export type ApiSuccess<T> = { success: true; data: T };
export type ApiError = {
  success: false;
  error: { message: string; code?: string; details?: unknown };
};

export type User = {
  _id: string;
  id?: string;
  email: string;
  fullName: string;
  phone?: string;
  role: 'customer' | 'admin';
  addresses?: Address[];
  wishlist?: string[] | ProductListItem[];
};

export type Address = {
  _id?: string;
  label?: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  province: string;
  postalCode?: string;
  country?: string;
  isDefault?: boolean;
};

export type Brand = {
  _id: string;
  name: string;
  slug: string;
  deviceFamilyLabel?: string;
  description?: string;
  logoUrl?: string;
  sortOrder?: number;
};

export type DeviceModel = {
  _id: string;
  name: string;
  slug: string;
  series?: string;
  brandId: string | Brand;
};

export type Category = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  isFeatured?: boolean;
  imageUrl?: string;
};

export type ProductImage = { url: string; alt?: string; sortOrder?: number };

export type ProductListItem = {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  images?: ProductImage[];
  basePriceMinor: number;
  compareAtPriceMinor?: number;
  minPriceMinor?: number;
  maxPriceMinor?: number;
  inStock?: boolean;
  colors?: string[];
  variantCount?: number;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  caseType?: string;
  material?: string;
  brandIds?: Brand[];
  categoryIds?: Category[];
  compatibleDeviceModelIds?: DeviceModel[];
  status?: string;
};

export type ProductVariant = {
  _id: string;
  productId: string;
  sku: string;
  deviceModelId?: DeviceModel | string | null;
  color: string;
  colorHex?: string;
  priceMinor: number;
  compareAtPriceMinor?: number;
  stockOnHand: number;
  stockReserved: number;
  availableStock: number;
  images?: ProductImage[];
  isActive?: boolean;
  lowStockThreshold?: number;
};

export type ProductDetail = ProductListItem & {
  features?: string[];
  materials?: string[];
  careInstructions?: string;
  seoTitle?: string;
  seoDescription?: string;
  variants: ProductVariant[];
};

export type Facets = {
  colors: string[];
  materials: string[];
  caseTypes: string[];
  priceRange: { minMinor: number; maxMinor: number };
};

export type CatalogResult = {
  items: ProductListItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type CartLineLocal = { variantId: string; quantity: number };

export type QuoteItem = {
  variantId: string;
  productId: string;
  title: string;
  slug: string;
  sku: string;
  color: string;
  colorHex?: string;
  deviceBrandName: string;
  deviceModelName: string;
  deviceModelId: string;
  imageUrl: string;
  unitPriceMinor: number;
  compareAtPriceMinor?: number;
  quantity: number;
  lineTotalMinor: number;
  available: number;
};

export type CartQuote = {
  items: QuoteItem[];
  currency: string;
  subtotalMinor: number;
  discountMinor: number;
  shippingMinor: number;
  taxMinor: number;
  totalMinor: number;
  couponCode: string;
  priceChanged: boolean;
};

export type StoreSettings = {
  storeName: string;
  tagline: string;
  announcement: string;
  heroImageUrl?: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  socialLinks?: { instagram?: string; facebook?: string; whatsapp?: string };
  currency: string;
  country: string;
  shippingFlatMinor: number;
  freeShippingThresholdMinor: number;
  serviceClaims?: string[];
  policies?: {
    shipping?: string;
    returns?: string;
    privacy?: string;
    terms?: string;
    faq?: string;
    about?: string;
    policiesAreDraft?: boolean;
    draftDisclaimer?: string;
  };
  seoDefaults?: { titleSuffix?: string; defaultDescription?: string };
};

export type Order = {
  _id: string;
  orderNumber: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  items: Array<{
    title: string;
    sku: string;
    color: string;
    deviceModelName?: string;
    quantity: number;
    unitPriceMinor: number;
    lineTotalMinor: number;
    imageUrl?: string;
  }>;
  subtotalMinor: number;
  discountMinor: number;
  shippingMinor: number;
  totalMinor: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  shippingAddress?: Address;
  trackingNumber?: string;
  trackingCarrier?: string;
  createdAt: string;
  notes?: string;
};

export type AdminDashboard = {
  metrics: {
    ordersCount: number;
    productsCount: number;
    pendingOrders: number;
    revenueMinor: number;
    collectedOrdersCount: number;
    revenueDefinition: string;
  };
  lowStock: Array<{
    _id: string;
    sku: string;
    color: string;
    stockOnHand: number;
    stockReserved: number;
    lowStockThreshold: number;
    productId?: { title?: string };
  }>;
  recentOrders: Order[];
  salesTrend: Array<{ _id: string; orders: number; collectedMinor: number }>;
};

export type Coupon = {
  _id: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  minSubtotalMinor?: number;
  maxDiscountMinor?: number;
  startsAt: string;
  endsAt: string;
  usageLimit?: number;
  usageCount?: number;
  isActive?: boolean;
  description?: string;
};
