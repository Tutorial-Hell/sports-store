import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '@/db/prisma'
import { auth } from '@/auth'
import { updateUserAddress, updateUserPaymentMethod, getAllUsers } from '@/lib/actions/user.actions'

const mockAuth = vi.mocked(auth)
const userFindMany = vi.mocked(prisma.user.findMany)
const userFindFirst = vi.mocked(prisma.user.findFirst)
const userCount = vi.mocked(prisma.user.count)
const userUpdate = vi.mocked(prisma.user.update)

const validAddress = {
  fullName: 'John Doe',
  streetAddress: '123 Main St',
  city: 'New York',
  postalCode: '12345',
  country: 'United States',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('updateUserAddress', () => {
  it('saves address and returns success for authenticated user', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    userUpdate.mockResolvedValue({} as never)

    const result = await updateUserAddress(validAddress)

    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { address: validAddress },
    })
    expect(result).toEqual({ success: true, message: 'Address updated successfully' })
  })

  it('returns failure when user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null as never)

    const result = await updateUserAddress(validAddress)

    expect(userUpdate).not.toHaveBeenCalled()
    expect(result.success).toBe(false)
    expect(typeof result.message).toBe('string')
  })

  it('returns failure when address data fails validation', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)

    const result = await updateUserAddress({
      fullName: 'Jo',
      streetAddress: 'AB',
      city: 'NY',
      postalCode: '1',
      country: 'US',
    })

    expect(userUpdate).not.toHaveBeenCalled()
    expect(result.success).toBe(false)
    expect(typeof result.message).toBe('string')
  })

  it('returns failure when DB update throws', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    userUpdate.mockRejectedValue(new Error('DB connection failed'))

    const result = await updateUserAddress(validAddress)

    expect(result.success).toBe(false)
    expect(result.message).toBe('DB connection failed')
  })
})

describe('updateUserPaymentMethod', () => {
  it('saves payment method and returns success for authenticated user', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    userFindFirst.mockResolvedValue({ id: 'user-1' } as never)
    userUpdate.mockResolvedValue({} as never)

    const result = await updateUserPaymentMethod({ type: 'PayPal' })

    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { paymentMethod: 'PayPal' },
    })
    expect(result).toEqual({ success: true, message: 'User updated successfully' })
  })

  it('returns failure when user is not found', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    userFindFirst.mockResolvedValue(null as never)

    const result = await updateUserPaymentMethod({ type: 'PayPal' })

    expect(userUpdate).not.toHaveBeenCalled()
    expect(result.success).toBe(false)
    expect(result.message).toBe('User not found')
  })

  it('returns failure when payment method type is invalid', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    userFindFirst.mockResolvedValue({ id: 'user-1' } as never)

    const result = await updateUserPaymentMethod({ type: 'Bitcoin' })

    expect(userUpdate).not.toHaveBeenCalled()
    expect(result.success).toBe(false)
    expect(typeof result.message).toBe('string')
  })

  it('returns failure when DB update throws', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    userFindFirst.mockResolvedValue({ id: 'user-1' } as never)
    userUpdate.mockRejectedValue(new Error('DB connection failed'))

    const result = await updateUserPaymentMethod({ type: 'PayPal' })

    expect(result.success).toBe(false)
    expect(result.message).toBe('DB connection failed')
  })
})

describe('getAllUsers', () => {
  it('returns all users with no filter when query is empty', async () => {
    userFindMany.mockResolvedValue([{ id: 'user-1', name: 'John', email: 'john@example.com' }] as never)
    userCount.mockResolvedValue(1 as never)

    const result = await getAllUsers({ query: '', page: 1 })

    expect(userFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} })
    )
    expect(userCount).toHaveBeenCalledWith({ where: {} })
    expect(result.data).toHaveLength(1)
  })

  it('filters by name when query is provided', async () => {
    userFindMany.mockResolvedValue([] as never)
    userCount.mockResolvedValue(0 as never)

    await getAllUsers({ query: 'john', page: 1 })

    const expectedFilter = { name: { contains: 'john', mode: 'insensitive' } }
    expect(userFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expectedFilter })
    )
    expect(userCount).toHaveBeenCalledWith({ where: expectedFilter })
  })

  it('calculates totalPages from the filtered count', async () => {
    userFindMany.mockResolvedValue([] as never)
    userCount.mockResolvedValue(9 as never)

    const result = await getAllUsers({ query: '', page: 1, limit: 3 })

    expect(result.totalPages).toBe(3)
  })
})
