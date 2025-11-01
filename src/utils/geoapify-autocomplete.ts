/**
 * Geoapify Address Autocomplete Utility
 *
 * Provides address suggestions as the user types
 * Free tier: 3,000 requests per day
 */

import GEOAPIFY_CONFIG from '@/config/geoapify'

export interface AddressSuggestion {
  formatted: string
  address1: string
  address2?: string
  city: string
  state: string
  zipcode: string
  country: string
  countryCode: string
  lat?: number
  lon?: number
}

class GeoapifyAutocomplete {
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
   * Get address suggestions based on user input
   */
  async getSuggestions(query: string, countryFilter?: string): Promise<AddressSuggestion[]> {
    if (!this.isEnabled()) {
      console.warn('Geoapify autocomplete not configured')
      return []
    }

    if (!query || query.length < 3) {
      // Don't search for very short queries
      return []
    }

    try {
      // Build URL with optional country filter
      let url = `${this.baseUrl}/geocode/autocomplete?text=${encodeURIComponent(query)}&apiKey=${this.apiKey}&format=json&limit=5`

      if (countryFilter) {
        // Convert country name to ISO code if needed
        const countryCode = this.getCountryCode(countryFilter)
        if (countryCode) {
          url += `&filter=countrycode:${countryCode}`
        }
      }

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Geoapify API returned ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.results || data.results.length === 0) {
        return []
      }

      // Transform results into our format
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return data.results.map((result: any) => this.transformResult(result))
    } catch (error) {
      console.error('Geoapify autocomplete error:', error)
      return []
    }
  }

  /**
   * Transform Geoapify result into our format
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private transformResult(result: any): AddressSuggestion {
    console.log('Geoapify raw result:', result)

    // Geoapify's address_line2 often contains "City, State ZIP, Country" which we don't want
    // Only use it if it looks like an actual unit/apartment (e.g., "Apt 5", "Unit B", "#201")
    const address2 = result.unit || result.apartment || ''

    const suggestion = {
      formatted: result.formatted || '',
      address1: this.extractStreetAddress(result),
      address2: address2,
      city: result.city || '',
      state: result.state || result.county || '',
      zipcode: result.postcode || '',
      country: result.country || '',
      countryCode: result.country_code?.toUpperCase() || '',
      lat: result.lat,
      lon: result.lon,
    }

    console.log('Transformed suggestion:', suggestion)
    return suggestion
  }

  /**
   * Extract street address from result
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
   * Convert country name to ISO code
   */
  private getCountryCode(country: string): string {
    const countryMap: Record<string, string> = {
      // Common countries
      'united states': 'us',
      usa: 'us',
      us: 'us',
      canada: 'ca',
      'united kingdom': 'gb',
      uk: 'gb',
      portugal: 'pt',
      spain: 'es',
      france: 'fr',
      germany: 'de',
      italy: 'it',
      netherlands: 'nl',
      belgium: 'be',
      switzerland: 'ch',
      austria: 'at',
      poland: 'pl',
      sweden: 'se',
      norway: 'no',
      denmark: 'dk',
      finland: 'fi',
      ireland: 'ie',
      greece: 'gr',
      australia: 'au',
      'new zealand': 'nz',
      japan: 'jp',
      china: 'cn',
      india: 'in',
      brazil: 'br',
      mexico: 'mx',
      argentina: 'ar',
      chile: 'cl',
      colombia: 'co',
      peru: 'pe',
      venezuela: 've',
      // Add more as needed
    }

    const normalized = country.toLowerCase().trim()
    return countryMap[normalized] || ''
  }
}

// Export singleton instance
export const geoapifyAutocomplete = new GeoapifyAutocomplete()
export default geoapifyAutocomplete
