# AWS Systems Manager Parameter Store Setup Guide

## Overview

All API keys are now stored securely in AWS Systems Manager Parameter Store instead of environment variables or client-side code. This provides:

- ✅ **Security**: Keys never exposed to clients
- ✅ **Centralized Management**: Single source of truth
- ✅ **Easy Rotation**: Update keys without redeploying code
- ✅ **Audit Trail**: Track who accessed what and when

## Step 1: Deploy the Backend

First, deploy the updated backend with SSM integration:

```bash
npx ampx sandbox
```

Wait for deployment to complete. This will:

- Create 3 Lambda functions (`address-validator`, `usps-proxy`, `geoapify-proxy`)
- Create an SQS queue for async validation
- Set up IAM permissions for SSM access
- Export Lambda Function URLs

## Step 2: Create SSM Parameters

### Option A: Via AWS Console (Recommended for First Time)

1. Open **AWS Systems Manager** console
2. Go to **Parameter Store** (left sidebar)
3. Click **Create parameter**

Create these 3 parameters:

#### Parameter 1: Geoapify API Key

- **Name**: `/kellish-yir/geoapify/api-key`
- **Type**: `SecureString`
- **KMS key**: Use default
- **Value**: `11b3be8a12b94e7789be6c299450d3c0`
- Click **Create parameter**

#### Parameter 2: USPS Consumer Key

- **Name**: `/kellish-yir/usps/consumer-key`
- **Type**: `SecureString`
- **KMS key**: Use default
- **Value**: Your USPS consumer key
- Click **Create parameter**

#### Parameter 3: USPS Consumer Secret

- **Name**: `/kellish-yir/usps/consumer-secret`
- **Type**: `SecureString`
- **KMS key**: Use default
- **Value**: Your USPS consumer secret
- Click **Create parameter**

### Option B: Via AWS CLI (Faster for Automation)

```bash
# Set your region
export AWS_REGION=us-east-1

# Create Geoapify API key parameter
aws ssm put-parameter \
  --name "/kellish-yir/geoapify/api-key" \
  --type "SecureString" \
  --value "11b3be8a12b94e7789be6c299450d3c0" \
  --description "Geoapify API key for international address validation" \
  --region $AWS_REGION

# Create USPS consumer key parameter
aws ssm put-parameter \
  --name "/kellish-yir/usps/consumer-key" \
  --type "SecureString" \
  --value "YOUR_USPS_CONSUMER_KEY_HERE" \
  --description "USPS OAuth2 consumer key" \
  --region $AWS_REGION

# Create USPS consumer secret parameter
aws ssm put-parameter \
  --name "/kellish-yir/usps/consumer-secret" \
  --type "SecureString" \
  --value "YOUR_USPS_CONSUMER_SECRET_HERE" \
  --description "USPS OAuth2 consumer secret" \
  --region $AWS_REGION
```

## Step 3: Verify Parameters

```bash
# List all parameters
aws ssm describe-parameters \
  --parameter-filters "Key=Name,Option=BeginsWith,Values=/kellish-yir/" \
  --region $AWS_REGION

# Get a parameter value (for testing)
aws ssm get-parameter \
  --name "/kellish-yir/geoapify/api-key" \
  --with-decryption \
  --region $AWS_REGION
```

You should see all 3 parameters listed.

## Step 4: Test Lambda Functions

### Test USPS Proxy

```bash
# Get the USPS proxy Lambda URL from Amplify outputs
# Look for something like: https://xxxxx.lambda-url.us-east-1.on.aws

curl -X POST https://YOUR_USPS_PROXY_URL \
  -H "Content-Type: application/json" \
  -d '{
    "address1": "1015 S Sixth Street",
    "city": "Philadelphia",
    "state": "PA",
    "zipcode": "19147"
  }'
```

Expected response:

```json
{
  "address1": "1015 S 6TH ST",
  "city": "PHILADELPHIA",
  "state": "PA",
  "zipcode": "19147",
  "zipPlus4": "4011",
  "deliverable": true,
  "standardized": true
}
```

### Test Geoapify Proxy

```bash
# Get the Geoapify proxy Lambda URL from Amplify outputs

curl -X POST https://YOUR_GEOAPIFY_PROXY_URL \
  -H "Content-Type: application/json" \
  -d '{
    "action": "validate",
    "address1": "Avenida Diogo Cão",
    "address2": "N15 - 2C",
    "city": "Loures",
    "country": "Portugal"
  }'
```

Expected response:

```json
{
  "results": [
    {
      "formatted": "Avenida Diogo Cão, 2670 Loures, Portugal",
      "city": "Loures",
      "country": "Portugal",
      ...
    }
  ]
}
```

## Step 5: Update Client Configuration

The client now needs the Lambda URLs instead of API keys.

### Option A: Use Amplify Outputs (Recommended)

After deployment, Amplify automatically exports the Lambda URLs. They're available at:

```
amplify_outputs.json
```

The client will automatically use these URLs.

### Option B: Manual Configuration

If you need to manually set the URLs, create/update `.env.local`:

```bash
# Remove these (no longer needed on client)
# VITE_GEOAPIFY_API_KEY=...

# Add Lambda URLs
VITE_GEOAPIFY_PROXY_URL=https://your-geoapify-lambda-url.amazonaws.com
```

## Step 6: Clean Up Old Environment Variables

1. Remove API keys from `.env.local`:

   ```bash
   # Open .env.local and remove:
   VITE_GEOAPIFY_API_KEY=11b3be8a12b94e7789be6c299450d3c0
   ```

2. Restart dev server:
   ```bash
   npm run dev
   ```

## Step 7: Verify Everything Works

1. **Test US Address Validation:**

   - Open RecipientAdmin
   - Add/edit a recipient
   - Enter a US address
   - Click Create/Update
   - Should validate via USPS proxy Lambda

2. **Test International Address Validation:**

   - Add/edit a recipient
   - Enter an international address (e.g., Portugal)
   - Click Create/Update
   - Should validate via Geoapify proxy Lambda

3. **Test Autocomplete:**
   - In Address 1 field, type a partial address
   - Should see suggestions (via Geoapify proxy)

## Troubleshooting

### Issue: Lambda returns "Parameter not found"

**Cause**: SSM parameters not created or wrong region

**Solution**:

1. Verify region matches: `echo $AWS_REGION`
2. List parameters: `aws ssm describe-parameters`
3. Create missing parameters (see Step 2)

### Issue: Lambda returns "Access Denied"

**Cause**: Lambda doesn't have permission to read SSM parameters

**Solution**:

1. Re-deploy: `npx ampx sandbox`
2. Check IAM role has `ssm:GetParameter` permission

### Issue: "Geoapify proxy not configured"

**Cause**: Lambda URL not set in client

**Solution**:

1. Check `amplify_outputs.json` for `geoapifyProxyUrl`
2. Set `VITE_GEOAPIFY_PROXY_URL` in `.env.local`
3. Restart dev server

### Issue: CORS errors

**Cause**: Lambda CORS headers not configured

**Solution**:

- CORS is configured in Lambda handlers
- Make sure you're calling the Function URL, not API Gateway

## Security Best Practices

### 1. Use Different Keys Per Environment

```bash
# Development
/kellish-yir/dev/geoapify/api-key

# Production
/kellish-yir/prod/geoapify/api-key
```

### 2. Rotate Keys Regularly

```bash
# Update a parameter
aws ssm put-parameter \
  --name "/kellish-yir/geoapify/api-key" \
  --type "SecureString" \
  --value "NEW_API_KEY_HERE" \
  --overwrite \
  --region $AWS_REGION

# Lambda will pick up new value on next cold start
# Or force refresh by updating Lambda environment variable
```

### 3. Monitor Access

```bash
# View parameter access logs in CloudTrail
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=ResourceName,AttributeValue=/kellish-yir/geoapify/api-key \
  --region $AWS_REGION
```

### 4. Restrict Access

Only Lambda execution roles should have access to these parameters:

- `amplify-kellish-yir-addressValidator-role`
- `amplify-kellish-yir-uspsProxy-role`
- `amplify-kellish-yir-geoapifyProxy-role`

## Cost

**SSM Parameter Store:**

- Standard parameters: **Free** (up to 10,000 parameters)
- Advanced parameters: $0.05 per parameter per month

**KMS Encryption:**

- Using default AWS-managed key: **Free**
- Using customer-managed CMK: $1/month + $0.03 per 10,000 API calls

**Total estimated cost:** ~$0/month (using free tier)

## Next Steps

1. ✅ Deploy backend
2. ✅ Create SSM parameters
3. ✅ Test Lambda functions
4. ✅ Update client configuration
5. ✅ Verify end-to-end functionality
6. 🚀 Deploy to production
7. 📊 Set up CloudWatch alarms for Lambda errors
8. 🔄 Schedule key rotation (optional)

## Resources

- [AWS Systems Manager Parameter Store](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html)
- [AWS Lambda Function URLs](https://docs.aws.amazon.com/lambda/latest/dg/lambda-urls.html)
- [Amplify Gen 2 Backend](https://docs.amplify.aws/gen2/)
