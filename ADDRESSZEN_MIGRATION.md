# AddressZen Migration Guide

This guide shows how to integrate AddressZen as a unified replacement for USPS (US addresses) and Geoapify (international addresses).

## Files Created

1. **`src/config/addresszen.ts`** - Configuration for AddressZen API
2. **`src/utils/addresszen-validator.ts`** - AddressZen validator utility
3. **`amplify/functions/addresszen-proxy/`** - Lambda proxy for secure API key handling
4. **`amplify/backend.ts`** - Updated to include AddressZen proxy

## Setup Steps

### 1. Get AddressZen API Key

1. Sign up at https://addresszen.com
2. Get your API key from the dashboard
3. Note: You'll need to check their pricing and API limits

### 2. Create SSM Parameter

Create the SSM parameter for AddressZen API key:

```bash
aws ssm put-parameter \
  --name "/kellish-yir/addresszen/api-key" \
  --type "String" \
  --value "your-addresszen-api-key-here"
```

### 3. Deploy Backend

The AddressZen proxy Lambda is already configured in `backend.ts`. Deploy:

```bash
npx ampx sandbox
```

After deployment, the `addresszenProxyUrl` will be in `amplify_outputs.json`.

### 4. Optional: Add Environment Variable (for direct client-side calls)

If you want to test direct API calls (not recommended for production), add to `.env.local`:

```
VITE_ADDRESSZEN_API_KEY=your-api-key-here
```

**Note:** The Lambda proxy approach is recommended to keep API keys secure.

## Integration Points

### Option A: Test AddressZen Alongside Current Validators

You can add AddressZen as an optional validator to test before full migration:

**In `RecipientAdmin.vue`**, add AddressZen import:

```typescript
import { addresszenValidator } from '../utils/addresszen-validator.ts'
```

**In `validateAddressBeforeSave()` function**, add AddressZen as a test option:

```typescript
// Test AddressZen if enabled (add this as an option)
if (addresszenValidator.isEnabled()) {
  const result = await addresszenValidator.validateAddress(address)
  // Handle result...
  return
}
```

### Option B: Full Migration (Replace USPS + Geoapify)

To fully migrate:

1. **Update `validateAddressBeforeSave()`** to use AddressZen for all addresses
2. **Update Lambda handler** (`address-validator/handler.ts`) to use AddressZen
3. **Remove USPS and Geoapify** code (or keep as fallback)

## Testing AddressZen API

Before full migration, test the AddressZen API format. The current implementation has placeholder code marked with `TODO:` that needs to be adjusted based on AddressZen's actual API:

1. **API Endpoint** - Update in `addresszen-proxy/handler.ts` if different
2. **Request Format** - Adjust query parameters based on AddressZen's API
3. **Response Format** - Update `mapResponseToValidatedAddress()` based on their response structure
4. **Alternatives Support** - Check if AddressZen returns multiple matches like Geoapify

## Next Steps

1. **Test AddressZen API** - Sign up and test their API format
2. **Update placeholder code** - Adjust API calls based on actual AddressZen documentation
3. **Test with sample addresses** - Try both US and international addresses
4. **Compare results** - Test against current USPS/Geoapify results
5. **Migrate gradually** - Start with test mode, then full migration

## Benefits

- ✅ Single API for US and international
- ✅ No USPS OAuth complexity
- ✅ Potentially higher rate limits than USPS (60/hour)
- ✅ Unified autocomplete (if supported)

## Considerations

- ⚠️ Cost: Check AddressZen pricing vs free USPS/Geoapify tiers
- ⚠️ API Limits: Verify their rate limits
- ⚠️ Response Format: May differ from current validators
- ⚠️ Dependency: Single vendor vs multiple providers
