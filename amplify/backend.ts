import { defineBackend } from '@aws-amplify/backend'
import { auth } from './auth/resource'
import { data } from './data/resource'
import { storage } from './storage/resource'
import { uspsProxy } from './functions/usps-proxy/resource'
import { addressValidator } from './functions/address-validator/resource'
import { queueAddressValidation } from './functions/queue-address-validation/resource'
import { geoapifyProxy } from './functions/geoapify-proxy/resource'
import { addresszenProxy } from './functions/addresszen-proxy/resource'
import { FunctionUrlAuthType } from 'aws-cdk-lib/aws-lambda'
import { Duration } from 'aws-cdk-lib'
import { Queue } from 'aws-cdk-lib/aws-sqs'
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources'
import { StringParameter } from 'aws-cdk-lib/aws-ssm'
import { PolicyStatement } from 'aws-cdk-lib/aws-iam'

const backend = defineBackend({
  auth,
  data,
  storage,
  uspsProxy,
  addressValidator,
  queueAddressValidation,
  geoapifyProxy,
  addresszenProxy,
})

// Add Function URL for USPS proxy
// Note: CORS is handled in the Lambda handler code, not at the Function URL level
backend.uspsProxy.resources.lambda.addFunctionUrl({
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

// Create SSM Parameters for API keys (values will be set manually in AWS Console)
const geoapifyApiKeyParam = StringParameter.fromStringParameterName(
  backend.addressValidator.resources.lambda.stack,
  'GeoapifyApiKey',
  '/kellish-yir/geoapify/api-key',
)

const uspsConsumerKeyParam = StringParameter.fromStringParameterName(
  backend.addressValidator.resources.lambda.stack,
  'UspsConsumerKey',
  '/kellish-yir/usps/consumer-key',
)

const uspsConsumerSecretParam = StringParameter.fromStringParameterName(
  backend.addressValidator.resources.lambda.stack,
  'UspsConsumerSecret',
  '/kellish-yir/usps/consumer-secret',
)

const addresszenApiKeyParam = StringParameter.fromStringParameterName(
  backend.addressValidator.resources.lambda.stack,
  'AddressZenApiKey',
  '/kellish-yir/addresszen/api-key',
)

// Grant read access to SSM parameters for validator Lambda
geoapifyApiKeyParam.grantRead(backend.addressValidator.resources.lambda)
uspsConsumerKeyParam.grantRead(backend.addressValidator.resources.lambda)
uspsConsumerSecretParam.grantRead(backend.addressValidator.resources.lambda)
addresszenApiKeyParam.grantRead(backend.addressValidator.resources.lambda)

// Grant read access to SSM parameters for uspsProxy Lambda
uspsConsumerKeyParam.grantRead(backend.uspsProxy.resources.lambda)
uspsConsumerSecretParam.grantRead(backend.uspsProxy.resources.lambda)

// Grant read access to SSM parameters for geoapifyProxy Lambda
geoapifyApiKeyParam.grantRead(backend.geoapifyProxy.resources.lambda)

// Grant read access to SSM parameters for addresszenProxy Lambda
addresszenApiKeyParam.grantRead(backend.addresszenProxy.resources.lambda)

// Add Function URL for Geoapify proxy
const geoapifyFunctionUrl = backend.geoapifyProxy.resources.lambda.addFunctionUrl({
  authType: FunctionUrlAuthType.NONE, // Allow public access
})

// Add Function URL for AddressZen proxy
const addresszenFunctionUrl = backend.addresszenProxy.resources.lambda.addFunctionUrl({
  authType: FunctionUrlAuthType.NONE, // Allow public access
})

// Export Lambda URLs for client
backend.addOutput({
  custom: {
    queueValidationUrl: queueFunctionUrl.url,
    geoapifyProxyUrl: geoapifyFunctionUrl.url,
    addresszenProxyUrl: addresszenFunctionUrl.url,
  },
})
