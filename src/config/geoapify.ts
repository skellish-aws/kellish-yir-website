/**
 * Geoapify API Configuration
 *
 * Free tier: 3,000 requests per day
 * Sign up at: https://www.geoapify.com/
 *
 * To use:
 * 1. Sign up for a free account at https://www.geoapify.com/
 * 2. Get your API key from the dashboard
 * 3. Set the VITE_GEOAPIFY_API_KEY environment variable
 */

export const GEOAPIFY_CONFIG = {
  apiKey: import.meta.env.VITE_GEOAPIFY_API_KEY || '11b3be8a12b94e7789be6c299450d3c0',
  baseUrl: 'https://api.geoapify.com/v1',
  enabled: !!import.meta.env.VITE_GEOAPIFY_API_KEY,
}

export default GEOAPIFY_CONFIG
