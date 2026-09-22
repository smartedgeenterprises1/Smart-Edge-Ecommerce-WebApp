import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { ok } from '../../lib/api-response.js';
import { asyncHandler, validateBody } from '../../middleware/error.js';
import { requireAdmin, requireAuth } from '../../middleware/auth.js';
import { saveProductImage } from '../../lib/storage.js';
import { AppError } from '../../lib/errors.js';
import { Product, ProductVariant } from '../products/product.model.js';
import { Brand, DeviceModel } from '../brands/brand.model.js';
import { Category } from '../categories/category.model.js';
import { Order } from '../orders/order.model.js';
import { Coupon } from '../coupons/coupon.model.js';
import { User } from '../users/user.model.js';
import { StoreSettings, AuditLog } from '../settings/settings.model.js';
import { InventoryMovement } from '../inventory/inventory.model.js';
import { adjustStock } from '../inventory/inventory.service.js';
import {
  cancelOrder,
  markPaymentCollected,
  updateFulfillmentStatus,
  updateOrderTracking,
} from '../orders/order.service.js';
import { slugify, toMinor } from '../../lib/utils.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

export const adminRouter = Router();
adminRouter.use(requireAuth, requireAdmin);

adminRouter.get(
  '/dashboard',
  asyncHandler(async (_req, res) => {
    const [ordersCount, productsCount, pendingOrders, lowStock, recentOrders, collectedAgg, trend] =
      await Promise.all([
        Order.countDocuments(),
        Product.countDocuments({ status: { $ne: 'archived' } }),
        Order.countDocuments({ fulfillmentStatus: 'pending' }),
        ProductVariant.find({
          isActive: true,
          $expr: {
            $lte: [{ $subtract: ['$stockOnHand', '$stockReserved'] }, '$lowStockThreshold'],
          },
        })
          .populate('productId', 'title')
          .limit(20)
          .lean(),
        Order.find().sort({ createdAt: -1 }).limit(10).lean(),
        // Revenue definition: only COD payments explicitly marked collected
        Order.aggregate([
          { $match: { paymentStatus: 'collected' } },
          { $group: { _id: null, revenueMinor: { $sum: '$totalMinor' }, count: { $sum: 1 } } },
        ]),
        Order.aggregate([
          {
            $match: {
              createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            },
          },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              orders: { $sum: 1 },
              // Pending COD is NOT counted as revenue
              collectedMinor: {
                $sum: {
                  $cond: [{ $eq: ['$paymentStatus', 'collected'] }, '$totalMinor', 0],
                },
              },
            },
          },
          { $sort: { _id: 1 } },
        ]),
      ]);

    ok(res, {
      metrics: {
        ordersCount,
        productsCount,
        pendingOrders,
        revenueMinor: collectedAgg[0]?.revenueMinor ?? 0,
        collectedOrdersCount: collectedAgg[0]?.count ?? 0,
        revenueDefinition: 'Sum of order totals where paymentStatus is collected (COD cash received). Unpaid COD is excluded.',
      },
      lowStock,
      recentOrders,
      salesTrend: trend,
    });
  }),
);

adminRouter.get(
  '/products',
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Number(req.query.limit) || 20);
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    const [items, total] = await Promise.all([
      Product.find(filter).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Product.countDocuments(filter),
    ]);
    ok(res, { items, total, page, limit });
  }),
);

adminRouter.post(
  '/products',
  validateBody(
    z.object({
      title: z.string().min(2).max(200),
      slug: z.string().optional(),
      description: z.string().optional(),
      features: z.array(z.string()).optional(),
      materials: z.array(z.string()).optional(),
      careInstructions: z.string().optional(),
      categoryIds: z.array(z.string()).optional(),
      brandIds: z.array(z.string()).optional(),
      compatibleDeviceModelIds: z.array(z.string()).optional(),
      caseType: z.string().optional(),
      material: z.string().optional(),
      images: z
        .array(z.object({ url: z.string(), alt: z.string().optional(), sortOrder: z.number().optional() }))
        .max(15)
        .optional(),
      status: z.enum(['draft', 'active', 'archived']).optional(),
      isFeatured: z.boolean().optional(),
      isNewArrival: z.boolean().optional(),
      basePriceMinor: z.number().int().min(0),
      compareAtPriceMinor: z.number().int().min(0).optional(),
      seoTitle: z.string().optional(),
      seoDescription: z.string().optional(),
      /** Optional: create sellable variants as model × color matrix */
      colors: z
        .array(
          z.object({
            name: z.string().min(1),
            hex: z.string().optional(),
            stockOnHand: z.number().int().min(0).default(0),
            imageUrl: z.string().min(1).optional(),
          }),
        )
        .max(10)
        .optional(),
    }),
  ),
  asyncHandler(async (req, res) => {
    const slug = req.body.slug || slugify(req.body.title);
    const { colors, ...productBody } = req.body;
    const productImages = (req.body.images || []).slice(0, 15);
    const product = await Product.create({
      ...productBody,
      images: productImages,
      slug,
      publishedAt: req.body.status === 'active' ? new Date() : undefined,
    });

    const modelIds: string[] = req.body.compatibleDeviceModelIds || [];
    const colorList = (colors || []).slice(0, 10);
    const createdVariants = [];

    if (modelIds.length && colorList.length) {
      for (const modelId of modelIds) {
        const model = await DeviceModel.findById(modelId).select('name slug');
        for (const color of colorList) {
          const sku = `SE-${slugify(product.slug).slice(0, 12)}-${slugify(model?.slug || modelId).slice(0, 16)}-${slugify(color.name).slice(0, 10)}`
            .toUpperCase()
            .replace(/[^A-Z0-9-]/g, '')
            .slice(0, 48);
          const colorImages = color.imageUrl
            ? [{ url: color.imageUrl, alt: `${product.title} — ${color.name}`, sortOrder: 0 }]
            : product.images || [];
          createdVariants.push(
            await ProductVariant.create({
              productId: product._id,
              sku,
              deviceModelId: modelId,
              color: color.name,
              colorHex: color.hex || '#CCCCCC',
              priceMinor: product.basePriceMinor,
              compareAtPriceMinor: product.compareAtPriceMinor,
              stockOnHand: color.stockOnHand ?? 0,
              images: colorImages,
              isActive: true,
            }),
          );
        }
      }
    }

    await AuditLog.create({
      actorUserId: req.user!._id,
      action: 'product.create',
      entityType: 'Product',
      entityId: String(product._id),
      after: {
        title: product.title,
        status: product.status,
        variantsCreated: createdVariants.length,
      },
    });
    ok(res, { product, variantsCreated: createdVariants.length }, 201);
  }),
);

adminRouter.get(
  '/products/:id',
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id).lean();
    if (!product) throw new AppError('Product not found', 404);
    const variants = await ProductVariant.find({ productId: product._id })
      .populate({ path: 'deviceModelId', select: 'name slug brandId' })
      .sort({ color: 1, sku: 1 })
      .lean();
    ok(res, { ...product, variants });
  }),
);

adminRouter.patch(
  '/products/:id',
  asyncHandler(async (req, res) => {
    const allowed = [
      'title', 'slug', 'description', 'features', 'materials', 'careInstructions',
      'categoryIds', 'brandIds', 'compatibleDeviceModelIds', 'caseType', 'material',
      'compatibilityFeatures', 'images', 'status', 'isFeatured', 'isNewArrival',
      'basePriceMinor', 'compareAtPriceMinor', 'seoTitle', 'seoDescription',
    ];
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    if (Array.isArray(update.images)) update.images = (update.images as unknown[]).slice(0, 15);
    if (update.status === 'active') update.publishedAt = new Date();
    const before = await Product.findById(req.params.id);
    if (!before) throw new AppError('Product not found', 404);
    const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    await AuditLog.create({
      actorUserId: req.user!._id,
      action: 'product.update',
      entityType: 'Product',
      entityId: String(req.params.id),
      before: { title: before.title, status: before.status, basePriceMinor: before.basePriceMinor },
      after: update,
    });
    ok(res, product);
  }),
);

/** Full cover edit: product fields + color/stock/image sync across model×color variants */
adminRouter.post(
  '/products/:id/edit',
  validateBody(
    z.object({
      title: z.string().min(2).max(200),
      description: z.string().optional(),
      basePriceMinor: z.number().int().min(0),
      compareAtPriceMinor: z.number().int().min(0).optional(),
      status: z.enum(['draft', 'active', 'archived']).optional(),
      caseType: z.string().optional(),
      material: z.string().optional(),
      isFeatured: z.boolean().optional(),
      isNewArrival: z.boolean().optional(),
      brandIds: z.array(z.string()).optional(),
      compatibleDeviceModelIds: z.array(z.string()).min(1),
      images: z
        .array(z.object({ url: z.string(), alt: z.string().optional(), sortOrder: z.number().optional() }))
        .max(15)
        .optional(),
      colors: z
        .array(
          z.object({
            name: z.string().min(1),
            hex: z.string().optional(),
            stockOnHand: z.number().int().min(0).default(0),
            imageUrl: z.string().min(1).optional(),
          }),
        )
        .min(1)
        .max(10),
      syncVariantPrices: z.boolean().optional().default(true),
    }),
  ),
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) throw new AppError('Product not found', 404);

    const modelIds: string[] = (req.body.compatibleDeviceModelIds || []).slice(0, 80);
    const colorList = (req.body.colors || []).slice(0, 10);
    const productImages = (req.body.images || []).slice(0, 15);

    product.title = req.body.title;
    product.description = req.body.description ?? product.description;
    product.basePriceMinor = req.body.basePriceMinor;
    if (req.body.compareAtPriceMinor !== undefined) product.compareAtPriceMinor = req.body.compareAtPriceMinor;
    if (req.body.status) {
      product.status = req.body.status;
      if (req.body.status === 'active' && !product.publishedAt) product.publishedAt = new Date();
    }
    if (req.body.caseType !== undefined) product.caseType = req.body.caseType;
    if (req.body.material !== undefined) product.material = req.body.material;
    if (req.body.isFeatured !== undefined) product.isFeatured = req.body.isFeatured;
    if (req.body.isNewArrival !== undefined) product.isNewArrival = req.body.isNewArrival;
    if (req.body.brandIds) product.set('brandIds', req.body.brandIds);
    product.set('compatibleDeviceModelIds', modelIds);
    product.set('images', productImages);
    await product.save();

    const existing = await ProductVariant.find({ productId: product._id });
    const colorNames = new Set(colorList.map((c: { name: string }) => c.name.trim().toLowerCase()));
    const modelIdSet = new Set(modelIds.map(String));

    let updated = 0;
    let created = 0;
    let deactivated = 0;

    for (const color of colorList) {
      const colorName = color.name.trim();
      const colorImages = color.imageUrl
        ? [{ url: color.imageUrl, alt: `${product.title} — ${colorName}`, sortOrder: 0 }]
        : productImages;

      for (const modelId of modelIds) {
        const variant = existing.find(
          (v) =>
            String(v.deviceModelId) === String(modelId) &&
            v.color.trim().toLowerCase() === colorName.toLowerCase(),
        );

        if (variant) {
          variant.color = colorName;
          variant.colorHex = color.hex || variant.colorHex || '#CCCCCC';
          variant.images = colorImages as typeof variant.images;
          variant.isActive = true;
          if (req.body.syncVariantPrices !== false) {
            variant.priceMinor = product.basePriceMinor;
            if (product.compareAtPriceMinor != null) variant.compareAtPriceMinor = product.compareAtPriceMinor;
          }
          await variant.save();

          const targetStock = color.stockOnHand ?? 0;
          const delta = targetStock - variant.stockOnHand;
          if (delta !== 0) {
            await adjustStock({
              variantId: String(variant._id),
              delta,
              reason: `Admin cover edit — set ${colorName} stock to ${targetStock}`,
              actorUserId: String(req.user!._id),
            });
          }
          updated += 1;
        } else {
          const model = await DeviceModel.findById(modelId).select('name slug');
          const sku = `SE-${slugify(product.slug).slice(0, 12)}-${slugify(model?.slug || modelId).slice(0, 16)}-${slugify(colorName).slice(0, 10)}`
            .toUpperCase()
            .replace(/[^A-Z0-9-]/g, '')
            .slice(0, 48);
          await ProductVariant.create({
            productId: product._id,
            sku,
            deviceModelId: modelId,
            color: colorName,
            colorHex: color.hex || '#CCCCCC',
            priceMinor: product.basePriceMinor,
            compareAtPriceMinor: product.compareAtPriceMinor,
            stockOnHand: color.stockOnHand ?? 0,
            images: colorImages,
            isActive: true,
          });
          created += 1;
        }
      }
    }

    for (const v of existing) {
      const modelOk = modelIdSet.has(String(v.deviceModelId));
      const colorOk = colorNames.has(v.color.trim().toLowerCase());
      if ((!modelOk || !colorOk) && v.isActive) {
        v.isActive = false;
        await v.save();
        deactivated += 1;
      }
    }

    await AuditLog.create({
      actorUserId: req.user!._id,
      action: 'product.edit',
      entityType: 'Product',
      entityId: String(product._id),
      after: {
        title: product.title,
        status: product.status,
        variantsUpdated: updated,
        variantsCreated: created,
        variantsDeactivated: deactivated,
      },
    });

    const variants = await ProductVariant.find({ productId: product._id })
      .populate({ path: 'deviceModelId', select: 'name slug brandId' })
      .lean();

    ok(res, {
      product,
      variants,
      variantsUpdated: updated,
      variantsCreated: created,
      variantsDeactivated: deactivated,
    });
  }),
);

adminRouter.delete(
  '/products/:id',
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) throw new AppError('Product not found', 404);
    const variants = await ProductVariant.find({ productId: product._id }).select('_id sku');
    const variantIds = variants.map((v) => v._id);
    await ProductVariant.deleteMany({ productId: product._id });
    await Product.findByIdAndDelete(product._id);
    await AuditLog.create({
      actorUserId: req.user!._id,
      action: 'product.delete',
      entityType: 'Product',
      entityId: String(product._id),
      before: {
        title: product.title,
        status: product.status,
        variantsDeleted: variantIds.length,
      },
    });
    ok(res, { deleted: true, variantsDeleted: variantIds.length });
  }),
);

adminRouter.post(
  '/variants',
  validateBody(
    z.object({
      productId: z.string(),
      sku: z.string().min(2),
      deviceModelId: z.string(),
      color: z.string().min(1),
      colorHex: z.string().optional(),
      priceMinor: z.number().int().min(0),
      compareAtPriceMinor: z.number().int().min(0).optional(),
      stockOnHand: z.number().int().min(0).default(0),
      lowStockThreshold: z.number().int().min(0).optional(),
      images: z.array(z.object({ url: z.string(), alt: z.string().optional() })).optional(),
      isActive: z.boolean().optional(),
    }),
  ),
  asyncHandler(async (req, res) => {
    const variant = await ProductVariant.create({
      ...req.body,
      sku: req.body.sku.toUpperCase(),
    });
    ok(res, variant, 201);
  }),
);

adminRouter.patch(
  '/variants/:id',
  asyncHandler(async (req, res) => {
    const allowed = [
      'sku', 'deviceModelId', 'color', 'colorHex', 'priceMinor', 'compareAtPriceMinor',
      'lowStockThreshold', 'images', 'isActive',
    ];
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    if (update.sku) update.sku = String(update.sku).toUpperCase();
    const before = await ProductVariant.findById(req.params.id);
    if (!before) throw new AppError('Variant not found', 404);
    const variant = await ProductVariant.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (update.priceMinor != null && update.priceMinor !== before.priceMinor) {
      await AuditLog.create({
        actorUserId: req.user!._id,
        action: 'variant.price_update',
        entityType: 'ProductVariant',
        entityId: String(req.params.id),
        before: { priceMinor: before.priceMinor },
        after: { priceMinor: update.priceMinor },
      });
    }
    ok(res, variant);
  }),
);

adminRouter.post(
  '/inventory/adjust',
  validateBody(
    z.object({
      variantId: z.string(),
      delta: z.number().int(),
      reason: z.string().min(3).max(300),
    }),
  ),
  asyncHandler(async (req, res) => {
    const variant = await adjustStock({
      variantId: req.body.variantId,
      delta: req.body.delta,
      reason: req.body.reason,
      actorUserId: String(req.user!._id),
    });
    ok(res, variant);
  }),
);

adminRouter.get(
  '/inventory/movements',
  asyncHandler(async (req, res) => {
    const variantId = typeof req.query.variantId === 'string' ? req.query.variantId : undefined;
    const filter: Record<string, unknown> = {};
    if (variantId) filter.variantId = variantId;
    const items = await InventoryMovement.find(filter).sort({ createdAt: -1 }).limit(100).lean();
    ok(res, items);
  }),
);

adminRouter.get(
  '/orders',
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Number(req.query.limit) || 20);
    const filter: Record<string, unknown> = {};
    if (typeof req.query.fulfillmentStatus === 'string') filter.fulfillmentStatus = req.query.fulfillmentStatus;
    if (typeof req.query.paymentStatus === 'string') filter.paymentStatus = req.query.paymentStatus;
    if (typeof req.query.q === 'string' && req.query.q) {
      filter.$or = [
        { orderNumber: new RegExp(req.query.q, 'i') },
        { customerEmail: new RegExp(req.query.q, 'i') },
        { customerPhone: new RegExp(req.query.q, 'i') },
        { customerName: new RegExp(req.query.q, 'i') },
      ];
    }
    const [items, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Order.countDocuments(filter),
    ]);
    ok(res, { items, total, page, limit });
  }),
);

adminRouter.get(
  '/orders/:id',
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).lean();
    if (!order) throw new AppError('Order not found', 404);
    ok(res, order);
  }),
);

adminRouter.post(
  '/orders/:id/fulfillment',
  validateBody(
    z.object({
      status: z.enum(['confirmed', 'processing', 'shipped', 'delivered', 'cancelled']),
      trackingNumber: z.string().optional(),
      trackingCarrier: z.string().optional(),
    }),
  ),
  asyncHandler(async (req, res) => {
    const order = await updateFulfillmentStatus(String(req.params.id), req.body.status, String(req.user!._id), {
      trackingNumber: req.body.trackingNumber,
      trackingCarrier: req.body.trackingCarrier,
    });
    await AuditLog.create({
      actorUserId: req.user!._id,
      action: 'order.fulfillment',
      entityType: 'Order',
      entityId: String(order._id),
      after: { status: req.body.status },
    });
    ok(res, order);
  }),
);

adminRouter.post(
  '/orders/:id/tracking',
  validateBody(
    z.object({
      trackingNumber: z.string().optional(),
      trackingCarrier: z.string().optional(),
    }),
  ),
  asyncHandler(async (req, res) => {
    const order = await updateOrderTracking(String(req.params.id), req.body, String(req.user!._id));
    await AuditLog.create({
      actorUserId: req.user!._id,
      action: 'order.tracking',
      entityType: 'Order',
      entityId: String(order._id),
      after: {
        trackingNumber: order.trackingNumber,
        trackingCarrier: order.trackingCarrier,
      },
    });
    ok(res, order);
  }),
);

adminRouter.post(
  '/orders/:id/collect-payment',
  asyncHandler(async (req, res) => {
    const order = await markPaymentCollected(String(req.params.id), String(req.user!._id));
    await AuditLog.create({
      actorUserId: req.user!._id,
      action: 'order.payment_collected',
      entityType: 'Order',
      entityId: String(order._id),
    });
    ok(res, order);
  }),
);

adminRouter.post(
  '/orders/:id/cancel',
  asyncHandler(async (req, res) => {
    const order = await cancelOrder(String(req.params.id), String(req.user!._id));
    ok(res, order);
  }),
);

adminRouter.get(
  '/customers',
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Number(req.query.limit) || 20);
    const [items, total] = await Promise.all([
      User.find({ role: 'customer' })
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments({ role: 'customer' }),
    ]);
    ok(res, { items, total, page, limit });
  }),
);

adminRouter.get(
  '/brands',
  asyncHandler(async (_req, res) => ok(res, await Brand.find().sort({ sortOrder: 1 }))),
);
adminRouter.post(
  '/brands',
  validateBody(z.object({ name: z.string(), deviceFamilyLabel: z.string(), slug: z.string().optional(), description: z.string().optional() })),
  asyncHandler(async (req, res) => {
    const brand = await Brand.create({ ...req.body, slug: req.body.slug || slugify(req.body.name) });
    ok(res, brand, 201);
  }),
);

adminRouter.get(
  '/device-models',
  asyncHandler(async (_req, res) =>
    ok(res, await DeviceModel.find().populate('brandId', 'name slug').sort({ sortOrder: 1 })),
  ),
);
adminRouter.post(
  '/device-models',
  validateBody(z.object({ brandId: z.string(), name: z.string(), slug: z.string().optional(), series: z.string().optional() })),
  asyncHandler(async (req, res) => {
    const model = await DeviceModel.create({ ...req.body, slug: req.body.slug || slugify(req.body.name) });
    ok(res, model, 201);
  }),
);

adminRouter.get(
  '/categories',
  asyncHandler(async (_req, res) => ok(res, await Category.find().sort({ sortOrder: 1 }))),
);
adminRouter.post(
  '/categories',
  validateBody(z.object({ name: z.string(), slug: z.string().optional(), description: z.string().optional(), isFeatured: z.boolean().optional() })),
  asyncHandler(async (req, res) => {
    const category = await Category.create({ ...req.body, slug: req.body.slug || slugify(req.body.name) });
    ok(res, category, 201);
  }),
);

adminRouter.get(
  '/coupons',
  asyncHandler(async (_req, res) => ok(res, await Coupon.find().sort({ createdAt: -1 }))),
);
adminRouter.post(
  '/coupons',
  validateBody(
    z.object({
      code: z.string().min(3),
      type: z.enum(['percent', 'fixed']),
      value: z.number().min(0),
      minSubtotalMinor: z.number().optional(),
      maxDiscountMinor: z.number().optional(),
      startsAt: z.string(),
      endsAt: z.string(),
      usageLimit: z.number().optional(),
      description: z.string().optional(),
    }),
  ),
  asyncHandler(async (req, res) => {
    const value = req.body.type === 'fixed' && req.body.value < 1000 ? toMinor(req.body.value) : req.body.value;
    const coupon = await Coupon.create({
      ...req.body,
      code: req.body.code.toUpperCase(),
      value,
      startsAt: new Date(req.body.startsAt),
      endsAt: new Date(req.body.endsAt),
    });
    ok(res, coupon, 201);
  }),
);

adminRouter.get(
  '/settings',
  asyncHandler(async (_req, res) => {
    let settings = await StoreSettings.findOne({ key: 'default' });
    if (!settings) settings = await StoreSettings.create({ key: 'default' });
    ok(res, settings);
  }),
);

adminRouter.patch(
  '/settings',
  asyncHandler(async (req, res) => {
    const allowed = [
      'storeName', 'tagline', 'announcement', 'heroImageUrl', 'contactEmail', 'contactPhone', 'contactAddress',
      'socialLinks', 'shippingFlatMinor', 'freeShippingThresholdMinor', 'lowStockThreshold',
      'featuredProductIds', 'serviceClaims', 'policies', 'seoDefaults',
    ];
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    const settings = await StoreSettings.findOneAndUpdate({ key: 'default' }, update, {
      new: true,
      upsert: true,
    });
    await AuditLog.create({
      actorUserId: req.user!._id,
      action: 'settings.update',
      entityType: 'StoreSettings',
      entityId: 'default',
      after: update,
    });
    ok(res, settings);
  }),
);

adminRouter.post(
  '/uploads',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new AppError('File required', 400);
    const saved = await saveProductImage(req.file.buffer, req.file.mimetype);
    ok(res, saved, 201);
  }),
);

adminRouter.get(
  '/audit-logs',
  asyncHandler(async (_req, res) => {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100).lean();
    ok(res, logs);
  }),
);
