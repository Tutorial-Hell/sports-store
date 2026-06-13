import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { paypal } from '@/lib/paypal'

describe('generateAccessToken', () => {
  beforeEach(() => {
    vi.stubEnv('PAYPAL_CLIENT_ID', 'test-client-id')
    vi.stubEnv('PAYPAL_APP_SECRET', 'test-secret')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('returns the access token on a successful response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'mock-access-token' }),
    } as Response)

    const token = await paypal.generateAccessToken()

    expect(token).toBe('mock-access-token')
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/oauth2/token'),
      expect.objectContaining({
        method: 'POST',
        body: 'grant_type=client_credentials',
      })
    )
  })

  it('throws an error when the response is not ok', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      text: async () => 'Invalid client credentials',
    } as Response)

    await expect(paypal.generateAccessToken()).rejects.toThrow(
      'Invalid client credentials'
    )
  })
})

describe('createOrder', () => {
  beforeEach(() => {
    vi.spyOn(paypal, 'generateAccessToken').mockResolvedValue('mock-access-token')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns the created PayPal order on a successful response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'paypal-order-id', status: 'CREATED' }),
    } as Response)

    const order = await paypal.createOrder(10)

    expect(order).toEqual({ id: 'paypal-order-id', status: 'CREATED' })
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v2/checkout/orders'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer mock-access-token' }),
      })
    )
  })

  it('throws an error when the response is not ok', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      text: async () => 'Invalid amount',
    } as Response)

    await expect(paypal.createOrder(10)).rejects.toThrow('Invalid amount')
  })
})

describe('capturePayment', () => {
  beforeEach(() => {
    vi.spyOn(paypal, 'generateAccessToken').mockResolvedValue('mock-access-token')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns the capture result on a successful response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'paypal-order-id', status: 'COMPLETED' }),
    } as Response)

    const result = await paypal.capturePayment('paypal-order-id')

    expect(result).toEqual({ id: 'paypal-order-id', status: 'COMPLETED' })
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v2/checkout/orders/paypal-order-id/capture'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer mock-access-token' }),
      })
    )
  })

  it('throws an error when the response is not ok', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      text: async () => 'Order already captured',
    } as Response)

    await expect(paypal.capturePayment('paypal-order-id')).rejects.toThrow(
      'Order already captured'
    )
  })
})
