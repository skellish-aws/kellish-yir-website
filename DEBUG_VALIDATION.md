# Address Validation Debugging Guide

## ✅ Verified Working

1. ✅ **SSM Parameter exists**: `/kellish-yir/googlemaps/api-key`
2. ✅ **Lambda Proxy URL configured**: `https://2abauf4y3lfgjs6g5f7sjgotzq0onmzq.lambda-url.us-east-1.on.aws/`
3. ✅ **Lambda function responding**: Tested with curl - returns valid Google Maps response
4. ✅ **amplify_outputs.json has proxy URL**: `googlemapsProxyUrl` is present

## Debugging Steps

### Step 1: Check Browser Console

Open your browser's developer console (F12) and look for:

- `[Google Maps Debug]` logs showing the validation request
- `[Google Maps Error]` logs showing any errors
- Network tab showing the request to the Lambda URL

**Common issues:**
- CORS errors → Check Lambda CORS headers
- 404 errors → Proxy URL incorrect
- 500 errors → Check Lambda logs

### Step 2: Verify Frontend Configuration

Check that the frontend is loading the proxy URL correctly:

```javascript
// In browser console
import('../../amplify_outputs.json').then(m => console.log(m.default.custom))
```

Should show:
```json
{
  "googlemapsProxyUrl": "https://2abauf4y3lfgjs6g5f7sjgotzq0onmzq.lambda-url.us-east-1.on.aws/",
  "queueValidationUrl": "https://..."
}
```

### Step 3: Test Direct API Call

Test the Lambda proxy directly from your browser console:

```javascript
fetch('https://2abauf4y3lfgjs6g5f7sjgotzq0onmzq.lambda-url.us-east-1.on.aws/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    address: {
      address1: '1600 Amphitheatre Parkway',
      city: 'Mountain View',
      state: 'CA',
      zipcode: '94043',
      country: 'United States'
    }
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

### Step 4: Check Lambda Logs

```bash
AWS_PROFILE=softsys aws logs tail /aws/lambda/amplify-kellishyirwebsite-googlemapsproxylambda68E-OKhxrSRhBBY9 \
  --since 1h \
  --region us-east-1 \
  --follow
```

Look for:
- `[Google Maps Error]` messages
- API key retrieval errors
- Google Maps API errors

### Step 5: Verify API Key

The API key must:
1. ✅ Exist in SSM Parameter Store
2. ✅ Be a valid Google Maps API key (not placeholder)
3. ✅ Be associated with a project where Address Validation API is enabled
4. ✅ Have Address Validation API enabled in the key restrictions

Check API key:
```bash
# Check if it's a placeholder
AWS_PROFILE=softsys aws ssm get-parameter \
  --name "/kellish-yir/googlemaps/api-key" \
  --with-decryption \
  --region us-east-1 \
  --query 'Parameter.Value' \
  --output text | grep -i "placeholder\|replace" && echo "❌ API key is still a placeholder!"
```

## Common Issues & Solutions

### Issue 1: "API not enabled in project"
**Symptom**: Error mentions project ID (e.g., `451043453717`)

**Solution**: 
1. Go to Google Cloud Console
2. Select the project mentioned in the error
3. Enable Address Validation API
4. Wait 2-5 minutes for propagation

### Issue 2: "API key not found"
**Symptom**: Lambda logs show SSM parameter errors

**Solution**:
```bash
AWS_PROFILE=softsys aws ssm put-parameter \
  --name "/kellish-yir/googlemaps/api-key" \
  --value "YOUR_REAL_API_KEY" \
  --type "SecureString" \
  --overwrite \
  --region us-east-1
```

### Issue 3: CORS Errors
**Symptom**: Browser console shows CORS preflight errors

**Solution**: Check Lambda handler CORS headers are correct (should be `*` for `Access-Control-Allow-Origin`)

### Issue 4: Network Errors
**Symptom**: "Failed to fetch" or network errors

**Solution**: 
- Check Lambda URL is correct in `amplify_outputs.json`
- Verify Lambda Function URL is active
- Check internet connectivity

## Testing Commands

### Test Lambda Proxy Directly
```bash
curl -X POST "https://2abauf4y3lfgjs6g5f7sjgotzq0onmzq.lambda-url.us-east-1.on.aws/" \
  -H "Content-Type: application/json" \
  -d '{
    "address": {
      "address1": "1600 Amphitheatre Parkway",
      "city": "Mountain View",
      "state": "CA",
      "zipcode": "94043",
      "country": "United States"
    }
  }'
```

### Test with German Address
```bash
curl -X POST "https://2abauf4y3lfgjs6g5f7sjgotzq0onmzq.lambda-url.us-east-1.on.aws/" \
  -H "Content-Type: application/json" \
  -d '{
    "address": {
      "address1": "Johanna-Kirchner-Str. 26",
      "city": "Karlsruhe",
      "zipcode": "76189",
      "country": "Germany"
    }
  }'
```

## Next Steps

1. Open browser console and check for errors when validating an address
2. Run the browser console test (Step 3) to see if fetch works from the browser
3. Check Lambda logs for any errors during validation attempts
4. Verify the API key is not a placeholder value

