/**
 * USPS API Configuration
 *
 * To use the USPS Address Validation API, you need to:
 * 1. Register for a USPS Web Tools User ID at: https://www.usps.com/business/web-tools-apis/
 * 2. Replace 'YOUR_USPS_USER_ID' with your actual User ID
 * 3. The API is free but has usage restrictions (only for shipping/mailing services)
 */

export const USPS_CONFIG = {
  // Replace with your actual USPS API credentials
  CONSUMER_KEY: 'jqYd2m9p8biwhptLG7J6xAZkbdEm6bLnzmGgTKxAhCUnkff5',
  CONSUMER_SECRET: 'rNlZ0DStNDe1DHtpGwZpQjqYwRZRzIfDTAIF6M8Dc7hKAOQ5gHoPK1mFcoAsDSH3',

  // API endpoints (newer USPS API)
  AUTH_URL: 'https://api.usps.com/oauth2/v3/token',
  BASE_URL: 'https://api.usps.com',
  ADDRESS_VALIDATION_ENDPOINT: '/addresses/v3/address',

  // Rate limiting (requests per minute)
  RATE_LIMIT: 5,

  // Timeout in milliseconds
  TIMEOUT: 10000,
}

// Instructions for getting a USPS User ID:
export const USPS_SETUP_INSTRUCTIONS = `
To use USPS Address Validation:

1. Go to https://www.usps.com/business/web-tools-apis/
2. Click "Get Started" and create an account
3. Request access to the Address Validation API
4. Once approved, you'll receive a User ID
5. Replace 'YOUR_USPS_USER_ID' in this file with your actual User ID

Note: The USPS API is intended for use with USPS shipping/mailing services only.
Using it for other purposes may violate their terms of service.
`
