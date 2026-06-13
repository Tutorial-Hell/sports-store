import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '@/db/prisma'
import { paypal } from '@/lib/paypal'
import { createPayPalOrder, approvePayPalOrder } from '@/lib/actions/order.actions'

vi.mock('@/lib/paypal', () => ({
  paypal: {
    createOrder: vi.fn(),
    capturePayment: vi.fn(),
    generateAccessToken: vi.fn(),
  },
}))

const orderFindFirst = vi.mocked(prisma.order.findFirst)
const orderUpdate = vi.mocked(prisma.order.update)
const createOrder = vi.mocked(paypal.createOrder)
const capturePayment = vi.mocked(paypal.capturePayment)

const mockOrder = {
  id: 'order-1',
  totalPrice: '100.00',
  isPaid: false,
  paymentResult: { id: 'paypal-order-id', status: '', email_address: '', pricePaid: '0' },
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('createPayPalOrder', () => {
  it('creates a PayPal order and saves the id to paymentResult', async () => {
    orderFindFirst.mockResolvedValue(mockOrder as never)
    createOrder.mockResolvedValue({ id: 'paypal-order-id' } as never)
    orderUpdate.mockResolvedValue({} as never)

    const result = await createPayPalOrder('order-1')

    expect(createOrder).toHaveBeenCalledWith(100)
    expect(orderUpdate).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: {
        paymentResult: {
          id: 'paypal-order-id',
          email_address: '',
          status: '',
          pricePaid: '0',
        },
      },
    })
    expect(result).toEqual({
      success: true,
      message: 'PayPal order created successfully',
      data: 'paypal-order-id',
    })
  })

  it('returns failure when order is not found', async () => {
    orderFindFirst.mockResolvedValue(null as never)

    const result = await createPayPalOrder('order-1')

    expect(createOrder).not.toHaveBeenCalled()
    expect(result.success).toBe(false)
    expect(result.message).toBe('Order not found')
  })

  it('returns failure when PayPal create order throws', async () => {
    orderFindFirst.mockResolvedValue(mockOrder as never)
    createOrder.mockRejectedValue(new Error('PayPal error'))

    const result = await createPayPalOrder('order-1')

    expect(orderUpdate).not.toHaveBeenCalled()
    expect(result.success).toBe(false)
    expect(result.message).toBe('PayPal error')
  })
})

describe('approvePayPalOrder', () => {
  it('marks the order as paid when capture is completed', async () => {
    orderFindFirst
      .mockResolvedValueOnce(mockOrder as never)
      .mockResolvedValueOnce({ ...mockOrder, orderitems: [] } as never)

    capturePayment.mockResolvedValue({
      id: 'paypal-order-id',
      status: 'COMPLETED',
      payer: { email_address: 'buyer@example.com' },
      purchase_units: [{ payments: { captures: [{ amount: { value: '100.00' } }] } }],
    } as never)
    orderUpdate.mockResolvedValue({} as never)

    const result = await approvePayPalOrder('order-1', { orderID: 'paypal-order-id' })

    expect(orderUpdate).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: {
        isPaid: true,
        paidAt: expect.any(Date),
        paymentResult: {
          id: 'paypal-order-id',
          status: 'COMPLETED',
          email_address: 'buyer@example.com',
          pricePaid: '100.00',
        },
      },
    })
    expect(result).toEqual({ success: true, message: 'Your order has been paid' })
  })

  it('returns failure when order is not found', async () => {
    orderFindFirst.mockResolvedValue(null as never)

    const result = await approvePayPalOrder('order-1', { orderID: 'paypal-order-id' })

    expect(capturePayment).not.toHaveBeenCalled()
    expect(result.success).toBe(false)
    expect(result.message).toBe('Order not found')
  })

  it('returns failure when capture status is not completed', async () => {
    orderFindFirst.mockResolvedValue(mockOrder as never)
    capturePayment.mockResolvedValue({
      id: 'paypal-order-id',
      status: 'PENDING',
    } as never)

    const result = await approvePayPalOrder('order-1', { orderID: 'paypal-order-id' })

    expect(orderUpdate).not.toHaveBeenCalled()
    expect(result.success).toBe(false)
    expect(result.message).toBe('Error in PayPal payment')
  })

  it('returns failure when DB update throws', async () => {
    orderFindFirst
      .mockResolvedValueOnce(mockOrder as never)
      .mockResolvedValueOnce({ ...mockOrder, orderitems: [] } as never)

    capturePayment.mockResolvedValue({
      id: 'paypal-order-id',
      status: 'COMPLETED',
      payer: { email_address: 'buyer@example.com' },
      purchase_units: [{ payments: { captures: [{ amount: { value: '100.00' } }] } }],
    } as never)
    orderUpdate.mockRejectedValue(new Error('DB connection failed'))

    const result = await approvePayPalOrder('order-1', { orderID: 'paypal-order-id' })

    expect(result.success).toBe(false)
    expect(result.message).toBe('DB connection failed')
  })
})
