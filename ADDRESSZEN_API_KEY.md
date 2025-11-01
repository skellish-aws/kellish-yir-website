# AddressZen API Key Guide

This guide explains what AddressZen API keys are and how to use them.

**Reference:** https://docs.addresszen.com/docs/guides/api-key

## What is an API Key?

An API Key is a **string of characters that authenticates your integration** with AddressZen. Think of it as a code that allows AddressZen to know who is accessing their services.

When your integration searches AddressZen's database for an address, you send your API Key to identify yourself.

## API Key Format

**Format:** API Keys begin with the characters `ak_`

**Example:**

```
ak_ksqa49sjSdAEDq9I88
```

**Location:** You can find your API keys listed on your dashboard after signing into your account at https://addresszen.com

## How Many API Keys Can I Have?

You can create **up to 10 API Keys** per account.

**First API Key:** Receives a **test balance of 100 free lookups** automatically.

**Additional Keys:** Each additional key starts with zero balance (you'll need to purchase lookups).

You can create more keys on your account via the dashboard.

## What Are API Keys Used For?

### 1. Authentication

When searching and validating addresses, you **must include your API Key** so AddressZen knows who is accessing the data. Your API Key is required in any integration.

**Usage Example:**

```
https://api.addresszen.com/v1/verify?api_key=ak_ksqa49sjSdAEDq9I88&...
```

### 2. Security

Each API Key on your account has **configurable security settings** that you control:

- **Daily Lookup Limits** - Control spending and prevent misuse
- **Individual IP Limits** - Limit requests per IP address (optional)
- **Allowed URLs** - Restrict which URLs can use the key (for frontend integrations)

See `ADDRESSZEN_SECURITY.md` for detailed security configuration.

### 3. Notifications

Each API Key has its **own email notification list**. Addresses on this list receive:

- Balance notifications (at 90% and 100% of daily limit)
- Top-up updates
- Other actionable information

Configure email recipients in your API Key settings.

### 4. Balance Management

Each API Key has its **own lookup balance**:

- **Test Balance:** First API key receives 100 free test lookups
- **Purchased Balance:** Buy lookup credits in blocks of 100
- **Separate Balances:** Use different keys for different purposes (testing, staging, production)
- **Balance Tracking:** Monitor usage per key in the dashboard

See `ADDRESSZEN_PRICING.md` for details on purchasing and managing lookup balances.

## Best Practices

### ✅ DO:

1. **Store API keys securely** (we use AWS SSM Parameter Store)
2. **Use separate keys** for testing and production
3. **Set daily lookup limits** to prevent overspending
4. **Monitor key usage** regularly in the dashboard
5. **Enable email notifications** for balance alerts
6. **Use server-side proxy** (Lambda) to keep keys secure

### ❌ DON'T:

1. **Don't expose API keys in client code** (use Lambda proxy instead)
2. **Don't commit API keys to git** (use SSM or environment variables)
3. **Don't share API keys** between environments without limits
4. **Don't use unlimited daily limits** (could lead to unexpected charges)
5. **Don't ignore balance notifications** (monitor usage)

## Multiple API Keys Strategy

With up to 10 API keys available, consider this strategy:

### Recommended Setup:

1. **Development Key**

   - Use test balance (100 free lookups)
   - Set low daily limit (e.g., 500/day)
   - For local development and testing

2. **Staging Key**

   - Purchase minimal balance for testing
   - Set moderate daily limit
   - For staging environment testing

3. **Production Key**

   - Purchase balance based on expected usage
   - Set daily limit to 10x peak usage
   - Enable automated top-ups
   - For production environment

4. **Reserve Keys**
   - Keep additional keys available
   - Use for special projects or backup

## Getting Your API Key

### Steps:

1. **Sign Up:** Go to https://addresszen.com and create an account
2. **Sign In:** Sign into your account dashboard
3. **Find Keys:** Navigate to the "Keys" tab or section
4. **Copy Key:** Copy your API key (starts with `ak_`)
5. **Store Securely:** Add to AWS SSM Parameter Store (for production)
   ```bash
   aws ssm put-parameter \
     --name "/kellish-yir/addresszen/api-key" \
     --type "String" \
     --value "ak_your-api-key-here"
   ```

## API Key Validation

Our code validates API key format:

```typescript
// From src/config/addresszen.ts
function isValidAddressZenApiKey(key: string): boolean {
  return key.startsWith('ak_') && key.length > 3
}
```

This ensures keys:

- Start with `ak_`
- Have at least 4 characters (minimum: `ak_` + 1 character)

## References

- **API Key Guide:** https://docs.addresszen.com/docs/guides/api-key
- **API Key Settings:** https://docs.addresszen.com/docs/guides/api-key-settings
- **API Key Security:** https://docs.addresszen.com/docs/guides/api-key-secure
- **Setup Guide:** See `ADDRESSZEN_SETUP.md`
- **Security Guide:** See `ADDRESSZEN_SECURITY.md`
- **Pricing Guide:** See `ADDRESSZEN_PRICING.md`

---

**Last Updated:** Based on AddressZen API Key Documentation
