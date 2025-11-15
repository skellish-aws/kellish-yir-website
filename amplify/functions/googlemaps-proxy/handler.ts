/**
 * Google Maps Address Validation Proxy Lambda Function
 *
 * Proxies requests to Google Maps Address Validation API with API key stored in SSM Parameter Store
 * Supports both US and international address validation
 *
 * API Documentation: https://developers.google.com/maps/documentation/address-validation
 */

import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'

const ssmClient = new SSMClient({})
const GOOGLE_MAPS_API_URL = 'https://addressvalidation.googleapis.com/v1:validateAddress'

interface GoogleMapsRequest {
  address: {
    address1?: string
    address2?: string
    city?: string
    state?: string
    zipcode?: string
    country?: string
  }
  enableUspsCass?: boolean // Enable for US addresses
  regionCode?: string // ISO 3166-1 alpha-2 country code
}

// Cache for API key
let cachedApiKey: string | null = null

/**
 * Get Google Maps API key from SSM Parameter Store
 */
async function getApiKey(): Promise<string> {
  if (cachedApiKey) {
    return cachedApiKey
  }

  try {
    const command = new GetParameterCommand({
      Name: '/kellish-yir/googlemaps/api-key',
      WithDecryption: true,
    })

    const response = await ssmClient.send(command)

    if (!response.Parameter?.Value) {
      throw new Error('Google Maps API key not found in SSM Parameter Store')
    }

    cachedApiKey = response.Parameter.Value
    return cachedApiKey
  } catch (error) {
    console.error('Error getting Google Maps API key from SSM:', error)
    throw new Error('Failed to retrieve Google Maps API key')
  }
}

/**
 * Convert our address format to Google Maps Address Validation API format
 */
function formatAddressForGoogleMaps(address: GoogleMapsRequest['address']): any {
  const formatted: any = {
    addressLines: [],
  }

  if (address.address1) {
    formatted.addressLines.push(address.address1)
  }
  if (address.address2) {
    formatted.addressLines.push(address.address2)
  }

  if (address.city) {
    formatted.locality = address.city
  }

  if (address.state) {
    formatted.administrativeArea = address.state
  }

  if (address.zipcode) {
    formatted.postalCode = address.zipcode
  }

  // Region code (ISO 3166-1 alpha-2) - convert country name to code if needed
  if (address.country) {
    // Map common country names to ISO codes
    const countryCode = mapCountryToCode(address.country)
    if (countryCode) {
      formatted.regionCode = countryCode
    }
  }

  return formatted
}

/**
 * Map country name to ISO 3166-1 alpha-2 code
 */
function mapCountryToCode(country: string): string | null {
  const countryLower = country.toLowerCase().trim()
  
  const countryMap: Record<string, string> = {
    'united states': 'US',
    'usa': 'US',
    'us': 'US',
    'germany': 'DE',
    'deutschland': 'DE',
    'united kingdom': 'GB',
    'uk': 'GB',
    'great britain': 'GB',
    'canada': 'CA',
    'france': 'FR',
    'australia': 'AU',
    'japan': 'JP',
    'mexico': 'MX',
    'spain': 'ES',
    'italy': 'IT',
    'netherlands': 'NL',
    'belgium': 'BE',
    'switzerland': 'CH',
    'austria': 'AT',
    'sweden': 'SE',
    'norway': 'NO',
    'denmark': 'DK',
    'finland': 'FI',
    'poland': 'PL',
    'portugal': 'PT',
    'greece': 'GR',
    'ireland': 'IE',
    'new zealand': 'NZ',
  }

  // Check direct match
  if (countryMap[countryLower]) {
    return countryMap[countryLower]
  }

  // Check if it's already a 2-letter code
  if (country.length === 2 && /^[A-Z]{2}$/i.test(country)) {
    return country.toUpperCase()
  }

  return null
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

    const apiKey = await getApiKey()
    const requestBody: GoogleMapsRequest = JSON.parse(event.body || '{}')

    if (!requestBody.address) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Address is required' }),
      }
    }

    // Determine if this is a US address for CASS enablement
    const country = (requestBody.address.country || requestBody.regionCode || '').toLowerCase()
    const isUSAddress = 
      !country || 
      country === 'us' || 
      country === 'usa' || 
      country === 'united states'

    // Format address for Google Maps API
    const formattedAddress = formatAddressForGoogleMaps(requestBody.address)

    // Build Google Maps API request
    const googleMapsRequest = {
      address: formattedAddress,
      enableUspsCass: isUSAddress, // Enable CASS for US addresses
    }


    // Call Google Maps Address Validation API
    const response = await fetch(`${GOOGLE_MAPS_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(googleMapsRequest),
    })

    if (!response.ok) {
      let errorText = ''
      let errorJson: any = null
      
      try {
        errorText = await response.text()
        // Try to parse as JSON for more structured error info
        try {
          errorJson = JSON.parse(errorText)
        } catch {
          // Not JSON, use as-is
        }
      } catch (e) {
        errorText = `Failed to read error response: ${e}`
      }
      
      console.error('[Google Maps Error] API error:', response.status, errorText)
      
      // Extract useful error information
      let errorMessage = 'Google Maps API error'
      if (errorJson?.error?.message) {
        errorMessage = errorJson.error.message
      } else if (errorJson?.error) {
        errorMessage = typeof errorJson.error === 'string' ? errorJson.error : 'Google Maps API error'
      } else if (errorText && errorText.length < 500) {
        errorMessage = errorText
      }
      
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          error: errorMessage,
          details: errorJson || errorText,
          status: response.status,
        }),
      }
    }

    const data = await response.json()

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data),
    }
  } catch (error) {
    console.error('[Google Maps Error] Handler error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    }
  }
}

