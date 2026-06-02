import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '@/db/prisma'
import { getLatestProducts, getProductBySlug } from '@/lib/actions/product.actions'

const mockProduct = {
  id: '1',
  name: 'Test Shoes',
  slug: 'test-shoes',
  category: 'Shoes',
  brand: 'Nike',
  description: 'A test product',
  stock: 10,
  images: ['/test.jpg'],
  isFeatured: false,
  banner: null,
  price: '99.99',
  rating: '4.50',
  numReviews: 0,
  createdAt: new Date('2024-01-01'),
}

const findMany = vi.mocked(prisma.product.findMany)
const findFirst = vi.mocked(prisma.product.findFirst)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getLatestProducts', () => {
  it('returns products ordered by createdAt desc', async () => {
    findMany.mockResolvedValue([mockProduct] as never)

    const result = await getLatestProducts()

    expect(findMany).toHaveBeenCalledWith({
      take: expect.any(Number),
      orderBy: { createdAt: 'desc' },
    })
    expect(result).toHaveLength(1)
    expect(result[0].slug).toBe('test-shoes')
  })

  it('returns an empty array when no products exist', async () => {
    findMany.mockResolvedValue([] as never)

    const result = await getLatestProducts()

    expect(result).toEqual([])
  })
})

describe('getProductBySlug', () => {
  it('returns a product matching the slug', async () => {
    findFirst.mockResolvedValue(mockProduct as never)

    const result = await getProductBySlug('test-shoes')

    expect(findFirst).toHaveBeenCalledWith({ where: { slug: 'test-shoes' } })
    expect(result?.name).toBe('Test Shoes')
  })

  it('returns null when slug does not match', async () => {
    findFirst.mockResolvedValue(null)

    const result = await getProductBySlug('not-a-real-slug')

    expect(result).toBeNull()
  })
})
