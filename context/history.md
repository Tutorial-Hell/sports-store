# History

### Fix Stripe Return URL Domain
- Fixed `app/(root)/order/[id]/stripe-payment.tsx`: `return_url` passed to `stripe.confirmPayment` was built from `SERVER_URL` (`lib/constants/index.ts`), a build-time `NEXT_PUBLIC_SERVER_URL`/`VERCEL_URL` value baked into the client bundle — caused customers checking out on the custom Namecheap domain to be redirected back to the Vercel domain after payment
- Since `StripeForm` only ever runs in the browser (parent `order-details-table.tsx` is `'use client'`), switched to `window.location.origin` computed at submit time so the redirect always matches the domain the customer is actually on
