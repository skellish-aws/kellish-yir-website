# AddressZen API Key Security Guide

This guide explains how to properly secure your AddressZen API key and configure security settings.

**References:**

- API Key Settings: https://docs.addresszen.com/docs/guides/api-key-settings
- API Key Security: https://docs.addresszen.com/docs/guides/api-key-secure
- Allowed URLs: https://docs.addresszen.com/docs/guides/allowed-urls

## Architecture Approach

Our implementation uses a **Private/Server-Side** approach:

- ✅ API key stored in AWS SSM Parameter Store (secure)
- ✅ API calls made through Lambda proxy (server-side)
- ✅ Client never sees the API key
- ✅ No direct client-side calls to AddressZen

## API Key Settings to Configure

### 1. Daily Lookup Limits ⭐ **MOST IMPORTANT**

**Required:** Set a daily limit to control spending and prevent misuse

- Limits number of lookups per API key per day
- Resets at **midnight UTC**
- Email notifications sent at **90% and 100%** capacity
- Works for both **frontend and backend** integrations
- **Setting:** Dashboard → Manage API Key → Key Restrictions → Limit the Daily Lookup Usage

**Recommended Formula:**

> Set daily limit to **10x your daily peak** usage

**Example Scenarios:**

- Expected usage: 50 lookups/day → Set limit: **500/day** (10x)
- Expected usage: 100 lookups/day → Set limit: **1,000/day** (10x)
- Expected usage: 500 lookups/day → Set limit: **5,000/day** (10x)

This provides buffer for usage spikes while preventing overspending.

Reference: https://docs.addresszen.com/docs/guides/api-key-secure

### 2. Individual Lookup Limits (Per IP Address)

**Optional:** Useful for monitoring and preventing abuse from single source

- Limits requests **per IP address** per day
- Resets at **midnight UTC per IP**
- Works for both frontend and backend integrations
- **Backend integrations require IP Address Forwarding** (see below)
- **Setting:** Dashboard → Manage API Key → Key Restrictions → Limit the Daily IP Usage

**When to Use:**

- Multiple Lambda functions calling the API
- Want to monitor per-server usage
- Need protection against single IP abuse

**Important for Backend:**

- Individual IP limits require **IP Address Forwarding** to work properly
- See "IP Address Forwarding" section below

### 3. Allowed URLs

**Not Needed:** Only for **frontend/client-side** integrations

Since we use **Lambda proxy (backend integration)**, we don't need to configure Allowed URLs.

**Why:**

- ✅ Allowed URLs only work for **frontend** integrations (web browser)
- ✅ Our API key is in Lambda (backend), never in the browser
- ✅ CORS is handled by Lambda, not AddressZen
- ✅ Requests don't come from browser, so URL checking doesn't apply

**URL Matching Details (if using frontend):**

- URLs with `http://` or `https://`: Exact match from start
  - Example: `https://example.com` matches `https://example.com/` and `https://example.com/page`
- URLs without protocol: Substring match
  - Example: `example.com` matches both `https://www.example.com` and `http://example.com`
- **Recommendation:** Restrict by domain and protocol only (e.g., `https://example.com`)

**Referer/Origin Headers:**

- AddressZen checks `Referer` and `Origin` headers against allowed URLs
- `Referrer-Policy` settings affect whether `Referer` is sent
- For domain-only matching, omit trailing slashes and paths

Reference: https://docs.addresszen.com/docs/guides/api-key-secure

### 4. Email Notifications

**Recommended:** Enable notifications

Configure email recipients to receive:

- Balance notifications (90% and 100% daily limit)
- Top-up updates
- Important account information

**Setting:** Dashboard → API Key Settings → Email Notifications

## Security Best Practices

### ✅ DO:

1. **Store API key in SSM Parameter Store** (we do this)
2. **Use Lambda proxy** (server-side, not client-side)
3. **Set daily lookup limits** to prevent overspending
4. **Enable email notifications** for monitoring
5. **Monitor usage regularly** in the dashboard
6. **Use separate API keys** for dev/staging/production

### ❌ DON'T:

1. **Don't expose API key in client code** (we use Lambda proxy to avoid this)
2. **Don't commit API keys to git** (we use SSM instead)
3. **Don't set unlimited daily limits** (could lead to unexpected charges)
4. **Don't use client-side integration** (less secure than server-side)

## IP Address Forwarding (Advanced)

**When Needed:** Only if you enable **Individual Lookup Limits** and your Lambda is behind a proxy/load balancer.

**How It Works:**

- Send `IDPC-Source-IP` HTTP header with the original client IP address
- AddressZen will rate limit based on the forwarded IP, not the proxy IP
- Response includes `IDPC-Source-IP` header confirming the rate-limited IP

**Example:**

```javascript
headers: {
  'IDPC-Source-IP': '192.168.1.100' // Original client IP
}
```

**Important Notes:**

- ⚠️ **Do NOT enable IP forwarding for frontend/client-side** integrations (would allow circumventing rate limits)
- ✅ **Enable for backend** if using Individual IP limits and behind a proxy
- ✅ Malformed IP addresses return `400` response
- ✅ If forwarding enabled but no header provided, original IP is rate limited

**For Our Setup:**

- **Not needed currently** (Lambda → AddressZen direct connection)
- **May be needed if** you add a load balancer or API Gateway in front of Lambda

Reference: https://docs.addresszen.com/docs/guides/api-key-secure

## API Key Regeneration

If your API key is compromised:

1. Regenerate the key in the dashboard
2. Update SSM parameter with new key
3. Old key will immediately stop working
4. Existing purchases are unaffected

**Note:** Regeneration is irreversible - make sure you update all systems before regenerating.

## Retention Period

Default: 28 days

- Personal data (IP addresses, queries, referers) is retained for this period
- Can be set to 0 to disable retention
- Can be adjusted in API Key Settings

## Lookup Balance & Purchasing

**Important:** AddressZen uses a **lookup balance** system where each lookup costs credits.

**Key Details:**

- **Lookup Balance:** Credits that permit one valid address search
- **Test Balance:** First API key receives **100 free test lookups**
- **Purchase Units:** Blocks of **100 credits** (100 verified addresses)
- **Expiration:** Lookups expire **12 months from first use** (not purchase date)
- **Consumption:** FIFO order - oldest batches consumed first, newest saved last

**Purchasing Lookups:**

1. Dashboard → Keys tab → Manage button on your API Key
2. Click **"One Time Top Up"** button (next to your balance)
3. Enter number of credit blocks (each block = 100 credits)
4. Enter payment details and make payment

**Automated Top-Ups:**

- Can set up automated top-ups when balance runs low
- Keeps you notified and prevents running out
- Recommended for production use

**Reference:** https://docs.addresszen.com/docs/guides/purchasing-lookups

## Cost Control

**Recommended Daily Limit Formula:**

> Set daily limit to **10x your daily peak usage** (AddressZen recommendation)

**Example Configurations:**

**Scenario 1: Small Volume**

- Expected usage: 50 lookups/day
- Recommended limit: **500 lookups/day** (10x)
- Buffer for spikes: 450 extra lookups

**Scenario 2: Medium Volume**

- Expected usage: 100 lookups/day
- Recommended limit: **1,000 lookups/day** (10x)
- Buffer for spikes: 900 extra lookups

**Scenario 3: Large Volume**

- Expected usage: 500 lookups/day
- Recommended limit: **5,000 lookups/day** (10x)
- Buffer for spikes: 4,500 extra lookups

**Cost Estimation:**

- Daily Lookup Limit: Based on 10x peak usage
- AddressZen cost: Check their pricing page (varies by plan)
- Daily cost = (Daily Limit × Cost per Lookup)
- Monthly max = (Daily cost × 30 days)

**Recommended Settings:**

1. ✅ Set daily limit to **10x daily peak** (AddressZen recommendation)
2. ✅ Enable email notifications at **90%** capacity
3. ✅ Monitor first week to adjust limits
4. ✅ Scale up limits as usage grows
5. ✅ Review usage monthly

Reference: https://docs.addresszen.com/docs/guides/api-key-secure

## Managing API Key Settings

**Dashboard Location:**

1. Sign in to AddressZen dashboard
2. Click blue **"Manage"** button on your API key
3. Scroll down to **"Key Restrictions"** section
4. Configure:
   - **Allow URLs** (not needed for backend)
   - **Limit the Daily Lookup Usage** ⭐ **Required**
   - **Limit the Daily IP Usage** (optional)

## Monitoring

Check your dashboard regularly for:

- Daily usage vs. daily limit
- Remaining lookup balance
- Recent lookup activity
- Email notifications (90% and 100% alerts)
- Cost tracking

**Email Notifications:**

- Configure email recipients in API Key Settings
- Receive alerts at **90%** and **100%** of daily limit
- Get top-up reminders and balance updates

---

**References:**

- API Key Settings: https://docs.addresszen.com/docs/guides/api-key-settings
- API Key Security: https://docs.addresszen.com/docs/guides/api-key-secure
- Allowed URLs: https://docs.addresszen.com/docs/guides/allowed-urls
