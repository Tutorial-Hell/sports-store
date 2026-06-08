import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '@/db/prisma'
import { auth } from '@/auth'
import { updateUserAddress } from '@/lib/actions/user.actions'

const mockAuth = vi.mocked(auth)
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
