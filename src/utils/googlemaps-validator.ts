/**
 * Google Maps Address Validation API Client
 * 
 * Handles both US and international address validation using Google Maps Address Validation API.
 * API Documentation: https://developers.google.com/maps/documentation/address-validation
 */

import { GOOGLEMAPS_CONFIG } from '../config/googlemaps'
import amplifyOutputs from '../../amplify_outputs.json'

export interface GoogleMapsAddress {
  address1?: string
  address2?: string
  city?: string
  state?: string
  zipcode?: string
  country?: string
}

export interface GoogleMapsValidatedAddress {
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
  confidence?: number // 0-1, higher is better
  error?: string
  alternatives?: GoogleMapsValidatedAddress[] // Alternative matches if available
}

class GoogleMapsValidator {
  private proxyUrl?: string // Lambda proxy URL if configured

  constructor() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.proxyUrl = (amplifyOutputs.custom as any)?.googlemapsProxyUrl
      if (this.proxyUrl) {
        // Proxy URL loaded successfully
      }
    } catch (error) {
      console.warn('⚠️ Could not load Google Maps proxy URL:', error)
    }
  }

  /**
   * Check if Google Maps validation is enabled
   */
  isEnabled(): boolean {
    return !!this.proxyUrl && GOOGLEMAPS_CONFIG.enabled
  }

  /**
   * Ensure proxy URL is loaded
   */
  async ensureProxyUrl(): Promise<void> {
    if (!this.proxyUrl) {
      // Try to reload from amplify_outputs
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.proxyUrl = (amplifyOutputs.custom as any)?.googlemapsProxyUrl
      } catch (error) {
        console.warn('⚠️ Could not load Google Maps proxy URL:', error)
      }
    }
  }

  /**
   * Format an address object into a display string
   */
  private formatAddress(address: GoogleMapsAddress): string {
    const parts: string[] = []
    if (address.address1) parts.push(address.address1)
    if (address.address2) parts.push(address.address2)
    if (address.city) parts.push(address.city)
    if (address.state) parts.push(address.state)
    if (address.zipcode) parts.push(address.zipcode)
    if (address.country) parts.push(address.country)
    return parts.join(', ')
  }

  /**
   * Map Google Maps Address Validation API response to our format
   */
  private mapGoogleMapsResponse(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any,
    original: GoogleMapsAddress,
  ): GoogleMapsValidatedAddress {
    // Google Maps Address Validation API response structure:
    // {
    //   result: {
    //     verdict: {
    //       inputGranularity: "...",
    //       validationGranularity: "...",
    //       geocodeGranularity: "...",
    //       addressComplete: boolean,
    //       hasUnconfirmedComponents: boolean,
    //       hasInferredComponents: boolean
    //     },
    //     address: {
    //       formattedAddress: "...",
    //       postalAddress: {
    //         addressLines: [],
    //         locality: "...",
    //         administrativeArea: "...",
    //         postalCode: "...",
    //         regionCode: "..."
    //       },
    //       addressComponents: [...],
    //       missingComponents: [...],
    //       unconfirmedComponents: [...],
    //       unresolvedTokens: [...]
    //     },
    //     geocode: {...},
    //     metadata: {
    //       business: boolean,
    //       poBox: boolean
    //     }
    //   }
    // }

    if (!data.result) {
      return {
        address1: original.address1 || '',
        address2: original.address2,
        city: original.city || '',
        state: original.state || '',
        zipcode: original.zipcode || '',
        country: original.country || '',
        formatted: this.formatAddress(original),
        deliverable: false,
        standardized: false,
        error: 'Address validation failed - no result from Google Maps',
      }
    }

    const result = data.result
    const verdict = result.verdict || {}
    const postalAddress = result.address?.postalAddress || {}
    const addressComponents = result.address?.addressComponents || []

    // Determine if address is deliverable
    // SUB_PREMISE means apartment/unit - this is deliverable!
    // Only 'OTHER' granularity means not deliverable
    // For international addresses, we rely on addressComplete and validationGranularity
    const deliverable =
      verdict.addressComplete === true &&
      verdict.validationGranularity !== 'OTHER'
    
    // Also check USPS DPV confirmation if available (more reliable for US addresses)
    const uspsData = result.uspsData
    // USPS DPV confirmation codes:
    // "Y" = Confirmed deliverable
    // "D" = Confirmed with Drop (also deliverable)
    // "S" = Confirmed at Street level (also deliverable)
    // "N" = Not deliverable
    const dpvConfirmation = uspsData?.dpvConfirmation
    const uspsDeliverable = dpvConfirmation === 'Y' || dpvConfirmation === 'D' || dpvConfirmation === 'S'
    const uspsNotDeliverable = dpvConfirmation === 'N'
    
    // For US addresses: use USPS confirmation if clear, otherwise fall back to Google Maps verdict
    // For international addresses: use Google Maps verdict (USPS data won't exist)
    const isDeliverable = uspsData !== undefined 
      ? (uspsNotDeliverable ? false : (uspsDeliverable ? true : deliverable)) // US address: use USPS if clear, else Google Maps
      : deliverable // International address: use Google Maps verdict
    

    // Extract address components
    const addressLines = postalAddress.addressLines || []
    
    // Google Maps may combine apartment numbers into the first line
    // If there's only one line, it likely includes the apartment number
    let address1 = addressLines[0] || original.address1 || ''
    let address2: string | undefined = addressLines[1] || undefined
    
    // If no address2 from Google Maps and we have one in original, check if it's already in address1
    if (!address2 && original.address2) {
      // Normalize apartment number from original address2
      const aptNumber = original.address2
        .toLowerCase()
        .replace(/\b(apt|apartment|unit|ste|suite|#)\s*/gi, '')
        .trim()
      
      // Check if address1 already contains this apartment number
      const address1Lower = address1.toLowerCase()
      if (aptNumber && !address1Lower.includes(aptNumber)) {
        // Apartment number not in address1, use original address2
        address2 = original.address2
      }
      // Otherwise, address2 is already included in address1, so leave it undefined
    }

    // Extract city
    const city = postalAddress.locality || original.city || ''

    // Extract state
    const state = postalAddress.administrativeArea || original.state || ''

    // Extract ZIP/postal code
    const zipcode = postalAddress.postalCode || original.zipcode || ''

    // Extract country code and name
    const countryCode = postalAddress.regionCode || ''
    let country = original.country || ''
    
    // Map country code to country name if needed
    if (countryCode && !country) {
      country = this.mapCountryCodeToName(countryCode)
    }

    // Calculate confidence based on verdict
    let confidence = 0.5 // Default
    if (verdict.addressComplete === true) {
      confidence = 0.9
    } else if (verdict.hasUnconfirmedComponents === false && verdict.hasInferredComponents === false) {
      confidence = 0.8
    } else if (verdict.hasInferredComponents === true) {
      confidence = 0.6
    }

    // Build formatted address
    const formattedParts: string[] = []
    if (address1) formattedParts.push(address1)
    if (address2) formattedParts.push(address2)
    if (city) formattedParts.push(city)
    if (state && zipcode) {
      formattedParts.push(`${state} ${zipcode}`)
    } else if (state) {
      formattedParts.push(state)
    } else if (zipcode) {
      formattedParts.push(zipcode)
    }
    if (country) formattedParts.push(country)
    const formatted = formattedParts.join(', ')

    return {
      address1,
      address2: address2 || undefined,
      city,
      state,
      zipcode,
      country,
      countryCode,
      formatted,
      deliverable: isDeliverable,
      standardized: isDeliverable && (verdict.validationGranularity === 'PREMISE' || verdict.validationGranularity === 'SUB_PREMISE' || verdict.validationGranularity === 'RANGE_INTERPOLATED'),
      confidence,
    }
  }

  /**
   * Map ISO 3166-1 alpha-2 country code to country name
   */
  private mapCountryCodeToName(code: string): string {
    const countryMap: Record<string, string> = {
      US: 'United States',
      GB: 'United Kingdom',
      CA: 'Canada',
      DE: 'Germany',
      FR: 'France',
      ES: 'Spain',
      IT: 'Italy',
      NL: 'Netherlands',
      BE: 'Belgium',
      CH: 'Switzerland',
      AT: 'Austria',
      SE: 'Sweden',
      NO: 'Norway',
      DK: 'Denmark',
      FI: 'Finland',
      PL: 'Poland',
      PT: 'Portugal',
      GR: 'Greece',
      IE: 'Ireland',
      AU: 'Australia',
      NZ: 'New Zealand',
      JP: 'Japan',
      MX: 'Mexico',
    }

    return countryMap[code.toUpperCase()] || code
  }

  /**
   * Validate an address using Google Maps Address Validation API via proxy
   */
  async validateAddress(address: GoogleMapsAddress): Promise<GoogleMapsValidatedAddress> {
    await this.ensureProxyUrl()

    if (!this.isEnabled() || !this.proxyUrl) {
      const errorMsg =
        'Google Maps Address Validation is not configured. ' +
        'The Lambda proxy must be deployed and the proxy URL must be available in amplify_outputs.json. ' +
        'API key is stored securely in SSM Parameter Store. ' +
        `Proxy URL status: ${this.proxyUrl ? 'Found' : 'Missing'}`

      console.error('[Google Maps Error] Not enabled:', {
        proxyUrl: this.proxyUrl,
        amplifyOutputs: amplifyOutputs.custom,
        address,
      })

      return {
        address1: address.address1 || '',
        address2: address.address2,
        city: address.city || '',
        state: address.state || '',
        zipcode: address.zipcode || '',
        country: address.country || '',
        formatted: this.formatAddress(address),
        deliverable: false,
        standardized: false,
        error: errorMsg,
      }
    }

    try {
      const response = await fetch(this.proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: {
            address1: address.address1,
            address2: address.address2,
            city: address.city,
            state: address.state,
            zipcode: address.zipcode,
            country: address.country,
          },
        }),
      })

      if (!response.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let errorData: any
        try {
          errorData = await response.json()
        } catch {
          const errorText = await response.text()
          errorData = { error: errorText }
        }

        // Extract error message - avoid double prefixing
        let errorMessage = errorData.error || errorData.message || `HTTP ${response.status}`
        
        // If error details are available, include them
        if (errorData.details) {
          errorMessage = `${errorMessage}. Details: ${typeof errorData.details === 'string' ? errorData.details : JSON.stringify(errorData.details)}`
        }
        
        // Don't add "Google Maps validation failed:" prefix here since it will be added in the UI
        console.error('[Google Maps Error] Proxy error:', response.status, errorMessage)

        return {
          ...this.mapGoogleMapsResponse({}, address),
          deliverable: false,
          standardized: false,
          error: errorMessage,
        }
      }

      const data = await response.json()

      const validated = this.mapGoogleMapsResponse(data, address)

      return validated
    } catch (error) {
      console.error('[Google Maps Error] Validation error:', error)

      let errorMessage = 'Unknown error during address validation'
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage =
          'Network error: Could not connect to Google Maps proxy. ' +
          'Please ensure the Amplify backend is deployed and the proxy URL is correct.'
      } else if (error instanceof Error) {
        errorMessage = error.message
      }

      return {
        ...this.mapGoogleMapsResponse({}, address),
        deliverable: false,
        standardized: false,
        error: errorMessage,
      }
    }
  }
}

// Export singleton instance
export const googlemapsValidator = new GoogleMapsValidator()

