import { defineFunction } from '@aws-amplify/backend'

export const addressValidator = defineFunction({
  name: 'address-validator',
  entry: './handler.ts',
  timeoutSeconds: 300, // 5 minutes
  memoryMB: 512,
})
