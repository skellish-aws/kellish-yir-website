/**
 * GDPR Data Export Lambda Function
 *
 * Exports user data in JSON format for GDPR Right to Data Portability (Article 20)
 * Aggregates data from NewsletterUser, AccessCode, and Recipient models
 *
 * Access: Admin only (via IAM authentication)
 */

import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import {
  CognitoIdentityProviderClient,
  AdminGetUserCommand,
} from '@aws-sdk/client-cognito-identity-provider'

const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({}))
const cognitoClient = new CognitoIdentityProviderClient({})

interface ExportRequest {
  userEmail: string
}

interface UserExportData {
  exportDate: string
  userAccount: {
    email: string
    registeredAt?: string
    lastLoginAt?: string
    accessLevel?: string
    active?: boolean
  }
  registrationDetails?: {
    accessCode?: string
    codeCreatedAt?: string
    codeUsedAt?: string
    invitationType?: string
    recipientName?: string
    recipientAddress?: string
  }
  recipientInformation?: {
    firstName?: string
    lastName?: string
    secondName?: string
    suffix?: string
    title?: string
    mailingName?: string
    email?: string
    address?: {
      address1?: string
      address2?: string
      city?: string
      state?: string
      zipcode?: string
      country?: string
    }
    validatedAddress?: {
      address1?: string
      address2?: string
      city?: string
      state?: string
      zipcode?: string
      country?: string
    }
    preferences?: {
      wantsPaper?: boolean
      sendCard?: boolean
    }
  }
  accessRights?: {
    newslettersAccessible: Array<{
      year: number
      title: string
    }>
  }
}

/**
 * Get table name by listing tables and finding the one with the prefix
 */
async function getTableName(prefix: string): Promise<string | null> {
  // For Amplify Gen 2, table names are prefixed with the stack name
  // We'll need to query by scanning or use environment variables
  // For now, we'll use a pattern-based approach
  // In production, consider using environment variables or SSM parameters

  // This is a simplified approach - in practice, you might want to:
  // 1. Use environment variables set in backend.ts
  // 2. Use SSM Parameter Store
  // 3. List tables and find by prefix

  // For now, we'll assume table names follow Amplify Gen 2 pattern
  // and use environment variables or hardcode the pattern
  return null // Will be set via environment variable
}

/**
 * Query NewsletterUser by email
 */
async function getUserByEmail(email: string, userTableName: string): Promise<any | null> {
  try {
    // Note: Amplify Gen 2 uses GSI for email queries
    // This is a simplified version - you may need to adjust based on your actual schema
    const result = await dynamoClient.send(
      new QueryCommand({
        TableName: userTableName,
        IndexName: 'email-index', // Adjust based on your actual GSI
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: {
          ':email': email,
        },
        Limit: 1,
      }),
    )

    return result.Items && result.Items.length > 0 ? result.Items[0] : null
  } catch (error) {
    console.error('Error querying user:', error)
    // Fallback: scan table (less efficient, but works if no GSI)
    const result = await dynamoClient.send(
      new QueryCommand({
        TableName: userTableName,
        FilterExpression: 'email = :email',
        ExpressionAttributeValues: {
          ':email': email,
        },
        Limit: 1,
      }),
    )
    return result.Items && result.Items.length > 0 ? result.Items[0] : null
  }
}

/**
 * Query AccessCode by usedBy (NewsletterUser ID)
 */
async function getAccessCodeByUserId(
  userId: string,
  accessCodeTableName: string,
): Promise<any | null> {
  try {
    const result = await dynamoClient.send(
      new QueryCommand({
        TableName: accessCodeTableName,
        IndexName: 'usedBy-index', // Adjust based on your actual GSI
        KeyConditionExpression: 'usedBy = :userId',
        ExpressionAttributeValues: {
          ':userId': userId,
        },
        Limit: 1,
      }),
    )

    return result.Items && result.Items.length > 0 ? result.Items[0] : null
  } catch (error) {
    console.error('Error querying access code:', error)
    return null
  }
}

/**
 * Query Recipient by accessCode
 */
async function getRecipientByAccessCode(
  accessCode: string,
  recipientTableName: string,
): Promise<any | null> {
  try {
    const result = await dynamoClient.send(
      new QueryCommand({
        TableName: recipientTableName,
        IndexName: 'accessCode-index', // Adjust based on your actual GSI
        KeyConditionExpression: 'accessCode = :code',
        ExpressionAttributeValues: {
          ':code': accessCode,
        },
        Limit: 1,
      }),
    )

    return result.Items && result.Items.length > 0 ? result.Items[0] : null
  } catch (error) {
    console.error('Error querying recipient:', error)
    return null
  }
}

/**
 * Get all newsletters user has access to
 */
async function getAllNewsletters(newsletterTableName: string): Promise<any[]> {
  try {
    const result = await dynamoClient.send(
      new QueryCommand({
        TableName: newsletterTableName,
        // Scan all newsletters (users have access to all)
        // In a more complex system, you might filter by access rights
      }),
    )

    return result.Items || []
  } catch (error) {
    console.error('Error querying newsletters:', error)
    return []
  }
}

/**
 * Aggregate user data for export
 */
async function aggregateUserData(email: string): Promise<UserExportData> {
  // Get table names from environment variables (set in backend.ts)
  const userTableName = process.env.NEWSLETTER_USER_TABLE_NAME || ''
  const accessCodeTableName = process.env.ACCESS_CODE_TABLE_NAME || ''
  const recipientTableName = process.env.RECIPIENT_TABLE_NAME || ''
  const newsletterTableName = process.env.NEWSLETTER_TABLE_NAME || ''

  // Get user from NewsletterUser table
  const user = await getUserByEmail(email, userTableName)
  if (!user) {
    throw new Error('User not found')
  }

  // Get access code used for registration
  let accessCode = null
  if (user.id) {
    accessCode = await getAccessCodeByUserId(user.id, accessCodeTableName)
  }

  // Get recipient information if access code exists
  let recipient = null
  if (accessCode?.code) {
    recipient = await getRecipientByAccessCode(accessCode.code, recipientTableName)
  }

  // Get all newsletters (user has access to all)
  const newsletters = await getAllNewsletters(newsletterTableName)

  // Build export data
  const exportData: UserExportData = {
    exportDate: new Date().toISOString(),
    userAccount: {
      email: user.email || email,
      registeredAt: user.registeredAt,
      lastLoginAt: user.lastLoginAt,
      accessLevel: user.accessLevel || 'viewer',
      active: user.active !== false, // Default to true if not set
    },
  }

  // Add registration details if access code found
  if (accessCode) {
    exportData.registrationDetails = {
      accessCode: accessCode.code,
      codeCreatedAt: accessCode.createdAt,
      codeUsedAt: accessCode.usedAt,
      invitationType: accessCode.invitationType,
      recipientName: accessCode.recipientName,
      recipientAddress: accessCode.recipientAddress,
    }
  }

  // Add recipient information if found
  if (recipient) {
    exportData.recipientInformation = {
      firstName: recipient.firstName,
      lastName: recipient.lastName,
      secondName: recipient.secondName,
      suffix: recipient.suffix,
      title: recipient.title,
      mailingName: recipient.mailingName,
      email: recipient.email,
      address: {
        address1: recipient.address1,
        address2: recipient.address2,
        city: recipient.city,
        state: recipient.state,
        zipcode: recipient.zipcode,
        country: recipient.country,
      },
      validatedAddress: recipient.validatedAddress1
        ? {
            address1: recipient.validatedAddress1,
            address2: recipient.validatedAddress2,
            city: recipient.validatedCity,
            state: recipient.validatedState,
            zipcode: recipient.validatedZipcode,
            country: recipient.validatedCountry,
          }
        : undefined,
      preferences: {
        wantsPaper: recipient.wantsPaper !== false,
        sendCard: recipient.sendCard !== false,
      },
    }
  }

  // Add newsletter access rights
  exportData.accessRights = {
    newslettersAccessible: newsletters.map((n) => ({
      year: n.year,
      title: n.title,
    })),
  }

  return exportData
}

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
    // TODO: Verify admin authentication
    // For now, we'll assume authentication is handled at the API Gateway/Lambda level
    // In production, verify the user is an admin via Cognito token

    // Parse request body
    const request: ExportRequest = JSON.parse(event.body || '{}')

    if (!request.userEmail) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'userEmail is required' }),
      }
    }

    // Aggregate user data
    const exportData = await aggregateUserData(request.userEmail)

    // Return JSON export
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Disposition': `attachment; filename="user-data-export-${request.userEmail}-${Date.now()}.json"`,
      },
      body: JSON.stringify(exportData, null, 2),
    }
  } catch (error: any) {
    console.error('Error exporting user data:', error)

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to export user data',
        message: error.message || 'Unknown error',
      }),
    }
  }
}
