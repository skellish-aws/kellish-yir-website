// src/amplify-config.ts
import { Amplify } from 'aws-amplify'
import amplifyOutputsJson from '../amplify_outputs.json'

// Amplify outputs use snake_case (user_pool_id) not camelCase (userPoolId)
const userPoolId = amplifyOutputsJson.auth?.user_pool_id

if (!amplifyOutputsJson.auth || !userPoolId) {
  console.warn(
    '⚠️ amplify_outputs.json exists but auth configuration is missing or incomplete.',
    'The backend deployment may still be in progress.',
    'Please wait for the Amplify sandbox to complete deployment.',
  )
  // Minimal fallback configuration - but auth won't work
  Amplify.configure({
    version: '1',
    auth: {
      aws_region: 'us-east-1',
      userPoolId: '',
      userPoolClientId: '',
      identityPoolId: '',
    },
    custom: {
      queueValidationUrl: '',
      googlemapsProxyUrl: '',
    },
  })
} else {
  console.log('✅ Amplify configuration loaded successfully')
  Amplify.configure(amplifyOutputsJson)
}
