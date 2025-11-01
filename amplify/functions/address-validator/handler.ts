/**
 * Address Validator Lambda Function
 *
 * Processes address validation requests from SQS queue
 * Validates addresses using USPS (US) or Geoapify (International)
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
  const tableName = response.TableNames?.find((name) => name.startsWith('Recipient-'))

  if (!tableName) {
    throw new Error('Recipient table not found')
  }

  cachedRecipientTableName = tableName
  return tableName
}

// Cache API keys for reuse across invocations
let cachedUspsConsumerKey: string | null = null
let cachedUspsConsumerSecret: string | null = null
let cachedGeoapifyApiKey: string | null = null

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
 * Get API keys from SSM Parameter Store
 */
async function getApiKeys(): Promise<{
  uspsConsumerKey: string
  uspsConsumerSecret: string
  geoapifyApiKey: string
}> {
  // Return cached values if available
  if (cachedUspsConsumerKey && cachedUspsConsumerSecret && cachedGeoapifyApiKey) {
    return {
      uspsConsumerKey: cachedUspsConsumerKey,
      uspsConsumerSecret: cachedUspsConsumerSecret,
      geoapifyApiKey: cachedGeoapifyApiKey,
    }
  }

  try {
    // Fetch all parameters in parallel
    const [uspsKeyResponse, uspsSecretResponse, geoapifyResponse] = await Promise.all([
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
      ssmClient.send(
        new GetParameterCommand({
          Name: '/kellish-yir/geoapify/api-key',
          WithDecryption: true,
        }),
      ),
    ])

    cachedUspsConsumerKey = uspsKeyResponse.Parameter?.Value || ''
    cachedUspsConsumerSecret = uspsSecretResponse.Parameter?.Value || ''
    cachedGeoapifyApiKey = geoapifyResponse.Parameter?.Value || ''

    if (!cachedUspsConsumerKey || !cachedUspsConsumerSecret || !cachedGeoapifyApiKey) {
      throw new Error('One or more API keys not found in SSM Parameter Store')
    }

    return {
      uspsConsumerKey: cachedUspsConsumerKey,
      uspsConsumerSecret: cachedUspsConsumerSecret,
      geoapifyApiKey: cachedGeoapifyApiKey,
    }
  } catch (error) {
    console.error('Error getting API keys from SSM:', error)
    throw new Error('Failed to retrieve API keys from SSM Parameter Store')
  }
}

export const handler = async (event: SQSEvent): Promise<void> => {
  console.log('Processing', event.Records.length, 'address validation requests')

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

  console.log('Validating address for recipient:', request.recipientId)

  // Determine if US or international
  const country = request.country?.toLowerCase() || ''
  const isUSAddress =
    !country || country === 'usa' || country === 'united states' || country === 'us'

  let result: ValidationResult

  if (isUSAddress) {
    result = await validateUSPSAddress(request)
  } else {
    result = await validateGeoapifyAddress(request)
  }

  // Update recipient in DynamoDB
  await updateRecipientValidation(request.recipientId, result)
}

async function validateUSPSAddress(request: AddressValidationRequest): Promise<ValidationResult> {
  try {
    // Get API keys from SSM
    const { uspsConsumerKey, uspsConsumerSecret } = await getApiKeys()

    // Get OAuth token
    const tokenResponse = await fetch('https://apis-tem.usps.com/oauth2/v3/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: uspsConsumerKey,
        client_secret: uspsConsumerSecret,
        scope: 'addresses',
      }),
    })

    if (!tokenResponse.ok) {
      throw new Error(`OAuth token request failed: ${tokenResponse.status}`)
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Strip ZIP+4 for USPS API
    let zipcode = request.zipcode
    if (zipcode.includes('-')) {
      zipcode = zipcode.split('-')[0]
    }

    // Convert state to 2-letter code if needed
    const state = getStateAbbreviation(request.state)

    // Build query parameters for USPS Address Validation API (GET request per API spec)
    const params = new URLSearchParams({
      streetAddress: request.address1,
      state: state,
    })

    // Add optional parameters
    if (request.address2) {
      params.append('secondaryAddress', request.address2)
    }
    if (request.city) {
      params.append('city', request.city)
    }
    if (zipcode) {
      params.append('ZIPCode', zipcode)
    }

    // Validate address using GET request
    const url = `https://apis-tem.usps.com/addresses/v3/address?${params.toString()}`
    const validateResponse = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    })

    if (!validateResponse.ok) {
      const errorText = await validateResponse.text()
      return {
        status: 'invalid',
        message: `USPS validation failed: ${errorText}`,
      }
    }

    const data = await validateResponse.json()
    const address = data.address

    return {
      status: 'valid',
      message: 'Address validated by USPS',
      validatedAddress: {
        address1: address.streetAddress || request.address1,
        address2: address.secondaryAddress || request.address2,
        city: address.city || request.city,
        state: address.state || request.state,
        zipcode: address.ZIPCode
          ? `${address.ZIPCode}${address.ZIPPlus4 ? '-' + address.ZIPPlus4 : ''}`
          : request.zipcode,
        country: 'United States', // Always set to USA for USPS-validated addresses
      },
    }
  } catch (error) {
    console.error('USPS validation error:', error)
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

async function validateGeoapifyAddress(
  request: AddressValidationRequest,
): Promise<ValidationResult> {
  try {
    // Get API keys from SSM
    const { geoapifyApiKey } = await getApiKeys()

    const addressParts = [
      request.address1,
      request.address2,
      request.city,
      request.state,
      request.zipcode,
      request.country,
    ].filter(Boolean)

    const addressString = addressParts.join(', ')

    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(addressString)}&apiKey=${geoapifyApiKey}&format=json`

    const response = await fetch(url)

    if (!response.ok) {
      return {
        status: 'invalid',
        message: `Geoapify validation failed: ${response.status}`,
      }
    }

    const data = await response.json()

    if (!data.results || data.results.length === 0) {
      return {
        status: 'invalid',
        message: 'Address not found',
      }
    }

    const result = data.results[0]

    // Check confidence
    if (result.rank?.confidence < 0.5) {
      return {
        status: 'invalid',
        message: 'Low confidence match',
      }
    }

    return {
      status: 'valid',
      message: 'Address validated by Geoapify',
      validatedAddress: {
        address1: extractStreetAddress(result),
        address2: request.address2 || '',
        city: result.city || request.city,
        state: result.state || request.state,
        zipcode: result.postcode || request.zipcode,
        country: result.country || request.country,
      },
    }
  } catch (error) {
    console.error('Geoapify validation error:', error)
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }
  }
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

  console.log(`Updated recipient ${recipientId} with validation status: ${result.status}`)
}

function extractStreetAddress(result: any): string {
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

function getStateAbbreviation(state: string): string {
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
  return stateMap[normalized] || state
}
