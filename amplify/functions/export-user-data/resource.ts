import { defineFunction } from '@aws-amplify/backend'

export const exportUserData = defineFunction({
  name: 'export-user-data',
  entry: './handler.ts',
})
