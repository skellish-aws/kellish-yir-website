import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'

const ssmClient = new SSMClient({})

interface USPSAddress {
  address1: string
  address2?: string
  city: string
  state: string
  zipcode: string
}

interface USPSValidatedAddress {
  address1: string
  address2?: string
  city: string
  state: string
  zipcode: string
  zipPlus4?: string
  deliverable: boolean
  standardized: boolean
  error?: string
}

// Cache for OAuth token and API keys
let cachedToken: string | null = null
let tokenExpiry: number = 0
let cachedConsumerKey: string | null = null
let cachedConsumerSecret: string | null = null

/**
 * Get USPS API credentials from SSM Parameter Store
 */
async function getUspsCredentials(): Promise<{ consumerKey: string; consumerSecret: string }> {
  if (cachedConsumerKey && cachedConsumerSecret) {
    return {
      consumerKey: cachedConsumerKey,
      consumerSecret: cachedConsumerSecret,
    }
  }

  try {
    const [keyResponse, secretResponse] = await Promise.all([
      ssmClient.send(
        new GetParameterCommand({
          Name: '/kellish-yir/usps/consumer-key',
          WithDecryption: true,
        }),
      ),
      ssmClient.send(
        new GetParameterCommand({
          Name: '/kellish-yir/usps/consumer-secret',
          WithDecryption: true,
        }),
      ),
    ])

    cachedConsumerKey = keyResponse.Parameter?.Value || ''
    cachedConsumerSecret = secretResponse.Parameter?.Value || ''

    if (!cachedConsumerKey || !cachedConsumerSecret) {
      throw new Error('USPS credentials not found in SSM Parameter Store')
    }

    return {
      consumerKey: cachedConsumerKey,
      consumerSecret: cachedConsumerSecret,
    }
  } catch (error) {
    console.error('Error getting USPS credentials from SSM:', error)
    throw new Error('Failed to retrieve USPS credentials')
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
    const address: USPSAddress = body.address

    if (!address) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Address is required' }),
      }
    }

    // Validate required fields
    if (!address.address1 || !address.city || !address.state) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Address1, city, and state are required' }),
      }
    }

    // Get credentials from SSM
    const { consumerKey, consumerSecret } = await getUspsCredentials()

    // Get OAuth token
    const token = await getOAuthToken(consumerKey, consumerSecret)

    // Validate address using USPS API
    const validatedAddress = await validateAddress(address, token)

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(validatedAddress),
    }
  } catch (error) {
    console.error('USPS Proxy Error:', error)
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

async function getOAuthToken(consumerKey: string, consumerSecret: string): Promise<string> {
  // Return cached token if still valid
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken
  }

  try {
    // Build form data with client_id and client_secret in the body (per USPS OAuth spec)
    const formData = new URLSearchParams()
    formData.append('grant_type', 'client_credentials')
    formData.append('client_id', consumerKey)
    formData.append('client_secret', consumerSecret)

    console.log('Requesting OAuth token from USPS...')

    // Note: Using apis.usps.com (with 's'), not api.usps.com
    const response = await fetch('https://apis.usps.com/oauth2/v3/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OAuth token request failed:', response.status, errorText)
      throw new Error(`OAuth token request failed: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    cachedToken = data.access_token
    // Set expiry to 5 minutes before actual expiry for safety
    tokenExpiry = Date.now() + (data.expires_in - 300) * 1000

    if (!cachedToken) {
      throw new Error('No access token received from USPS')
    }

    return cachedToken
  } catch (error) {
    console.error('Error getting OAuth token:', error)
    throw error
  }
}

async function validateAddress(address: USPSAddress, token: string): Promise<USPSValidatedAddress> {
  try {
    // Convert state to 2-letter abbreviation if needed
    const stateAbbr = getStateAbbreviation(address.state)

    // Build query parameters for USPS Address Validation API (GET request per API spec)
    const params = new URLSearchParams({
      streetAddress: address.address1,
      state: stateAbbr,
    })

    // Add optional parameters
    if (address.address2) {
      params.append('secondaryAddress', address.address2)
    }
    if (address.city) {
      params.append('city', address.city)
    }
    if (address.zipcode) {
      params.append('ZIPCode', address.zipcode)
    }

    // Note: Using apis.usps.com (with 's'), not api.usps.com
    const url = `https://apis.usps.com/addresses/v3/address?${params.toString()}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`USPS API request failed: ${response.status} - ${errorText}`)
    }

    const data = await response.json()

    // Parse USPS API response according to the OpenAPI spec
    if (data.address) {
      const addr = data.address
      return {
        address1: addr.streetAddress || address.address1,
        address2: addr.secondaryAddress || address.address2,
        city: addr.city || address.city,
        state: addr.state || address.state,
        zipcode: addr.ZIPCode || address.zipcode,
        zipPlus4: addr.ZIPPlus4 || undefined,
        deliverable: data.additionalInfo?.DPVConfirmation === 'Y',
        standardized: true,
      }
    } else if (data.error) {
      return {
        address1: address.address1,
        city: address.city,
        state: address.state,
        zipcode: address.zipcode,
        deliverable: false,
        standardized: false,
        error: data.error.message || 'Address validation failed',
      }
    } else {
      throw new Error('Unexpected response format from USPS API')
    }
  } catch (error) {
    console.error('Error validating address:', error)
    return {
      address1: address.address1,
      city: address.city,
      state: address.state,
      zipcode: address.zipcode,
      deliverable: false,
      standardized: false,
      error: error instanceof Error ? error.message : 'Failed to validate address',
    }
  }
}

function getStateAbbreviation(state: string): string {
  // If already 2 characters, assume it's an abbreviation
  if (state.length === 2) {
    return state.toUpperCase()
  }

  // Map of full state names to abbreviations
  const stateMap: Record<string, string> = {
    alabama: 'AL',
    alaska: 'AK',
    arizona: 'AZ',
    arkansas: 'AR',
    california: 'CA',
    colorado: 'CO',
    connecticut: 'CT',
    delaware: 'DE',
    florida: 'FL',
    georgia: 'GA',
    hawaii: 'HI',
    idaho: 'ID',
    illinois: 'IL',
    indiana: 'IN',
    iowa: 'IA',
    kansas: 'KS',
    kentucky: 'KY',
    louisiana: 'LA',
    maine: 'ME',
    maryland: 'MD',
    massachusetts: 'MA',
    michigan: 'MI',
    minnesota: 'MN',
    mississippi: 'MS',
    missouri: 'MO',
    montana: 'MT',
    nebraska: 'NE',
    nevada: 'NV',
    'new hampshire': 'NH',
    'new jersey': 'NJ',
    'new mexico': 'NM',
    'new york': 'NY',
    'north carolina': 'NC',
    'north dakota': 'ND',
    ohio: 'OH',
    oklahoma: 'OK',
    oregon: 'OR',
    pennsylvania: 'PA',
    'rhode island': 'RI',
    'south carolina': 'SC',
    'south dakota': 'SD',
    tennessee: 'TN',
    texas: 'TX',
    utah: 'UT',
    vermont: 'VT',
    virginia: 'VA',
    washington: 'WA',
    'west virginia': 'WV',
    wisconsin: 'WI',
    wyoming: 'WY',
    'district of columbia': 'DC',
    'puerto rico': 'PR',
    guam: 'GU',
    'american samoa': 'AS',
    'virgin islands': 'VI',
    'northern mariana islands': 'MP',
  }

  const normalized = state.toLowerCase().trim()
  return stateMap[normalized] || state.toUpperCase()
}
