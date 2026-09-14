import { z } from 'zod';
import { Types } from 'mongoose';
import { Product, ProductVariant } from './product.model.js';
import { Brand, DeviceModel } from '../brands/brand.model.js';
import { Category } from '../categories/category.model.js';
import { escapeRegex } from '../../lib/utils.js';
import { AppError, assertFound } from '../../lib/errors.js';

export const catalogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(24),
  q: z.string().max(100).optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  category: z.string().optional(),
  color: z.string().optional(),
  material: z.string().optional(),
  caseType: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  inStock: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'bestselling']).default('newest'),
  featured: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  newArrival: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
});

export type CatalogQuery = z.infer<typeof catalogQuerySchema>;

async function resolveIds(query: CatalogQuery) {
  const filter: Record<string, unknown> = { status: 'active' };
  if (query.q) filter.$text = { $search: query.q };
  if (query.featured) filter.isFeatured = true;
  if (query.newArrival) filter.isNewArrival = true;
  if (query.material) filter.material = new RegExp(`^${escapeRegex(query.material)}$`, 'i');
  if (query.caseType) filter.caseType = new RegExp(`^${escapeRegex(query.caseType)}$`, 'i');

  if (query.brand) {
    const brand = await Brand.findOne({
      $or: [{ slug: query.brand }, { _id: Types.ObjectId.isValid(query.brand) ? query.brand : undefined }],
      isActive: true,
    });
    if (brand) filter.brandIds = brand._id;
  }
  if (query.model) {
    const model = await DeviceModel.findOne({
      $or: [{ slug: query.model }, { _id: Types.ObjectId.isValid(query.model) ? query.model : undefined }],
      isActive: true,
    });
    if (model) filter.compatibleDeviceModelIds = model._id;
  }
  if (query.category) {
    const category = await Category.findOne({
      $or: [
        { slug: query.category },
        { _id: Types.ObjectId.isValid(query.category) ? query.category : undefined },
      ],
      isActive: true,
    });
    if (category) filter.categoryIds = category._id;
  }

  return filter;
}

export async function listProducts(query: CatalogQuery) {
  const filter = await resolveIds(query);

  // Variant-level filters via aggregation when needed
  const needsVariantFilter =
    query.color || query.minPrice != null || query.maxPrice != null || query.inStock === true;

  if (needsVariantFilter) {
    const variantMatch: Record<string, unknown> = { isActive: true };
    if (query.color) variantMatch.color = new RegExp(`^${escapeRegex(query.color)}$`, 'i');
    if (query.minPrice != null || query.maxPrice != null) {
      variantMatch.priceMinor = {};
      if (query.minPrice != null) (variantMatch.priceMinor as Record<string, number>).$gte = Math.round(query.minPrice * 100);
      if (query.maxPrice != null) (variantMatch.priceMinor as Record<string, number>).$lte = Math.round(query.maxPrice * 100);
    }
    if (query.inStock) {
      variantMatch.$expr = { $gt: [{ $subtract: ['$stockOnHand', '$stockReserved'] }, 0] };
    }

    const matchingVariantProductIds = await ProductVariant.distinct('productId', variantMatch);
    filter._id = { $in: matchingVariantProductIds };
  }

  const sortMap: Record<string, Record<string, 1 | -1>> = {
    newest: { publishedAt: -1, createdAt: -1 },
    price_asc: { basePriceMinor: 1 },
    price_desc: { basePriceMinor: -1 },
    bestselling: { salesCount: -1, publishedAt: -1 },
  };

  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort(sortMap[query.sort])
      .skip(skip)
      .limit(query.limit)
      .populate('brandIds', 'name slug deviceFamilyLabel')
      .populate('compatibleDeviceModelIds', 'name slug')
      .populate('categoryIds', 'name slug')
      .lean(),
    Product.countDocuments(filter),
  ]);

  const productIds = items.map((p) => p._id);
  const variants = await ProductVariant.find({ productId: { $in: productIds }, isActive: true }).lean();
  const byProduct = new Map<string, typeof variants>();
  for (const v of variants) {
    const key = String(v.productId);
    if (!byProduct.has(key)) byProduct.set(key, []);
    byProduct.get(key)!.push(v);
  }

  return {
    items: items.map((p) => {
      const vs = byProduct.get(String(p._id)) ?? [];
      const prices = vs.map((v) => v.priceMinor);
      const minPrice = prices.length ? Math.min(...prices) : p.basePriceMinor;
      const maxPrice = prices.length ? Math.max(...prices) : p.basePriceMinor;
      const inStock = vs.some((v) => v.stockOnHand - v.stockReserved > 0);
      const colors = [...new Set(vs.map((v) => v.color))];
      return {
        ...p,
        minPriceMinor: minPrice,
        maxPriceMinor: maxPrice,
        inStock,
        colors,
        variantCount: vs.length,
      };
    }),
    page: query.page,
    limit: query.limit,
    total,
    totalPages: Math.ceil(total / query.limit),
  };
}

export async function getProductBySlug(slug: string) {
  const product = await Product.findOne({ slug, status: 'active' })
    .populate('brandIds', 'name slug deviceFamilyLabel')
    .populate('compatibleDeviceModelIds', 'name slug brandId')
    .populate('categoryIds', 'name slug')
    .lean();
  assertFound(product, 'Product not found');

  const variants = await ProductVariant.find({ productId: product._id, isActive: true })
    .populate({ path: 'deviceModelId', populate: { path: 'brandId', select: 'name slug deviceFamilyLabel' } })
    .lean();

  return {
    ...product,
    variants: variants.map((v) => ({
      ...v,
      availableStock: Math.max(0, v.stockOnHand - v.stockReserved),
    })),
  };
}

export async function getRelatedProducts(productId: string, deviceModelId?: string, limit = 8) {
  const filter: Record<string, unknown> = {
    status: 'active',
    _id: { $ne: productId },
  };
  if (deviceModelId) filter.compatibleDeviceModelIds = deviceModelId;
  return Product.find(filter).sort({ salesCount: -1, publishedAt: -1 }).limit(limit).lean();
}

export async function listBrands() {
  return Brand.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean();
}

export async function listDeviceModels(brandSlug?: string) {
  const filter: Record<string, unknown> = { isActive: true };
  if (brandSlug) {
    const brand = await Brand.findOne({ slug: brandSlug, isActive: true });
    if (!brand) return [];
    filter.brandId = brand._id;
  }
  return DeviceModel.find(filter)
    .populate('brandId', 'name slug deviceFamilyLabel')
    .sort({ sortOrder: 1, name: 1 })
    .lean();
}

export async function listCategories() {
  return Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean();
}

export async function getFacetOptions(deviceModelSlug?: string) {
  const productFilter: Record<string, unknown> = { status: 'active' };
  if (deviceModelSlug) {
    const model = await DeviceModel.findOne({ slug: deviceModelSlug });
    if (model) productFilter.compatibleDeviceModelIds = model._id;
  }
  const products = await Product.find(productFilter).select('_id material caseType').lean();
  const ids = products.map((p) => p._id);
  const variants = await ProductVariant.find({ productId: { $in: ids }, isActive: true })
    .select('color priceMinor')
    .lean();
  return {
    colors: [...new Set(variants.map((v) => v.color))].sort(),
    materials: [...new Set(products.map((p) => p.material).filter(Boolean))].sort(),
    caseTypes: [...new Set(products.map((p) => p.caseType).filter(Boolean))].sort(),
    priceRange: {
      minMinor: variants.length ? Math.min(...variants.map((v) => v.priceMinor)) : 0,
      maxMinor: variants.length ? Math.max(...variants.map((v) => v.priceMinor)) : 0,
    },
  };
}

export async function adminUpsertProduct(data: Record<string, unknown>, id?: string) {
  if (id) {
    const updated = await Product.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!updated) throw new AppError('Product not found', 404);
    return updated;
  }
  return Product.create(data);
}
