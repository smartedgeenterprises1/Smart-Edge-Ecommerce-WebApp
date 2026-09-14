export type Brand = {
  _id: string;
  name: string;
  slug: string;
  deviceFamilyLabel: string;
  description?: string;
};

export type DeviceModel = {
  _id: string;
  name: string;
  slug: string;
  brandId: Brand | string;
};

export type Category = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  isFeatured?: boolean;
};

export type ProductImage = { url: string; alt?: string; sortOrder?: number };

export type ProductListItem = {
  _id: string;
  title: string;
  slug: string;
  images: ProductImage[];
  minPriceMinor: number;
  maxPriceMinor: number;
  compareAtPriceMinor?: number;
  inStock: boolean;
  colors: string[];
  brandIds?: Brand[];
  compatibleDeviceModelIds?: Array<{ _id: string; name: string; slug: string }>;
  caseType?: string;
  material?: string;
  isFeatured?: boolean;
  isNewArrival?: boolean;
};

export type ProductVariant = {
  _id: string;
  sku: string;
  color: string;
  colorHex?: string;
  priceMinor: number;
  compareAtPriceMinor?: number;
  availableStock: number;
  stockOnHand: number;
  stockReserved: number;
  images: ProductImage[];
  deviceModelId?: {
    _id: string;
    name: string;
    slug: string;
    brandId?: Brand;
  } | string;
  isActive: boolean;
};

export type ProductDetail = ProductListItem & {
  description: string;
  features?: string[];
  materials?: string[];
  careInstructions?: string;
  seoTitle?: string;
  seoDescription?: string;
  categoryIds?: Category[];
  variants: ProductVariant[];
  basePriceMinor: number;
};

export type StoreSettings = {
  storeName: string;
  tagline: string;
  announcement?: string;
  heroImageUrl?: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  shippingFlatMinor: number;
  freeShippingThresholdMinor: number;
  serviceClaims?: string[];
  policies: {
    shipping: string;
    returns: string;
    privacy: string;
    terms: string;
    faq: string;
    about: string;
    policiesAreDraft?: boolean;
    draftDisclaimer?: string;
  };
  featuredProductIds?: string[];
  seoDefaults?: { titleSuffix?: string; defaultDescription?: string };
};

export type CartLine = { variantId: string; quantity: number };

export type Quote = {
  items: Array<{
    variantId: string;
    productId: string;
    title: string;
    slug: string;
    sku: string;
    color: string;
    deviceBrandName: string;
    deviceModelName: string;
    imageUrl: string;
    unitPriceMinor: number;
    quantity: number;
    lineTotalMinor: number;
    available: number;
  }>;
  currency: string;
  subtotalMinor: number;
  discountMinor: number;
  shippingMinor: number;
  taxMinor: number;
  totalMinor: number;
  couponCode: string;
};
