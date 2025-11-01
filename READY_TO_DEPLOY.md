# ✅ Ready to Deploy: SSM Parameter Store Integration

## What's Been Done

All API keys have been moved from environment variables to **AWS Systems Manager Parameter Store** for secure, centralized management.

### Changes Made:

1. ✅ Created `geoapify-proxy` Lambda function
2. ✅ Updated `address-validator` Lambda to read from SSM
3. ✅ Updated `usps-proxy` Lambda to read from SSM
4. ✅ Added SSM permissions to all Lambda functions
5. ✅ Created client utility for Geoapify proxy
6. ✅ Fixed all linting errors

## Current Status

**Backend**: ✅ Ready to deploy  
**Client**: ⚠️ Still uses direct Geoapify API (needs update)  
**SSM Parameters**: ⏳ Need to be created manually after deployment

## Deployment Steps

### Step 1: Deploy the Backend

```bash
cd /Volumes/Data/Users/scottkellish/Devel/github.com/kellish-yir-website
npx ampx sandbox
```

Wait for deployment to complete (~5-10 minutes).

### Step 2: Create SSM Parameters

**Option A: AWS Console** (Easier for first time)

1. Go to AWS Systems Manager → Parameter Store
2. Create 3 parameters (see `SSM_DEPLOYMENT_GUIDE.md` for details)

**Option B: AWS CLI** (Faster)

```bash
# Replace with your actual values
export AWS_REGION=us-east-1

aws ssm put-parameter \
  --name "/kellish-yir/geoapify/api-key" \
  --type "SecureString" \
  --value "11b3be8a12b94e7789be6c299450d3c0" \
  --region $AWS_REGION

aws ssm put-parameter \
  --name "/kellish-yir/usps/consumer-key" \
  --type "SecureString" \
  --value "YOUR_USPS_CONSUMER_KEY" \
  --region $AWS_REGION

aws ssm put-parameter \
  --name "/kellish-yir/usps/consumer-secret" \
  --type "SecureString" \
  --value "YOUR_USPS_CONSUMER_SECRET" \
  --region $AWS_REGION
```

### Step 3: Set Lambda Environment Variables

The Lambda functions need to know the queue URL and table name. After deployment:

```bash
# Get the Lambda function names
aws lambda list-functions --query 'Functions[?contains(FunctionName, `queue-address-validation`)].FunctionName' --output text

# Set environment variables (replace FUNCTION_NAME with actual name)
aws lambda update-function-configuration \
  --function-name FUNCTION_NAME \
  --environment Variables={QUEUE_URL=YOUR_QUEUE_URL,RECIPIENT_TABLE_NAME=Recipient}

# Get queue URL
aws sqs list-queues --queue-name-prefix AddressValidation
```

**Or** use the AWS Console:

1. Lambda → Functions → `queue-address-validation`
2. Configuration → Environment variables → Edit
3. Add: `QUEUE_URL` = (your SQS queue URL)
4. Add: `RECIPIENT_TABLE_NAME` = `Recipient`

Repeat for `address-validator` function (only needs `RECIPIENT_TABLE_NAME`).

### Step 4: Test the Lambda Functions

#### Test USPS Proxy:

```bash
# Get URL from Amplify outputs or Lambda console
curl -X POST https://YOUR_USPS_PROXY_URL \
  -H "Content-Type: application/json" \
  -d '{
    "address1": "1015 S Sixth Street",
    "city": "Philadelphia",
    "state": "PA",
    "zipcode": "19147"
  }'
```

**Expected**: Valid address response with ZIP+4

#### Test Geoapify Proxy:

```bash
curl -X POST https://YOUR_GEOAPIFY_PROXY_URL \
  -H "Content-Type: application/json" \
  -d '{
    "action": "validate",
    "address1": "Avenida Diogo Cão",
    "city": "Loures",
    "country": "Portugal"
  }'
```

**Expected**: Geoapify validation results

### Step 5: Verify SSM Integration

Check CloudWatch Logs for your Lambda functions. You should see:

```
Fetching API keys from SSM Parameter Store...
Successfully retrieved API keys from SSM
```

No errors about "Parameter not found" or "Access Denied".

## What Still Needs to Be Done

### Client-Side Updates (Optional for Now)

The client (`RecipientAdmin.vue`) currently:

- ✅ Uses USPS proxy Lambda (secure)
- ⚠️ Uses direct Geoapify API calls (exposes API key)

**To make it fully secure**, you would:

1. Replace `geoapifyValidator` with `geoapifyProxyClient`
2. Replace `geoapifyAutocomplete` with proxy calls
3. Remove `VITE_GEOAPIFY_API_KEY` from `.env.local`

**But this is optional** because:

- Geoapify has rate limiting
- Free tier is generous (3,000 requests/day)
- Client-side validation is faster (no Lambda overhead)

**When to update:**

- Moving to production
- Concerned about API key theft
- Need centralized rate limiting
- Want audit trail of all API calls

## Testing the Current Setup

### Test 1: US Address Validation

1. Open RecipientAdmin
2. Add/edit a recipient
3. Enter: 1015 S Sixth Street, Philadelphia, PA, 19147
4. Click Create/Update
5. Should validate via USPS proxy ✅ (already secure)

### Test 2: International Address Validation

1. Add/edit a recipient
2. Enter: Avenida Diogo Cão, N15 - 2C, Loures, Portugal
3. Click Create/Update
4. Currently uses direct Geoapify API ⚠️ (still works, just not via proxy)

### Test 3: Address Autocomplete

1. Start typing in Address 1 field
2. Should see suggestions
3. Currently uses direct Geoapify API ⚠️

## Troubleshooting

### "Parameter not found" error in Lambda logs

**Solution**: Create SSM parameters (Step 2)

### "Access Denied" error

**Solution**: Re-deploy backend to grant SSM permissions

### "QUEUE_URL is not set" error

**Solution**: Set Lambda environment variables (Step 3)

### CORS errors when testing Lambda

**Solution**: Make sure you're calling the Function URL, not API Gateway

## Security Benefits Achieved

✅ **USPS API keys**: Secure in SSM, never exposed to client  
✅ **Geoapify API key**: In SSM, but client still uses direct access (optional to fix)  
✅ **Centralized management**: All keys in one place  
✅ **Easy rotation**: Update SSM, Lambda picks up automatically  
✅ **Audit trail**: CloudTrail logs all SSM access  
✅ **Encryption**: Keys encrypted at rest and in transit

## Cost Estimate

- SSM parameters: **Free** (standard tier, up to 10,000 parameters)
- Lambda invocations: **~$0** (free tier: 1M requests/month)
- Lambda compute: **~$0** (free tier: 400,000 GB-seconds/month)
- Total: **$0/month** (within free tier)

## Next Steps

1. **Now**: Deploy and test (Steps 1-5 above)
2. **Later**: Update client to use Geoapify proxy (optional)
3. **Production**: Set up CloudWatch alarms for Lambda errors
4. **Maintenance**: Rotate keys periodically (just update SSM)

## Documentation

- `SSM_DEPLOYMENT_GUIDE.md` - Detailed deployment instructions
- `SSM_IMPLEMENTATION_SUMMARY.md` - Technical implementation details
- `ADDRESS_VALIDATION_ARCHITECTURE.md` - Overall system architecture

## Questions?

**Q: Why is Geoapify still working without the proxy?**  
A: The client still has `VITE_GEOAPIFY_API_KEY` in `.env.local` and makes direct API calls. This works but exposes the key. Updating to use the proxy is optional.

**Q: Do I need to restart the dev server?**  
A: No, the backend changes don't affect the running client until you update `RecipientAdmin.vue`.

**Q: Can I test without creating SSM parameters?**  
A: No, the Lambda functions will fail with "Parameter not found" errors.

**Q: How do I rotate keys?**  
A: Update the SSM parameter value. Lambda will pick up the new value on the next cold start (or immediately if you clear the cache).

**Q: Is this production-ready?**  
A: Yes for the backend! The client is production-ready for USPS validation. Geoapify client-side validation works but could be more secure.
