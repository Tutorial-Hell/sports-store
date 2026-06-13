const base = process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com'

export interface PayPalOrderResponse {
    id: string
    status: string
}

export interface PayPalCaptureResponse {
    id: string
    status: string
    payer: {
        email_address: string
    }
    purchase_units: Array<{
        payments: {
            captures: Array<{
                amount: {
                    value: string
                }
            }>
        }
    }>
}

export const paypal = {
    // Create a PayPal order for the given price
    async createOrder(price: number) {
        const accessToken = await paypal.generateAccessToken()

        const response = await fetch(`${base}/v2/checkout/orders`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                intent: 'CAPTURE',
                purchase_units: [
                    {
                        amount: {
                            currency_code: 'USD',
                            value: price.toFixed(2)
                        }
                    }
                ]
            })
        })

        return handleResponse<PayPalOrderResponse>(response)
    },

    // Capture payment for an approved PayPal order
    async capturePayment(orderId: string) {
        const accessToken = await paypal.generateAccessToken()

        const response = await fetch(`${base}/v2/checkout/orders/${orderId}/capture`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        })

        return handleResponse<PayPalCaptureResponse>(response)
    },

    // Generate access token
    async generateAccessToken() {
        const {PAYPAL_CLIENT_ID, PAYPAL_APP_SECRET} = process.env
        const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_APP_SECRET}`).toString('base64')

        const response = await fetch(`${base}/v1/oauth2/token`, {
            method: 'POST',
            body: 'grant_type=client_credentials',
            headers: {
                Authorization: `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })

        if(response.ok) {
            const jsonData = await response.json()
            return jsonData.access_token
        } else {
            const errorMessage = await response.text()
            throw new Error(errorMessage)
        }
    }
}

// Shared response handler for PayPal API calls
async function handleResponse<T>(response: Response): Promise<T> {
    if(response.ok) {
        return response.json()
    } else {
        const errorMessage = await response.text()
        throw new Error(errorMessage)
    }
}
