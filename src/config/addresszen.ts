/**
 * AddressZen API Configuration
 *
 * AddressZen is a unified address validation service that handles both US and international addresses.
 * Get your API key from: https://addresszen.com
 *
 * API Key Format:
 * - Keys begin with "ak_" (e.g., ak_ksqa49sjSdAEDq9I88)
 * - Found in your dashboard after signing into your account
 * - First API key receives 100 test lookups
 * - You can create up to 10 API keys per account
 * - Each key has its own balance, security, and notification settings
 * - Used for authentication, security, notifications, and balance management
 *
 * Documentation: https://docs.addresszen.com/docs/guides/api-key
 */

// Read API key from environment variable
const API_KEY = import.meta.env.VITE_ADDRESSZEN_API_KEY || ''

export const ADDRESSZEN_CONFIG = {
  apiKey: API_KEY,
  baseUrl: 'https://api.addresszen.com/v1', // API base URL (version 4.0.0)
  enabled: !!API_KEY,
  timeout: 10000, // 10 seconds
  rateLimit: 30, // requests per second per IP address
}

/**
 * Validate API key format (starts with "ak_")
 */
export function isValidAddressZenApiKey(key: string): boolean {
  return key.startsWith('ak_') && key.length > 3
}

export const ADDRESSZEN_SETUP_INSTRUCTIONS = `
To use AddressZen Address Validation:

1. Go to https://addresszen.com
2. Sign up for an account
3. Get your API key from the dashboard (starts with "ak_")
4. Your first API key receives 100 test lookups
5. Add VITE_ADDRESSZEN_API_KEY to your .env.local file
6. Restart your development server

Example .env.local:
VITE_ADDRESSZEN_API_KEY=ak_ksqa49sjSdAEDq9I88

API Key Documentation: https://docs.addresszen.com/docs/guides/api-key
`
