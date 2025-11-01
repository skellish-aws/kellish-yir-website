# USPS Address Validation Setup

This project uses the USPS Address Validation API to verify and standardize recipient addresses.

## ✅ Setup Complete!

The USPS Address Validation is now fully configured and operational.

### Current Configuration

- **Lambda Function URL**: `https://4e7oocaot3fhlyg2hlxz4476gq0qnnga.lambda-url.us-east-1.on.aws/`
- **Authentication**: OAuth 2.0 with Consumer Key/Secret (configured in Lambda)
- **CORS**: Enabled for all origins
- **Status**: Deployed and ready to use

## How It Works

1. **Frontend** (`RecipientAdmin.vue`) sends address validation request to the Lambda Function URL
2. **Lambda Function** (`amplify/functions/usps-proxy/handler.ts`) authenticates with USPS using OAuth 2.0
3. **Lambda Function** calls USPS Address Validation API
4. **Lambda Function** returns standardized address with ZIP+4 to frontend
5. **Frontend** updates the form with validated data

## Using Address Validation

In the Recipient Admin interface:

1. Fill in the address fields (address1, city, state, zipcode)
2. Click the **"Validate with USPS"** button
3. The system will:
   - Standardize the address (e.g., "Street" → "ST")
   - Add ZIP+4 code
   - Verify the address is deliverable
   - Update the form with validated data

## Configuration Files

### Lambda Function (Server-Side)

- **Resource**: `amplify/functions/usps-proxy/resource.ts`
- **Handler**: `amplify/functions/usps-proxy/handler.ts`
- **Environment Variables**: Consumer Key and Secret are configured in `resource.ts`

### Frontend (Client-Side)

- **API Client**: `src/utils/usps-api.ts`
- **Config**: `src/config/usps.ts`
- **Component**: `src/views/RecipientAdmin.vue`

## Security Notes

- ✅ Consumer Key/Secret are stored in Lambda environment variables (not in frontend code)
- ✅ Lambda proxy handles CORS and authentication securely
- ✅ Frontend cannot directly access USPS API (prevents credential exposure)
- ⚠️ Never commit credentials to version control

## Updating Credentials

If you need to update the USPS credentials:

1. Edit `amplify/functions/usps-proxy/resource.ts`
2. Update the `USPS_CONSUMER_KEY` and `USPS_CONSUMER_SECRET` values
3. Deploy: `npx ampx sandbox`

## API Documentation

- [USPS Web Tools API Documentation](https://www.usps.com/business/web-tools-apis/)
- [Address Validation API](https://www.usps.com/business/web-tools-apis/address-information-api.htm)

## Troubleshooting

### Address Not Validating

If validation fails:

1. Check browser console for error messages
2. Verify the address is a valid US address
3. Ensure all required fields are filled (address1, city, state)

### Lambda Function Errors

If you see Lambda errors:

1. Check AWS CloudWatch Logs for the Lambda function
2. Verify USPS credentials are correct
3. Ensure the Lambda function has been deployed: `npx ampx sandbox`

### CORS Errors

If you see CORS errors:

1. Verify you're calling the Lambda Function URL (not USPS directly)
2. Check that the Lambda Function URL CORS settings are correct in `amplify/backend.ts`
