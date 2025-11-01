/**
 * Geoapify Proxy Lambda Function
 *
 * Proxies requests to Geoapify API with API key stored in SSM Parameter Store
 * Supports:
 * - Address validation (geocoding)
 * - Address autocomplete
 */

import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'

const ssmClient = new SSMClient({})

// Cache API key for reuse across invocations
let cachedApiKey: string | null = null

interface GeoapifyRequest {
  action: 'validate' | 'autocomplete'
  address?: string // For validation: full address string
  text?: string // For autocomplete: partial text
  address1?: string
  address2?: string
  city?: string
  state?: string
  zipcode?: string
  country?: string
}

/**
 * Get Geoapify API key from SSM Parameter Store
 */
async function getApiKey(): Promise<string> {
  if (cachedApiKey) {
    return cachedApiKey
  }

  try {
    const command = new GetParameterCommand({
      Name: '/kellish-yir/geoapify/api-key',
      WithDecryption: true,
    })

    const response = await ssmClient.send(command)

    if (!response.Parameter?.Value) {
      throw new Error('Geoapify API key not found in SSM Parameter Store')
    }

    cachedApiKey = response.Parameter.Value
    return cachedApiKey
  } catch (error) {
    console.error('Error getting Geoapify API key from SSM:', error)
    throw new Error('Failed to retrieve Geoapify API key')
  }
}

/**
 * Validate address using Geoapify Geocoding API
 */
async function validateAddress(apiKey: string, request: GeoapifyRequest): Promise<any> {
  // Build address string
  const addressParts = [
    request.address1,
    request.address2,
    request.city,
    request.state,
    request.zipcode,
    request.country,
  ].filter(Boolean)

  const addressString = request.address || addressParts.join(', ')

  const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(addressString)}&apiKey=${apiKey}&format=json`

  console.log('Validating address with Geoapify:', addressString)

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Geoapify API returned ${response.status}: ${response.statusText}`)
  }

  const data = await response.json()
  return data
}

/**
 * Autocomplete address using Geoapify Autocomplete API
 */
async function autocompleteAddress(apiKey: string, text: string): Promise<any> {
  const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(text)}&apiKey=${apiKey}&format=json`

  console.log('Autocomplete address with Geoapify:', text)

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Geoapify API returned ${response.status}: ${response.statusText}`)
  }

  const data = await response.json()
  return data
}

/**
 * Lambda handler
 */
export const handler = async (event: any) => {
  console.log('Geoapify Proxy Lambda invoked:', JSON.stringify(event, null, 2))

  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  }

  // Handle OPTIONS request
  if (event.requestContext?.http?.method === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    }
  }

  try {
    // Parse request body
    const request: GeoapifyRequest = JSON.parse(event.body || '{}')

    if (!request.action) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing action parameter' }),
      }
    }

    // Get API key from SSM
    const apiKey = await getApiKey()

    // Route based on action
    let result
    if (request.action === 'validate') {
      result = await validateAddress(apiKey, request)
    } else if (request.action === 'autocomplete') {
      if (!request.text) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing text parameter for autocomplete' }),
        }
      }
      result = await autocompleteAddress(apiKey, request.text)
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: `Unknown action: ${request.action}` }),
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result),
    }
  } catch (error) {
    console.error('Error in Geoapify proxy:', error)

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    }
  }
}
