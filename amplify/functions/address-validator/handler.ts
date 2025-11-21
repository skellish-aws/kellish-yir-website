/**
 * Address Validator Lambda Function
 *
 * Processes address validation requests from SQS queue
 * Validates addresses using Google Maps Address Validation API (both US and international)
 * Updates recipient records in DynamoDB with validation results
 */

import { SQSEvent, SQSRecord } from 'aws-lambda'
import { DynamoDBClient, ListTablesCommand } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'

const dynamoClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(dynamoClient)
const ssmClient = new SSMClient({})

// Cache the table name after first lookup
let cachedRecipientTableName: string | null = null

async function getRecipientTableName(): Promise<string> {
  if (cachedRecipientTableName) {
    return cachedRecipientTableName
  }

  // List tables and find the one starting with "Recipient-"
  const listCommand = new ListTablesCommand({})
  const response = await dynamoClient.send(listCommand)
  const tableName = response.TableNames?.find((name: string) => name.startsWith('Recipient-'))

  if (!tableName) {
    throw new Error('Recipient table not found')
  }

  cachedRecipientTableName = tableName
  return tableName
}

// Cache API key for reuse across invocations
let cachedGoogleMapsApiKey: string | null = null

interface AddressValidationRequest {
  recipientId: string
  address1: string
  address2?: string
  city: string
  state: string
  zipcode: string
  country?: string
}

interface ValidationResult {
  status: 'valid' | 'invalid' | 'error'
  message?: string
  validatedAddress?: {
    address1: string
    address2?: string
    city: string
    state: string
    zipcode: string
    country?: string
  }
}

/**
 * Get Google Maps API key from SSM Parameter Store
 */
async function getGoogleMapsApiKey(): Promise<string> {
  if (cachedGoogleMapsApiKey) {
    return cachedGoogleMapsApiKey
  }

  try {
    const response = await ssmClient.send(
      new GetParameterCommand({
        Name: '/kellish-yir/googlemaps/api-key',
        WithDecryption: true,
      }),
    )

    cachedGoogleMapsApiKey = response.Parameter?.Value || ''

    if (!cachedGoogleMapsApiKey) {
      throw new Error('Google Maps API key not found in SSM Parameter Store')
    }

    return cachedGoogleMapsApiKey
  } catch (error) {
    console.error('Error getting Google Maps API key from SSM:', error)
    throw new Error('Failed to retrieve Google Maps API key from SSM Parameter Store')
  }
}

/**
 * Map country name to ISO 3166-1 alpha-2 code
 */
function mapCountryToCode(country: string): string | null {
  const countryLower = country.toLowerCase().trim()

  const countryMap: Record<string, string> = {
    'united states': 'US',
    usa: 'US',
    us: 'US',
    germany: 'DE',
    deutschland: 'DE',
    'united kingdom': 'GB',
    uk: 'GB',
    'great britain': 'GB',
    canada: 'CA',
    france: 'FR',
    australia: 'AU',
    japan: 'JP',
    mexico: 'MX',
    spain: 'ES',
    italy: 'IT',
    netherlands: 'NL',
    belgium: 'BE',
    switzerland: 'CH',
    austria: 'AT',
    sweden: 'SE',
    norway: 'NO',
    denmark: 'DK',
    finland: 'FI',
    poland: 'PL',
    portugal: 'PT',
    greece: 'GR',
    ireland: 'IE',
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

/**
 * Format address for Google Maps Address Validation API
 */
function formatAddressForGoogleMaps(address: AddressValidationRequest): any {
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
    const countryCode = mapCountryToCode(address.country)
    if (countryCode) {
      formatted.regionCode = countryCode
    }
  }

  return formatted
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: any, statusCode?: number): boolean {
  // Network errors (connection reset, timeout)
  if (error?.code === 'ECONNRESET' || error?.code === 'ETIMEDOUT') {
    return true
  }

  // HTTP 5xx errors (server errors) are retryable
  if (statusCode && statusCode >= 500 && statusCode < 600) {
    return true
  }

  // Rate limit errors (429) are retryable
  if (statusCode === 429) {
    return true
  }

  // HTTP 408 (Request Timeout) is retryable
  if (statusCode === 408) {
    return true
  }

  return false
}

/**
 * Validate address using Google Maps Address Validation API with retry logic
 */
async function validateGoogleMapsAddress(
  request: AddressValidationRequest,
): Promise<ValidationResult> {
  const maxRetries = 3
  const retryDelays = [1000, 5000, 30000] // 1s, 5s, 30s

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const apiKey = await getGoogleMapsApiKey()

      // Determine if this is a US address for CASS enablement
      const requestCountry = (request.country || '').toLowerCase()
      const isUSAddress =
        !requestCountry ||
        requestCountry === 'us' ||
        requestCountry === 'usa' ||
        requestCountry === 'united states'

      // Format address for Google Maps API
      const formattedAddress = formatAddressForGoogleMaps(request)

      // Build Google Maps API request
      const googleMapsRequest = {
        address: formattedAddress,
        enableUspsCass: isUSAddress, // Enable CASS for US addresses
      }

      // Call Google Maps Address Validation API
      const response = await fetch(
        `https://addressvalidation.googleapis.com/v1:validateAddress?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(googleMapsRequest),
        },
      )

      if (!response.ok) {
        const statusCode = response.status
        const errorText = await response.text()

        // Check if error is retryable
        if (isRetryableError(null, statusCode) && attempt < maxRetries - 1) {
          console.warn(
            `[Google Maps Error] Retryable error (attempt ${attempt + 1}/${maxRetries}):`,
            statusCode,
            errorText,
          )
          await sleep(retryDelays[attempt])
          continue // Retry
        }

        // Rate limit exceeded - mark as error, can retry later via DLQ
        if (statusCode === 429) {
          console.error('[Google Maps Error] Rate limit exceeded:', errorText)
          return {
            status: 'error',
            message: 'Rate limit exceeded, will retry later',
          }
        }

        // Non-retryable error
        console.error('[Google Maps Error] API error:', statusCode, errorText)
        return {
          status: 'error',
          message: `Google Maps validation failed: ${statusCode}`,
        }
      }

      // If we get here, validation was successful
      const data = await response.json()
      return processValidationResult(data, request)
    } catch (error: any) {
      // Check if error is retryable
      if (isRetryableError(error) && attempt < maxRetries - 1) {
        console.warn(
          `[Google Maps Error] Retryable network error (attempt ${attempt + 1}/${maxRetries}):`,
          error.message,
        )
        await sleep(retryDelays[attempt])
        continue // Retry
      }

      // Non-retryable error or max retries reached
      console.error('[Google Maps Error] Validation error:', error)
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // If we get here, all retries failed
  return {
    status: 'error',
    message: 'Validation failed after retries',
  }
}

/**
 * Process validation result from Google Maps API
 */
function processValidationResult(data: any, request: AddressValidationRequest): ValidationResult {
  if (!data.result) {
    return {
      status: 'invalid',
      message: 'Address validation failed - no result from Google Maps',
    }
  }

  const result = data.result
  const verdict = result.verdict || {}
  const postalAddress = result.address?.postalAddress || {}

  // Determine if address is deliverable
  // SUB_PREMISE means apartment/unit - this is deliverable!
  // Only 'OTHER' granularity means not deliverable
  // For international addresses, we rely on addressComplete and validationGranularity
  const deliverable = verdict.addressComplete === true && verdict.validationGranularity !== 'OTHER'

  // Also check USPS DPV confirmation if available (more reliable for US addresses)
  const uspsData = result.uspsData
  // USPS DPV confirmation codes:
  // "Y" = Confirmed deliverable
  // "D" = Confirmed with Drop (also deliverable)
  // "S" = Confirmed at Street level (also deliverable)
  // "N" = Not deliverable
  const dpvConfirmation = uspsData?.dpvConfirmation
  const uspsDeliverable =
    dpvConfirmation === 'Y' || dpvConfirmation === 'D' || dpvConfirmation === 'S'
  const uspsNotDeliverable = dpvConfirmation === 'N'

  // For US addresses: use USPS confirmation if clear, otherwise fall back to Google Maps verdict
  // For international addresses: use Google Maps verdict (USPS data won't exist)
  const isDeliverable =
    uspsData !== undefined
      ? uspsNotDeliverable
        ? false
        : uspsDeliverable
          ? true
          : deliverable // US address: use USPS if clear, else Google Maps
      : deliverable // International address: use Google Maps verdict

  // Extract address components
  const addressLines = postalAddress.addressLines || []
  const address1 = addressLines[0] || request.address1 || ''
  const address2 = addressLines[1] || request.address2 || ''
  const city = postalAddress.locality || request.city || ''
  const state = postalAddress.administrativeArea || request.state || ''
  const zipcode = postalAddress.postalCode || request.zipcode || ''
  const countryCode = postalAddress.regionCode || ''

  // Map country code to country name if needed
  let validatedCountry = request.country || ''
  if (countryCode && !validatedCountry) {
    // Map common country codes to names
    const codeToCountry: Record<string, string> = {
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
    validatedCountry = codeToCountry[countryCode.toUpperCase()] || countryCode
  }

  return {
    status: isDeliverable ? 'valid' : 'invalid',
    message: isDeliverable
      ? 'Address validated by Google Maps'
      : 'Address found but may not be deliverable',
    validatedAddress: {
      address1,
      address2: address2 || undefined,
      city,
      state,
      zipcode,
      country: validatedCountry || request.country || '',
    },
  }
}

export const handler = async (event: SQSEvent): Promise<void> => {
  for (const record of event.Records) {
    try {
      await processRecord(record)
    } catch (error) {
      console.error('Error processing record:', error)
      // Don't throw - let other records process
    }
  }
}

async function processRecord(record: SQSRecord): Promise<void> {
  const request: AddressValidationRequest = JSON.parse(record.body)

  // Use Google Maps for both US and international addresses
  const result = await validateGoogleMapsAddress(request)

  // Update recipient in DynamoDB
  await updateRecipientValidation(request.recipientId, result)
}

async function updateRecipientValidation(
  recipientId: string,
  result: ValidationResult,
): Promise<void> {
  const tableName = await getRecipientTableName()
  const updateParams: any = {
    TableName: tableName,
    Key: { id: recipientId },
    UpdateExpression:
      'SET addressValidationStatus = :status, addressValidationMessage = :message, addressValidatedAt = :timestamp',
    ExpressionAttributeValues: {
      ':status': result.status,
      ':message': result.message || '',
      ':timestamp': new Date().toISOString(),
    },
  }

  // Add validated address fields if available
  if (result.validatedAddress) {
    updateParams.UpdateExpression +=
      ', validatedAddress1 = :addr1, validatedAddress2 = :addr2, validatedCity = :city, validatedState = :state, validatedZipcode = :zip, validatedCountry = :country'
    updateParams.ExpressionAttributeValues[':addr1'] = result.validatedAddress.address1
    updateParams.ExpressionAttributeValues[':addr2'] = result.validatedAddress.address2 || ''
    updateParams.ExpressionAttributeValues[':city'] = result.validatedAddress.city
    updateParams.ExpressionAttributeValues[':state'] = result.validatedAddress.state
    updateParams.ExpressionAttributeValues[':zip'] = result.validatedAddress.zipcode
    updateParams.ExpressionAttributeValues[':country'] = result.validatedAddress.country || ''
  }

  await docClient.send(new UpdateCommand(updateParams))
}
