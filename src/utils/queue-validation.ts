/**
 * Queue Address Validation Utility
 *
 * Calls the queue-address-validation Lambda function to queue addresses for validation
 */

// This will be populated by Amplify outputs after deployment
const QUEUE_VALIDATION_URL = import.meta.env.VITE_QUEUE_VALIDATION_URL || ''

interface AddressValidationRequest {
  recipientId: string
  address1: string
  address2?: string
  city: string
  state: string
  zipcode: string
  country?: string
}

export async function queueAddressValidation(request: AddressValidationRequest): Promise<boolean> {
  if (!QUEUE_VALIDATION_URL) {
    console.warn('Queue validation URL not configured')
    return false
  }

  try {
    const response = await fetch(QUEUE_VALIDATION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Failed to queue validation:', error)
      return false
    }

    const result = await response.json()
    console.log('Queued validation:', result)
    return true
  } catch (error) {
    console.error('Error queuing validation:', error)
    return false
  }
}

export async function queueBatchValidation(requests: AddressValidationRequest[]): Promise<number> {
  if (!QUEUE_VALIDATION_URL) {
    console.warn('Queue validation URL not configured')
    return 0
  }

  if (requests.length === 0) {
    return 0
  }

  try {
    const response = await fetch(QUEUE_VALIDATION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requests),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Failed to queue batch validation:', error)
      return 0
    }

    const result = await response.json()
    console.log('Queued batch validation:', result)
    return result.queued || 0
  } catch (error) {
    console.error('Error queuing batch validation:', error)
    return 0
  }
}
