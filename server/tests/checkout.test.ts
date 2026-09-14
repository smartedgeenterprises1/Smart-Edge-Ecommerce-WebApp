import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { Brand, DeviceModel } from '../src/modules/brands/brand.model.js';
import { Product, ProductVariant } from '../src/modules/products/product.model.js';
import { User } from '../src/modules/users/user.model.js';
import { createAdminUser } from '../src/modules/auth/auth.service.js';
import { toMinor } from '../src/lib/utils.js';
import { Order } from '../src/modules/orders/order.model.js';
import { cancelOrder } from '../src/modules/orders/order.service.js';

const TEST_URI = process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/smart-edge-test';

describe('SMART EDGE API', () => {
  let app: Awaited<ReturnType<typeof createApp>>;
  let variantId: string;
  let adminCookie = '';
  let customerCookie = '';

  beforeAll(async () => {
    process.env.MONGODB_URI = TEST_URI;
    await connectDatabase();
    await mongoose.connection.dropDatabase();
    app = await createApp();

    const brand = await Brand.create({
      name: 'Apple',
      slug: 'apple',
      deviceFamilyLabel: 'iPhone',
    });
    const model = await DeviceModel.create({
      brandId: brand._id,
      name: 'iPhone 16',
      slug: 'iphone-16',
    });
    const product = await Product.create({
      title: 'Test Clear Case',
      slug: 'test-clear-case',
      status: 'active',
      brandIds: [brand._id],
      compatibleDeviceModelIds: [model._id],
      basePriceMinor: toMinor(2000),
      publishedAt: new Date(),
      images: [{ url: 'http://localhost/test.svg', alt: 'test' }],
    });
    const variant = await ProductVariant.create({
      productId: product._id,
      sku: 'TEST-SKU-001',
      deviceModelId: model._id,
      color: 'Black',
      priceMinor: toMinor(2000),
      stockOnHand: 5,
    });
    variantId = String(variant._id);

    await createAdminUser('admin@test.local', 'password12345', 'Admin');
    const adminLogin = await request(app).post('/api/auth/login').send({
      email: 'admin@test.local',
      password: 'password12345',
    });
    adminCookie = adminLogin.headers['set-cookie']?.[0] ?? '';

    await request(app).post('/api/auth/register').send({
      email: 'buyer@test.local',
      password: 'password12345',
      fullName: 'Buyer One',
    });
    const buyerLogin = await request(app).post('/api/auth/login').send({
      email: 'buyer@test.local',
      password: 'password12345',
    });
    customerCookie = buyerLogin.headers['set-cookie']?.[0] ?? '';
  }, 60_000);

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('rejects admin routes for customers', async () => {
    const res = await request(app).get('/api/admin/dashboard').set('Cookie', customerCookie);
    expect(res.status).toBe(403);
  });

  it('allows admin dashboard for admins', async () => {
    const res = await request(app).get('/api/admin/dashboard').set('Cookie', adminCookie);
    expect(res.status).toBe(200);
    expect(res.body.data.metrics.revenueDefinition).toMatch(/collected/i);
  });

  it('quotes cart with server prices', async () => {
    const res = await request(app)
      .post('/api/cart/quote')
      .send({ items: [{ variantId, quantity: 2 }] });
    expect(res.status).toBe(200);
    expect(res.body.data.subtotalMinor).toBe(toMinor(4000));
  });

  it('completes COD checkout idempotently and restores stock once on cancel', async () => {
    const key = `idem-${Date.now()}`;
    const payload = {
      items: [{ variantId, quantity: 2 }],
      paymentMethod: 'cod',
      idempotencyKey: key,
      customer: { fullName: 'Buyer', email: 'guest@test.local', phone: '+923001234567' },
      shippingAddress: {
        street: 'Street 1',
        city: 'Lahore',
        province: 'Punjab',
        postalCode: '54000',
        country: 'PK',
      },
    };
    const first = await request(app).post('/api/cart/checkout').send(payload);
    expect(first.status).toBe(201);
    const second = await request(app).post('/api/cart/checkout').send(payload);
    expect(second.status).toBe(200);
    expect(second.body.data.replayed).toBe(true);
    expect(second.body.data.order.orderNumber).toBe(first.body.data.order.orderNumber);

    const variantAfter = await ProductVariant.findById(variantId);
    expect(variantAfter!.stockOnHand).toBe(3);

    const order = await Order.findOne({ orderNumber: first.body.data.order.orderNumber });
    await cancelOrder(String(order!._id));
    await cancelOrder(String(order!._id)); // second cancel must not double-restore
    const variantRestored = await ProductVariant.findById(variantId);
    expect(variantRestored!.stockOnHand).toBe(5);
  });

  it('customers only see their orders', async () => {
    const key = `idem-own-${Date.now()}`;
    await request(app)
      .post('/api/cart/checkout')
      .set('Cookie', customerCookie)
      .send({
        items: [{ variantId, quantity: 1 }],
        paymentMethod: 'cod',
        idempotencyKey: key,
        customer: { fullName: 'Buyer One', email: 'buyer@test.local', phone: '+923001111111' },
        shippingAddress: {
          street: 'Street 2',
          city: 'Karachi',
          province: 'Sindh',
          country: 'PK',
        },
      });

    const mine = await request(app).get('/api/orders/mine').set('Cookie', customerCookie);
    expect(mine.status).toBe(200);
    expect(mine.body.data.length).toBeGreaterThanOrEqual(1);
    expect(mine.body.data.every((o: { customerEmail: string }) => o.customerEmail === 'buyer@test.local')).toBe(
      true,
    );
  });

  it('prevents selling more than available stock', async () => {
    await ProductVariant.findByIdAndUpdate(variantId, { stockOnHand: 1, stockReserved: 0 });

    const base = {
      items: [{ variantId, quantity: 1 }],
      paymentMethod: 'cod' as const,
      customer: { fullName: 'Race', email: 'oversell@test.local', phone: '+923001112233' },
      shippingAddress: { street: 'Street 1', city: 'Islamabad', province: 'ICT', country: 'PK' },
    };

    const first = await request(app)
      .post('/api/cart/checkout')
      .send({ ...base, idempotencyKey: `ov-1-${Date.now()}` });
    expect(first.status).toBe(201);

    const second = await request(app)
      .post('/api/cart/checkout')
      .send({
        ...base,
        customer: { ...base.customer, email: 'oversell2@test.local' },
        idempotencyKey: `ov-2-${Date.now()}`,
      });
    expect([400, 409]).toContain(second.status);

    const final = await ProductVariant.findById(variantId);
    expect(final!.stockOnHand).toBe(0);
  });
});
