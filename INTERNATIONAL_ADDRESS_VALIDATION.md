# International Address Validation Implementation

## Overview

The application now supports **automatic address validation** for both US and international addresses:

- **US Addresses**: Validated using USPS API (existing functionality)
- **International Addresses**: Validated using Geoapify API (new functionality)

## How It Works

### Automatic Detection

The system automatically determines whether an address is US or international based on the **Country** field:

- **US Address**: Country is empty, "USA", "US", or "United States"

  - Uses USPS API for validation
  - Provides ZIP+4 codes
  - Standardizes to USPS format

- **International Address**: Any other country value
  - Uses Geoapify API for validation
  - Provides standardized international format
  - Works with 245+ countries

### Validation Flow

1. User fills in recipient form including address fields
2. User clicks "Create" or "Update"
3. System checks the Country field
4. Appropriate validation API is called:
   - USPS for US addresses
   - Geoapify for international addresses
5. If validated address differs from entered address:
   - Dialog appears showing both versions side-by-side
   - User chooses which version to save
6. Address is saved to database

### User Experience

#### For US Addresses (No Change)

```
User enters:
  1234 Main St
  Philadelphia, PA 19147

USPS validates to:
  1234 Main Street
  Philadelphia, PA 19147-4011

Dialog shows both → User chooses → Saved
```

#### For International Addresses (New)

```
User enters:
  Avenida Diogo Cão, N15
  Portugal
  2670-327

Geoapify validates to:
  Avenida Diogo Cão, N15 - 2C
  2670-327 Infantado Loures
  Portugal

Dialog shows both → User chooses → Saved
```

## Setup Requirements

### For US Address Validation (USPS)

- Already configured
- See [USPS_SETUP.md](./USPS_SETUP.md) for details

### For International Address Validation (Geoapify)

- **Required**: Geoapify API key
- **Free Tier**: 3,000 requests per day
- **Setup**: See [GEOAPIFY_SETUP.md](./GEOAPIFY_SETUP.md)

**Quick Setup:**

1. Sign up at [https://www.geoapify.com/](https://www.geoapify.com/)
2. Get your API key
3. Add to environment variables:
   ```
   VITE_GEOAPIFY_API_KEY=your_api_key_here
   ```

## Technical Implementation

### Files Created/Modified

#### New Files:

- `src/config/geoapify.ts` - Geoapify configuration
- `src/utils/geoapify-validator.ts` - Geoapify validation utility
- `GEOAPIFY_SETUP.md` - Setup documentation
- `INTERNATIONAL_ADDRESS_VALIDATION.md` - This file

#### Modified Files:

- `src/views/RecipientAdmin.vue`:
  - Added Geoapify import
  - Updated `validateAddressBeforeSave()` to route to correct API
  - Updated `useValidatedAddress()` to handle both result types
  - Updated address confirmation dialog to show correct API name
  - Added `isInternationalValidation` flag

### API Integration

#### USPS API (Existing)

```typescript
interface USPSValidatedAddress {
  address1: string
  address2?: string
  city: string
  state: string
  zipcode: string
  zipPlus4?: string
  deliverable: boolean
  standardized: boolean
  error?: string
}
```

#### Geoapify API (New)

```typescript
interface GeoapifyValidatedAddress {
  address1: string
  address2?: string
  city: string
  state: string
  zipcode: string
  country: string
  countryCode: string
  formatted: string
  deliverable: boolean
  standardized: boolean
  confidence: number // 0-1 scale
  error?: string
}
```

### Confidence Scoring

Geoapify returns a confidence score (0-1):

- **0.8-1.0**: High confidence - exact match
- **0.5-0.8**: Medium confidence - likely correct
- **0.0-0.5**: Low confidence - may be incorrect

The system only suggests corrections for addresses with confidence ≥ 0.5.

## Graceful Degradation

If Geoapify is not configured:

- International addresses can still be saved
- No validation occurs
- No errors shown to user
- Console logs: "Geoapify not configured, skipping international address validation"

This allows the application to work without Geoapify, but with reduced functionality.

## Testing

### Test US Address

1. Add recipient
2. Leave Country field empty
3. Enter: "1600 Pennsylvania Ave NW, Washington, DC 20500"
4. Click Create
5. Should validate with USPS
   Q1. If USPS validates and user didn't provide a country, should we default to the USA

### Test International Address

1. Add recipient
2. Set Country: "Portugal"
3. Enter: "Avenida Diogo Cão, N15 - 2C, 2670-327 Infantado Loures"
4. Click Create
5. Should validate with Geoapify (if configured)

### Test Without Geoapify

1. Don't set VITE_GEOAPIFY_API_KEY
2. Add international recipient
3. Should save without validation
4. Check console for "Geoapify not configured" message

## Monitoring

### Check Geoapify Usage

1. Log in to [Geoapify Dashboard](https://myprojects.geoapify.com/)
2. View API usage statistics
3. Monitor daily request count (limit: 3,000/day)

### Browser Console Logs

- "Validating international address with Geoapify: ..."
- "Geoapify validation result: ..."
- "Skipping USPS validation for international address: ..."

## Benefits

1. **Improved Data Quality**: Standardized international addresses
2. **Reduced Errors**: Catch typos and formatting issues
3. **User Confidence**: Users see validated addresses before saving
4. **Global Support**: Works with 245+ countries
5. **Free**: No cost for up to 3,000 validations per day

## Limitations

1. **Geoapify Required**: International validation requires API key
2. **Daily Limit**: 3,000 requests per day on free tier
3. **Confidence Threshold**: Only suggests corrections for confidence ≥ 0.5
4. **No Offline Mode**: Requires internet connection

## Future Enhancements

Potential improvements:

- Cache validated addresses to reduce API calls
- Add support for address autocomplete
- Implement bulk address validation
- Add address quality scoring
- Support for PO boxes and military addresses

## Support

- **Geoapify Issues**: See [GEOAPIFY_SETUP.md](./GEOAPIFY_SETUP.md)
- **USPS Issues**: See [USPS_SETUP.md](./USPS_SETUP.md)
- **General Questions**: Check browser console for error messages
