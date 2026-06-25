import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '@/db/prisma'
import { getLatestProducts, getProductBySlug, getAllProducts } from '@/lib/actions/product.actions'

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
const count = vi.mocked(prisma.product.count)

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

describe('getAllProducts', () => {
  it('returns all products with no filter when query is empty', async () => {
    findMany.mockResolvedValue([mockProduct] as never)
    count.mockResolvedValue(1 as never)

    const result = await getAllProducts({ query: '', page: 1 })

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} })
    )
    expect(count).toHaveBeenCalledWith({ where: {} })
    expect(result.data).toHaveLength(1)
  })

  it('filters by name when query is provided', async () => {
    findMany.mockResolvedValue([mockProduct] as never)
    count.mockResolvedValue(1 as never)

    await getAllProducts({ query: 'shoes', page: 1 })

    const expectedFilter = { name: { contains: 'shoes', mode: 'insensitive' } }
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expectedFilter })
    )
    expect(count).toHaveBeenCalledWith({ where: expectedFilter })
  })

  it('calculates totalPages from the filtered count', async () => {
    findMany.mockResolvedValue([] as never)
    count.mockResolvedValue(10 as never)

    const result = await getAllProducts({ query: '', page: 1, limit: 4 })

    expect(result.totalPages).toBe(3)
  })

  it('applies correct pagination skip based on page', async () => {
    findMany.mockResolvedValue([] as never)
    count.mockResolvedValue(0 as never)

    await getAllProducts({ query: '', page: 3, limit: 4 })

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 8, take: 4 })
    )
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
