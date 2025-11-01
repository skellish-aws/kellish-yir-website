/**
 * AddressZen Address Validation Utility
 *
 * Unified address validation for both US and international addresses
 * Replaces both USPS (US) and Geoapify (international) validators
 */

import { ADDRESSZEN_CONFIG, isValidAddressZenApiKey } from '../config/addresszen'

export interface AddressZenAddress {
  address1: string
  address2?: string
  city?: string
  state?: string
  zipcode?: string
  country?: string
}

export interface AddressZenValidatedAddress {
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
  alternatives?: AddressZenValidatedAddress[] // Alternative matches if available
}

export interface AddressZenValidationResult {
  primary: AddressZenValidatedAddress
  alternatives: AddressZenValidatedAddress[]
}

class AddressZenValidator {
  private apiKey: string
  private baseUrl: string
  private proxyUrl?: string // Lambda proxy URL if configured

  constructor() {
    this.apiKey = ADDRESSZEN_CONFIG.apiKey
    this.baseUrl = ADDRESSZEN_CONFIG.baseUrl

    // Try to get proxy URL from amplify_outputs.json (set by backend)
    // This allows us to call through Lambda proxy to keep API key secure
    this.loadProxyUrl()
  }

  /**
   * Check if AddressZen is configured and enabled
   * Only enabled via Lambda proxy URL (from amplify_outputs.json)
   * API key is stored securely in SSM Parameter Store, not on client side
   *
   * NOTE: Call ensureProxyUrl() first if you want to check for proxy URL availability
   */
  isEnabled(): boolean {
    // Only enable if proxy URL exists (API key is stored in SSM Parameter Store, not on client)
    return !!this.proxyUrl
  }

  /**
   * Load proxy URL from amplify_outputs.json if available
   */
  private async loadProxyUrl(): Promise<void> {
    if (this.proxyUrl) {
      return // Already loaded
    }

    try {
      const outputs = await import('../../amplify_outputs.json')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.proxyUrl = (outputs.default.custom as any)?.addresszenProxyUrl
      if (this.proxyUrl) {
        console.log(
          '✅ AddressZen proxy URL loaded from amplify_outputs.json (API key in SSM Parameter Store)',
        )
      } else {
        console.log(
          '⚠️ AddressZen proxy URL not found in amplify_outputs.json. API key must be stored in SSM Parameter Store.',
        )
      }
    } catch {
      // amplify_outputs.json might not exist or proxy not configured yet
      console.log(
        '⚠️ AddressZen proxy URL not found. Lambda proxy must be deployed with SSM Parameter Store API key.',
      )
    }
  }

  /**
   * Ensure proxy URL is loaded before validation
   * Public method so callers can ensure proxy is loaded before checking isEnabled()
   */
  async ensureProxyUrl(): Promise<void> {
    if (!this.proxyUrl) {
      await this.loadProxyUrl()
    }
  }

  /**
   * Validate a single address (for inline validation during form save)
   * For US addresses: uses Address Verification API
   * For international addresses: uses Autocomplete → Resolve flow
   */
  async validateAddress(address: AddressZenAddress): Promise<AddressZenValidatedAddress> {
    // Ensure proxy URL is loaded before checking enabled status
    await this.ensureProxyUrl()

    if (!this.isEnabled()) {
      const errorMsg = !this.proxyUrl
        ? 'AddressZen not configured. The Lambda proxy must be deployed and the proxy URL must be available in amplify_outputs.json. API key is stored securely in SSM Parameter Store.'
        : 'AddressZen not configured'

      return {
        ...this.mapToValidatedAddress(address),
        deliverable: false,
        standardized: false,
        error: errorMsg,
      }
    }

    // At this point, we know proxyUrl exists (required for SSM-based API key)
    if (!this.proxyUrl) {
      return {
        ...this.mapToValidatedAddress(address),
        deliverable: false,
        standardized: false,
        error: 'AddressZen proxy URL not available',
      }
    }

    try {
      console.log('Validating address with AddressZen API (via proxy with SSM API key):', address)

      // Determine if US or international address
      const country = address.country?.trim().toLowerCase() || ''
      const isUSAddress =
        !country || country === 'usa' || country === 'united states' || country === 'us'

      if (isUSAddress) {
        // US address: use Address Verification API via proxy (SSM API key)
        const result = await this.validateViaProxy(address)
        console.log('AddressZen validation result (US):', result)
        return result
      } else {
        // International address: use Autocomplete → Resolve flow
        // Build query string for autocomplete
        const addressParts: string[] = []
        if (address.address1) addressParts.push(address.address1)
        if (address.address2) addressParts.push(address.address2)
        if (address.city) addressParts.push(address.city)
        if (address.state) addressParts.push(address.state)
        if (address.zipcode) addressParts.push(address.zipcode)
        if (address.country) addressParts.push(address.country)

        const query = addressParts.join(', ')

        // Step 1: Autocomplete to get suggestions
        const suggestions = await this.autocompleteViaProxy(query)

        console.log('Autocomplete returned', suggestions?.length || 0, 'suggestions')

        if (!suggestions || suggestions.length === 0) {
          return {
            ...this.mapToValidatedAddress(address),
            deliverable: false,
            standardized: false,
            error: 'Address not found in AddressZen database',
          }
        }

        // Step 2: Check if suggestions match the requested country
        // AddressZen autocomplete may return US addresses even for international queries
        const requestedCountry = address.country?.toLowerCase() || ''
        const isInternationalRequest =
          requestedCountry &&
          requestedCountry !== 'usa' &&
          requestedCountry !== 'united states' &&
          requestedCountry !== 'us'

        if (isInternationalRequest) {
          // Check if the suggestions are for the wrong country
          // Look at the first few suggestions to see if they match the requested country
          const sampleSuggestions = suggestions.slice(0, 3)
          const allSuggestionsMatchCountry = sampleSuggestions.every((hit: any) => {
            const suggestion = hit.suggestion?.toLowerCase() || ''
            // Check if suggestion contains country indicators that don't match
            // For Germany: should NOT contain "ND" (North Dakota), "ND," or US state abbreviations
            // For US: would contain state abbreviations like "ND", "CA", "NY", etc.
            const usStatePattern =
              /\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC)\b/i
            const hasUSState = usStatePattern.test(suggestion)

            // For Germany, if suggestion has US state, it's wrong
            if (requestedCountry.includes('germany') && hasUSState) {
              return false
            }

            // Additional checks could be added for other countries
            return true
          })

          if (!allSuggestionsMatchCountry) {
            console.warn(
              'AddressZen returned country-mismatched results for international address. Falling back to Geoapify.',
            )
            // Return error so caller can fall back to Geoapify
            return {
              ...this.mapToValidatedAddress(address),
              deliverable: false,
              standardized: false,
              error:
                'AddressZen did not find matching results for this country. Try Geoapify instead.',
            }
          }
        }

        // Step 3: Resolve the first/best suggestion
        // AddressZen autocomplete returns hits with structure: { suggestion: "...", id: "...", urls: {...} }
        const bestMatch = suggestions[0]
        console.log('Best match from autocomplete:', bestMatch)

        if (!bestMatch) {
          return {
            ...this.mapToValidatedAddress(address),
            deliverable: false,
            standardized: false,
            error: 'Address found but no match details available',
          }
        }

        // AddressZen uses 'id' field for the place ID (not 'place_id')
        // Try to resolve using the ID
        const placeId = bestMatch.id || bestMatch.place_id

        if (placeId) {
          try {
            console.log('Resolving place_id:', placeId)
            const resolved = await this.resolveViaProxy(placeId)
            console.log('AddressZen validation result (International - resolved):', resolved)

            // If resolve succeeded and returned valid data, use it
            if (resolved && !resolved.error && resolved.address1) {
              return resolved
            }
            // If resolve failed or returned empty, fall through to use suggestion
            console.log('Resolve failed or returned empty, using autocomplete suggestion instead')
          } catch (resolveError) {
            console.log('Resolve failed, using autocomplete suggestion instead:', resolveError)
            // Fall through to use suggestion
          }
        }

        // Fallback: If resolve doesn't work or ID not available, parse the suggestion string
        // AddressZen autocomplete returns: { suggestion: "26 Lena St, Karlsruhe, ND, 58744", id: "...", urls: {} }
        if (bestMatch.suggestion) {
          console.log('Using autocomplete suggestion directly:', bestMatch.suggestion)
          // Parse the suggestion string into address components
          const suggestionParts = bestMatch.suggestion.split(',').map((s: string) => s.trim())

          // Try to parse: "26 Lena St, Karlsruhe, ND, 58744"
          // Format varies, so we'll try to extract what we can
          const parsed = {
            address1: suggestionParts[0] || address.address1 || '',
            address2: address.address2 || '',
            city: suggestionParts[1] || address.city || '',
            state: suggestionParts.length > 2 ? suggestionParts[2] : address.state || '',
            zipcode: suggestionParts.length > 3 ? suggestionParts[3] : address.zipcode || '',
            country: address.country || '',
            formatted: bestMatch.suggestion,
            deliverable: true, // Assume deliverable if AddressZen suggested it
            standardized: true,
            confidence: 0.8, // Medium confidence when using suggestion
            error: undefined,
          }

          console.log('AddressZen validation result (International - from suggestion):', parsed)
          return parsed
        }

        // Last resort: return error
        return {
          ...this.mapToValidatedAddress(address),
          deliverable: false,
          standardized: false,
          error: 'Address found but cannot be resolved and no suggestion available',
        }
      }
    } catch (error) {
      console.error('AddressZen API Error:', error)
      return {
        ...this.mapToValidatedAddress(address),
        deliverable: false,
        standardized: false,
        error:
          'Failed to validate address with AddressZen. ' +
          (error instanceof Error ? error.message : ''),
      }
    }
  }

  /**
   * Validate address with alternatives (for showing multiple matches)
   */
  async validateAddressWithAlternatives(
    address: AddressZenAddress,
  ): Promise<AddressZenValidationResult> {
    if (!this.isEnabled()) {
      const errorMsg = !this.apiKey
        ? 'AddressZen API key not configured. Add VITE_ADDRESSZEN_API_KEY to .env.local'
        : !isValidAddressZenApiKey(this.apiKey)
          ? 'Invalid AddressZen API key format. Keys must start with "ak_"'
          : 'AddressZen API key not configured'

      const primary = {
        ...this.mapToValidatedAddress(address),
        deliverable: false,
        standardized: false,
        error: errorMsg,
      }
      return {
        primary,
        alternatives: [],
      }
    }

    try {
      console.log('Validating address with AddressZen (with alternatives):', address)

      // Ensure proxy URL is loaded
      await this.ensureProxyUrl()

      // AddressZen API likely supports returning multiple matches
      // All validation goes through proxy (SSM API key)
      if (!this.proxyUrl) {
        throw new Error('AddressZen proxy URL not configured (API key in SSM)')
      }
      const result = await this.validateViaProxy(address)

      // If AddressZen returns alternatives, extract them
      // Otherwise, return single result
      const primary = result
      const alternatives: AddressZenValidatedAddress[] = []

      // TODO: Parse alternatives from AddressZen API response
      // This will depend on AddressZen's actual API response format

      return {
        primary,
        alternatives,
      }
    } catch (error) {
      console.error('AddressZen API Error:', error)
      const primary = {
        ...this.mapToValidatedAddress(address),
        deliverable: false,
        standardized: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
      return {
        primary,
        alternatives: [],
      }
    }
  }

  /**
   * Validate via Lambda proxy (keeps API key secure on server)
   * For US addresses only (uses Address Verification API)
   */
  private async validateViaProxy(address: AddressZenAddress): Promise<AddressZenValidatedAddress> {
    if (!this.proxyUrl) {
      throw new Error('Proxy URL not configured')
    }

    const response = await fetch(this.proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'validate', address }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Lambda proxy returned ${response.status}: ${errorText}`)
    }

    return await response.json()
  }

  /**
   * Autocomplete address via Lambda proxy (for international addresses)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async autocompleteViaProxy(query: string): Promise<any[]> {
    if (!this.proxyUrl) {
      throw new Error('Proxy URL not configured')
    }

    console.log('Autocomplete request to AddressZen proxy:', query)

    const response = await fetch(this.proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'autocomplete', query }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Lambda proxy returned ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    console.log('AddressZen autocomplete response:', data)
    console.log('AddressZen autocomplete response structure:', JSON.stringify(data, null, 2))

    // Handle different response structures
    // Lambda proxy returns: { suggestions: <AddressZen API response> }
    // AddressZen API returns: { result: { hits: [...] }, code: 2000, message: "Success" }
    if (data.suggestions) {
      // If suggestions is already an array, return it
      if (Array.isArray(data.suggestions)) {
        console.log('Found suggestions array:', data.suggestions.length, 'items')
        return data.suggestions
      }
      // AddressZen autocomplete returns { result: { hits: [...] }, code, message }
      if (
        data.suggestions.result &&
        data.suggestions.result.hits &&
        Array.isArray(data.suggestions.result.hits)
      ) {
        console.log(
          'Found suggestions.result.hits array:',
          data.suggestions.result.hits.length,
          'items',
        )
        return data.suggestions.result.hits
      }
      // Fallback: check other common structures
      if (data.suggestions.results && Array.isArray(data.suggestions.results)) {
        console.log('Found suggestions.results array:', data.suggestions.results.length, 'items')
        return data.suggestions.results
      }
      if (data.suggestions.data && Array.isArray(data.suggestions.data)) {
        console.log('Found suggestions.data array:', data.suggestions.data.length, 'items')
        return data.suggestions.data
      }
      if (data.suggestions.items && Array.isArray(data.suggestions.items)) {
        console.log('Found suggestions.items array:', data.suggestions.items.length, 'items')
        return data.suggestions.items
      }
      if (data.suggestions.addresses && Array.isArray(data.suggestions.addresses)) {
        console.log(
          'Found suggestions.addresses array:',
          data.suggestions.addresses.length,
          'items',
        )
        return data.suggestions.addresses
      }
    }

    // If no suggestions found, log the full response for debugging
    console.warn(
      'No suggestions array found in AddressZen autocomplete response. Full response structure:',
      JSON.stringify(data, null, 2),
    )
    console.warn(
      'suggestions keys:',
      data.suggestions ? Object.keys(data.suggestions) : 'no suggestions property',
    )
    return []
  }

  /**
   * Resolve address via Lambda proxy (for international addresses)
   */
  private async resolveViaProxy(placeId: string): Promise<AddressZenValidatedAddress> {
    if (!this.proxyUrl) {
      throw new Error('Proxy URL not configured')
    }

    const response = await fetch(this.proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'resolve', placeId }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Lambda proxy returned ${response.status}: ${errorText}`)
    }

    return await response.json()
  }

  /**
   * Validate via direct API call (DEPRECATED - not used, API key stored in SSM)
   * Uses AddressZen Address Verification API
   * Reference: https://docs.addresszen.com/docs/address-verification/getting-started
   *
   * NOTE: This method is kept for reference but should not be used.
   * All validation goes through the Lambda proxy which uses SSM Parameter Store API key.
   */
  private async validateDirect(address: AddressZenAddress): Promise<AddressZenValidatedAddress> {
    // AddressZen Address Verification API endpoint
    // POST https://api.addresszen.com/v1/verify/addresses

    // Build full address string (Option 1: full address string - recommended)
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

    const url = `${this.baseUrl}/verify/addresses?api_key=${this.apiKey}`

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
      const errorMessage = this.parseAddressZenError(response.status, errorData)
      throw new Error(errorMessage)
    }

    const data = await response.json()

    // Map AddressZen API response to our format
    // Response structure: https://docs.addresszen.com/docs/address-verification/getting-started
    // Response has: { result: {...}, code: 2000, message: "Success" }
    return this.mapAddressZenResponse(data, address)
  }

  /**
   * Map AddressZen Address Verification API response to our ValidatedAddress format
   * Reference: https://docs.addresszen.com/docs/address-verification/getting-started
   */
  private mapAddressZenResponse(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any,
    original: AddressZenAddress,
  ): AddressZenValidatedAddress {
    // AddressZen Address Verification API response structure:
    // { result: { address_line_one, address_line_two, city, state, zip_code, match: {...} }, code: 2000, message: "Success" }

    if (!data.result) {
      // No result means validation failed or address not found
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
        error: data.message || 'Address not found or could not be verified',
      }
    }

    const result = data.result
    const validatedZip = result.zip_code || original.zipcode || ''
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

    const formatted = formattedParts.join(', ') || this.formatAddress(original)

    // Determine deliverability from match information
    // match.dpv indicates deliverability: 'Y' = deliverable, 'N' = not deliverable
    const deliverable =
      match.dpv === 'Y' || result.match_information?.includes('delivery address was found')

    // Confidence from response (0-1 scale)
    const confidence = result.confidence ?? (result.count === 1 ? 1 : 0)

    return {
      address1: result.address_line_one || match.address1 || original.address1 || '',
      address2: result.address_line_two || match.address2 || original.address2,
      city: result.city || match.city || original.city || '',
      state: result.state || match.state || original.state || '',
      zipcode: validatedZip || original.zipcode || '',
      country: match.country_code === 'US' ? 'United States' : original.country || '',
      countryCode: result.country_iso_2 || match.country_code || 'US',
      formatted: formatted,
      deliverable: deliverable,
      standardized: result.count === 1, // Standardized if we got a single match
      confidence: confidence,
      error: result.match_information?.includes('not found') ? result.match_information : undefined,
    }
  }

  /**
   * Format USPS address from AddressZen response
   */
  private formatUSPSAddress(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    uspsData: any,
    zipcode: string,
  ): string {
    const parts: string[] = []

    if (uspsData.line_1) {
      parts.push(uspsData.line_1)
    }
    if (uspsData.line_2) {
      parts.push(uspsData.line_2)
    }

    const city = uspsData.preferred_city || uspsData.city || ''
    const state = uspsData.state_abbreviation || uspsData.state || ''

    if (city && state) {
      parts.push(`${city} ${state} ${zipcode}`)
    } else if (uspsData.last_line) {
      parts.push(uspsData.last_line)
    }

    return parts.join(', ')
  }

  /**
   * Map address input to validated address format
   */
  private mapToValidatedAddress(address: AddressZenAddress): AddressZenValidatedAddress {
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
    }
  }

  /**
   * Format address into a single string
   */
  private formatAddress(address: AddressZenAddress): string {
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
   * Parse AddressZen error codes into user-friendly messages
   * Reference: https://docs.addresszen.com/docs/api/api-reference
   */
  private parseAddressZenError(
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
    return (
      errorData?.message || `AddressZen API error (${httpStatus}): ${JSON.stringify(errorData)}`
    )
  }
}

// Export singleton instance
export const addresszenValidator = new AddressZenValidator()

// Export for backwards compatibility
export default addresszenValidator
