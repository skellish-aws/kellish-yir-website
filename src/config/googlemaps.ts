/**
 * Google Maps Address Validation API Configuration
 *
 * Google Maps Address Validation API handles both US and international addresses.
 * Get your API key from: https://console.cloud.google.com/
 *
 * Documentation: https://developers.google.com/maps/documentation/address-validation
 */

export const GOOGLEMAPS_CONFIG = {
  baseUrl: 'https://addressvalidation.googleapis.com/v1',
  enabled: true, // Always enabled when proxy is deployed
  timeout: 10000, // 10 seconds
}

