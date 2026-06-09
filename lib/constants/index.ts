export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ||'Sportstore'
export const APP_DESCRIPTION = process.env.NEXT_PUBLIC_APP_DESCRIPTION ||'A modern ecommerce store built with Next.Js'
export const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3001')
export const LATEST_PRODUCTS_LIMIT = Number(process.env.LATEST_PRODUCTS_LIMIT) || 4

export const signInDefaultValues = {
   email: '',
   password: ''                                   
}

export const signUpDefaultValues = {
   name: '',
   email: '',
   password: '' ,
   confirmPassword: ''                                  
}

export const shippingAddressDefaultValues = {
   name: 'John Doe',
   streetAddress: '272 E 3rd Street',
   city: "New York, NY",
   postalCode: '10009-1234',
   country: 'USA'
}

export const PAYMENT_METHODS = process.env.PAYMENT_METHODS ? process.env.PAYMENT_METHODS.split(', ') :
['PayPal', 'Stripe', 'CashOnDelivery']
export const DEFAULT_PAYMENT_METHOD = process.env.DEFAULT_PAYMENT_METHOD || 'PayPal'
