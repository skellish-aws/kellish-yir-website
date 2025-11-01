/**
 * Queue Address Validation API
 *
 * Accepts address validation requests and queues them to SQS
 */

import { SQSClient, SendMessageCommand, SendMessageBatchCommand } from '@aws-sdk/client-sqs'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb'

const sqsClient = new SQSClient({})
const dynamoClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(dynamoClient)

const QUEUE_URL = process.env.QUEUE_URL || ''
const RECIPIENT_TABLE_NAME = process.env.RECIPIENT_TABLE_NAME || ''

interface AddressValidationRequest {
  recipientId: string
  address1: string
  address2?: string
  city: string
  state: string
  zipcode: string
  country?: string
}

export const handler = async (event: any) => {
  console.log('Queue validation request:', JSON.stringify(event))

  // Handle CORS preflight
  if (event.requestContext?.http?.method === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'POST,OPTIONS',
      },
      body: '',
    }
  }

  try {
    const body = JSON.parse(event.body || '{}')

    // Support both single and batch requests
    const requests: AddressValidationRequest[] = Array.isArray(body) ? body : [body]

    if (requests.length === 0) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'No validation requests provided' }),
      }
    }

    // Send to SQS
    if (requests.length === 1) {
      await sendSingleMessage(requests[0])
    } else {
      await sendBatchMessages(requests)
    }

    // Update status to 'queued' for all recipients
    await Promise.all(
      requests.map((req) =>
        updateRecipientStatus(req.recipientId, 'queued', 'Queued for validation'),
      ),
    )

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        queued: requests.length,
      }),
    }
  } catch (error) {
    console.error('Error queuing validation:', error)
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        error: 'Failed to queue validation',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    }
  }
}

async function sendSingleMessage(request: AddressValidationRequest): Promise<void> {
  const command = new SendMessageCommand({
    QueueUrl: QUEUE_URL,
    MessageBody: JSON.stringify(request),
  })

  await sqsClient.send(command)
  console.log('Queued validation for recipient:', request.recipientId)
}

async function sendBatchMessages(requests: AddressValidationRequest[]): Promise<void> {
  // SQS batch limit is 10 messages
  const batchSize = 10

  for (let i = 0; i < requests.length; i += batchSize) {
    const batch = requests.slice(i, i + batchSize)

    const command = new SendMessageBatchCommand({
      QueueUrl: QUEUE_URL,
      Entries: batch.map((req, index) => ({
        Id: `${i + index}`,
        MessageBody: JSON.stringify(req),
      })),
    })

    await sqsClient.send(command)
    console.log(`Queued batch of ${batch.length} validations`)
  }
}

async function updateRecipientStatus(
  recipientId: string,
  status: string,
  message: string,
): Promise<void> {
  const command = new UpdateCommand({
    TableName: RECIPIENT_TABLE_NAME,
    Key: { id: recipientId },
    UpdateExpression: 'SET addressValidationStatus = :status, addressValidationMessage = :message',
    ExpressionAttributeValues: {
      ':status': status,
      ':message': message,
    },
  })

  await docClient.send(command)
}
