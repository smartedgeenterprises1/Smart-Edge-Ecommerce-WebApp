import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { Brand, DeviceModel } from '../modules/brands/brand.model.js';
import { slugify } from '../lib/utils.js';

const APPLE_MODELS = [
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

async function main() {
  await connectDatabase();
  const apple = await Brand.findOneAndUpdate(
    { slug: 'apple' },
    {
      $set: {
        name: 'Apple',
        slug: 'apple',
        deviceFamilyLabel: 'iPhone',
        description: 'Covers for Apple iPhone models.',
        logoUrl: '/brands/apple.svg',
        sortOrder: 1,
        isActive: true,
      },
    },
    { upsert: true, new: true },
  );

  let created = 0;
  let updated = 0;
  for (let i = 0; i < APPLE_MODELS.length; i++) {
    const name = APPLE_MODELS[i];
    const slug = slugify(name);
    const existing = await DeviceModel.findOne({ slug });
    if (existing) {
      existing.name = name;
      existing.brandId = apple!._id;
      existing.sortOrder = i + 1;
      existing.isActive = true;
      await existing.save();
      updated += 1;
    } else {
      await DeviceModel.create({
        brandId: apple!._id,
        name,
        slug,
        sortOrder: i + 1,
        isActive: true,
      });
      created += 1;
    }
  }

  console.log(JSON.stringify({ brand: apple?.slug, created, updated, total: APPLE_MODELS.length }, null, 2));
  await disconnectDatabase();
}

main().catch(async (err) => {
  console.error(err);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
