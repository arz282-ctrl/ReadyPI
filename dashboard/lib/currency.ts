'use client';

/**
 * ReadyPI Currency Module
 * Handles multi-currency pricing for Bangladesh & South Asia market
 */

// Supported currencies
export type Currency = 'BDT' | 'USD' | 'INR' | 'PKR';

// Currency symbols
export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  BDT: '৳',
  USD: '$',
  INR: '₹',
  PKR: '₨',
};

// Exchange rates (BDT base)
// These rates should be fetched from an API in production
// For now, using approximate rates as of 2024
const EXCHANGE_RATES: Record<Currency, number> = {
  BDT: 1,      // 1 BDT = 1 BDT
  USD: 0.0091, // 1 BDT = 0.0091 USD (~110 BDT per USD)
  INR: 0.76,   // 1 BDT = 0.76 INR (~1.32 INR per BDT)
  PKR: 2.52,   // 1 BDT = 2.52 PKR (~0.40 PKR per BDT)
};

/**
 * Convert price from BDT to target currency
 * @param priceBDT - Price in BDT
 * @param targetCurrency - Target currency
 * @returns Converted price (rounded to nearest integer)
 */
export function convertCurrency(priceBDT: number, targetCurrency: Currency): number {
  if (priceBDT === 0) return 0;
  
  const rate = EXCHANGE_RATES[targetCurrency];
  const converted = priceBDT * rate;
  
  // Round to appropriate precision
  if (targetCurrency === 'USD') {
    return Math.round(converted * 100) / 100; // 2 decimal places for USD
  }
  
  return Math.round(converted);
}

/**
 * Format price with currency symbol
 * @param price - Price value
 * @param currency - Currency code
 * @returns Formatted price string
 */
export function formatPrice(price: number, currency: Currency): string {
  const symbol = CURRENCY_SYMBOLS[currency];
  
  if (currency === 'USD') {
    return `${symbol}${price.toFixed(2)}`;
  }
  
  return `${symbol}${price.toLocaleString()}`;
}

/**
 * Get currency locale for formatting
 * @param currency - Currency code
 * @returns Locale string
 */
export function getCurrencyLocale(currency: Currency): string {
  switch (currency) {
    case 'BDT':
      return 'bn-BD';
    case 'USD':
      return 'en-US';
    case 'INR':
      return 'en-IN';
    case 'PKR':
      return 'en-PK';
    default:
      return 'en-US';
  }
}

/**
 * Convert price with locale formatting
 * @param priceBDT - Price in BDT
 * @param currency - Target currency
 * @returns Formatted price string with symbol
 */
export function convertAndFormat(priceBDT: number, currency: Currency): string {
  const converted = convertCurrency(priceBDT, currency);
  return formatPrice(converted, currency);
}