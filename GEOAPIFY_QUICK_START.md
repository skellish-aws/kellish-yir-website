# Geoapify Quick Start Guide

## Current Status

International address validation is **NOT configured**. When you try to save an international address (like Portugal), you should now see a **yellow warning banner** in the dialog that says:

> ⚠️ **International address validation not configured.**  
> Address will be saved without validation. To enable validation, set up Geoapify API key.

## To Enable Geoapify Validation

### 1. Get Your Free API Key

1. Go to https://www.geoapify.com/
2. Click **Sign Up** (free tier: 3,000 requests/day)
3. Verify your email
4. Go to your dashboard
5. Copy your API key

### 2. Configure Your Environment

Create or edit `.env.local` in the project root:

```bash
VITE_GEOAPIFY_API_KEY=your_actual_api_key_here
```

**Important:** Make sure the key starts with `VITE_` so Vite can access it!

### 3. Restart Dev Server

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

### 4. Test It Out

1. Open the app in your browser
2. Add or edit a recipient
3. Enter an international address:
   - **Address 1:** Avenida Diogo Cão
   - **Address 2:** N15 - 2C
   - **City:** Loures
   - **Country:** Portugal
4. Click **Create** or **Update**

**Expected Behavior:**

- ✅ **If Geoapify is configured:** You'll see a validation dialog comparing your address with Geoapify's standardized version
- ⚠️ **If Geoapify is NOT configured:** Yellow warning banner appears, address saves without validation

## Console Logs to Check

Open browser DevTools (F12) → Console tab. You should see:

### If NOT Configured:

```
Detected international address, country: Portugal
⚠️ Geoapify not configured! Set VITE_GEOAPIFY_API_KEY environment variable.
Skipping international address validation
```

### If Configured:

```
Detected international address, country: Portugal
Using Geoapify to validate international address
Validating international address with Geoapify: Avenida Diogo Cão, N15 - 2C, Loures, Portugal
Geoapify validation result: { address1: "...", city: "...", confidence: 0.8, ... }
```

## Troubleshooting

### Warning banner doesn't appear?

- Make sure you entered a country (not USA/United States/US)
- Refresh the page

### Warning banner appears even after setting API key?

1. Check `.env.local` file exists in project root
2. Verify the key name is `VITE_GEOAPIFY_API_KEY` (with `VITE_` prefix)
3. Restart the dev server
4. Hard refresh the browser (Cmd+Shift+R or Ctrl+Shift+R)

### Validation fails with error?

- Check browser console for detailed error messages
- Verify API key is correct
- Check if you've exceeded the 3,000 requests/day limit

## What Gets Validated

**US Addresses:**

- Uses USPS API (already configured)
- Validates address format, city, state, ZIP code
- Returns ZIP+4 if available

**International Addresses:**

- Uses Geoapify API (requires setup)
- Validates address exists and is deliverable
- Standardizes format based on country conventions
- Confidence score: 0-1 (higher is better)
- Only shows dialog if confidence ≥ 0.5 and address differs

## Cost

- **USPS:** Free (government API)
- **Geoapify:** Free tier includes 3,000 requests/day
  - Perfect for manual data entry
  - For bulk imports (100+ addresses), consider paid plan

## Next Steps

1. **Right now:** Set up Geoapify following steps above
2. **Test:** Try the Portugal address again
3. **Verify:** Check console logs to confirm it's working
4. **Import:** When you're ready, the CSV import will queue all addresses for validation via Lambda + SQS
