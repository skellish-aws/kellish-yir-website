# Debugging Guide

This guide covers how to debug the application, with a focus on AddressZen integration.

## Quick Debug Checklist

### 1. Check Browser Console
Open Developer Tools (F12 or Cmd+Option+I) and look for:
- `[AddressZen Debug]` logs - Shows API call details
- Error messages in red
- Network tab for failed API calls

### 2. Verify Configuration
```bash
# Check if amplify_outputs.json exists and has AddressZen URL
cat amplify_outputs.json | jq '.custom.addresszenProxyUrl'

# Check SSM parameter exists (replace with your AWS region)
aws ssm get-parameter --name "/kellish-yir/addresszen/api-key" --region us-east-1 --with-decryption
```

### 3. Check Lambda Logs
```bash
# View recent Lambda logs (requires AWS CLI configured)
aws logs tail /aws/lambda/addresszen-proxy-<stack-id> --follow --region us-east-1
```

## Detailed Debugging Steps

## Frontend Debugging

### Browser Console
1. **Open Developer Tools**
   - Chrome/Edge: `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
   - Firefox: `F12` or `Ctrl+Shift+K` (Windows) / `Cmd+Option+K` (Mac)
   - Safari: `Cmd+Option+I` (need to enable Developer menu first)

2. **Check Console Tab**
   - Look for `[AddressZen Debug]` prefixed messages
   - Look for red error messages
   - AddressZen logs show:
     - Autocomplete requests/responses
     - Resolve requests/responses
     - Response structure details

3. **Check Network Tab**
   - Filter by "addresszen" or "proxy"
   - Look for failed requests (red)
   - Click on requests to see:
     - Request payload
     - Response body
     - Status codes
     - CORS errors

4. **Verify amplify_outputs.json**
   - Open: `amplify_outputs.json`
   - Check: `custom.addresszenProxyUrl` exists and has a URL
   - If missing, backend needs to be deployed

### Vue DevTools (Optional)
1. Install Vue DevTools browser extension
2. Inspect component state
3. Check `RecipientAdmin.vue` component data:
   - `form.value` - Current form data
   - `addressValidationStatus` - Validation status
   - `isInternationalValidation` - Whether using international validation

## Backend Debugging

### Lambda Function Logs

#### View Logs via AWS Console
1. Go to AWS Console → CloudWatch → Log Groups
2. Find: `/aws/lambda/addresszen-proxy-<your-stack-id>`
3. Click latest log stream
4. Look for `[AddressZen Debug]` messages

#### View Logs via CLI
```bash
# List log groups
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/addresszen" --region us-east-1

# Tail logs (replace with actual log group name)
aws logs tail /aws/lambda/addresszen-proxy-YOUR-STACK-ID --follow --region us-east-1

# Get recent logs (last 10 minutes)
aws logs tail /aws/lambda/addresszen-proxy-YOUR-STACK-ID --since 10m --region us-east-1
```

#### Local Lambda Testing (Sandbox)
```bash
# If using Amplify sandbox, logs appear in terminal
npx ampx sandbox
# Look for Lambda invocation logs in the sandbox output
```

### SSM Parameter Debugging

#### Check if Parameter Exists
```bash
aws ssm get-parameter --name "/kellish-yir/addresszen/api-key" --region us-east-1
```

#### Check Parameter Value (without decryption - won't show value but confirms it exists)
```bash
aws ssm get-parameter --name "/kellish-yir/addresszen/api-key" --region us-east-1 --query 'Parameter.Name'
```

#### Update Parameter (if needed)
```bash
aws ssm put-parameter \
  --name "/kellish-yir/addresszen/api-key" \
  --type "String" \
  --value "ak_your-api-key-here" \
  --overwrite \
  --region us-east-1
```

#### Check Lambda IAM Permissions
```bash
# Check if Lambda has SSM read permission
# Go to AWS Console → Lambda → addresszen-proxy function → Configuration → Permissions
# Verify it can access SSM parameter: /kellish-yir/addresszen/api-key
```

## AddressZen-Specific Debugging

### Test AddressZen Proxy Directly

#### Test Autocomplete
```bash
# Get proxy URL from amplify_outputs.json
PROXY_URL=$(cat amplify_outputs.json | jq -r '.custom.addresszenProxyUrl')

# Test autocomplete
curl -X POST "$PROXY_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "autocomplete",
    "query": "26 Lena St, Karlsruhe, Germany"
  }' | jq .
```

#### Test Validate (US Address)
```bash
PROXY_URL=$(cat amplify_outputs.json | jq -r '.custom.addresszenProxyUrl')

curl -X POST "$PROXY_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "validate",
    "address": {
      "address1": "1600 Pennsylvania Avenue NW",
      "city": "Washington",
      "state": "DC",
      "zipcode": "20500"
    }
  }' | jq .
```

#### Test Resolve
```bash
PROXY_URL=$(cat amplify_outputs.json | jq -r '.custom.addresszenProxyUrl')

# First get a place_id from autocomplete, then:
curl -X POST "$PROXY_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "resolve",
    "placeId": "your-place-id-from-autocomplete"
  }' | jq .
```

### AddressZen API Error Codes

Check console/logs for these error codes:

| HTTP Code | API Code | Meaning | Solution |
|-----------|----------|---------|----------|
| 401 | 4010 | Invalid API key | Check SSM parameter value |
| 401 | 4011 | URL not whitelisted | Only needed for client-side, not Lambda proxy |
| 402 | 4020 | Balance depleted | Purchase more lookups in AddressZen dashboard |
| 402 | 4021 | Daily limit reached | Wait for reset or increase limit |
| 400 | 4000-4009 | Bad request | Check request format |
| 404 | 4040-4046 | Not found | Address not in database |
| 500 | 5000-5002 | Server error | Contact AddressZen support |
| 503 | - | Rate limit | Slow down requests (<30/second) |

### Common Issues

#### 1. "AddressZen not configured" Error
**Symptoms:** Console shows "AddressZen not configured. Lambda proxy URL not found"

**Debug Steps:**
1. Check `amplify_outputs.json` exists:
   ```bash
   ls -la amplify_outputs.json
   ```

2. Check if `addresszenProxyUrl` exists:
   ```bash
   cat amplify_outputs.json | jq '.custom.addresszenProxyUrl'
   ```

3. If missing, deploy backend:
   ```bash
   npx ampx sandbox
   ```

4. Check browser console for:
   ```
   ⚠️ AddressZen proxy URL not found in amplify_outputs.json
   ```

#### 2. "No suggestions found" Error
**Symptoms:** Autocomplete returns empty array

**Debug Steps:**
1. Check browser console for `[AddressZen Debug]` logs
2. Check response structure in Network tab
3. Verify query format is correct
4. Check Lambda logs for API errors

**Common Causes:**
- Query too specific or incorrect format
- Address not in AddressZen database
- API response structure changed

#### 3. API Key Errors (401)
**Symptoms:** "Invalid AddressZen API key" or "Failed to retrieve API key"

**Debug Steps:**
1. Verify SSM parameter exists:
   ```bash
   aws ssm get-parameter --name "/kellish-yir/addresszen/api-key" --region us-east-1
   ```

2. Check Lambda has SSM read permission
3. Check API key format starts with `ak_`
4. Verify API key in AddressZen dashboard is active

#### 4. Balance Depleted (402)
**Symptoms:** "AddressZen API key balance depleted"

**Debug Steps:**
1. Check AddressZen dashboard for balance
2. Purchase more lookups if needed
3. Check daily limits in API key settings

#### 5. CORS Errors
**Symptoms:** Network tab shows CORS errors

**Debug Steps:**
1. Check Lambda handler includes CORS headers
2. Verify Function URL allows CORS
3. Check browser console for CORS error details

**Note:** CORS should be handled in Lambda code (already implemented)

## Debugging Workflow

### Step-by-Step Debug Process

1. **Reproduce the Issue**
   - Try to validate an address (US or international)
   - Note the exact error message
   - Note the address that failed

2. **Check Browser Console**
   - Open Developer Tools → Console
   - Look for `[AddressZen Debug]` messages
   - Look for error messages
   - Screenshot or copy console output

3. **Check Network Tab**
   - Filter by "proxy" or "addresszen"
   - Click on the failed request
   - Check:
     - Request payload (Request tab)
     - Response body (Response tab)
     - Status code
     - Headers

4. **Check Lambda Logs**
   - Go to CloudWatch or use CLI
   - Look for `[AddressZen Debug]` messages
   - Check for error stack traces
   - Verify API key retrieval worked

5. **Test API Directly**
   - Use curl commands above
   - Verify API key works
   - Check response format

6. **Check Configuration**
   - Verify `amplify_outputs.json` has proxy URL
   - Verify SSM parameter exists and has correct value
   - Verify Lambda has SSM permissions

## Debugging Tools

### Browser Extensions
- **Vue DevTools**: Inspect Vue component state
- **React DevTools**: If using React components
- **Network Monitor**: Built into browser DevTools

### AWS CLI Commands
```bash
# Check Lambda function exists
aws lambda get-function --function-name addresszen-proxy-<stack-id> --region us-east-1

# Check Function URL
aws lambda get-function-url-config --function-name addresszen-proxy-<stack-id> --region us-east-1

# Test Lambda invocation (requires proper payload)
aws lambda invoke \
  --function-name addresszen-proxy-<stack-id> \
  --payload '{"action":"autocomplete","query":"test"}' \
  --region us-east-1 \
  response.json && cat response.json
```

### Local Testing
```bash
# Run dev server with verbose logging
npm run dev

# Check for TypeScript errors
npm run type-check

# Check for linting errors
npm run lint
```

## Getting Help

When asking for help, provide:
1. Browser console output (screenshot or copy)
2. Network tab details (failed request)
3. Lambda logs (relevant log entries)
4. Steps to reproduce
5. Expected vs actual behavior

## Next Steps

After debugging:
1. Fix the identified issue
2. Test with multiple addresses (US and international)
3. Verify error handling works
4. Check logs are clean

