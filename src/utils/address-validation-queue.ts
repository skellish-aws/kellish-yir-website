/**
 * Address Validation Queue Utility
 *
 * Sends address validation requests to SQS queue
 */

import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs'
import { fetchAuthSession } from 'aws-amplify/auth'

// Note: Queue URL will be provided by Amplify outputs after deployment
const QUEUE_URL = import.meta.env.VITE_ADDRESS_VALIDATION_QUEUE_URL || ''
const AWS_REGION = import.meta.env.VITE_AWS_REGION || 'us-east-1'

interface AddressValidationRequest {
  recipientId: string
  address1: string
  address2?: string
  city: string
  state: string
  zipcode: string
  country?: string
}

class AddressValidationQueue {
  private sqsClient: SQSClient | null = null

  async getSQSClient(): Promise<SQSClient> {
    if (this.sqsClient) {
      return this.sqsClient
    }

    // Get AWS credentials from Amplify
    const session = await fetchAuthSession()
    const credentials = session.credentials

    if (!credentials) {
      throw new Error('No AWS credentials available')
    }

    this.sqsClient = new SQSClient({
      region: AWS_REGION,
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        sessionToken: credentials.sessionToken,
      },
    })

    return this.sqsClient
  }

  async queueValidation(request: AddressValidationRequest): Promise<boolean> {
    if (!QUEUE_URL) {
      console.warn('Address validation queue URL not configured')
      return false
    }

    try {
      const client = await this.getSQSClient()

      const command = new SendMessageCommand({
        QueueUrl: QUEUE_URL,
        MessageBody: JSON.stringify(request),
      })

      await client.send(command)
      console.log('Queued address validation for recipient:', request.recipientId)
      return true
    } catch (error) {
      console.error('Error queuing address validation:', error)
      return false
    }
  }

  async queueBatch(requests: AddressValidationRequest[]): Promise<number> {
    let successCount = 0

    for (const request of requests) {
      const success = await this.queueValidation(request)
      if (success) successCount++
    }

    return successCount
  }
}

export const addressValidationQueue = new AddressValidationQueue()
export default addressValidationQueue
