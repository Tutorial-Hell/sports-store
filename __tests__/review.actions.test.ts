import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '@/db/prisma'
import { auth } from '@/auth'
import {
  createUpdateReview,
  getReviews,
  getReviewByProductId,
} from '@/lib/actions/review.actions'

const mockAuth = vi.mocked(auth)
const productFindFirst = vi.mocked(prisma.product.findFirst)
const reviewFindFirst = vi.mocked(prisma.review.findFirst)
const reviewFindMany = vi.mocked(prisma.review.findMany)
const transaction = vi.mocked(prisma.$transaction)

const mockProduct = { id: 'product-1', slug: 'test-product' }

const mockReviewData = {
  title: 'Great product',
  description: 'Really loved this item',
  productId: 'product-1',
  userId: 'user-1',
  rating: 5,
}

const makeTx = (overrides: Record<string, unknown> = {}) => ({
  review: {
    create: vi.fn(),
    update: vi.fn(),
    aggregate: vi.fn().mockResolvedValue({ _avg: { rating: 5 } }),
    count: vi.fn().mockResolvedValue(1),
  },
  product: {
    update: vi.fn(),
  },
  ...overrides,
})

beforeEach(() => {
  vi.clearAllMocks()
  mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
})

describe('createUpdateReview', () => {
  it('creates a new review and returns success', async () => {
    productFindFirst.mockResolvedValue(mockProduct as never)
    reviewFindFirst.mockResolvedValue(null)
    const tx = makeTx()
    transaction.mockImplementation(async (fn: (tx: typeof tx) => Promise<void>) => fn(tx))

    const result = await createUpdateReview(mockReviewData)

    expect(result.success).toBe(true)
    expect(result.message).toBe('Review Updated Successfully')
    expect(tx.review.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ title: 'Great product', rating: 5 }) })
    )
    expect(tx.product.update).toHaveBeenCalled()
  })

  it('updates an existing review instead of creating a duplicate', async () => {
    const existingReview = { id: 'review-1', productId: 'product-1', userId: 'user-1' }
    productFindFirst.mockResolvedValue(mockProduct as never)
    reviewFindFirst.mockResolvedValue(existingReview as never)
    const tx = makeTx()
    transaction.mockImplementation(async (fn: (tx: typeof tx) => Promise<void>) => fn(tx))

    const result = await createUpdateReview(mockReviewData)

    expect(result.success).toBe(true)
    expect(tx.review.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'review-1' } })
    )
    expect(tx.review.create).not.toHaveBeenCalled()
  })

  it('returns error when user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null as never)

    const result = await createUpdateReview(mockReviewData)

    expect(result.success).toBe(false)
    expect(result.message).toMatch(/not authenticated/i)
  })

  it('returns error when product does not exist', async () => {
    productFindFirst.mockResolvedValue(null)

    const result = await createUpdateReview(mockReviewData)

    expect(result.success).toBe(false)
    expect(result.message).toMatch(/product not found/i)
  })

  it('returns error when review data fails validation', async () => {
    const result = await createUpdateReview({
      ...mockReviewData,
      title: 'ab', // fails min(3)
    })

    expect(result.success).toBe(false)
  })

  it('recalculates product rating and numReviews after create', async () => {
    productFindFirst.mockResolvedValue(mockProduct as never)
    reviewFindFirst.mockResolvedValue(null)
    const tx = makeTx()
    tx.review.aggregate = vi.fn().mockResolvedValue({ _avg: { rating: 4.5 } })
    tx.review.count = vi.fn().mockResolvedValue(3)
    transaction.mockImplementation(async (fn: (tx: typeof tx) => Promise<void>) => fn(tx))

    await createUpdateReview(mockReviewData)

    expect(tx.product.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'product-1' },
        data: { rating: 4.5, numReviews: 3 },
      })
    )
  })
})

describe('getReviews', () => {
  it('returns reviews for the given product', async () => {
    const mockReviews = [
      { id: 'review-1', title: 'Nice', rating: 4, user: { name: 'Alice' } },
    ]
    reviewFindMany.mockResolvedValue(mockReviews as never)

    const result = await getReviews({ productId: 'product-1' })

    expect(reviewFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { productId: 'product-1' } })
    )
    expect(result.data).toHaveLength(1)
    expect(result.data[0].title).toBe('Nice')
  })

  it('returns an empty array when there are no reviews', async () => {
    reviewFindMany.mockResolvedValue([] as never)

    const result = await getReviews({ productId: 'product-99' })

    expect(result.data).toHaveLength(0)
  })
})

describe('getReviewByProductId', () => {
  it("returns the current user's review for a product", async () => {
    const mockReview = { id: 'review-1', productId: 'product-1', userId: 'user-1' }
    reviewFindFirst.mockResolvedValue(mockReview as never)

    const result = await getReviewByProductId({ productId: 'product-1' })

    expect(reviewFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { productId: 'product-1', userId: 'user-1' } })
    )
    expect(result).toMatchObject({ id: 'review-1' })
  })

  it('throws when user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null as never)

    await expect(getReviewByProductId({ productId: 'product-1' })).rejects.toThrow(
      /not authenticated/i
    )
  })
})
