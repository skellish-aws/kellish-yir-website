import { defineFunction } from '@aws-amplify/backend'

export const validateAccessCode = defineFunction({
  name: 'validate-access-code',
  entry: './handler.ts',
})

