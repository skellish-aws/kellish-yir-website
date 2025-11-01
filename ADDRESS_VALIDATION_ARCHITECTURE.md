# Address Validation Architecture

## Overview

Asynchronous address validation system using SQS queue and Lambda processor.

## Architecture

```
┌─────────────┐
│   Client    │
│ (Vue App)   │
└──────┬──────┘
       │
       │ 1. Import CSV
       │ 2. Create Recipients
       │ 3. Send to SQS
       ▼
┌─────────────────┐
│   SQS Queue     │
│ (Validation)    │
└──────┬──────────┘
       │
       │ Triggers
       ▼
┌──────────────────┐
│  Lambda Function │
│ (Address         │
│  Validator)      │
└──────┬───────────┘
       │
       │ Validates with:
       ├─► USPS API (US)
       └─► Geoapify (International)
       │
       │ Updates
       ▼
┌──────────────────┐
│    DynamoDB      │
│  (Recipients)    │
└──────────────────┘
```

## Database Schema Changes

### New Fields in Recipient Model:

```typescript
addressValidationStatus: string // 'pending', 'queued', 'valid', 'invalid', 'error'
addressValidationMessage: string // Error message or details
addressValidatedAt: datetime // When last validated
validatedAddress1: string // Validated address from API
validatedAddress2: string
validatedCity: string
validatedState: string
validatedZipcode: string
validatedCountry: string
```

## Validation Status Flow

```
pending → queued → valid/invalid/error
   ↓         ↓           ↓
Created   In SQS    Processed
```

### Status Meanings:

- **pending**: Just created, not yet queued
- **queued**: Sent to SQS, waiting for processing
- **valid**: Successfully validated, address confirmed
- **invalid**: Address not found or low confidence
- **error**: API error or system failure

## Implementation Steps

### ✅ Step 1: Database Schema (DONE)

- Added validation fields to Recipient model
- Ready to deploy

### ✅ Step 2: Lambda Function (DONE)

- Created `address-validator` function
- Handles SQS events
- Validates with USPS/Geoapify
- Updates DynamoDB

### ✅ Step 3: SQS Queue (DONE)

- Created queue in backend.ts
- Connected to Lambda
- Configured batch processing (10 at a time)

### ⏳ Step 4: Client Integration (TODO)

Need to update RecipientAdmin.vue to:

1. Send messages to SQS after import
2. Show validation status in list
3. Allow manual re-validation

### ⏳ Step 5: UI Indicators (TODO)

Add visual indicators in recipient list:

- ✅ Green checkmark: valid
- ⚠️ Yellow warning: invalid
- ❌ Red X: error
- ⏳ Clock: queued/pending

### ⏳ Step 6: Manual Validation (TODO)

Add "Validate Address" button in edit dialog:

- Shows current validation status
- Allows re-validation
- Shows validated vs. entered address

## Client-Side Changes Needed

### 1. Import Flow

```typescript
async function importRecipients() {
  // Create all recipients first
  for (const recipient of importPreview.value) {
    const result = await client.models.Recipient.create({
      ...recipient,
      addressValidationStatus: 'pending',
    })

    // Queue for validation if has address
    if (recipient.address1 && recipient.city) {
      await queueAddressValidation(result.data.id, recipient)
    }
  }
}

async function queueAddressValidation(recipientId, address) {
  // Send to SQS
  await sendToSQS({
    recipientId,
    address1: address.address1,
    address2: address.address2,
    city: address.city,
    state: address.state,
    zipcode: address.zipcode,
    country: address.country,
  })

  // Update status to 'queued'
  await client.models.Recipient.update({
    id: recipientId,
    addressValidationStatus: 'queued',
  })
}
```

### 2. Recipient List UI

```vue
<template>
  <!-- In recipient list -->
  <div class="flex items-center gap-2">
    <div>{{ recipient.city }}, {{ recipient.state }}</div>

    <!-- Validation indicator -->
    <i
      v-if="recipient.addressValidationStatus === 'valid'"
      class="pi pi-check-circle text-green-600"
      title="Address validated"
    ></i>

    <i
      v-else-if="recipient.addressValidationStatus === 'invalid'"
      class="pi pi-exclamation-triangle text-yellow-600"
      title="Address needs review"
    ></i>

    <i
      v-else-if="recipient.addressValidationStatus === 'error'"
      class="pi pi-times-circle text-red-600"
      title="Validation error"
    ></i>

    <i
      v-else-if="recipient.addressValidationStatus === 'queued'"
      class="pi pi-clock text-blue-600"
      title="Validation in progress"
    ></i>

    <i v-else class="pi pi-question-circle text-gray-400" title="Not validated"></i>
  </div>
</template>
```

### 3. Edit Dialog Enhancement

```vue
<template>
  <!-- In edit dialog -->
  <div
    v-if="form.addressValidationStatus"
    class="mt-4 p-3 rounded"
    :class="{
      'bg-green-50 border border-green-200': form.addressValidationStatus === 'valid',
      'bg-yellow-50 border border-yellow-200': form.addressValidationStatus === 'invalid',
      'bg-red-50 border border-red-200': form.addressValidationStatus === 'error',
    }"
  >
    <div class="flex items-center justify-between">
      <div>
        <div class="font-semibold">Address Validation</div>
        <div class="text-sm">{{ form.addressValidationMessage }}</div>
        <div v-if="form.addressValidatedAt" class="text-xs text-gray-500">
          Last validated: {{ formatDate(form.addressValidatedAt) }}
        </div>
      </div>

      <Button
        label="Re-validate"
        icon="pi pi-refresh"
        class="p-button-sm"
        @click="revalidateAddress"
      />
    </div>

    <!-- Show validated address if different -->
    <div v-if="hasValidatedAddress && addressesDiffer" class="mt-3">
      <div class="text-sm font-semibold mb-2">Validated Address:</div>
      <div class="text-sm">
        <div>{{ form.validatedAddress1 }}</div>
        <div v-if="form.validatedAddress2">{{ form.validatedAddress2 }}</div>
        <div>{{ form.validatedCity }}, {{ form.validatedState }} {{ form.validatedZipcode }}</div>
      </div>
      <Button
        label="Use Validated Address"
        class="p-button-sm p-button-success mt-2"
        @click="useValidatedAddress"
      />
    </div>
  </div>
</template>
```

## Environment Variables Needed

### Lambda Function:

```bash
USPS_CONSUMER_KEY=your_usps_key
USPS_CONSUMER_SECRET=your_usps_secret
GEOAPIFY_API_KEY=your_geoapify_key
```

### Client (for SQS):

```bash
VITE_AWS_REGION=us-east-1
# Queue URL will be exported by backend
```

## Benefits

### ✅ Scalable

- SQS handles any volume
- Lambda auto-scales
- No client blocking

### ✅ Resilient

- Failed validations retry automatically
- 14-day message retention
- Dead letter queue for failures

### ✅ Efficient

- Batch processing (10 at a time)
- Parallel validation
- No duplicate API calls

### ✅ User-Friendly

- Import completes immediately
- Validation happens in background
- Visual status indicators
- Manual re-validation option

## Performance

### Import 114 Recipients:

- **Without validation**: ~5-10 seconds
- **With validation**: ~5-10 seconds (import) + ~2-3 minutes (background validation)
- **User experience**: Import feels instant, validation happens in background

### API Usage:

- **USPS**: Free (your account)
- **Geoapify**: 114 requests = ~4% of daily limit (3,000/day)

## Monitoring

### CloudWatch Metrics:

- SQS queue depth
- Lambda invocations
- Validation success rate
- Average processing time

### DynamoDB Queries:

```typescript
// Count by status
const pending = recipients.filter((r) => r.addressValidationStatus === 'pending')
const valid = recipients.filter((r) => r.addressValidationStatus === 'valid')
const invalid = recipients.filter((r) => r.addressValidationStatus === 'invalid')
```

## Next Steps

1. **Deploy schema changes**:

   ```bash
   npx ampx sandbox
   ```

2. **Test Lambda locally** (optional):

   ```bash
   cd amplify/functions/address-validator
   npm install
   ```

3. **Update client code** (RecipientAdmin.vue):

   - Add SQS integration
   - Add UI indicators
   - Add re-validation button

4. **Test end-to-end**:

   - Import CSV
   - Watch validation status update
   - Verify addresses in DynamoDB

5. **Monitor**:
   - Check CloudWatch logs
   - Monitor SQS queue
   - Review validation results

## Cost Estimate

### AWS Services:

- **SQS**: $0.40 per million requests (~$0.00 for 114)
- **Lambda**: $0.20 per million requests (~$0.00 for 114)
- **DynamoDB**: Included in free tier

### API Services:

- **USPS**: Free
- **Geoapify**: Free (up to 3,000/day)

**Total**: Essentially free for your use case!

## Questions?

- Should validation be automatic on import or manual?
- Should we show a progress indicator during validation?
- Should we send notifications when validation completes?
- Should we auto-accept validated addresses or require review?
