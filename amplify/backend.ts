import { defineBackend } from '@aws-amplify/backend'
import { auth } from './auth/resource'
import { data } from './data/resource'
import { storage } from './storage/resource'
import { addressValidator } from './functions/address-validator/resource'
import { queueAddressValidation } from './functions/queue-address-validation/resource'
import { googlemapsProxy } from './functions/googlemaps-proxy/resource'
import { exportUserData } from './functions/export-user-data/resource'
import { validateAccessCode } from './functions/validate-access-code/resource'
import { FunctionUrlAuthType } from 'aws-cdk-lib/aws-lambda'
import { Duration } from 'aws-cdk-lib'
import { Queue } from 'aws-cdk-lib/aws-sqs'
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources'
import { PolicyStatement } from 'aws-cdk-lib/aws-iam'

const backend = defineBackend({
  auth,
  data,
  storage,
  addressValidator,
  queueAddressValidation,
  googlemapsProxy,
  exportUserData,
  validateAccessCode,
})

// Add Function URL for Google Maps proxy.
// Note: CORS is handled in the Lambda handler code, not at the Function URL level
const googlemapsFunctionUrl = backend.googlemapsProxy.resources.lambda.addFunctionUrl({
  authType: FunctionUrlAuthType.NONE, // Allow public access
})

// Create Dead Letter Queue for failed address validations
const addressValidationDLQ = new Queue(
  backend.addressValidator.resources.lambda.stack,
  'AddressValidationDLQ',
  {
    retentionPeriod: Duration.days(14),
  },
)

// Create SQS queue for address validation with DLQ
const addressValidationQueue = new Queue(
  backend.addressValidator.resources.lambda.stack,
  'AddressValidationQueue',
  {
    visibilityTimeout: Duration.seconds(300), // 5 minutes for validation
    retentionPeriod: Duration.days(14),
    receiveMessageWaitTime: Duration.seconds(20), // Long polling
    deadLetterQueue: {
      queue: addressValidationDLQ,
      maxReceiveCount: 3, // Retry 3 times before sending to DLQ
    },
  },
)

// Grant permissions to queue Lambda
addressValidationQueue.grantSendMessages(backend.queueAddressValidation.resources.lambda)
backend.data.resources.tables['Recipient'].grantReadWriteData(
  backend.queueAddressValidation.resources.lambda,
)

// Pass queue URL and table name as environment variables to queue Lambda
// Use the underlying CDK NodejsFunction to add environment variables
const queueLambdaFunction = backend.queueAddressValidation.resources.lambda as any
queueLambdaFunction.addEnvironment('QUEUE_URL', addressValidationQueue.queueUrl)
queueLambdaFunction.addEnvironment(
  'RECIPIENT_TABLE_NAME',
  backend.data.resources.tables['Recipient'].tableName,
)

// Grant permissions to validator Lambda
backend.data.resources.tables['Recipient'].grantReadWriteData(
  backend.addressValidator.resources.lambda,
)

// Grant ListTables permission so the Lambda can find the Recipient table
const validatorLambda = backend.addressValidator.resources.lambda as any
validatorLambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['dynamodb:ListTables'],
    resources: ['*'], // ListTables requires * resource
  }),
)

// Add SQS as event source for Lambda
backend.addressValidator.resources.lambda.addEventSource(
  new SqsEventSource(addressValidationQueue, {
    batchSize: 10, // Process 10 addresses at a time
    maxBatchingWindow: Duration.seconds(5),
  }),
)

// Add Function URL for queue Lambda (public access for authenticated users)
const queueFunctionUrl = backend.queueAddressValidation.resources.lambda.addFunctionUrl({
  authType: FunctionUrlAuthType.NONE, // Allow public access (auth handled in app)
})

// Grant read access to SSM parameter for Google Maps API key
// Using PolicyStatement instead of grantRead() to avoid CloudFormation parameter type issues
const googlemapsApiKeyParamName = '/kellish-yir/googlemaps/api-key'

backend.addressValidator.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['ssm:GetParameter', 'ssm:GetParameters'],
    resources: [
      `arn:aws:ssm:${backend.addressValidator.resources.lambda.stack.region}:${backend.addressValidator.resources.lambda.stack.account}:parameter${googlemapsApiKeyParamName}`,
    ],
  }),
)

backend.googlemapsProxy.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['ssm:GetParameter', 'ssm:GetParameters'],
    resources: [
      `arn:aws:ssm:${backend.googlemapsProxy.resources.lambda.stack.region}:${backend.googlemapsProxy.resources.lambda.stack.account}:parameter${googlemapsApiKeyParamName}`,
    ],
  }),
)

// Add Function URL for validate access code Lambda (public access)
const validateCodeFunctionUrl = backend.validateAccessCode.resources.lambda.addFunctionUrl({
  authType: FunctionUrlAuthType.NONE, // Allow public access for code validation
})

// Grant permissions to validate code Lambda
backend.data.resources.tables['AccessCode'].grantReadData(
  backend.validateAccessCode.resources.lambda,
)

// Add Function URL for export user data Lambda (admin only, requires IAM auth)
const exportFunctionUrl = backend.exportUserData.resources.lambda.addFunctionUrl({
  authType: FunctionUrlAuthType.AWS_IAM, // Require IAM authentication (admin only)
})

// Grant permissions to export Lambda
backend.data.resources.tables['NewsletterUser'].grantReadData(
  backend.exportUserData.resources.lambda,
)
backend.data.resources.tables['AccessCode'].grantReadData(backend.exportUserData.resources.lambda)
backend.data.resources.tables['Recipient'].grantReadData(backend.exportUserData.resources.lambda)
backend.data.resources.tables['Newsletter'].grantReadData(backend.exportUserData.resources.lambda)

// Set environment variables for export Lambda (table names)
const exportLambdaFunction = backend.exportUserData.resources.lambda as any
exportLambdaFunction.addEnvironment(
  'NEWSLETTER_USER_TABLE_NAME',
  backend.data.resources.tables['NewsletterUser'].tableName,
)
exportLambdaFunction.addEnvironment(
  'ACCESS_CODE_TABLE_NAME',
  backend.data.resources.tables['AccessCode'].tableName,
)
exportLambdaFunction.addEnvironment(
  'RECIPIENT_TABLE_NAME',
  backend.data.resources.tables['Recipient'].tableName,
)
exportLambdaFunction.addEnvironment(
  'NEWSLETTER_TABLE_NAME',
  backend.data.resources.tables['Newsletter'].tableName,
)

// Export Lambda URLs for client
backend.addOutput({
  custom: {
    queueValidationUrl: queueFunctionUrl.url,
    googlemapsProxyUrl: googlemapsFunctionUrl.url,
    exportUserDataUrl: exportFunctionUrl.url,
    validateAccessCodeUrl: validateCodeFunctionUrl.url,
  },
})
