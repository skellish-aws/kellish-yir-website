# Address Validation Logic Implementation

## User Requirements

### A. CSV Import

- Each recipient should be queued for async validation
- No inline validation during import
- Fast import, validation happens in background

### B. Create/Update Recipient

Smart validation based on current state:

**Skip validation if:**

- Address is currently `'valid'` OR `'overridden'`
- AND user hasn't touched any address fields

**Run inline validation if:**

- Address has NOT been validated yet (`'pending'`, `null`)
- OR address is currently `'invalid'` or `'error'`
- OR user has modified any address field

**If user ignores validated address:**

- Set status to `'overridden'`
- Save their original address
- Don't validate again unless they edit

## Status Values

```typescript
type ValidationStatus =
  | 'pending' // Not yet validated
  | 'queued' // Sent to SQS, waiting for processing
  | 'valid' // Successfully validated
  | 'invalid' // Validation failed (address not found)
  | 'error' // API error during validation
  | 'overridden' // User chose to keep their address despite validation
```

## Implementation

### 1. Track Address Changes

```typescript
// Store original address when dialog opens
const originalAddressFields = ref<{
  address1?: string
  address2?: string
  city?: string
  state?: string
  zipcode?: string
  country?: string
}>({})

function showAddDialog() {
  // ... existing code ...
  originalAddressFields.value = {}
}

function editRecipient(recipient: Recipient) {
  // ... existing code ...
  originalAddressFields.value = {
    address1: recipient.address1,
    address2: recipient.address2,
    city: recipient.city,
    state: recipient.state,
    zipcode: recipient.zipcode,
    country: recipient.country,
  }
}

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
```

### 2. Smart Validation Decision

```typescript
async function saveRecipient() {
  // ... existing validation ...

  // Determine if we should validate
  const shouldValidate = shouldRunInlineValidation()

  if (shouldValidate && !skipValidation.value) {
    const validationResult = await validateAddressBeforeSave()
    if (validationResult === false) {
      saving.value = false
      return
    }
  }

  // ... continue with save ...
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

  // Run validation if:
  // - Address has changed
  // - OR status is pending/invalid/error
  return true
}
```

### 3. Handle User Override

```typescript
function useOriginalAddress() {
  // User chose to keep their address
  form.value.addressValidationStatus = 'overridden'
  form.value.addressValidationMessage = 'User chose to keep original address'

  showAddressConfirmDialog.value = false
  skipValidation.value = true

  // Continue with save
  saveRecipient()
}
```

### 4. CSV Import with Queueing

```typescript
async function importRecipients() {
  try {
    importing.value = true

    const validationRequests = []

    // Create all recipients first
    for (const recipient of importPreview.value) {
      const result = await client.models.Recipient.create({
        ...recipient,
        addressValidationStatus: 'pending', // Start as pending
      })

      // Prepare validation request if has address
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
    }

    // Queue all for validation in batch
    if (validationRequests.length > 0) {
      const queued = await queueBatchValidation(validationRequests)
      console.log(`Queued ${queued} addresses for validation`)
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

## User Experience

### CSV Import Flow:

1. User selects CSV file
2. Preview shows (first 10)
3. User clicks "Import"
4. Recipients created instantly (~5-10 seconds)
5. Status shows as "pending" (gray ?)
6. Background: Requests queued to SQS
7. Status updates to "queued" (blue ⏳ pulsing)
8. Background: Lambda processes validations
9. Status updates to "valid" (green ✓) or "invalid" (yellow ⚠️)

### Create/Update Flow:

**Scenario 1: New recipient**

1. User enters address
2. Clicks "Save"
3. Inline validation runs
4. If different, shows dialog
5. User chooses validated or original
6. Saves with appropriate status

**Scenario 2: Edit existing (no address change)**

1. User edits name/email only
2. Clicks "Save"
3. No validation (address unchanged and valid/overridden)
4. Saves immediately

**Scenario 3: Edit existing (address changed)**

1. User changes city
2. Clicks "Save"
3. Inline validation runs (address changed)
4. If different, shows dialog
5. User chooses validated or original
6. Saves with appropriate status

**Scenario 4: Fix invalid address**

1. Recipient has yellow ⚠️ (invalid)
2. User clicks edit
3. Fixes address
4. Clicks "Save"
5. Inline validation runs (status was invalid)
6. If valid, saves with green ✓

## Benefits

1. **Fast imports** - No waiting for validation
2. **Smart validation** - Only when needed
3. **User control** - Can override validation
4. **Visual feedback** - Clear status indicators
5. **Background processing** - Doesn't block UI
6. **Efficient** - Doesn't re-validate unchanged addresses

## Next Steps

1. ✅ Deploy backend changes
2. ✅ Update RecipientAdmin.vue with new logic
3. ✅ Test import flow
4. ✅ Test create/update flows
5. ✅ Monitor validation queue
