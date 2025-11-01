# AddressZen Lookup Balance & Pricing

This guide explains AddressZen's lookup balance system and how to purchase credits.

Reference: https://docs.addresszen.com/docs/guides/purchasing-lookups

## Lookup Balance System

AddressZen uses a **credit-based system** where:

- **1 lookup** = 1 credit = 1 valid address search
- You purchase credits in advance
- Each lookup consumes one credit from your balance

## Test Balance

**First API Key:**

- Receives **100 free test lookups**
- Use these for initial testing
- No payment required

## Purchasing Lookups

### How to Purchase

1. Sign in to AddressZen dashboard
2. Click **"Keys"** tab on the left
3. Click blue **"Manage"** button on your API Key
4. On the right side, see your current balance (green box)
5. Click **"One Time Top Up"** button
6. Enter number of **credit blocks** to purchase
   - Each block = **100 credits** (100 verified addresses)
   - Example: 10 blocks = 1,000 lookups
7. Enter payment details
8. Click **"Make Payment"**

### Purchase Units

- **Credit Blocks:** Sold in blocks of **100 credits**
- **Minimum:** 1 block (100 lookups)
- **Pricing:** Check AddressZen pricing page for current rates

### Expiration Policy

**Important:**

- Lookups expire **12 months from first use** (not purchase date)
- If you buy 1,000 lookups today but don't use them until next month, they expire 12 months from when you first use them

**Example:**

- Purchase date: January 1, 2025
- First use: February 1, 2025
- Expiration: February 1, 2026 (12 months from first use, not purchase)

### Batch Consumption

**FIFO (First In, First Out):**

- Oldest batches are consumed first
- Newest batches are saved until last

**Example:**

- January: Purchase 1,000 lookups
- March: Purchase 2,000 lookups
- Usage consumes January batch first, then March batch

## Automated Top-Ups

**Recommended for Production:**

Set up automated top-ups to:

- Automatically purchase credits when balance runs low
- Prevent running out of lookups
- Keep you notified
- Ensure continuous service

**Setup:**

1. Dashboard → Keys → Manage API Key
2. Configure Automated Top-Up settings
3. Set trigger threshold (e.g., when balance drops below 500)
4. Set purchase amount (e.g., buy 10 blocks when triggered)

**Reference:** See AddressZen Automated Top-Ups guide

## Testing

**Recommended Testing Approach:**

1. **Initial Integration:**

   - Use your **100 free test lookups** for development
   - Test with **genuine address requests** (not hardcoded test data)
   - Verify API format and response handling

2. **Separate Test & Production Keys:**

   - Create separate API keys for testing and production
   - Test key: Use test balance and limit daily usage
   - Production key: Use purchased credits with proper limits

3. **Request Additional Test Balances:**

   - If you run out of test lookups during development
   - Request additional test balances from AddressZen
   - Continue testing until integration is complete

4. **Continuous Integration:**
   - Enquire about long-term testing keys for CI/CD
   - Contact: support@addresszen.com or chat
   - Set up dedicated test API keys for automated testing

**Reference:** https://docs.addresszen.com/docs/guides/testing

## Cost Estimation

**Example Calculation:**

**Monthly Usage:**

- Expected: 3,000 lookups/month
- Daily average: ~100 lookups/day
- Recommended daily limit: **1,000/day** (10x peak)

**Purchase Strategy:**

- Initial purchase: 10 blocks = 1,000 lookups (test with 100 free first)
- Monthly need: ~3,000 lookups
- Purchase 30 blocks = 3,000 lookups/month
- Buffer: Set up automated top-up at 1,000 remaining

**Cost Factors:**

- Check AddressZen pricing page for current rates
- Consider volume discounts
- Factor in expiration (12 months from first use)

## Best Practices

### ✅ DO:

1. **Start with test balance** (100 free lookups)
2. **Test integration** before purchasing
3. **Monitor usage** in dashboard
4. **Set up automated top-ups** for production
5. **Purchase in appropriate blocks** based on expected usage
6. **Use lookups within 12 months** to avoid expiration

### ❌ DON'T:

1. **Don't over-purchase** upfront (expires if not used)
2. **Don't forget to set up automated top-ups** for production
3. **Don't let balance run out** (validation will fail)
4. **Don't purchase too small blocks** (inefficient)

## Monitoring Balance

**Check Dashboard Regularly:**

- Current balance (green box in API Key settings)
- Recent lookup activity
- Expiration dates of batches
- Purchase history

**Set Up Alerts:**

- Email notifications for low balance
- Automated top-up triggers
- Daily usage reports

---

**References:**

- Purchasing Lookups: https://docs.addresszen.com/docs/guides/purchasing-lookups
- Automated Top-Ups: https://docs.addresszen.com/docs/guides/automated-top-ups
- API Key Settings: https://docs.addresszen.com/docs/guides/api-key-settings
