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
