# SMART EDGE — Mobile Accessories E-commerce

Full-stack store for Pakistan (PKR) focused on phone covers for **Apple (iPhone)**, **Google (Pixel)**, and **Samsung (Galaxy)**.

## Stack

| Layer | Tech |
| --- | --- |
| Storefront | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| API | Node.js, Express 5, TypeScript |
| Database | MongoDB + Mongoose 9 |
| Auth | HttpOnly session cookies (bcrypt password hashes) |
| Payments | Cash on Delivery adapter (online providers pluggable later) |

## Repository layout

```
client/   Next.js storefront + admin UI
server/   Express REST API (authoritative business logic)
```

## Prerequisites

- Node.js 20+
- MongoDB 7+ (local service or Atlas). **Multi-document transactions** used at checkout require a replica set (Atlas provides this; for local, initiate a single-node replica set).

### Local replica set (transactions)

Checkout prefers multi-document transactions. On a **standalone** MongoDB (typical local install), the API automatically falls back to atomic conditional updates without a multi-doc transaction and logs a warning. For production, use **MongoDB Atlas** or initiate a replica set:

```bash
# mongosh
rs.initiate({ _id: "rs0", members: [{ _id: 0, host: "127.0.0.1:27017" }] })
```

## Quick start

```bash
# Root helpers
npm install

# Server
cp server/.env.example server/.env
# edit SESSION_SECRET / CSRF_SECRET / MONGODB_URI

# Client
cp client/.env.example client/.env.local

npm run seed --prefix server
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='choose-a-strong-password' ADMIN_NAME='Store Admin' npm run create-admin --prefix server

# Run both (from root)
npm run dev
```

- Storefront: http://localhost:3000  
- API: http://localhost:4000/health  
- Admin: http://localhost:3000/admin (after admin login)

## Inventory policy

- `stockOnHand` = physical units  
- `stockReserved` = held for active checkout reservations  
- **Available** = on-hand − reserved  
- Checkout creates a short-lived reservation (atomic conditional updates), then consumes it into a sale  
- A background job expires reservations and releases stock (TTL indexes alone are not used to restore stock)  
- Cancellation restores sold stock **exactly once** via `order.inventoryRestored`  
- Money is stored as **integer minor units** (paisa). Display as PKR.

## Revenue definition (admin)

**Collected revenue** = sum of order totals where `paymentStatus === 'collected'`.  
Unpaid / pending Cash on Delivery orders are **not** counted as revenue.

## Cookie / CORS / domains

- API sets `se_session` HttpOnly cookie  
- `CLIENT_ORIGIN` must match the Next.js origin (default `http://localhost:3000`)  
- CORS allows credentials from that origin only  
- For production split domains, set `COOKIE_SECURE=true`, appropriate `COOKIE_SAME_SITE` (`none` if cross-site), and `COOKIE_DOMAIN`  
- Next.js never holds auth secrets in `NEXT_PUBLIC_*` variables

## Email & uploads

- `EMAIL_DRIVER=preview` writes messages to `server/mail-preview/` (does **not** claim delivery)  
- Product images: local `server/uploads/` served at `/uploads/*` (dev). Production can swap the storage adapter.

## Scripts

| Command | Where | Purpose |
| --- | --- | --- |
| `npm run dev` | root / each app | Development servers |
| `npm run build` | root / each | Production builds |
| `npm run typecheck` | each | TypeScript |
| `npm run lint` | each | ESLint |
| `npm run test` | server | Vitest API tests |
| `npm run seed` | server | Dev seed (refuses production unless `ALLOW_PROD_SEED=true`) |
| `npm run create-admin` | server | Interactive/env-based admin creation (no hardcoded password) |

## Seed notes

- ~20 cover listings across Apple / Google / Samsung with per-model variants  
- Low-stock and out-of-stock examples  
- Coupons `EDGE10`, `SAVE500` (development)  
- SVG placeholder images generated locally (no scraped product photos)  
- Optional `SEED_CUSTOMER_PASSWORD` creates `customer@smartedge.local`

## API overview

- `GET /api/settings`  
- `GET /api/catalog/products|brands|device-models|categories|facets`  
- `POST /api/cart/quote`, `POST /api/cart/checkout`  
- `POST /api/auth/register|login|logout|forgot-password|reset-password`, `GET /api/auth/me`  
- `GET/PATCH /api/account/*`  
- `GET /api/orders/mine`, `POST /api/orders/guest-lookup`  
- ` /api/admin/*` — dashboard, catalog, inventory, orders, customers, coupons, settings, uploads, audit logs  

## Deployment

1. Provision MongoDB (replica set / Atlas)  
2. Set production secrets on the API host  
3. Build: `npm run build --prefix server && npm run build --prefix client`  
4. Run API (`npm start --prefix server`) behind HTTPS  
5. Host Next.js (`npm start --prefix client` or a Node/edge host) with `NEXT_PUBLIC_API_URL` / `API_URL` pointing at the API  
6. Align cookie domain, CORS origin, and `PUBLIC_API_URL` for uploaded assets  

## Assumptions

- Brand color primary ≈ `#75D1FF` from the provided SMART EDGE logo  
- Reference site phonecase.pk informed IA (brand → model → covers); branding and content are original  
- Policy text ships as **draft** until owner review  
- No MagSafe / drop-rating / licensing claims unless configured  
- Online payment provider credentials are **not** required for the complete COD demo  

## Still needed from owner

- Production MongoDB / hosting credentials  
- Real product photography  
- Confirmed shipping rates, cities covered, return windows  
- Legal review of privacy / terms  
- SMTP (or other) email provider for password reset delivery  
- Optional future online payment merchant account  

## Brand note

Apple and iPhone are not separate brands: brand = **Apple**, device family = **iPhone**.
