import { vi } from 'vitest'

vi.mock('@/db/prisma', () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))
