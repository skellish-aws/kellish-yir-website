# AddressZen API Reference

This document provides essential information for integrating with the AddressZen API based on their official API reference.

**Reference:** https://docs.addresszen.com/docs/api/api-reference

## Base URL

```
https://api.addresszen.com/v1
```

**Version:** 4.0.0

## Authentication

AddressZen API requires an **API key** for authentication. There are two ways to authenticate:

### Method 1: Query String Parameter (Recommended)

```
api.addresszen.com/v1/autocomplete/addresses?api_key=your-api-key-here&q=parkside
```

### Method 2: Authorization Header

```
Authorization: api_key="your-api-key-here" [other_key="foo"]
```

**Important:** The API parameter is `api_key` (with underscore), not `apiKey`.

## HTTP Methods

The API supports:

- `GET` - For most read operations
- `POST` - For some operations
- `OPTIONS` - For CORS preflight requests

## Rate Limiting

- **Limit:** 30 requests per second per IP address
- **Result:** 503 response if limit is exceeded
- **Note:** Autocomplete API has an additional rate limit
- **Contact:** If you expect to breach the limit, contact AddressZen for a higher limit endpoint

## Response Codes

### Success

| HTTP Code | API Code | Description                                  |
| --------- | -------- | -------------------------------------------- |
| 200       | 2000     | Success. Request was completed successfully. |

### Client Errors (4XX)

#### 400 - Bad Request

| HTTP Code | API Code | Description                         |
| --------- | -------- | ----------------------------------- |
| 400       | 4000     | Invalid syntax submitted            |
| 400       | 4001     | Validation failed on submitted data |
| 400       | 4005     | Invalid start date                  |
| 400       | 4006     | Invalid end date                    |
| 400       | 4007     | Invalid date range (wrong order)    |
| 400       | 4008     | Invalid date range (>90 days)       |
| 400       | 4009     | Too many tags (>3)                  |

#### 401 - Unauthorized

| HTTP Code | API Code | Description                        |
| --------- | -------- | ---------------------------------- |
| 401       | 4010     | Invalid Key - API key is not valid |
| 401       | 4011     | Requesting URL not on whitelist    |
| 401       | 4012     | Failed user authentication         |
| 401       | 4013     | Licensee Key is required           |

#### 402 - Request Failed

| HTTP Code | API Code | Description                           |
| --------- | -------- | ------------------------------------- |
| 402       | 4020     | Key balance depleted - Out of lookups |
| 402       | 4021     | Limit reached - Daily limit breached  |

#### 404 - Resource Not Found

| HTTP Code | API Code | Description        |
| --------- | -------- | ------------------ |
| 404       | 4040     | Postcode not found |
| 404       | 4041     | User not found     |
| 404       | 4042     | Key not found      |
| 404       | 4044     | No UDPRN found     |
| 404       | 4045     | No licensee found  |
| 404       | 4046     | No UMPRN found     |

### Server Errors (5XX)

| HTTP Code | API Code | Description                            |
| --------- | -------- | -------------------------------------- |
| 500       | 5000     | Server error occurred                  |
| 500       | 5001     | Server error (similar to 5000)         |
| 500       | 5002     | Server timeout - request took too long |

### Rate Limit

| HTTP Code | Description                              |
| --------- | ---------------------------------------- |
| 503       | Rate limit exceeded (30 requests/second) |

## Error Handling

### Response Structure

Errors return HTTP status codes and API response codes in the response body:

```json
{
  "code": 4020,
  "message": "Key balance depleted"
}
```

### Common Error Scenarios

1. **Balance Depleted (4020):**

   - **Solution:** Purchase more lookups from AddressZen dashboard
   - **Reference:** https://docs.addresszen.com/docs/guides/purchasing-lookups

2. **Daily Limit Reached (4021):**

   - **Solution:** Wait for limit to reset (midnight UTC) or increase limit in dashboard
   - **Reference:** https://docs.addresszen.com/docs/guides/api-key-settings

3. **Invalid API Key (4010):**

   - **Solution:** Verify API key is correct and starts with `ak_`
   - **Reference:** https://docs.addresszen.com/docs/guides/api-key

4. **Rate Limit Exceeded (503):**
   - **Solution:** Slow down requests to <30/second or contact AddressZen for higher limit

## Testing

- Each new account comes with a **free test balance**
- Use test balance for initial integration testing
- Contact AddressZen if you need more test credits
- Create separate API keys for testing and production

**Reference:** https://docs.addresszen.com/docs/guides/testing

## Metadata & Tagging

Requests that affect your balance can be annotated with arbitrary metadata:

- Stored along with lookup history
- Queryable via API or dashboard
- Useful for tracking usage by feature, user, etc.

**Reference:** https://docs.addresszen.com/docs/guides/tagging

## Versioning

- API versioned with URL prefix `/v1/`
- Backwards-compatibility maintained
- Breaking changes released under new version
- Backwards-compatible changes:
  - Adding new properties
  - Adding new endpoints
  - Adding optional parameters
  - Changing property order
  - Changing autocomplete suggestion format

## Protocol Support

- **HTTPS** (recommended)
- **HTTP** (available but not recommended)
- **IPv4** and **IPv6** supported

## Integration Checklist

When implementing AddressZen integration:

- [ ] API key stored securely (SSM Parameter Store or Secrets Manager)
- [ ] Authentication via `api_key` query parameter or Authorization header
- [ ] Rate limiting handled (<30 requests/second)
- [ ] Error codes properly parsed and handled
- [ ] Balance depleted errors (4020) handled gracefully
- [ ] Daily limit errors (4021) handled gracefully
- [ ] Rate limit errors (503) handled with retry logic
- [ ] Testing with test balance before production
- [ ] Separate API keys for test and production

## Additional Resources

- **API Reference:** https://docs.addresszen.com/docs/api/api-reference
- **Address Search:** https://docs.addresszen.com/docs/api/address-search
- **Support:** support@addresszen.com
- **Dashboard:** https://addresszen.com/dashboard

---

**Last Updated:** Based on AddressZen API Reference v4.0.0
