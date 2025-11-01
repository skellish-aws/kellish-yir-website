/**
 * USPS Address Validation API Integration
 *
 * This service integrates with the real USPS Address Validation API
 * to validate and standardize addresses, including ZIP+4 codes.
 */

import { USPS_CONFIG } from '../config/usps'

export interface USPSAddress {
  address1: string
  address2?: string
  city: string
  state: string
  zipcode: string
}

export interface USPSValidatedAddress {
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

export class USPSAddressValidator {
  private baseUrl = 'https://secure.shippingapis.com/ShippingAPI.dll'
  private userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  /**
   * Validate a single address using USPS API via Lambda proxy
   */
  async validateAddress(address: USPSAddress): Promise<USPSValidatedAddress> {
    try {
      console.log('Validating address with USPS API:', address)

      const lambdaUrl = 'https://4e7oocaot3fhlyg2hlxz4476gq0qnnga.lambda-url.us-east-1.on.aws/'

      const response = await fetch(lambdaUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Lambda proxy returned ${response.status}: ${errorText}`)
      }

      const result = await response.json()
      console.log('USPS validation result:', result)

      return result
    } catch (error) {
      console.error('USPS API Error:', error)
      return {
        ...address,
        deliverable: false,
        standardized: false,
        error:
          'Failed to validate address with USPS. ' + (error instanceof Error ? error.message : ''),
      }
    }
  }

  /**
   * Standardize state name to abbreviation
   */
  private standardizeState(state: string): string {
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
    }

    const normalized = state.toLowerCase().trim()
    return stateMap[normalized] || state.toUpperCase()
  }

  /**
   * Get OAuth token for USPS API
   */
  private async getOAuthToken(): Promise<string> {
    try {
      const credentials = btoa(`${USPS_CONFIG.CONSUMER_KEY}:${USPS_CONFIG.CONSUMER_SECRET}`)

      const response = await fetch(USPS_CONFIG.AUTH_URL, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`OAuth token request failed: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      return data.access_token
    } catch (error) {
      console.error('Error getting OAuth token:', error)
      throw error
    }
  }

  /**
   * Build XML request for USPS API
   */
  private buildXMLRequest(address: USPSAddress): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<AddressValidateRequest USERID="${this.userId}">
  <Address ID="1">
    <Address1>${this.escapeXml(address.address1)}</Address1>
    <Address2>${this.escapeXml(address.address2 || '')}</Address2>
    <City>${this.escapeXml(address.city)}</City>
    <State>${this.escapeXml(address.state)}</State>
    <Zip5>${this.escapeXml(address.zipcode)}</Zip5>
    <Zip4></Zip4>
  </Address>
</AddressValidateRequest>`
  }

  /**
   * Make HTTP request to USPS API
   */
  private async makeRequest(xmlRequest: string): Promise<string> {
    const url = `${this.baseUrl}?API=Verify&XML=${encodeURIComponent(xmlRequest)}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/xml',
      },
    })

    if (!response.ok) {
      throw new Error(`USPS API request failed: ${response.status}`)
    }

    return await response.text()
  }

  /**
   * Parse XML response from USPS API
   */
  private parseXMLResponse(xmlResponse: string): USPSValidatedAddress {
    try {
      // Simple XML parsing - in production, use a proper XML parser
      const address1Match = xmlResponse.match(/<Address1>(.*?)<\/Address1>/)
      const address2Match = xmlResponse.match(/<Address2>(.*?)<\/Address2>/)
      const cityMatch = xmlResponse.match(/<City>(.*?)<\/City>/)
      const stateMatch = xmlResponse.match(/<State>(.*?)<\/State>/)
      const zip5Match = xmlResponse.match(/<Zip5>(.*?)<\/Zip5>/)
      const zip4Match = xmlResponse.match(/<Zip4>(.*?)<\/Zip4>/)
      const dpvMatch = xmlResponse.match(/<DPV>(.*?)<\/DPV>/)
      const errorMatch = xmlResponse.match(/<Error>(.*?)<\/Error>/)

      if (errorMatch) {
        return {
          address1: '',
          city: '',
          state: '',
          zipcode: '',
          deliverable: false,
          standardized: false,
          error: errorMatch[1],
        }
      }

      const address1 = address1Match ? address1Match[1] : ''
      const address2 = address2Match ? address2Match[1] : ''
      const city = cityMatch ? cityMatch[1] : ''
      const state = stateMatch ? stateMatch[1] : ''
      const zip5 = zip5Match ? zip5Match[1] : ''
      const zip4 = zip4Match ? zip4Match[1] : ''
      const dpv = dpvMatch ? dpvMatch[1] : 'N'

      return {
        address1,
        address2: address2 || undefined,
        city,
        state,
        zipcode: zip5,
        zipPlus4: zip4 || undefined,
        deliverable: dpv === 'Y',
        standardized: true,
      }
    } catch (error) {
      console.error('Error parsing USPS response:', error)
      return {
        address1: '',
        city: '',
        state: '',
        zipcode: '',
        deliverable: false,
        standardized: false,
        error: 'Failed to parse USPS response',
      }
    }
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }
}

// Create a singleton instance
export const uspsValidator = new USPSAddressValidator(USPS_CONFIG.USER_ID)
