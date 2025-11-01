import { defineFunction } from '@aws-amplify/backend'

export const queueAddressValidation = defineFunction({
  name: 'queue-address-validation',
  entry: './handler.ts',
  timeoutSeconds: 30,
})
