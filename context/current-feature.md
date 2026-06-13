# Current Feature

## Status

<!-- Not Started | In Progress | Completed -->

## Goals

<!-- Goals and requirements -->

## Notes

<!-- Any extra notes -->

## History

<!-- Keep this updated earliest to latest -->

### Next.js Project Setup
- Bootstrapped Next.js 15 app with App Router
- Configured Tailwind CSS and shadcn/ui component library
- Set up `next-themes` for light/dark mode support
- Established route groups: `app/(root)/` for public pages with shared Header + Footer layout
- Dev server configured to run on port 3001 via `NEXT_PUBLIC_SERVER_URL`

### Database Creation
- Provisioned a Neon Postgres serverless database
- Added `DATABASE_URL` environment variable for the connection string
- Configured WebSocket support via `@neondatabase/serverless` for Neon's serverless connection pooling

### Prisma Configuration
- Installed Prisma and configured it to use the Neon serverless driver adapter
- Set generated client output to `lib/generated/prisma` (non-default location)
- Enabled `earlyAccess` flag in `prisma.config.ts` for driver adapter support
- Created `db/prisma.ts` as the singleton Prisma client with computed string fields for `price` and `rating` (stored as `Decimal` in Postgres, serialized as `string` to avoid issues across server/client boundaries)
- Created `db/seed.ts` using the `pg` adapter (instead of Neon serverless) so it can run directly with `tsx` outside of Next.js

### Auth Layout
- Created `app/(auth)/` route group with `AuthLayout` that centers content vertically and horizontally
- Added `/sign-in` page: card with logo (links to homepage), title, and description
- Added `/sign-out` page: logo (links to homepage) and heading, centered
- Applied Inter as the default site font via `next/font/google` on the body

### Add Toast (shadcn/ui)
- Installed `sonner` via `npx shadcn@latest add sonner` — creates `components/ui/sonner.tsx`
- Added `<Toaster />` to `app/layout.tsx` for site-wide toast availability
- `AddToCart` component updated to render a `<Button>` that fires `toast.success()` on click
- `AddToCart` wired into `ProductCard` (homepage cards) and product detail page action column
- Fixed pre-existing next-auth v5 build error: `declare module 'next-auth/jwt'` → `@auth/core/jwt`

### ShippingAddress Form
- Created `app/(root)/shipping-address/shipping-address-form.tsx` — client form using `react-hook-form` + `zodResolver(shippingAddressSchema)` with fields for Full Name, Street Address, Postal Code, Country
- Created `app/(root)/shipping-address/page.tsx` — server page that guards empty cart, fetches user's existing address, and pre-populates the form
- Added `updateUserAddress` server action to `lib/actions/user.actions.ts` — validates with `shippingAddressSchema`, saves to `user.address` (JSON field), returns `{ success, message }`
- Added `components/ui/form.tsx` — shadcn Form component written manually (CLI install failed)
- Fixed `formatError` in `lib/utils.ts`: removed unnecessary `async`, switched from `error.errors` to `error.issues` (correct Zod v3 API)
- Added unit tests in `__tests__/user.actions.test.ts` covering happy path, unauthenticated, validation failure, and DB error cases

### Payment Method Form
- Created `app/(root)/payment-method/payment-method-form.tsx` — client form using `react-hook-form` + `zodResolver(paymentMethodSchema)` with `RadioGroup` for selecting from `PAYMENT_METHODS`, `useTransition` for pending state, and `toast` for feedback; redirects to `/place-order` on success
- Created `app/(root)/payment-method/page.tsx` — server page that guards empty cart, fetches user's saved payment method, and pre-selects it in the form
- Added `components/ui/radio-group.tsx` — shadcn RadioGroup using `@radix-ui/react-radio-group` (rewrote auto-installed version which used incompatible `radix-ui` bundle)
- Fixed `PAYMENT_METHODS` constant default in `lib/constants/index.ts`: was `['PayPal, Stripe, CashOnDelivery']` (one element) — corrected to `['PayPal', 'Stripe', 'CashOnDelivery']`
- Added unit tests for `updateUserPaymentMethod` covering happy path, user not found, invalid payment type, and DB error

### Order Details Page
- Created `app/(root)/order/[id]/order-details-table.tsx` — displays shipping address, payment status, order items, and price summary for an order
- Wired `OrderDetailsTable` into `app/(root)/order/[id]/page.tsx`
- Extended `db/prisma.ts` with computed string fields for `cart`/`order`/`orderItem` Decimal prices (itemsPrice, shippingPrice, taxPrice, totalPrice, item price)
- Added `formatId` and `formatDateTime` helpers to `lib/utils.ts`

### Place Order Form Fix
- Fixed `app/(root)/place-order/place-order-form.tsx`: `PlaceOrderButton` was defined inside the render body, failing `react-hooks/static-components` and breaking the production build — moved it to module scope

### PayPal Create Order & Capture Payment
- Added `createOrder(price)` and `capturePayment(orderId)` to `lib/paypal.ts`, calling the PayPal Orders v2 API (`/v2/checkout/orders`, `/v2/checkout/orders/{id}/capture`) via `generateAccessToken()`, with shared `handleResponse<T>` helper and typed `PayPalOrderResponse`/`PayPalCaptureResponse` responses
- Added `paymentResultSchema` to `lib/validators.ts` and `PaymentResult` type to `types/index.ts`
- Added `createPayPalOrder(orderId)` server action — creates the PayPal order and stores its id on `order.paymentResult`
- Added `approvePayPalOrder(orderId, { orderID })` server action — captures payment, validates the captured order id/status, marks the order paid via `updateOrderToPaid`, and revalidates `/order/[id]`
- Added unit tests in `__tests__/paypal.test.ts` (createOrder/capturePayment) and `__tests__/order.actions.test.ts` (createPayPalOrder/approvePayPalOrder); added `prisma.order` and `next/cache` mocks to `__tests__/setup.ts`
- PayPal buttons/UI wiring on the order details page is out of scope for this feature
