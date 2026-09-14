import { Router } from 'express';
import { ok } from '../../lib/api-response.js';
import { asyncHandler, validateQuery } from '../../middleware/error.js';
import {
  catalogQuerySchema,
  getFacetOptions,
  getProductBySlug,
  getRelatedProducts,
  listBrands,
  listCategories,
  listDeviceModels,
  listProducts,
} from './product.service.js';

export const catalogRouter = Router();

catalogRouter.get(
  '/products',
  validateQuery(catalogQuerySchema),
  asyncHandler(async (req, res) => {
    const query = (req as typeof req & { validatedQuery: unknown }).validatedQuery as ReturnType<
      typeof catalogQuerySchema.parse
    >;
    const result = await listProducts(query);
    ok(res, result);
  }),
);

catalogRouter.get(
  '/products/:slug',
  asyncHandler(async (req, res) => {
    const product = await getProductBySlug(String(req.params.slug));
    const related = await getRelatedProducts(
      String(product._id),
      product.compatibleDeviceModelIds?.[0]
        ? String((product.compatibleDeviceModelIds[0] as { _id?: unknown })._id ?? product.compatibleDeviceModelIds[0])
        : undefined,
    );
    ok(res, { product, related });
  }),
);

catalogRouter.get(
  '/brands',
  asyncHandler(async (_req, res) => {
    ok(res, await listBrands());
  }),
);

catalogRouter.get(
  '/device-models',
  asyncHandler(async (req, res) => {
    const brand = typeof req.query.brand === 'string' ? req.query.brand : undefined;
    ok(res, await listDeviceModels(brand));
  }),
);

catalogRouter.get(
  '/categories',
  asyncHandler(async (_req, res) => {
    ok(res, await listCategories());
  }),
);

catalogRouter.get(
  '/facets',
  asyncHandler(async (req, res) => {
    const model = typeof req.query.model === 'string' ? req.query.model : undefined;
    ok(res, await getFacetOptions(model));
  }),
);
