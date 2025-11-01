import { defineFunction } from '@aws-amplify/backend'

export const geoapifyProxy = defineFunction({
  name: 'geoapify-proxy',
  timeoutSeconds: 30,
})
