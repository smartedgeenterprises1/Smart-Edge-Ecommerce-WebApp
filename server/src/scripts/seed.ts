/**
 * Development seed — NEVER run automatically in production.
 * Creates Apple / Google / Samsung brands, device models, ~20 covers,
 * accessory categories, coupons, and sample orders.
 *
 * Demo images: SVG placeholders generated locally (no third-party product photos).
 */
import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { env } from '../config/env.js';
import { Brand, DeviceModel } from '../modules/brands/brand.model.js';
import { Category } from '../modules/categories/category.model.js';
import { Product, ProductVariant } from '../modules/products/product.model.js';
import { Coupon } from '../modules/coupons/coupon.model.js';
import { StoreSettings } from '../modules/settings/settings.model.js';
import { Order } from '../modules/orders/order.model.js';
import { User } from '../modules/users/user.model.js';
import { slugify, toMinor } from '../lib/utils.js';
import bcrypt from 'bcryptjs';

if (env.NODE_ENV === 'production' && process.env.ALLOW_PROD_SEED !== 'true') {
  console.error('Refusing to seed in production. Set ALLOW_PROD_SEED=true to override (not recommended).');
  process.exit(1);
}

async function writePlaceholderSvg(filename: string, label: string, color: string) {
  const dir = path.resolve(process.cwd(), env.UPLOAD_DIR);
  await fs.mkdir(dir, { recursive: true });
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f7fbff"/>
      <stop offset="100%" stop-color="#e8f6ff"/>
    </linearGradient>
  </defs>
  <rect width="800" height="800" fill="url(#g)"/>
  <rect x="220" y="120" width="360" height="560" rx="48" fill="${color}" opacity="0.92"/>
  <rect x="250" y="160" width="300" height="480" rx="28" fill="#0b1b2b" opacity="0.08"/>
  <circle cx="400" cy="150" r="10" fill="#fff" opacity="0.7"/>
  <text x="400" y="720" text-anchor="middle" font-family="Segoe UI, Arial" font-size="28" fill="#0b3a55">${label}</text>
</svg>`;
  await fs.writeFile(path.join(dir, filename), svg, 'utf8');
  return `${env.PUBLIC_API_URL}/uploads/${filename}`;
}

const COLORS = [
  { name: 'Midnight Black', hex: '#111827' },
  { name: 'Sky Blue', hex: '#75D1FF' },
  { name: 'Soft White', hex: '#F8FAFC' },
  { name: 'Coral', hex: '#FB7185' },
  { name: 'Forest', hex: '#166534' },
];

async function main() {
  await connectDatabase();
  console.log('Clearing development collections…');
  await Promise.all([
    Brand.deleteMany({}),
    DeviceModel.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
    ProductVariant.deleteMany({}),
    Coupon.deleteMany({}),
    Order.deleteMany({}),
    StoreSettings.deleteMany({}),
  ]);

  const apple = await Brand.create({
    name: 'Apple',
    slug: 'apple',
    deviceFamilyLabel: 'iPhone',
    description: 'Covers for Apple iPhone models.',
    logoUrl: '/brands/apple.svg',
    sortOrder: 1,
  });
  const google = await Brand.create({
    name: 'Google',
    slug: 'google',
    deviceFamilyLabel: 'Pixel',
    description: 'Covers for Google Pixel models.',
    logoUrl: '/brands/google.svg',
    sortOrder: 2,
  });
  const samsung = await Brand.create({
    name: 'Samsung',
    slug: 'samsung',
    deviceFamilyLabel: 'Galaxy',
    description: 'Covers for Samsung Galaxy models.',
    logoUrl: '/brands/samsung.svg',
    sortOrder: 3,
  });

  const appleModels = [
    'iPhone 18 Pro Max',
    'iPhone 18 Pro',
    'iPhone 18 Plus',
    'iPhone 18',
    'iPhone 17 Pro Max',
    'iPhone 17 Pro',
    'iPhone 17 Plus',
    'iPhone 17 Air',
    'iPhone 17',
    'iPhone 16 Pro Max',
    'iPhone 16 Pro',
    'iPhone 16 Plus',
    'iPhone 16',
    'iPhone 15 Pro Max',
    'iPhone 15 Pro',
    'iPhone 15 Plus',
    'iPhone 15',
    'iPhone 14 Pro Max',
    'iPhone 14 Pro',
    'iPhone 14 Plus',
    'iPhone 14',
    'iPhone 13 Pro Max',
    'iPhone 13 Pro',
    'iPhone 13 mini',
    'iPhone 13',
    'iPhone 12 Pro Max',
    'iPhone 12 Pro',
    'iPhone 12 mini',
    'iPhone 12',
    'iPhone 11 Pro Max',
    'iPhone 11 Pro',
    'iPhone 11',
  ];
  const googleModels = ['Pixel 9 Pro', 'Pixel 9', 'Pixel 8 Pro', 'Pixel 8', 'Pixel 7'];
  const samsungModels = [
    'Galaxy S25 Ultra',
    'Galaxy S25',
    'Galaxy S24 Ultra',
    'Galaxy S24',
    'Galaxy A55',
    'Galaxy Z Flip 6',
  ];

  const createModels = async (brandId: mongoose.Types.ObjectId, names: string[]) => {
    const docs = [];
    for (let i = 0; i < names.length; i++) {
      docs.push(
        await DeviceModel.create({
          brandId,
          name: names[i],
          slug: slugify(names[i]),
          sortOrder: i + 1,
        }),
      );
    }
    return docs;
  };

  const iphones = await createModels(apple._id, appleModels);
  const pixels = await createModels(google._id, googleModels);
  const galaxies = await createModels(samsung._id, samsungModels);

  const phoneCovers = await Category.create({
    name: 'Phone Covers',
    slug: 'phone-covers',
    description: 'Protective and style covers for your phone.',
    isFeatured: true,
    sortOrder: 1,
  });
  const chargers = await Category.create({
    name: 'Chargers & Cables',
    slug: 'chargers-cables',
    description: 'Charging accessories.',
    isFeatured: true,
    sortOrder: 2,
  });
  const holders = await Category.create({
    name: 'Holders & Mounts',
    slug: 'holders-mounts',
    description: 'Car and desk mounts.',
    isFeatured: true,
    sortOrder: 3,
  });

  type CoverDef = {
    title: string;
    brand: typeof apple;
    models: typeof iphones;
    caseType: string;
    material: string;
    price: number;
    compareAt?: number;
    featured?: boolean;
    newArrival?: boolean;
  };

  const covers: CoverDef[] = [
    { title: 'Clear Shield Case', brand: apple, models: iphones.slice(0, 4), caseType: 'Clear', material: 'TPU', price: 2499, featured: true, newArrival: true },
    { title: 'Matte Armor Case', brand: apple, models: iphones.slice(0, 5), caseType: 'Rugged', material: 'PC + TPU', price: 3499, compareAt: 3999, featured: true },
    { title: 'Silicone Soft Touch', brand: apple, models: iphones.slice(2, 6), caseType: 'Silicone', material: 'Silicone', price: 2799, newArrival: true },
    { title: 'Leather Folio Wallet', brand: apple, models: iphones.slice(0, 3), caseType: 'Wallet', material: 'PU Leather', price: 4499 },
    { title: 'Slim Frost Case', brand: apple, models: [iphones[0], iphones[1], iphones[3]], caseType: 'Slim', material: 'PC', price: 1999, featured: true },
    { title: 'Ring Stand Case', brand: apple, models: iphones.slice(1, 5), caseType: 'Stand', material: 'TPU', price: 2999 },
    { title: 'Carbon Texture Case', brand: apple, models: [iphones[0], iphones[2]], caseType: 'Textured', material: 'TPU', price: 2699 },
    { title: 'Pixel Clear Guard', brand: google, models: pixels.slice(0, 4), caseType: 'Clear', material: 'TPU', price: 2299, featured: true },
    { title: 'Pixel Soft Matte', brand: google, models: pixels.slice(0, 3), caseType: 'Silicone', material: 'Silicone', price: 2599, newArrival: true },
    { title: 'Pixel Rugged Shield', brand: google, models: pixels.slice(1, 5), caseType: 'Rugged', material: 'PC + TPU', price: 3299, featured: true },
    { title: 'Pixel Slim Shell', brand: google, models: [pixels[0], pixels[1]], caseType: 'Slim', material: 'PC', price: 1899 },
    { title: 'Pixel Fabric Case', brand: google, models: pixels.slice(0, 3), caseType: 'Fabric', material: 'Fabric + TPU', price: 3199 },
    { title: 'Galaxy Crystal Case', brand: samsung, models: galaxies.slice(0, 4), caseType: 'Clear', material: 'TPU', price: 2199, featured: true },
    { title: 'Galaxy Armor Pro', brand: samsung, models: galaxies.slice(0, 3), caseType: 'Rugged', material: 'PC + TPU', price: 3599, compareAt: 4199, newArrival: true },
    { title: 'Galaxy Silicone Cover', brand: samsung, models: galaxies.slice(1, 5), caseType: 'Silicone', material: 'Silicone', price: 2499 },
    { title: 'Galaxy Slim Fit', brand: samsung, models: [galaxies[0], galaxies[2]], caseType: 'Slim', material: 'PC', price: 1799, featured: true },
    { title: 'Galaxy Flip Companion', brand: samsung, models: [galaxies[5]], caseType: 'Flip', material: 'PU Leather', price: 3999 },
    { title: 'Galaxy Wallet Case', brand: samsung, models: galaxies.slice(0, 3), caseType: 'Wallet', material: 'PU Leather', price: 4299 },
    { title: 'Galaxy Soft Grip', brand: samsung, models: galaxies.slice(2, 5), caseType: 'Textured', material: 'TPU', price: 2399 },
    { title: 'Everyday Dual Layer', brand: apple, models: [iphones[4], iphones[5], iphones[6]], caseType: 'Hybrid', material: 'PC + TPU', price: 2899 },
  ];

  const featuredIds: mongoose.Types.ObjectId[] = [];

  for (let i = 0; i < covers.length; i++) {
    const c = covers[i];
    const img = await writePlaceholderSvg(
      `cover-${i + 1}.svg`,
      c.title.split(' ').slice(0, 2).join(' '),
      COLORS[i % COLORS.length].hex,
    );
    const product = await Product.create({
      title: c.title,
      slug: slugify(`${c.brand.name}-${c.title}`),
      description: `${c.title} designed for specific ${c.brand.deviceFamilyLabel} models. Select your exact phone model before purchase — similar names do not share cover dimensions.`,
      features: ['Precise cutouts for the listed model', 'Raised edges around screen and camera', 'Everyday scratch protection'],
      materials: [c.material],
      careInstructions: 'Wipe with a soft dry cloth. Avoid solvents.',
      categoryIds: [phoneCovers._id],
      brandIds: [c.brand._id],
      compatibleDeviceModelIds: c.models.map((m) => m._id),
      caseType: c.caseType,
      material: c.material,
      images: [{ url: img, alt: `${c.title} product image`, sortOrder: 0 }],
      status: 'active',
      isFeatured: Boolean(c.featured),
      isNewArrival: Boolean(c.newArrival),
      basePriceMinor: toMinor(c.price),
      compareAtPriceMinor: c.compareAt ? toMinor(c.compareAt) : undefined,
      publishedAt: new Date(Date.now() - i * 86_400_000),
      seoTitle: `${c.title} | SMART EDGE`,
      seoDescription: `Buy ${c.title} for ${c.brand.deviceFamilyLabel} in Pakistan. Prices in PKR.`,
    });
    if (c.featured) featuredIds.push(product._id);

    for (let mi = 0; mi < c.models.length; mi++) {
      const model = c.models[mi];
      // Fewer colors for some; stock variety
      const colorSet = COLORS.slice(0, mi % 2 === 0 ? 3 : 2);
      for (let ci = 0; ci < colorSet.length; ci++) {
        const color = colorSet[ci];
        let stock = 25;
        if (i === 0 && mi === 0 && ci === 0) stock = 2; // low stock
        if (i === 1 && mi === 0 && ci === 1) stock = 0; // out of stock
        if (i === 7 && mi === 0 && ci === 0) stock = 1;

        const colorImg = await writePlaceholderSvg(
          `v-${i + 1}-${mi}-${ci}.svg`,
          color.name,
          color.hex,
        );

          await ProductVariant.create({
          productId: product._id,
          sku: `SE-${String(i + 1).padStart(2, '0')}-M${mi}-C${ci}-${slugify(model.name).slice(0, 18)}-${slugify(color.name).slice(0, 8)}`.toUpperCase().replace(/-/g, '').slice(0, 48),
          deviceModelId: model._id,
          color: color.name,
          colorHex: color.hex,
          priceMinor: toMinor(c.price + ci * 100),
          compareAtPriceMinor: c.compareAt ? toMinor(c.compareAt) : undefined,
          stockOnHand: stock,
          stockReserved: 0,
          lowStockThreshold: 5,
          images: [{ url: colorImg, alt: `${c.title} in ${color.name} for ${model.name}`, sortOrder: 0 }],
          isActive: true,
        });
      }
    }
  }

  // Other accessories (non-cover)
  const cableImg = await writePlaceholderSvg('cable.svg', 'USB-C Cable', '#75D1FF');
  await Product.create({
    title: 'Braided USB-C Cable 1m',
    slug: 'braided-usb-c-cable-1m',
    description: 'Durable braided charging cable. Compatibility depends on your device port — confirm USB-C support.',
    categoryIds: [chargers._id],
    brandIds: [],
    compatibleDeviceModelIds: [],
    caseType: '',
    material: 'Nylon braid',
    images: [{ url: cableImg, alt: 'Braided USB-C cable', sortOrder: 0 }],
    status: 'active',
    isFeatured: false,
    isNewArrival: true,
    basePriceMinor: toMinor(1499),
    publishedAt: new Date(),
  });
  const cable = await Product.findOne({ slug: 'braided-usb-c-cable-1m' });
  if (cable) {
    await ProductVariant.create({
      productId: cable._id,
      sku: 'SE-CABLE-USBC-1M-BLK',
      color: 'Black',
      colorHex: '#111827',
      priceMinor: toMinor(1499),
      stockOnHand: 40,
      images: [{ url: cableImg, alt: 'USB-C cable black' }],
    });
  }

  const mountImg = await writePlaceholderSvg('mount.svg', 'Car Mount', '#0ea5e9');
  const mount = await Product.create({
    title: 'Magnetic Car Mount',
    slug: 'magnetic-car-mount',
    description: 'Dashboard/vent magnetic mount. Pair with a compatible metal plate or MagSafe-style ring only if your case supports it — not claimed as MagSafe-certified.',
    categoryIds: [holders._id],
    images: [{ url: mountImg, alt: 'Magnetic car mount' }],
    status: 'active',
    basePriceMinor: toMinor(2999),
    publishedAt: new Date(),
    material: 'ABS + magnet',
  });
  await ProductVariant.create({
    productId: mount._id,
    sku: 'SE-MOUNT-MAG-BLK',
    color: 'Black',
    colorHex: '#111827',
    priceMinor: toMinor(2999),
    stockOnHand: 18,
    images: [{ url: mountImg, alt: 'Car mount' }],
  });

  await Coupon.create({
    code: 'EDGE10',
    description: 'Development coupon — 10% off',
    type: 'percent',
    value: 10,
    minSubtotalMinor: toMinor(2000),
    maxDiscountMinor: toMinor(1500),
    startsAt: new Date(Date.now() - 86400000),
    endsAt: new Date(Date.now() + 90 * 86400000),
    usageLimit: 100,
    isActive: true,
  });
  await Coupon.create({
    code: 'SAVE500',
    description: 'Development coupon — PKR 500 off',
    type: 'fixed',
    value: toMinor(500),
    minSubtotalMinor: toMinor(3000),
    startsAt: new Date(Date.now() - 86400000),
    endsAt: new Date(Date.now() + 90 * 86400000),
    usageLimit: 50,
    isActive: true,
  });

  await StoreSettings.create({
    key: 'default',
    storeName: 'SMART EDGE',
    tagline: 'Find the right cover for your exact phone.',
    announcement:
      'Welcome to SMART EDGE ENTERPRISE, Buy covers for IPhone, Google Pixel, and Samsung Phones. Free Delivery on Orders Above 2499 Rs',
    contactEmail: 'hello@smartedge.local',
    contactPhone: '+92 300 0000000',
    contactAddress: 'Pakistan',
    shippingFlatMinor: toMinor(250),
    freeShippingThresholdMinor: toMinor(5000),
    featuredProductIds: featuredIds.slice(0, 6),
    serviceClaims: [
      'Cash on Delivery available across Pakistan (where logistics partners operate).',
      'Select your exact phone model — cases are model-specific.',
    ],
    policies: {
      shipping: 'DRAFT: Shipping times and rates are configured in admin settings. Confirm carrier coverage for your city before launch.',
      returns: 'DRAFT: Returns window and condition rules must be confirmed by the store owner before launch.',
      privacy: 'DRAFT: We collect contact and delivery details to fulfill orders. Update this policy with your legal review.',
      terms: 'DRAFT: Standard terms for sale of goods in Pakistan — replace with counsel-approved text.',
      faq: 'How do I choose a cover?\nSelect your brand, then your exact phone model, then browse compatible covers.\n\nDo you offer Cash on Delivery?\nYes — COD is available as the default payment method.',
      about: 'SMART EDGE is a Pakistan-focused mobile accessories store specializing in phone covers for Apple iPhone, Google Pixel, and Samsung Galaxy devices.',
      policiesAreDraft: true,
      draftDisclaimer: 'DRAFT — Review and confirm with store owner before launch.',
    },
  });

  // Optional demo customer (password via env or skip)
  const demoPassword = process.env.SEED_CUSTOMER_PASSWORD;
  if (demoPassword && demoPassword.length >= 8) {
    await User.findOneAndUpdate(
      { email: 'customer@smartedge.local' },
      {
        email: 'customer@smartedge.local',
        fullName: 'Demo Customer',
        passwordHash: await bcrypt.hash(demoPassword, 12),
        role: 'customer',
        phone: '+92 300 1111111',
      },
      { upsert: true },
    );
    console.log('Demo customer: customer@smartedge.local (password from SEED_CUSTOMER_PASSWORD)');
  }

  console.log('Seed complete.');
  console.log(`Brands: 3 | Models: ${appleModels.length + googleModels.length + samsungModels.length} | Cover listings: ${covers.length}`);
  console.log('Coupons: EDGE10, SAVE500');
  console.log('Create an admin with: npm run create-admin --prefix server');
  await disconnectDatabase();
}

main().catch(async (err) => {
  console.error(err);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
