import { defineFunction } from '@aws-amplify/backend'

export const uspsProxy = defineFunction({
  name: 'usps-proxy',
  entry: './handler.ts',
  environment: {
    USPS_CONSUMER_KEY: 'jqYd2m9p8biwhptLG7J6xAZkbdEm6bLnzmGgTKxAhCUnkff5',
    USPS_CONSUMER_SECRET: 'rNlZ0DStNDe1DHtpGwZpQjqYwRZRzIfDTAIF6M8Dc7hKAOQ5gHoPK1mFcoAsDSH3',
  },
})
