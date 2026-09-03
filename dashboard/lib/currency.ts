'use client';

/**
 * ReadyPI Currency Module — India AI Market
 * Handles multi-currency pricing with INR as primary base currency.
 */

// Supported currencies
export type Currency = 'INR' | 'USD' | 'BDT' | 'PKR';

// Currency symbols
export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  INR: '₹',
  USD: '$',
  BDT: '৳',
  PKR: '₨',
};

// Exchange rates (INR base)
const EXCHANGE_RATES: Record<Currency, number> = {
  INR: 1,       // 1 INR = 1 INR
  USD: 0.0116,  // 1 INR = 0.0116 USD (~86.5 INR per USD)
  BDT: 1.32,    // 1 INR = 1.32 BDT
  PKR: 3.25,    // 1 INR = 3.25 PKR
};

/**
 * Convert price from INR base to target currency
 */
export function convertCurrency(priceINR: number, targetCurrency: Currency): number {
  if (priceINR === 0) return 0;
  
  const rate = EXCHANGE_RATES[targetCurrency];
  const converted = priceINR * rate;
  
  if (targetCurrency === 'USD') {
    return Math.round(converted * 100) / 100;
  }
  
  return Math.round(converted);
}

/**
 * Format price with currency symbol and Indian numbering system (en-IN)
 */
export function formatPrice(price: number, currency: Currency): string {
  const symbol = CURRENCY_SYMBOLS[currency];
  
  if (currency === 'USD') {
    return `${symbol}${price.toFixed(2)}`;
  }
  
  return `${symbol}${price.toLocaleString('en-IN')}`;
}

export function getCurrencyLocale(currency: Currency): string {
  switch (currency) {
    case 'INR':
      return 'en-IN';
    case 'BDT':
      return 'bn-BD';
    case 'USD':
      return 'en-US';
    case 'PKR':
      return 'en-PK';
    default:
      return 'en-IN';
  }
}

export function convertAndFormat(priceINR: number, currency: Currency = 'INR'): string {
  const converted = convertCurrency(priceINR, currency);
  return formatPrice(converted, currency);
}