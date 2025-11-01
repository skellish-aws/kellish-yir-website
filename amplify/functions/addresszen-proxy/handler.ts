/**
 * AddressZen Proxy Lambda Function
 *
 * Proxies requests to AddressZen API with API key stored in SSM Parameter Store
 * Supports both US and international address validation
 */

import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'

const ssmClient = new SSMClient({})

interface AddressZenRequest {
  action?: 'validate' | 'autocomplete' | 'resolve'
  address?: {
    address1: string
    address2?: string
    city?: string
    state?: string
    zipcode?: string
    country?: string
  }
  query?: string // For autocomplete
  placeId?: string // For resolve (from autocomplete suggestion)
}

interface AddressZenValidatedAddress {
  address1: string
  address2?: string
  city: string
  state: string
  zipcode: string
  country: string
  countryCode?: string
  formatted: string
  deliverable: boolean
  standardized: boolean
  confidence?: number
  error?: string
}

// Cache for API key
let cachedApiKey: string | null = null

/**
 * Get AddressZen API key from SSM Parameter Store
 */
async function getApiKey(): Promise<string> {
  if (cachedApiKey) {
    return cachedApiKey
  }

  try {
    const command = new GetParameterCommand({
      Name: '/kellish-yir/addresszen/api-key',
      WithDecryption: true,
    })

    const response = await ssmClient.send(command)

    if (!response.Parameter?.Value) {
      throw new Error('AddressZen API key not found in SSM Parameter Store')
    }

    cachedApiKey = response.Parameter.Value
    return cachedApiKey
  } catch (error) {
    console.error('Error getting AddressZen API key from SSM:', error)
    throw new Error('Failed to retrieve AddressZen API key')
  }
}

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  }

  // Handle preflight requests
  if (event.requestContext.http.method === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    }
  }

  try {
    if (event.requestContext.http.method !== 'POST') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' }),
      }
    }

    const body = JSON.parse(event.body || '{}')
    const request: AddressZenRequest = body

    // Get API key from SSM
    const apiKey = await getApiKey()

    // Route based on action
    const action = request.action || 'validate'

    if (action === 'autocomplete') {
      // AddressZen Autocomplete API
      if (!request.query) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Query is required for autocomplete' }),
        }
      }

      const suggestions = await autocompleteAddress(request.query, apiKey)
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ suggestions }),
      }
    } else if (action === 'resolve') {
      // AddressZen Resolve API
      if (!request.placeId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Place ID is required for resolve' }),
        }
      }

      const resolvedAddress = await resolveAddress(request.placeId, apiKey)
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(resolvedAddress),
      }
    } else {
      // Default: validate (for US addresses)
      if (!request.address) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Address is required' }),
        }
      }

      // Validate required fields
      if (!request.address.address1) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Address1 is required' }),
        }
      }

      // Validate address using AddressZen Address Verification API (US-only)
      // We've already checked request.address exists above
      const validatedAddress = await validateAddress(request.address!, apiKey)

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(validatedAddress),
      }
    }
  } catch (error) {
    console.error('AddressZen Proxy Error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to validate address',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    }
  }
}

async function validateAddress(
  address: NonNullable<AddressZenRequest['address']>,
  apiKey: string,
): Promise<AddressZenValidatedAddress> {
  try {
    // AddressZen Address Verification API
    // Reference: https://docs.addresszen.com/docs/address-verification/getting-started
    // Endpoint: POST https://api.addresszen.com/v1/verify/addresses

    // Build full address string (Option 1: full address string - recommended)
    // This is the most reliable format according to AddressZen docs
    const addressParts: string[] = []
    if (address.address1) {
      addressParts.push(address.address1)
    }
    if (address.address2) {
      addressParts.push(address.address2)
    }
    if (address.city) {
      addressParts.push(address.city)
    }
    if (address.state) {
      addressParts.push(address.state)
    }
    if (address.zipcode) {
      addressParts.push(address.zipcode)
    }

    const fullAddressString = addressParts.join(', ')

    // Build request body - Option 1: Full Address String
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const requestBody: any = {
      query: fullAddressString || address.address1 || '',
    }

    // AddressZen API endpoint
    const url = `https://api.addresszen.com/v1/verify/addresses?api_key=${apiKey}`

    console.log('Validating address with AddressZen:', address.address1)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    // Handle AddressZen-specific error codes
    if (!response.ok) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let errorData: any
      try {
        errorData = await response.json()
      } catch {
        const errorText = await response.text()
        errorData = { code: 0, message: errorText }
      }
      const errorMessage = parseAddressZenError(response.status, errorData)
      throw new Error(errorMessage)
    }

    const data = await response.json()

    // Map AddressZen API response to our format
    // Response structure: https://docs.addresszen.com/docs/address-verification/getting-started
    // Response has: { result: {...}, code: 2000, message: "Success" }

    if (!data.result) {
      // No result means validation failed or address not found
      return {
        address1: address.address1 || '',
        address2: address.address2,
        city: address.city || '',
        state: address.state || '',
        zipcode: address.zipcode || '',
        country: address.country || '',
        formatted: formatAddress(address),
        deliverable: false,
        standardized: false,
        error: data.message || 'Address not found or could not be verified',
      }
    }

    const result = data.result

    // Extract address components from AddressZen response
    // Response fields: address_line_one, address_line_two, city, state, zip_code
    const validatedZip = result.zip_code || address.zipcode || ''
    const match = result.match || {}

    // Build formatted address
    const formattedParts: string[] = []
    if (result.address_line_one) {
      formattedParts.push(result.address_line_one)
    }
    if (result.address_line_two) {
      formattedParts.push(result.address_line_two)
    }
    if (result.city && result.state) {
      formattedParts.push(`${result.city}, ${result.state} ${validatedZip}`)
    } else if (result.city) {
      formattedParts.push(result.city)
    }

    const formatted = formattedParts.join(', ') || formatAddress(address)

    // Determine deliverability from match information
    // match.dpv indicates deliverability: 'Y' = deliverable, 'N' = not deliverable
    const deliverable =
      match.dpv === 'Y' || result.match_information?.includes('delivery address was found')

    // Confidence from response (0-1 scale)
    const confidence = result.confidence ?? (result.count === 1 ? 1 : 0)

    return {
      address1: result.address_line_one || match.address1 || address.address1 || '',
      address2: result.address_line_two || match.address2 || address.address2,
      city: result.city || match.city || address.city || '',
      state: result.state || match.state || address.state || '',
      zipcode: validatedZip || address.zipcode || '',
      country: match.country_code === 'US' ? 'United States' : address.country || '',
      countryCode: result.country_iso_2 || match.country_code || 'US',
      formatted: formatted,
      deliverable: deliverable,
      standardized: result.count === 1, // Standardized if we got a single match
      confidence: confidence,
      error: result.match_information?.includes('not found') ? result.match_information : undefined,
    }
  } catch (error) {
    console.error('Error validating address:', error)
    return {
      address1: address.address1,
      city: address.city || '',
      state: address.state || '',
      zipcode: address.zipcode || '',
      country: address.country || '',
      formatted: formatAddress(address),
      deliverable: false,
      standardized: false,
      error: error instanceof Error ? error.message : 'Failed to validate address',
    }
  }
}

interface AddressZenAutocompleteResponse {
  suggestions?: Array<{
    id?: string
    place_id?: string
    formatted?: string
    [key: string]: unknown
  }>
  [key: string]: unknown
}

/**
 * Autocomplete address using AddressZen Autocomplete API
 * Reference: AddressZen Address Autocomplete API
 * Endpoint: GET https://api.addresszen.com/v1/autocomplete/addresses?api_key=...&q=...
 */
async function autocompleteAddress(
  query: string,
  apiKey: string,
): Promise<AddressZenAutocompleteResponse> {
  try {
    const url = `https://api.addresszen.com/v1/autocomplete/addresses?api_key=${apiKey}&q=${encodeURIComponent(query)}`

    console.log('Autocomplete address with AddressZen:', query)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`AddressZen Autocomplete API returned ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    console.log('AddressZen Autocomplete API response:', JSON.stringify(data, null, 2))
    return data
  } catch (error) {
    console.error('Error autocompleting address:', error)
    throw error
  }
}

/**
 * Resolve address using AddressZen Resolve API
 * Takes a place ID from autocomplete and returns full address details
 * Reference: AddressZen Address Resolve API
 * Endpoint: GET https://api.addresszen.com/v1/resolve/addresses?api_key=...&place_id=...
 */
async function resolveAddress(
  placeId: string,
  apiKey: string,
): Promise<AddressZenValidatedAddress> {
  try {
    const url = `https://api.addresszen.com/v1/resolve/addresses?api_key=${apiKey}&place_id=${encodeURIComponent(placeId)}`

    console.log('Resolving address with AddressZen:', placeId)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`AddressZen Resolve API returned ${response.status}: ${errorText}`)
    }

    const data = await response.json()

    // Map AddressZen Resolve API response to our format
    // TODO: Adjust based on actual API response structure
    if (!data.result) {
      return {
        address1: '',
        city: '',
        state: '',
        zipcode: '',
        country: '',
        formatted: '',
        deliverable: false,
        standardized: false,
        error: 'Address not found or could not be resolved',
      }
    }

    const result = data.result

    // Extract address components (adjust field names based on actual API response)
    return {
      address1: result.address_line_one || result.address1 || '',
      address2: result.address_line_two || result.address2,
      city: result.city || '',
      state: result.state || '',
      zipcode: result.zip_code || result.zipcode || '',
      country: result.country || result.country_iso_2 ? getCountryName(result.country_iso_2) : '',
      countryCode: result.country_iso_2 || '',
      formatted: result.formatted || formatResolvedAddress(result),
      deliverable: true, // Resolved addresses are typically deliverable
      standardized: true,
      confidence: result.confidence ?? 1,
      error: undefined,
    }
  } catch (error) {
    console.error('Error resolving address:', error)
    return {
      address1: '',
      city: '',
      state: '',
      zipcode: '',
      country: '',
      formatted: '',
      deliverable: false,
      standardized: false,
      error: error instanceof Error ? error.message : 'Failed to resolve address',
    }
  }
}

function formatAddress(address?: AddressZenRequest['address']): string {
  if (!address) return ''
  const parts = [
    address.address1,
    address.address2,
    address.city,
    address.state,
    address.zipcode,
    address.country,
  ].filter(Boolean)

  return parts.join(', ')
}

/**
 * Format resolved address from AddressZen response
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatResolvedAddress(result: any): string {
  const parts: string[] = []
  if (result.address_line_one || result.address1) {
    parts.push(result.address_line_one || result.address1)
  }
  if (result.address_line_two || result.address2) {
    parts.push(result.address_line_two || result.address2)
  }
  if (result.city) {
    parts.push(result.city)
  }
  if (result.state) {
    parts.push(result.state)
  }
  if (result.zip_code || result.zipcode) {
    parts.push(result.zip_code || result.zipcode)
  }
  if (result.country || result.country_iso_2) {
    parts.push(result.country || getCountryName(result.country_iso_2))
  }
  return parts.join(', ')
}

/**
 * Get country name from ISO code (basic mapping)
 */
function getCountryName(countryCode: string): string {
  const countryMap: Record<string, string> = {
    US: 'United States',
    GB: 'United Kingdom',
    CA: 'Canada',
    AU: 'Australia',
    DE: 'Germany',
    FR: 'France',
    // Add more as needed
  }
  return countryMap[countryCode?.toUpperCase()] || countryCode || ''
}

/**
 * Parse AddressZen error codes into user-friendly messages
 * Reference: https://docs.addresszen.com/docs/api/api-reference
 */
function parseAddressZenError(
  httpStatus: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errorData: any,
): string {
  const apiCode = errorData?.code || 0

  // HTTP 402 - Request Failed (balance or limit issues)
  if (httpStatus === 402) {
    if (apiCode === 4020) {
      return 'AddressZen API key balance depleted. Please purchase more lookups.'
    }
    if (apiCode === 4021) {
      return 'AddressZen daily limit reached. Please wait for the limit to reset or increase your limit.'
    }
  }

  // HTTP 401 - Unauthorized
  if (httpStatus === 401) {
    if (apiCode === 4010) {
      return 'Invalid AddressZen API key. Please check your API key configuration.'
    }
    if (apiCode === 4011) {
      return 'Requesting URL not on whitelist. Please update allowed URLs in your API key settings.'
    }
  }

  // HTTP 400 - Bad Request
  if (httpStatus === 400) {
    return errorData?.message || `Bad request: ${errorData?.message || 'Invalid request format'}`
  }

  // HTTP 404 - Not Found
  if (httpStatus === 404) {
    return errorData?.message || 'Address not found'
  }

  // HTTP 500 - Server Error
  if (httpStatus === 500) {
    return 'AddressZen server error. Please try again later or contact support.'
  }

  // HTTP 503 - Rate Limit
  if (httpStatus === 503) {
    return 'AddressZen rate limit exceeded (30 requests/second). Please slow down your requests.'
  }

  // Generic error
  return errorData?.message || `AddressZen API error (${httpStatus}): ${JSON.stringify(errorData)}`
}
