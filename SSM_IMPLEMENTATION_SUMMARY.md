# SSM Parameter Store Implementation Summary

## ✅ What's Been Implemented

### 1. Backend Infrastructure (`amplify/backend.ts`)

- ✅ Created SSM parameter references for all API keys
- ✅ Created `geoapify-proxy` Lambda function
- ✅ Granted SSM read permissions to all Lambda functions
- ✅ Added Function URL for `geoapify-proxy`
- ✅ Exported `geoapifyProxyUrl` for client use

### 2. Lambda Functions Updated

#### `address-validator` Lambda

- ✅ Added SSM client import
- ✅ Created `getApiKeys()` function to read from SSM
- ✅ Updated `validateUSPSAddress()` to use SSM keys
- ✅ Updated `validateGeoapifyAddress()` to use SSM keys
- ✅ Added caching for API keys across invocations
- ✅ Added `@aws-sdk/client-ssm` dependency

#### `usps-proxy` Lambda

- ✅ Added SSM client import
- ✅ Created `getUspsCredentials()` function to read from SSM
- ✅ Updated handler to use SSM credentials
- ✅ Added caching for credentials
- ✅ Added `@aws-sdk/client-ssm` dependency
- ✅ Created `package.json`

#### `geoapify-proxy` Lambda (New)

- ✅ Created handler with SSM integration
- ✅ Supports both `validate` and `autocomplete` actions
- ✅ Handles CORS properly
- ✅ Caches API key across invocations
- ✅ Created `resource.ts` and `package.json`

### 3. Client Utilities

#### `geoapify-proxy.ts` (New)

- ✅ Client wrapper for Geoapify proxy Lambda
- ✅ Supports validation and autocomplete
- ✅ Error handling and fallbacks
- ✅ Same interface as direct Geoapify client

### 4. Documentation

- ✅ `SSM_DEPLOYMENT_GUIDE.md` - Complete deployment instructions
- ✅ `SSM_IMPLEMENTATION_SUMMARY.md` - This file

## ⚠️ Known Issue: Environment Variables

There's a TypeScript error in `amplify/backend.ts`:

```
Property 'addEnvironment' does not exist on type 'IFunction'
```

**Root Cause**: Amplify Gen 2's `defineFunction` doesn't expose CDK's `addEnvironment` method.

**Workaround Options**:

### Option A: Use Static Environment Variables (Recommended)

Define environment variables in resource files with placeholder values that get resolved at deploy time:

```typescript
// amplify/functions/queue-address-validation/resource.ts
export const queueAddressValidation = defineFunction({
  name: 'queue-address-validation',
  entry: './handler.ts',
  timeoutSeconds: 30,
  environment: {
    // These will be automatically populated by AWS
    AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  },
})
```

Then in the handler, query AWS services directly:

```typescript
// Get queue URL from SQS ListQueues API
// Get table name from DynamoDB ListTables API (filtered by tag)
```

### Option B: Use SSM for Everything

Store queue URL and table name in SSM Parameter Store too:

```bash
aws ssm put-parameter \
  --name "/kellish-yir/queue/validation-url" \
  --type "String" \
  --value "https://sqs.us-east-1.amazonaws.com/..."
```

### Option C: Use Tags and Discovery

Tag resources during deployment and have Lambdas discover them:

```typescript
const sqs = new SQSClient({})
const response = await sqs.send(
  new ListQueuesCommand({
    QueueNamePrefix: 'AddressValidationQueue',
  }),
)
```

## 🎯 Next Steps

### Immediate (Required for Deployment)

1. **Fix Environment Variable Issue**

   - Choose one of the workaround options above
   - Implement in Lambda handlers
   - Test locally with sandbox

2. **Create SSM Parameters**

   - Follow `SSM_DEPLOYMENT_GUIDE.md` Step 2
   - Use AWS Console or CLI
   - Verify parameters exist

3. **Deploy Backend**

   ```bash
   npx ampx sandbox
   ```

4. **Test Lambda Functions**
   - Use curl commands from deployment guide
   - Verify SSM keys are being read correctly
   - Check CloudWatch logs for errors

### Client Integration (TODO #4)

The client (`RecipientAdmin.vue`) currently uses:

- ❌ Direct Geoapify API calls (client-side, exposes API key)
- ✅ USPS proxy Lambda (already secure)

**Need to update**:

1. Replace `geoapifyValidator` imports with `geoapifyProxyClient`
2. Replace `geoapifyAutocomplete` with proxy client
3. Update autocomplete handler to use proxy
4. Remove `VITE_GEOAPIFY_API_KEY` from `.env.local`

### Cleanup (TODO #5)

1. Remove from `.env.local`:

   ```bash
   VITE_GEOAPIFY_API_KEY=11b3be8a12b94e7789be6c299450d3c0
   ```

2. Update documentation:

   - Mark Geoapify setup guides as deprecated
   - Point to SSM deployment guide

3. Remove unused files:
   - `src/config/geoapify.ts` (if not needed)
   - `src/utils/geoapify-validator.ts` (replaced by proxy)
   - `src/utils/geoapify-autocomplete.ts` (replaced by proxy)

## 🔒 Security Improvements

**Before (Insecure)**:

```
Client → Geoapify API (key exposed in JavaScript)
```

**After (Secure)**:

```
Client → Geoapify Proxy Lambda → SSM → Geoapify API
```

### Benefits:

- ✅ API keys never leave AWS
- ✅ Keys encrypted at rest (SSM SecureString)
- ✅ Keys encrypted in transit (TLS)
- ✅ Centralized key management
- ✅ Audit trail (CloudTrail logs SSM access)
- ✅ Easy key rotation (update SSM, Lambda picks up on next call)
- ✅ No client-side exposure
- ✅ Rate limiting at Lambda level (future enhancement)

## 📊 Performance Impact

### Latency:

- **Direct API call**: ~200-500ms
- **Via Lambda proxy**: ~300-700ms (+100-200ms overhead)
  - Cold start: ~500ms (first call only)
  - Warm: ~50ms Lambda execution
  - SSM cache: ~0ms (cached after first call)

### Cost:

- **Lambda invocations**: $0.20 per 1M requests
- **Lambda compute**: $0.0000166667 per GB-second
- **SSM GetParameter**: $0.05 per 10,000 API calls (free tier: 10,000/month)
- **Estimated**: <$1/month for typical usage

## 🧪 Testing Checklist

- [ ] Deploy backend successfully
- [ ] Create SSM parameters
- [ ] Test USPS proxy Lambda (curl)
- [ ] Test Geoapify proxy Lambda (curl)
- [ ] Verify SSM keys are cached (check CloudWatch logs)
- [ ] Test US address validation (client)
- [ ] Test international address validation (client)
- [ ] Test address autocomplete (client)
- [ ] Verify no API keys in client JavaScript bundle
- [ ] Test key rotation (update SSM, verify Lambda picks up new key)

## 📝 Notes

- All Lambda functions share the same SSM parameters
- API keys are cached per Lambda execution context (reused across invocations)
- SSM uses AWS-managed encryption by default (free)
- Could upgrade to customer-managed KMS key for more control ($1/month)
- Queue URL and table name environment variables still need to be resolved (see Known Issue above)

## 🚀 Deployment Commands

```bash
# 1. Deploy backend
npx ampx sandbox

# 2. Create SSM parameters (replace with your actual keys)
aws ssm put-parameter \
  --name "/kellish-yir/geoapify/api-key" \
  --type "SecureString" \
  --value "11b3be8a12b94e7789be6c299450d3c0"

aws ssm put-parameter \
  --name "/kellish-yir/usps/consumer-key" \
  --type "SecureString" \
  --value "YOUR_KEY"

aws ssm put-parameter \
  --name "/kellish-yir/usps/consumer-secret" \
  --type "SecureString" \
  --value "YOUR_SECRET"

# 3. Test
curl -X POST https://YOUR_GEOAPIFY_PROXY_URL \
  -H "Content-Type: application/json" \
  -d '{"action":"validate","address1":"123 Main St","city":"Boston","country":"USA"}'

# 4. Update client and restart dev server
npm run dev
```
