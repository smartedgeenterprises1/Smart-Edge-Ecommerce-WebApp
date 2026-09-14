import { Router } from 'express';
import { z } from 'zod';
import { ok } from '../../lib/api-response.js';
import { asyncHandler, validateBody } from '../../middleware/error.js';
import { requireAuth } from '../../middleware/auth.js';
import { User } from '../users/user.model.js';
import { Product } from '../products/product.model.js';
import { StoreSettings } from '../settings/settings.model.js';
import { AppError } from '../../lib/errors.js';

export const accountRouter = Router();

accountRouter.use(requireAuth);

accountRouter.get(
  '/profile',
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user!._id).select('-passwordHash');
    ok(res, user);
  }),
);

accountRouter.patch(
  '/profile',
  validateBody(
    z.object({
      fullName: z.string().min(2).max(120).optional(),
      phone: z.string().max(30).optional(),
    }),
  ),
  asyncHandler(async (req, res) => {
    const user = await User.findByIdAndUpdate(req.user!._id, req.body, { new: true }).select('-passwordHash');
    ok(res, user);
  }),
);

accountRouter.get(
  '/addresses',
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user!._id).select('addresses');
    ok(res, user?.addresses ?? []);
  }),
);

accountRouter.post(
  '/addresses',
  validateBody(
    z.object({
      label: z.string().max(60).optional(),
      fullName: z.string().min(2).max(120),
      phone: z.string().min(7).max(30),
      street: z.string().min(3).max(200),
      city: z.string().min(2).max(100),
      province: z.string().min(2).max(100),
      postalCode: z.string().max(20).optional(),
      country: z.string().length(2).default('PK'),
      isDefault: z.boolean().optional(),
    }),
  ),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user!._id);
    if (!user) throw new AppError('User not found', 404);
    if (req.body.isDefault) {
      user.addresses.forEach((a) => {
        a.isDefault = false;
      });
    }
    user.addresses.push(req.body);
    await user.save();
    ok(res, user.addresses, 201);
  }),
);

accountRouter.delete(
  '/addresses/:addressId',
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user!._id);
    if (!user) throw new AppError('User not found', 404);
    user.addresses = user.addresses.filter((a) => String(a._id) !== req.params.addressId) as typeof user.addresses;
    await user.save();
    ok(res, user.addresses);
  }),
);

accountRouter.get(
  '/wishlist',
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user!._id).populate({
      path: 'wishlist',
      match: { status: 'active' },
    });
    ok(res, user?.wishlist ?? []);
  }),
);

accountRouter.post(
  '/wishlist/:productId',
  asyncHandler(async (req, res) => {
    const product = await Product.findOne({ _id: req.params.productId, status: 'active' });
    if (!product) throw new AppError('Product not found', 404);
    await User.findByIdAndUpdate(req.user!._id, { $addToSet: { wishlist: product._id } });
    ok(res, { added: true });
  }),
);

accountRouter.delete(
  '/wishlist/:productId',
  asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user!._id, { $pull: { wishlist: req.params.productId } });
    ok(res, { removed: true });
  }),
);

export const settingsPublicRouter = Router();

settingsPublicRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    let settings = await StoreSettings.findOne({ key: 'default' }).lean();
    if (!settings) {
      const created = await StoreSettings.create({ key: 'default' });
      settings = created.toObject();
    }
    ok(res, settings);
  }),
);
