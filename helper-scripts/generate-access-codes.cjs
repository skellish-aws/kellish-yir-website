#!/usr/bin/env node

/**
 * Generate unique access codes for newsletter recipients
 * Usage: node generate-access-codes.js
 */

const fs = require('fs')
const crypto = require('crypto')

// Read the CSV file
const csvPath = 'samples/Yearly Christmas Card List.csv'
const csvContent = fs.readFileSync(csvPath, 'utf8')

// Parse CSV (simple parser for this specific format)
function parseCSV(content) {
  const lines = content.split('\n')
  const headers = lines[0].split(',')
  const recipients = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const values = line.split(',')
    if (values.length < 15) continue // Skip malformed lines

    const recipient = {
      skipprint: values[0],
      fromWho: values[1],
      title: values[2],
      firstName: values[3],
      secondName: values[4],
      send: values[5],
      cardReceived: values[6],
      lastName: values[7],
      address1: values[8],
      address2: values[9],
      city: values[10],
      state: values[11],
      zip: values[12],
      name: values[13],
      cityStateZip: values[14],
    }

    // Only include entries that should receive cards (Send column is not "No")
    if (recipient.send !== 'No' && recipient.firstName && recipient.lastName) {
      recipients.push(recipient)
    }
  }

  return recipients
}

// Generate unique access code (one per recipient, not per year)
function generateAccessCode() {
  const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase()
  return `KEL-${randomPart.substring(0, 4)}-${randomPart.substring(4, 8)}`
}

// Main function
function main() {
  console.log('🎄 Generating access codes for newsletter recipients...\n')

  const recipients = parseCSV(csvContent)
  console.log(`📊 Found ${recipients.length} recipients to send cards to\n`)

  const accessCodes = []
  const usedCodes = new Set()

  for (const recipient of recipients) {
    let accessCode
    do {
      accessCode = generateAccessCode()
    } while (usedCodes.has(accessCode))

    usedCodes.add(accessCode)

    accessCodes.push({
      accessCode,
      recipient: {
        firstName: recipient.firstName,
        lastName: recipient.lastName,
        title: recipient.title,
        address1: recipient.address1,
        address2: recipient.address2,
        city: recipient.city,
        state: recipient.state,
        zip: recipient.zip,
        fullName: recipient.name,
      },
    })
  }

  // Generate output files
  const timestamp = new Date().toISOString().split('T')[0]

  // 1. JSON file for database import
  const jsonOutput = {
    generatedAt: new Date().toISOString(),
    totalCodes: accessCodes.length,
    codes: accessCodes,
  }

  fs.writeFileSync(`access-codes-${timestamp}.json`, JSON.stringify(jsonOutput, null, 2))

  // 2. CSV file for printing labels
  const csvOutput = [
    'Access Code,Name,Address,City,State,Zip',
    ...accessCodes.map((code) =>
      [
        code.accessCode,
        `"${code.recipient.fullName}"`,
        `"${code.recipient.address1 || ''}"`,
        `"${code.recipient.city || ''}"`,
        `"${code.recipient.state || ''}"`,
        `"${code.recipient.zip || ''}"`,
      ].join(','),
    ),
  ].join('\n')

  fs.writeFileSync(`access-codes-${timestamp}.csv`, csvOutput)

  // 3. Print summary
  console.log('✅ Generated access codes successfully!\n')
  console.log(`📁 Files created:`)
  console.log(`   - access-codes-${timestamp}.json (for database import)`)
  console.log(`   - access-codes-${timestamp}.csv (for printing labels)\n`)

  console.log('📋 Sample codes:')
  accessCodes.slice(0, 5).forEach((code) => {
    console.log(`   ${code.accessCode} - ${code.recipient.fullName}`)
  })

  if (accessCodes.length > 5) {
    console.log(`   ... and ${accessCodes.length - 5} more`)
  }

  console.log(`\n🔗 Registration URL format:`)
  console.log(`   https://your-domain.com/register?code=KEL-XXXX-XXXX`)

  console.log(`\n📝 Next steps:`)
  console.log(`   1. Review the generated files`)
  console.log(`   2. Print labels with access codes`)
  console.log(`   3. Include codes in your 2025 newsletter mailings`)
  console.log(`   4. Deploy the registration system`)
}

if (require.main === module) {
  main()
}

module.exports = { parseCSV, generateAccessCode }
