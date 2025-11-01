import { defineStorage } from '@aws-amplify/backend'

export const storage = defineStorage({
  name: 'kellishyirbucket',
  access: (allow) => ({
    'newsletters/*': [
      // Admin can read and write
      allow.groups(['Admin']).to(['read', 'write', 'delete']),
      // Authenticated users can read
      allow.authenticated.to(['read']),
    ],
    'thumbnails/*': [
      // Admin can read and write
      allow.groups(['Admin']).to(['read', 'write', 'delete']),
      // Authenticated users can read
      allow.authenticated.to(['read']),
    ],
  }),
})
