import { defineFunction } from '@aws-amplify/backend'

/**
 * AddressZen Proxy Lambda Function
 *
 * Proxies requests to AddressZen API with API key stored in SSM Parameter Store
 * Handles both US and international address validation
 */

export const addresszenProxy = defineFunction({
  name: 'addresszen-proxy',
  entry: './handler.ts',
  environment: {
    SSM_PARAMETER_NAME: '/kellish-yir/addresszen/api-key',
  },
})
