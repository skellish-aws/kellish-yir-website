# AddressZen Setup Summary

## ✅ What Was Created

1. **Configuration**

   - `src/config/addresszen.ts` - API configuration and setup instructions

2. **Client Utility**

   - `src/utils/addresszen-validator.ts` - Unified validator for US and international addresses
   - Supports both direct API calls and Lambda proxy (recommended)

3. **Backend Lambda**

   - `amplify/functions/addresszen-proxy/` - Lambda proxy for secure API key handling
   - Reads API key from SSM Parameter Store
   - Handles CORS and API routing

4. **Backend Configuration**
   - Updated `amplify/backend.ts` to include AddressZen proxy
   - Exports `addresszenProxyUrl` to `amplify_outputs.json`

## 🚀 Quick Start

### 1. Get AddressZen API Key

Sign up at https://addresszen.com and get your API key from the dashboard.

**API Key Details:**

- **What it is:** A string of characters that authenticates your integration with AddressZen
- **Format:** Starts with `ak_` (e.g., `ak_ksqa49sjSdAEDq9I88`)
- **Location:** Found in your dashboard after signing into your account
- **Test Balance:** First API key receives **100 free test lookups**
- **Limit:** Up to **10 API keys per account**
- **Usage:** Each key has its own balance, security, and notification settings
- **Purpose:** Used for authentication, security, notifications, and balance management
- **Documentation:** https://docs.addresszen.com/docs/guides/api-key
- **See Also:** `ADDRESSZEN_API_KEY.md` for comprehensive API key guide

**Lookup Balance:**

- Each lookup costs credits from your balance
- Test balance: **100 free lookups** with first API key
- Purchase: Buy blocks of **100 credits** (100 verified addresses)
- Expiration: Lookups expire **12 months from first use** (not purchase date)
- Consumption: Oldest batches consumed first (FIFO)
- Reference: https://docs.addresszen.com/docs/guides/purchasing-lookups

### 1.1. Configure API Key Security Settings

**Important:** Configure security settings in your AddressZen dashboard to control usage.

Since we're using a **Lambda proxy** (server-side/private approach), configure:

1. **Daily Lookup Limits**

   - Set a daily limit on lookups per API key
   - Resets at midnight
   - Email notifications at 90% and 100% capacity

2. **Individual Lookup Limits** (Optional)

   - Limits per IP address per day
   - Useful if you have multiple servers calling the API
   - Resets at midnight per IP

3. **Allowed URLs** (Not needed for server-side)
   - Only needed for client-side integrations
   - Since we use Lambda proxy, this isn't required

**Security Best Practices:**

- ✅ Set daily lookup limits to control spending
- ✅ Enable email notifications for balance alerts
- ✅ Use server-side Lambda proxy (not client-side) for security
- ✅ Monitor usage in the dashboard regularly

**Documentation:** https://docs.addresszen.com/docs/guides/api-key-settings

### 2. Create SSM Parameter

```bash
aws ssm put-parameter \
  --name "/kellish-yir/addresszen/api-key" \
  --type "String" \
  --value "ak_your-api-key-here"
```

**Note:** Replace `ak_your-api-key-here` with your actual API key (starts with `ak_`).

### 3. Purchase Lookup Credits (After Testing)

Once you've tested the 100 free lookups, you'll need to purchase credits:

1. Dashboard → **Keys** tab
2. Click **"Manage"** button on your API Key
3. Click **"One Time Top Up"** button (next to your balance display)
4. Enter number of credit blocks (each block = 100 lookups)
5. Complete payment

**Important:**

- Lookups expire **12 months from first use** (not purchase date)
- Oldest batches are consumed first
- Consider setting up **Automated Top-Ups** for production

**Reference:** https://docs.addresszen.com/docs/guides/purchasing-lookups

### 4. Deploy

```bash
npx ampx sandbox
```

### 5. Test AddressZen API Format

**Important:** The code has placeholder API calls that need to be adjusted based on AddressZen's actual API format.

Check these files for `TODO:` comments:

- `src/utils/addresszen-validator.ts` - Client-side API calls
- `amplify/functions/addresszen-proxy/handler.ts` - Server-side API calls

You'll need to update:

- API endpoint URLs (base URL: `https://api.addresszen.com/v1`)
- Request parameter names
- Response parsing based on AddressZen's actual format
- Authentication: Use `api_key` parameter (with underscore) in query string

**Data Format Documentation:**

- AddressZen supports multiple country-specific formats (USPS, UK PAF, HERE Global, etc.)
- See `ADDRESSZEN_USPS_MAPPING.md` for address mapping details
- Data formats overview: https://docs.addresszen.com/docs/data
- USPS format: https://docs.addresszen.com/docs/data/usps

**API Reference Documentation:**

- See `ADDRESSZEN_API_REFERENCE.md` for complete API details
- Official reference: https://docs.addresszen.com/docs/api/api-reference
- Testing guide: https://docs.addresszen.com/docs/guides/testing

### 6. Integration Options

**Option A: Test Mode** (recommended first)

- Add AddressZen as an optional validator in `RecipientAdmin.vue`
- Test alongside USPS/Geoapify before full migration

**Option B: Full Migration**

- Replace all USPS/Geoapify calls with AddressZen
- Update Lambda handler for background validation
- Remove old validators after testing

## 📝 Next Steps

1. ✅ Sign up for AddressZen and get API key
2. ✅ Create SSM parameter
3. ✅ Deploy backend (`npx ampx sandbox`)
4. ⏳ Review AddressZen API documentation
5. ⏳ Update placeholder API code based on actual API format
6. ⏳ Test with sample US and international addresses
7. ⏳ Compare results with USPS/Geoapify
8. ⏳ Integrate into `RecipientAdmin.vue` for testing

## 🔧 Files to Update After Getting API Key

1. **`src/utils/addresszen-validator.ts`**

   - Update `validateDirect()` method with correct API endpoint and format
   - Update `mapResponseToValidatedAddress()` based on actual response structure

2. **`amplify/functions/addresszen-proxy/handler.ts`**
   - Update `validateAddress()` with correct API endpoint and format
   - Update response mapping based on AddressZen's actual response

## 📚 Documentation

- **API Key Guide:** See `ADDRESSZEN_API_KEY.md` for API key details
- **API Reference:** See `ADDRESSZEN_API_REFERENCE.md` for complete API details
- **Pricing & Balance:** See `ADDRESSZEN_PRICING.md` for lookup purchasing
- **Security Guide:** See `ADDRESSZEN_SECURITY.md` for API key security
- **Address Mapping:** See `ADDRESSZEN_USPS_MAPPING.md` for address format details
- **Migration Guide:** See `ADDRESSZEN_MIGRATION.md` for migration steps
- **AddressZen Docs:** https://docs.addresszen.com/
