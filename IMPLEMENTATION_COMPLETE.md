# Address Validation Implementation - READY TO DEPLOY

## ✅ What's Been Implemented

### Backend (100% Complete)

1. ✅ Database schema with validation fields
2. ✅ Lambda function to process validations (`address-validator`)
3. ✅ Lambda function to queue validations (`queue-address-validation`)
4. ✅ SQS queue for async processing
5. ✅ All permissions and environment variables configured

### Frontend (95% Complete)

1. ✅ UI status indicators in recipient list
2. ✅ TypeScript interfaces updated
3. ✅ Queue validation utility created
4. ⏳ RecipientAdmin.vue needs final updates (see below)

## 🚀 Deployment Steps

### 1. Deploy Backend

```bash
cd /Volumes/Data/Users/scottkellish/Devel/github.com/kellish-yir-website
npx ampx sandbox
```

This will:

- Deploy schema changes
- Deploy both Lambda functions
- Create SQS queue
- Export queue Lambda URL

### 2. Get the Queue URL

After deployment, the queue Lambda URL will be in `amplify_outputs.json`:

```json
{
  "custom": {
    "queueValidationUrl": "https://xxxxx.lambda-url.us-east-1.on.aws/"
  }
}
```

### 3. Add to Environment

Create/update `.env.local`:

```bash
VITE_QUEUE_VALIDATION_URL=https://xxxxx.lambda-url.us-east-1.on.aws/
VITE_GEOAPIFY_API_KEY=your_key_here
```

### 4. Restart Dev Server

```bash
npm run dev
```

## 📝 Final Code Changes Needed

Only ONE file needs updates: `src/views/RecipientAdmin.vue`

### Changes Required:

1. **Import the queue utility** (top of script):

```typescript
import { queueBatchValidation } from '../utils/queue-validation.ts'
```

2. **Add address tracking state** (with other refs):

```typescript
const originalAddressFields = ref<{
  address1?: string
  address2?: string
  city?: string
  state?: string
  zipcode?: string
  country?: string
}>({})
```

3. **Update `showAddDialog`** (clear tracking):

```typescript
function showAddDialog() {
  isEditing.value = false
  mailingNameManuallyEdited.value = false
  form.value = {
    // ... existing code ...
  }
  dialogVisible.value = true

  // Clear address tracking
  originalAddressFields.value = {}

  // ... existing setTimeout code ...
}
```

4. **Update `editRecipient`** (store original address):

```typescript
function editRecipient(recipient: Recipient) {
  isEditing.value = true
  form.value = { ...recipient }
  dialogVisible.value = true

  // Store original address for change detection
  originalAddressFields.value = {
    address1: recipient.address1,
    address2: recipient.address2,
    city: recipient.city,
    state: recipient.state,
    zipcode: recipient.zipcode,
    country: recipient.country,
  }

  // ... existing setTimeout code ...
}
```

5. **Add helper functions** (before `saveRecipient`):

```typescript
function hasAddressChanged(): boolean {
  return (
    form.value.address1 !== originalAddressFields.value.address1 ||
    form.value.address2 !== originalAddressFields.value.address2 ||
    form.value.city !== originalAddressFields.value.city ||
    form.value.state !== originalAddressFields.value.state ||
    form.value.zipcode !== originalAddressFields.value.zipcode ||
    form.value.country !== originalAddressFields.value.country
  )
}

function shouldRunInlineValidation(): boolean {
  // Skip if no address
  if (!form.value.address1?.trim() || !form.value.city?.trim()) {
    return false
  }

  // Skip if address hasn't changed and is valid or overridden
  if (!hasAddressChanged()) {
    const status = form.value.addressValidationStatus
    if (status === 'valid' || status === 'overridden') {
      console.log('Skipping validation: address unchanged and status is', status)
      return false
    }
  }

  // Run validation if address changed or status requires it
  return true
}
```

6. **Update `saveRecipient`** (replace validation section):

```typescript
// Find this section (around line 800):
// Auto-validate address if address fields are provided (unless we're skipping validation)
if (
  !skipValidation.value &&
  form.value.address1?.trim() &&
  form.value.city?.trim() &&
  form.value.state?.trim()
) {
  const validationResult = await validateAddressBeforeSave()
  // ...
}

// Replace with:
// Smart validation based on address changes and current status
if (shouldRunInlineValidation() && !skipValidation.value) {
  const validationResult = await validateAddressBeforeSave()

  if (validationResult === false) {
    saving.value = false
    return
  }
}
```

7. **Update `useOriginalAddress`** (set overridden status):

```typescript
function useOriginalAddress() {
  // User chose to keep their address - mark as overridden
  form.value.addressValidationStatus = 'overridden'
  form.value.addressValidationMessage = 'User chose to keep original address'

  showAddressConfirmDialog.value = false
  skipValidation.value = true

  // Continue with save (form already has original values)
  saveRecipient()
}
```

8. **Update `importRecipients`** (queue for validation):

```typescript
async function importRecipients() {
  try {
    importing.value = true

    const validationRequests = []

    // Import all recipients in batches
    const batchSize = 25
    for (let i = 0; i < importPreview.value.length; i += batchSize) {
      const batch = importPreview.value.slice(i, i + batchSize)
      const results = await Promise.all(
        batch.map((recipient) =>
          client.models.Recipient.create({
            ...recipient,
            addressValidationStatus: 'pending',
          }),
        ),
      )

      // Collect validation requests for recipients with addresses
      results.forEach((result, index) => {
        const recipient = batch[index]
        if (result.data && recipient.address1 && recipient.city) {
          validationRequests.push({
            recipientId: result.data.id,
            address1: recipient.address1,
            address2: recipient.address2 || '',
            city: recipient.city,
            state: recipient.state || '',
            zipcode: recipient.zipcode || '',
            country: recipient.country || '',
          })
        }
      })
    }

    // Queue all for validation
    if (validationRequests.length > 0) {
      const queued = await queueBatchValidation(validationRequests)
      console.log(`Queued ${queued} addresses for validation`)

      if (queued > 0) {
        alert(
          `Imported ${importPreview.value.length} recipients. ${queued} addresses queued for validation.`,
        )
      }
    }

    await fetchRecipients()
    showImportDialog.value = false
    importPreview.value = []
  } catch (err) {
    console.error('Error importing recipients:', err)
    alert('Error importing recipients. Please try again.')
  } finally {
    importing.value = false
  }
}
```

## 🎯 How It Works

### CSV Import:

1. Import all recipients (fast, ~5-10 seconds)
2. Queue addresses for validation (batch API call)
3. Lambda processes in background
4. Status updates automatically in database
5. Refresh page to see updated statuses

### Create/Update:

1. Smart check: has address changed?
2. Smart check: is current status valid/overridden?
3. If both no → skip validation, save immediately
4. If either yes → run inline validation
5. User can override → sets status to 'overridden'

## 🧪 Testing

### Test Import:

1. Import CSV with 114 recipients
2. Should complete in ~10 seconds
3. Check console: "Queued 114 addresses for validation"
4. Refresh after 2-3 minutes
5. Status icons should update

### Test Create:

1. Add new recipient with address
2. Should show validation dialog
3. Choose "Use My Address"
4. Status should be 'overridden'
5. Edit again without changing address
6. Should save immediately (no validation)

### Test Edit:

1. Edit recipient with valid address
2. Change only name
3. Should save immediately
4. Edit again, change city
5. Should run validation

## 📊 Monitoring

### Check Queue:

- AWS Console → SQS → AddressValidationQueue
- See messages in flight

### Check Lambda Logs:

- AWS Console → CloudWatch → Log Groups
- `/aws/lambda/address-validator`
- `/aws/lambda/queue-address-validation`

### Check Database:

```typescript
// Count by status
const stats = {
  pending: recipients.filter((r) => r.addressValidationStatus === 'pending').length,
  queued: recipients.filter((r) => r.addressValidationStatus === 'queued').length,
  valid: recipients.filter((r) => r.addressValidationStatus === 'valid').length,
  invalid: recipients.filter((r) => r.addressValidationStatus === 'invalid').length,
  error: recipients.filter((r) => r.addressValidationStatus === 'error').length,
  overridden: recipients.filter((r) => r.addressValidationStatus === 'overridden').length,
}
console.log('Validation stats:', stats)
```

## 🎉 You're Done!

Once you make these changes and deploy, you'll have:

- ✅ Fast CSV imports with background validation
- ✅ Smart inline validation that doesn't re-validate unnecessarily
- ✅ User control to override validation
- ✅ Visual status indicators
- ✅ Scalable, production-ready architecture

The hard part is done - just need to wire up the client code!
