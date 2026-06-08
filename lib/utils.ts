import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Convert Prisma object to regular JS object
export function convertToPlainObject<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

// Format number with decimal places
export function formatNumberWithDecimal(num: number): string {
  const [int, decimal] = num.toString().split('.');

  return decimal ? `${int}.${decimal.padEnd(2, '0')}` : `${int}.00`

}

// Format Errors
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatError(error: any) {
  if (error.name === 'ZodError') {
    const fieldErrors = error.issues.map((issue: { message: string }) => issue.message)
    return fieldErrors.join('. ')
  }

  if (error.name === 'PrismaClientKnownRequestError' && error.code === 'P2002') {
    const field = error.meta?.target ? error.meta.target[0] : 'Email'
    return `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
  }

  return typeof error.message === 'string' ? error.message : JSON.stringify(error.message)
}

// Round prices to 2 decimal places
export function round2(value: number | string) {
  if(typeof value === 'number') {
     return Math.round((value + Number.EPSILON) *100) / 100
  } else if (typeof value === 'string') { 
    return Math.round(Number(value + Number.EPSILON) *100) / 100
  }
    else {
      throw new Error ('Value is not a number or string ')
    }
  }

  // Currency Formatter
  const CURRENCY_FORMATTER = new Intl.NumberFormat('en-US', {
    currency: 'USD',
    style: 'currency',
    minimumFractionDigits: 2
  })

  // Format currency using formatter
  export function FormatCurrency(amount: number | string | null) {
    if (typeof amount === 'number') {
      return CURRENCY_FORMATTER.format(amount)
    } else if (typeof amount === 'string') {
      return CURRENCY_FORMATTER.format(Number(amount))
    } else {
      return 'NaN'
    }

  }