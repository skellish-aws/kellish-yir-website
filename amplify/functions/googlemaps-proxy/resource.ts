import { defineFunction } from '@aws-amplify/backend'

/**
 * Google Maps Address Validation Proxy Lambda Function
 *
 * Proxies requests to Google Maps Address Validation API with API key stored in SSM Parameter Store
 * Handles both US and international address validation
 */

export const googlemapsProxy = defineFunction({
  name: 'googlemaps-proxy',
  entry: './handler.ts',
  environment: {
    SSM_PARAMETER_NAME: '/kellish-yir/googlemaps/api-key',
  },
})

