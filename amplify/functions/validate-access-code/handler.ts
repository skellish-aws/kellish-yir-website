/**
 * Validate Access Code Lambda Function
 *
 * Public endpoint to validate access codes during registration
 * Returns code validity, expiration status, and usage status
 */

import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { DynamoDBClient, ListTablesCommand } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb'

const dynamoClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(dynamoClient)

// Cache the table name after first lookup
let cachedAccessCodeTableName: string | null = null

async function getAccessCodeTableName(): Promise<string> {
  if (cachedAccessCodeTableName) {
    return cachedAccessCodeTableName
  }

  // List tables and find the one starting with "AccessCode-"
  const listCommand = new ListTablesCommand({})
  const response = await dynamoClient.send(listCommand)
  const tableName = response.TableNames?.find((name: string) => name.startsWith('AccessCode-'))

  if (!tableName) {
    throw new Error('AccessCode table not found')
  }

  cachedAccessCodeTableName = tableName
  return tableName
}

interface ValidationRequest {
  code: string
}

interface ValidationResponse {
  valid: boolean
  exists: boolean
  used?: boolean
  invitationType?: string
  message?: string
  codeId?: string
}

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
    // Parse request body
    const request: ValidationRequest = JSON.parse(event.body || '{}')

    if (!request.code) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ valid: false, exists: false, message: 'Access code is required' }),
      }
    }

    // Normalize code (uppercase, remove spaces)
    const normalizedCode = request.code.replace(/\s+/g, '').toUpperCase()

    // Validate format
    const codeFormatRegex = /^KEL-[A-Z0-9]{4}-[A-Z0-9]{4}$/
    if (!codeFormatRegex.test(normalizedCode)) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          valid: false,
          exists: false,
          message: 'Invalid format. Please enter code as KEL-XXXX-XXXX',
        }),
      }
    }

    // Query AccessCode from database
    const tableName = await getAccessCodeTableName()

    // Scan table for code (since code is not the primary key)
    // Note: In production, consider adding a GSI on the code field for better performance
    const result = await docClient.send(
      new ScanCommand({
        TableName: tableName,
        FilterExpression: 'code = :code',
        ExpressionAttributeValues: {
          ':code': normalizedCode,
        },
        Limit: 1,
      }),
    )

    const codeRecord = result.Items?.[0]

    if (!codeRecord) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          valid: false,
          exists: false,
          message:
            'Invalid invitation link. Please check the link and try again, or contact an administrator for assistance.',
        }),
      }
    }

    // Check if code is used
    const used = codeRecord.used === true

    if (used) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          valid: false,
          exists: true,
          used: true,
          message:
            'This invitation link has already been used. Each invitation link can only be used once. Please contact an administrator if you need access.',
        }),
      }
    }

    // Code is valid and not used
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        valid: true,
        exists: true,
        used: false,
        invitationType: codeRecord.invitationType || undefined,
        codeId: codeRecord.id,
        message: 'Access code is valid',
      }),
    }
  } catch (error: unknown) {
    console.error('Error validating access code:', error)

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        valid: false,
        exists: false,
        message:
          'Unable to validate invitation link. Please try again or contact an administrator for assistance.',
      }),
    }
  }
}
