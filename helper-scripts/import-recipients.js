#!/usr/bin/env node

/**
 * Import recipients from CSV into the database
 * Usage: node import-recipients.js
 */

const fs = require('fs')
const { generateAccessCode } = require('./generate-access-codes')

// Read the CSV file
const csvPath = 'samples/Yearly Christmas Card List.csv'
const csvContent = fs.readFileSync(csvPath, 'utf8')

// Parse CSV (reusing the function from generate-access-codes.js)
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

// Generate database import data
function generateImportData() {
  console.log('🎄 Generating recipient import data...\n')

  const recipients = parseCSV(csvContent)
  console.log(`📊 Found ${recipients.length} recipients to import\n`)

  const importData = []
  const usedCodes = new Set()

  for (const recipient of recipients) {
    let accessCode
    do {
      accessCode = generateAccessCode()
    } while (usedCodes.has(accessCode))

    usedCodes.add(accessCode)

    const now = new Date().toISOString()

    importData.push({
      title: recipient.title || '',
      firstName: recipient.firstName,
      secondName: recipient.secondName || '',
      lastName: recipient.lastName,
      address1: recipient.address1 || '',
      address2: recipient.address2 || '',
      city: recipient.city || '',
      state: recipient.state || '',
      zipcode: recipient.zip || '',
      email: '', // No email in the CSV
      sendCard: recipient.send !== 'No',
      wantsPaper: true,
      accessCode: accessCode,
      accessCodeUsed: false,
      createdAt: now,
      updatedAt: now,
    })
  }

  // Generate output files
  const timestamp = new Date().toISOString().split('T')[0]

  // 1. JSON file for database import
  const jsonOutput = {
    generatedAt: new Date().toISOString(),
    totalRecipients: importData.length,
    recipients: importData,
  }

  fs.writeFileSync(`recipients-import-${timestamp}.json`, JSON.stringify(jsonOutput, null, 2))

  // 2. CSV file for verification
  const csvOutput = [
    'Title,First Name,Second Name,Last Name,Address1,Address2,City,State,ZIP,Access Code,Send Card',
    ...importData.map((r) =>
      [
        `"${r.title}"`,
        `"${r.firstName}"`,
        `"${r.secondName}"`,
        `"${r.lastName}"`,
        `"${r.address1}"`,
        `"${r.address2}"`,
        `"${r.city}"`,
        `"${r.state}"`,
        `"${r.zipcode}"`,
        r.accessCode,
        r.sendCard ? 'Yes' : 'No',
      ].join(','),
    ),
  ].join('\n')

  fs.writeFileSync(`recipients-import-${timestamp}.csv`, csvOutput)

  // 3. Print summary
  console.log('✅ Generated import data successfully!\n')
  console.log(`📁 Files created:`)
  console.log(`   - recipients-import-${timestamp}.json (for database import)`)
  console.log(`   - recipients-import-${timestamp}.csv (for verification)\n`)

  console.log('📋 Sample recipients:')
  importData.slice(0, 5).forEach((recipient) => {
    console.log(`   ${recipient.firstName} ${recipient.lastName} - ${recipient.accessCode}`)
  })

  if (importData.length > 5) {
    console.log(`   ... and ${importData.length - 5} more`)
  }

  console.log(`\n📝 Next steps:`)
  console.log(`   1. Review the generated files`)
  console.log(`   2. Use the admin interface to import recipients`)
  console.log(`   3. Or use the JSON file to bulk import into the database`)

  return importData
}

if (require.main === module) {
  generateImportData()
}

module.exports = { parseCSV, generateImportData }
