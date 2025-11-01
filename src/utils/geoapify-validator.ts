/**
 * Geoapify Address Validation Utility
 *
 * Validates international addresses using the Geoapify Geocoding API
 * Free tier: 3,000 requests per day
 */

import GEOAPIFY_CONFIG from '@/config/geoapify'

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

class GeoapifyValidator {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = GEOAPIFY_CONFIG.apiKey
    this.baseUrl = GEOAPIFY_CONFIG.baseUrl
  }

  /**
   * Check if Geoapify is configured and enabled
   */
  isEnabled(): boolean {
    return GEOAPIFY_CONFIG.enabled && !!this.apiKey
  }

  /**
   * Validate an international address using Geoapify Geocoding API
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
        error: 'Geoapify API key not configured',
      }
    }

    try {
      // Build address string for geocoding
      const addressParts = [
        address.address1,
        address.address2,
        address.city,
        address.state,
        address.zipcode,
        address.country,
      ].filter(Boolean)

      const addressString = addressParts.join(', ')

      // Call Geoapify Geocoding API
      const url = `${this.baseUrl}/geocode/search?text=${encodeURIComponent(addressString)}&apiKey=${this.apiKey}&format=json`

      console.log('Validating international address with Geoapify:', addressString)

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Geoapify API returned ${response.status}: ${response.statusText}`)
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
      console.error('Geoapify validation error:', error)
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
   * Get multiple address matches (for showing alternatives)
   */
  async validateAddressWithAlternatives(address: GeoapifyAddress): Promise<{
    primary: GeoapifyValidatedAddress
    alternatives: GeoapifyValidatedAddress[]
  }> {
    if (!this.isEnabled()) {
      const fallback = {
        ...address,
        countryCode: '',
        formatted: this.formatAddress(address),
        deliverable: false,
        standardized: false,
        confidence: 0,
        error: 'Geoapify API key not configured',
      }
      return { primary: fallback, alternatives: [] }
    }

    try {
      // Build address string for geocoding
      const addressParts = [
        address.address1,
        address.address2,
        address.city,
        address.state,
        address.zipcode,
        address.country,
      ].filter(Boolean)

      const addressString = addressParts.join(', ')

      // Call Geoapify Geocoding API
      const url = `${this.baseUrl}/geocode/search?text=${encodeURIComponent(addressString)}&apiKey=${this.apiKey}&format=json`

      console.log('Validating international address with Geoapify:', addressString)

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Geoapify API returned ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.results || data.results.length === 0) {
        const fallback = {
          ...address,
          countryCode: '',
          formatted: this.formatAddress(address),
          deliverable: false,
          standardized: false,
          confidence: 0,
          error: 'Address not found or could not be validated',
        }
        return { primary: fallback, alternatives: [] }
      }

      // Convert all results to our format
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const allResults: GeoapifyValidatedAddress[] = data.results.map((result: any) => ({
        address1: this.extractStreetAddress(result),
        address2: address.address2 || '',
        city: result.city || address.city,
        state: result.state || address.state,
        zipcode: result.postcode || address.zipcode,
        country: result.country || address.country,
        countryCode: result.country_code?.toUpperCase() || '',
        formatted: result.formatted || '',
        deliverable: result.rank?.confidence >= 0.5,
        standardized: true,
        confidence: result.rank?.confidence || 0,
      }))

      // Primary is the first result, alternatives are the rest (up to 4 more)
      const primary = allResults[0]
      const alternatives = allResults.slice(1, 5)

      console.log('Geoapify primary result:', primary)
      console.log('Geoapify alternatives:', alternatives.length)

      return { primary, alternatives }
    } catch (error) {
      console.error('Geoapify validation error:', error)
      const fallback = {
        ...address,
        countryCode: '',
        formatted: this.formatAddress(address),
        deliverable: false,
        standardized: false,
        confidence: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
      return { primary: fallback, alternatives: [] }
    }
  }

  /**
   * Extract street address from Geoapify result
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
export const geoapifyValidator = new GeoapifyValidator()
export default geoapifyValidator
