# Sportstore

This is an ecommerce site made with Next.js

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Context Files

Read the following to get the full context of the project

- @context/project-overview.md
- @context/coding-standards.md
- @context/ai-interaction.md
- @context/current-feature.md

## Commands

```bash
npm run dev        # start dev server (runs on port 3001 per NEXT_PUBLIC_SERVER_URL)
npm run build      # production build
npm run lint       # ESLint
npx prisma migrate dev   # run migrations
npx prisma studio        # open Prisma Studio to inspect DB
npx tsx db/seed.ts       # seed the database with sample products
```

## Architecture

This is a **Next.js 15 ecommerce app** (App Router) using Neon Postgres via Prisma with the serverless driver.

### Routing

- `app/layout.tsx` — root layout: sets metadata, `ThemeProvider` (next-themes), global font
- `app/(root)/layout.tsx` — shell for public pages: wraps content with `Header` + `Footer`
- `app/(root)/page.tsx` — homepage, fetches and renders latest products
- `app/(root)/product/[slug]/page.tsx` — product detail page

### Data layer

- **`db/prisma.ts`** — the singleton `prisma` client. Uses `@neondatabase/serverless` + WebSockets for Neon's serverless connection pooling. Extends the client with computed string fields for `price` and `rating` (stored as `Decimal` in Postgres, returned as `string` to avoid serialization issues across server/client boundaries).
- **`lib/actions/product.actions.ts`** — Server Actions (`'use server'`) for all product data fetching. Always call `convertToPlainObject()` on Prisma results before returning from a Server Action to strip non-serializable Decimal types.
- **`db/seed.ts`** — uses `pg` adapter (not Neon serverless) so it can run directly with `tsx` outside Next.js.

### Type safety

- **`lib/validartors.ts`** — Zod schemas for data validation. The `insertProductSchema` is the source of truth for product shape.
- **`types/index.ts`** — `Product` type is inferred from `insertProductSchema` and extended with `id`, `rating` (string), and `createdAt`.

### Components

- `components/ui/` — shadcn/ui primitives (Button, Card, Badge, Sheet, DropdownMenu)
- `components/shared/header/` — site header with theme toggle and menu
- `components/shared/product/` — ProductList, ProductCard, ProductImages, ProductPrice

### Environment variables

| Variable                      | Purpose                                            |
| ----------------------------- | -------------------------------------------------- |
| `DATABASE_URL`                | Neon Postgres connection string                    |
| `NEXT_PUBLIC_SERVER_URL`      | Base URL (defaults to `http://localhost:3001`)     |
| `NEXT_PUBLIC_APP_NAME`        | Site name displayed in metadata                    |
| `NEXT_PUBLIC_APP_DESCRIPTION` | Site description for metadata                      |
| `LATEST_PRODUCTS_LIMIT`       | How many products the homepage fetches (default 4) |

On Vercel, `VERCEL_URL` is used automatically as `metadataBase` — no need to set `NEXT_PUBLIC_SERVER_URL` there.

### Prisma notes

- Generated client outputs to `lib/generated/prisma` (not the default location) — import from there.
- `prisma.config.ts` enables the `earlyAccess` flag required for driver adapters.
- After any schema change: `npx prisma migrate dev` then `npm run postinstall` (or just `prisma generate`).
