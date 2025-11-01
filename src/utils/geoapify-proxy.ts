/**
 * Geoapify Proxy Client
 *
 * Calls Geoapify Lambda proxy instead of direct API calls
 * API key is securely stored in AWS Systems Manager Parameter Store
 */

import { fetchAuthSession } from 'aws-amplify/auth'

// Get Lambda URL from Amplify outputs
// Will be available after deployment
const GEOAPIFY_PROXY_URL =
  import.meta.env.VITE_GEOAPIFY_PROXY_URL || 'https://your-lambda-url.amazonaws.com'

export interface GeoapifyAddress {
  address1: string
  address2?: string
  city: string
  state: string
  zipcode: string
  country: string
}

export interface GeoapifyValidatedAddress {
  address1: string
  address2?: string
  city: string
  state: string
  zipcode: string
  country: string
  countryCode: string
  formatted: string
  deliverable: boolean
  standardized: boolean
  confidence: number // 0-1, higher is better
  error?: string
}

export interface AddressSuggestion {
  formatted: string
  address1?: string
  address2?: string
  city?: string
  state?: string
  zipcode?: string
  country?: string
  countryCode?: string
}

class GeoapifyProxyClient {
  private proxyUrl: string

  constructor() {
    this.proxyUrl = GEOAPIFY_PROXY_URL
  }

  /**
   * Check if proxy is configured
   */
  isEnabled(): boolean {
    return this.proxyUrl !== 'https://your-lambda-url.amazonaws.com'
  }

  /**
   * Validate an international address
   */
  async validateAddress(address: GeoapifyAddress): Promise<GeoapifyValidatedAddress> {
    if (!this.isEnabled()) {
      return {
        ...address,
        countryCode: '',
        formatted: this.formatAddress(address),
        deliverable: false,
        standardized: false,
        confidence: 0,
        error: 'Geoapify proxy not configured',
      }
    }

    try {
      console.log('Validating address with Geoapify proxy:', address)

      const response = await fetch(this.proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'validate',
          address1: address.address1,
          address2: address.address2,
          city: address.city,
          state: address.state,
          zipcode: address.zipcode,
          country: address.country,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()

      if (!data.results || data.results.length === 0) {
        return {
          ...address,
          countryCode: '',
          formatted: this.formatAddress(address),
          deliverable: false,
          standardized: false,
          confidence: 0,
          error: 'Address not found or could not be validated',
        }
      }

      // Get the best match (first result)
      const result = data.results[0]

      // Extract address components
      const validated: GeoapifyValidatedAddress = {
        address1: this.extractStreetAddress(result),
        address2: address.address2 || '',
        city: result.city || address.city,
        state: result.state || address.state,
        zipcode: result.postcode || address.zipcode,
        country: result.country || address.country,
        countryCode: result.country_code?.toUpperCase() || '',
        formatted: result.formatted || this.formatAddress(address),
        deliverable: result.rank?.confidence >= 0.5,
        standardized: true,
        confidence: result.rank?.confidence || 0,
      }

      console.log('Geoapify validation result:', validated)

      return validated
    } catch (error) {
      console.error('Geoapify proxy error:', error)
      return {
        ...address,
        countryCode: '',
        formatted: this.formatAddress(address),
        deliverable: false,
        standardized: false,
        confidence: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  /**
   * Autocomplete address
   */
  async autocomplete(text: string): Promise<AddressSuggestion[]> {
    if (!this.isEnabled()) {
      console.warn('Geoapify proxy not configured')
      return []
    }

    try {
      const response = await fetch(this.proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'autocomplete',
          text,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()

      if (!data.results || data.results.length === 0) {
        return []
      }

      return data.results.map((result: any) => ({
        formatted: result.formatted || '',
        address1: this.extractStreetAddress(result),
        city: result.city,
        state: result.state,
        zipcode: result.postcode,
        country: result.country,
        countryCode: result.country_code?.toUpperCase(),
      }))
    } catch (error) {
      console.error('Geoapify autocomplete error:', error)
      return []
    }
  }

  /**
   * Extract street address from Geoapify result
   */
  private extractStreetAddress(result: any): string {
    const parts = []

    if (result.housenumber) {
      parts.push(result.housenumber)
    }

    if (result.street) {
      parts.push(result.street)
    } else if (result.address_line1) {
      return result.address_line1
    }

    return parts.join(' ') || result.formatted?.split(',')[0] || ''
  }

  /**
   * Format address for display
   */
  private formatAddress(address: GeoapifyAddress): string {
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
}

// Export singleton instance
export const geoapifyProxyClient = new GeoapifyProxyClient()
export default geoapifyProxyClient
