#!/usr/bin/env node

/**
 * Import recipients directly from Excel file (.xlsm)
 * Usage: node import-excel-recipients.js
 */

const fs = require('fs')
const XLSX = require('xlsx')
// Generate unique access codes for newsletter recipients
function generateAccessCode() {
  // Generate a random 4-character hex string
  const part1 = Math.random().toString(16).substring(2, 6).toUpperCase()
  const part2 = Math.random().toString(16).substring(2, 6).toUpperCase()

  return `KEL-${part1}-${part2}`
}

// Read the Excel file
const excelPath = 'samples/Yearly Christmas Card List.xlsm'

function importFromExcel() {
  console.log('🎄 Importing recipients from Excel file...\n')

  try {
    // Read the Excel file
    const workbook = XLSX.readFile(excelPath)
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    // Convert to JSON with header mapping
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

    if (jsonData.length < 2) {
      console.error('❌ Excel file appears to be empty or has no data rows')
      return
    }

    console.log(`📊 Found ${jsonData.length - 1} rows in Excel file\n`)

    // Map the columns based on your Excel structure
    // Skipprint, From Who, Title, First Name(s), Second Name, Send, Card Received, Last Name, Address1, Address2, City, State, Zip, Name, City,ST,Zip
    const recipients = []
    const usedCodes = new Set()

    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i]
      if (!row || row.length < 15) continue

      const skipprint = row[0] || ''
      const fromWho = row[1] || ''
      const title = row[2] || ''
      const firstName = row[3] || ''
      const secondName = row[4] || ''
      const send = row[5] || ''
      const cardReceived = row[6] || ''
      const lastName = row[7] || ''
      const address1 = row[8] || ''
      const address2 = row[9] || ''
      const city = row[10] || ''
      const state = row[11] || ''
      const zip = row[12] || ''
      const name = row[13] || ''

      // Only include entries that should receive cards (Send column is not "No")
      if (send !== 'No' && firstName && lastName) {
        // Generate unique access code
        let accessCode
        do {
          accessCode = generateAccessCode()
        } while (usedCodes.has(accessCode))
        usedCodes.add(accessCode)

        const now = new Date().toISOString()

        recipients.push({
          title: title || '',
          firstName: firstName,
          secondName: secondName || '',
          lastName: lastName,
          address1: address1 || '',
          address2: address2 || '',
          city: city || '',
          state: state || '',
          zipcode: zip || '',
          email: '', // No email in the Excel file
          sendCard: send !== 'No',
          wantsPaper: true,
          accessCode: accessCode,
          accessCodeUsed: false,
          createdAt: now,
          updatedAt: now,
        })
      }
    }

    console.log(`✅ Processed ${recipients.length} recipients for import\n`)

    // Generate output files
    const timestamp = new Date().toISOString().split('T')[0]

    // 1. JSON file for database import
    const jsonOutput = {
      generatedAt: new Date().toISOString(),
      sourceFile: excelPath,
      totalRecipients: recipients.length,
      recipients: recipients,
    }

    fs.writeFileSync(
      `recipients-excel-import-${timestamp}.json`,
      JSON.stringify(jsonOutput, null, 2),
    )

    // 2. CSV file for verification and printing labels
    const csvOutput = [
      'Access Code,Name,Address,City,State,ZIP,Send Card',
      ...recipients.map((r) =>
        [
          r.accessCode,
          `"${(r.title + ' ' + r.firstName + ' ' + r.lastName).trim()}"`,
          `"${r.address1}"`,
          `"${r.city}"`,
          `"${r.state}"`,
          `"${r.zipcode}"`,
          r.sendCard ? 'Yes' : 'No',
        ].join(','),
      ),
    ].join('\n')

    fs.writeFileSync(`recipients-excel-import-${timestamp}.csv`, csvOutput)

    // 3. Print summary
    console.log('✅ Generated import files successfully!\n')
    console.log(`📁 Files created:`)
    console.log(`   - recipients-excel-import-${timestamp}.json (for database import)`)
    console.log(`   - recipients-excel-import-${timestamp}.csv (for printing labels)\n`)

    console.log('📋 Sample recipients:')
    recipients.slice(0, 5).forEach((recipient) => {
      console.log(`   ${recipient.accessCode} - ${recipient.firstName} ${recipient.lastName}`)
    })

    if (recipients.length > 5) {
      console.log(`   ... and ${recipients.length - 5} more`)
    }

    console.log(`\n📊 Statistics:`)
    console.log(`   - Total recipients: ${recipients.length}`)
    console.log(`   - Send cards: ${recipients.filter((r) => r.sendCard).length}`)
    console.log(`   - Skip cards: ${recipients.filter((r) => !r.sendCard).length}`)

    console.log(`\n🔗 Registration URL format:`)
    console.log(`   https://your-domain.com/register?code=KEL-XXXX-XXXX`)

    console.log(`\n📝 Next steps:`)
    console.log(`   1. Review the generated files`)
    console.log(`   2. Use the admin interface to import the JSON file`)
    console.log(`   3. Print labels using the CSV file`)
    console.log(`   4. Include access codes in your 2025 newsletter mailings`)
  } catch (error) {
    console.error('❌ Error reading Excel file:', error.message)
    console.log('\n💡 Make sure the file "samples/Yearly Christmas Card List.xlsm" exists')
  }
}

if (require.main === module) {
  importFromExcel()
}

module.exports = { importFromExcel }
