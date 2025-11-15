import { defineBackend } from '@aws-amplify/backend'
import { auth } from './auth/resource'
import { data } from './data/resource'
import { storage } from './storage/resource'
import { addressValidator } from './functions/address-validator/resource'
import { queueAddressValidation } from './functions/queue-address-validation/resource'
import { googlemapsProxy } from './functions/googlemaps-proxy/resource'
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
})

// Add Function URL for Google Maps proxy.
// Note: CORS is handled in the Lambda handler code, not at the Function URL level
const googlemapsFunctionUrl = backend.googlemapsProxy.resources.lambda.addFunctionUrl({
  authType: FunctionUrlAuthType.NONE, // Allow public access
})

// Create SQS queue for address validation
const addressValidationQueue = new Queue(
  backend.addressValidator.resources.lambda.stack,
  'AddressValidationQueue',
  {
    visibilityTimeout: Duration.seconds(300), // 5 minutes for validation
    retentionPeriod: Duration.days(14),
    receiveMessageWaitTime: Duration.seconds(20), // Long polling
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

// Export Lambda URLs for client
backend.addOutput({
  custom: {
    queueValidationUrl: queueFunctionUrl.url,
    googlemapsProxyUrl: googlemapsFunctionUrl.url,
  },
})
