# Geoapify International Address Validation Setup

This guide explains how to set up Geoapify for international address validation in your application.

## What is Geoapify?

Geoapify is a geocoding and address validation service that supports international addresses worldwide. The free tier includes:

- **3,000 requests per day**
- No credit card required
- Worldwide coverage
- **Address autocomplete** as you type
- **Address validation** after entry

## Setup Instructions

### 1. Sign Up for Geoapify

1. Go to [https://www.geoapify.com/](https://www.geoapify.com/)
2. Click "Sign Up" or "Get Started"
3. Create a free account (no credit card required)
4. Verify your email address

### 2. Get Your API Key

1. Log in to your Geoapify account
2. Go to the Dashboard
3. Navigate to "API Keys" or "Projects"
4. Copy your API key (it will look like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)

### 3. Configure the Application

#### For Local Development:

Create a `.env.local` file in the project root (if it doesn't exist):

```bash
# Geoapify API Key for international address validation
VITE_GEOAPIFY_API_KEY=your_api_key_here
```

Replace `your_api_key_here` with your actual API key.

#### For Production (AWS Amplify):

1. Go to your Amplify Console
2. Select your app
3. Go to "Environment variables"
4. Add a new environment variable:
   - **Key**: `VITE_GEOAPIFY_API_KEY`
   - **Value**: Your Geoapify API key
5. Redeploy your application

### 4. Verify Setup

1. Restart your development server (if running)
2. Open the Recipient Admin page
3. Try adding a recipient with an international address (e.g., Portugal, UK, Canada)
4. **Test Autocomplete**:
   - Start typing in the "Address 1" field (e.g., "Avenida Diogo")
   - You should see address suggestions appear as you type
   - Select a suggestion to auto-fill all address fields
5. **Test Validation**:
   - Fill in the address fields manually and set the Country field
   - Click "Create" or "Update"
   - The system should validate the international address using Geoapify

## How It Works

### Address Autocomplete (New!)

As you type in the **Address 1** field:

1. After 3+ characters, Geoapify suggests matching addresses
2. Suggestions appear in a dropdown (up to 5 results)
3. Select a suggestion to **auto-fill all address fields**:
   - Address 1
   - Address 2 (if applicable)
   - City
   - State/Province
   - ZIP/Postal Code
   - Country
4. If you specify a Country first, suggestions are filtered to that country

### Address Validation Flow

1. **US Addresses** (country is empty, "USA", "US", or "United States"):

   - Validated using USPS API
   - Provides ZIP+4 and standardized format
   - Free (USPS API)

2. **International Addresses** (any other country):
   - Validated using Geoapify API
   - Provides standardized international format
   - Free tier: 3,000 requests/day

### What Happens During Validation

When you save a recipient:

1. The system checks the `country` field
2. If international, it sends the address to Geoapify
3. Geoapify returns:
   - Standardized address format
   - Confidence score (0-1)
   - Country code
   - Geocoding information
4. If the validated address differs from what you entered:
   - A dialog appears showing both versions
   - You can choose to use the validated address or keep yours
5. The address is saved to the database

### Confidence Levels

Geoapify returns a confidence score:

- **0.8-1.0**: High confidence - exact match found
- **0.5-0.8**: Medium confidence - likely correct
- **0.0-0.5**: Low confidence - address may be incorrect

The system only suggests corrections for addresses with confidence ≥ 0.5.

## Monitoring Usage

### Check Your Usage

1. Log in to [Geoapify Dashboard](https://myprojects.geoapify.com/)
2. View your API usage statistics
3. Monitor daily request count

### Free Tier Limits

- **3,000 requests per day**
- Resets daily at midnight UTC
- No credit card required
- No automatic charges

### If You Exceed Limits

If you exceed 3,000 requests/day:

- Validation will fail gracefully
- Users can still save addresses (without validation)
- Consider upgrading to a paid plan if needed

## Troubleshooting

### Validation Not Working

1. **Check API Key**:

   ```bash
   # In your terminal
   echo $VITE_GEOAPIFY_API_KEY
   ```

   Should display your API key

2. **Check Browser Console**:

   - Open DevTools (F12)
   - Look for Geoapify-related errors
   - Check for "Geoapify not configured" messages

3. **Verify Country Field**:
   - Make sure the Country field is filled in
   - Use full country names (e.g., "Portugal", not "PT")

### Common Issues

**Issue**: "Geoapify API key not configured"

- **Solution**: Set the `VITE_GEOAPIFY_API_KEY` environment variable

**Issue**: "Address not found or could not be validated"

- **Solution**: The address may be too vague or incorrect. Try adding more details.

**Issue**: API returns 401 Unauthorized

- **Solution**: Your API key may be invalid. Check it in the Geoapify dashboard.

**Issue**: API returns 429 Too Many Requests

- **Solution**: You've exceeded the daily limit. Wait until midnight UTC or upgrade your plan.

## Optional: Upgrade Plans

If you need more than 3,000 requests/day, Geoapify offers paid plans:

- **Starter**: $49/month - 100,000 requests/month
- **Professional**: $149/month - 500,000 requests/month
- **Enterprise**: Custom pricing

For a mailing list of ~114 recipients, the free tier should be more than sufficient.

## Security Notes

- Never commit your API key to version control
- Add `.env.local` to your `.gitignore`
- Rotate your API key periodically
- Use environment variables for all deployments

## Support

- **Geoapify Documentation**: [https://apidocs.geoapify.com/](https://apidocs.geoapify.com/)
- **Geoapify Support**: [https://www.geoapify.com/support](https://www.geoapify.com/support)
