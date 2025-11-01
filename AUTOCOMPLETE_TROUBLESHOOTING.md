# Address Autocomplete Troubleshooting Guide

## Quick Checklist

If autocomplete is not working, check these in order:

### 1. ✅ Is Geoapify API Key Set?

**Check your environment variable:**

```bash
# In your terminal
echo $VITE_GEOAPIFY_API_KEY
```

Should display your API key (not empty).

**If empty:**

1. Create/edit `.env.local` in project root:
   ```
   VITE_GEOAPIFY_API_KEY=your_api_key_here
   ```
2. Restart your dev server:
   ```bash
   npm run dev
   ```

### 2. 🔍 Check Browser Console

Open DevTools (F12) and look for:

**Expected logs when typing:**

```
searchAddress called with query: 1600
Fetching address suggestions for: 1600 country: undefined
Received suggestions: [...]
```

**Common errors:**

#### Error: "Geoapify autocomplete is not enabled"

- **Cause**: API key not set
- **Fix**: Set `VITE_GEOAPIFY_API_KEY` and restart server

#### Error: "Geoapify API returned 403"

- **Cause**: Invalid API key
- **Fix**: Check your API key in Geoapify dashboard

#### Error: "Geoapify API returned 429"

- **Cause**: Exceeded daily limit (3,000 requests)
- **Fix**: Wait until midnight UTC or upgrade plan

#### No logs at all

- **Cause**: AutoComplete component not triggering
- **Fix**: Make sure you're typing in the Address 1 field

### 3. 📝 Test the Autocomplete

1. Open Recipient Admin page
2. Click "Add Recipient"
3. Look at the Address 1 field:

   - **If placeholder says**: "Start typing address..." → ✅ Configured
   - **If placeholder says**: "Enter address (autocomplete not configured)" → ❌ Not configured
   - **If you see orange tip**: "💡 Tip: Set VITE_GEOAPIFY_API_KEY..." → ❌ Not configured

4. Type at least 3 characters (e.g., "1600 Penn")
5. Wait 1-2 seconds
6. Should see dropdown with suggestions

### 4. 🌐 Test API Directly

Test if Geoapify API is working:

```bash
# Replace YOUR_API_KEY with your actual key
curl "https://api.geoapify.com/v1/geocode/autocomplete?text=1600%20Pennsylvania&apiKey=YOUR_API_KEY&format=json&limit=5"
```

**Expected response:**

```json
{
  "results": [
    {
      "formatted": "1600 Pennsylvania Avenue Northwest, Washington, DC 20500, United States",
      ...
    }
  ]
}
```

**If error:**

- Check API key is correct
- Check you haven't exceeded daily limit
- Check API key is active in Geoapify dashboard

## Common Issues

### Issue: Dropdown doesn't appear

**Possible causes:**

1. Typed less than 3 characters
2. API key not set
3. Network error
4. No matching addresses

**Debug steps:**

1. Open browser console
2. Type in Address 1 field
3. Check for console logs
4. Check for error messages

### Issue: Dropdown appears but is empty

**Possible causes:**

1. No addresses match your query
2. API returned no results
3. Country filter too restrictive

**Debug steps:**

1. Check console for "Received suggestions: []"
2. Try a more specific address
3. Clear the Country field and try again

### Issue: Selecting suggestion doesn't fill fields

**Possible causes:**

1. JavaScript error in `onAddressSelect`
2. Form fields not updating

**Debug steps:**

1. Check console for errors
2. Look for log: "Address auto-filled from suggestion: ..."
3. Check if form.value is reactive

### Issue: Autocomplete works but validation fails

**This is expected!** Autocomplete and validation are separate:

- **Autocomplete**: Suggests addresses as you type
- **Validation**: Verifies address when you save

Both use Geoapify but serve different purposes.

## Environment Variables

### Development (.env.local)

```bash
# Required for autocomplete
VITE_GEOAPIFY_API_KEY=your_api_key_here
```

### Production (Amplify Console)

1. Go to Amplify Console
2. Select your app
3. Go to "Environment variables"
4. Add:
   - **Key**: `VITE_GEOAPIFY_API_KEY`
   - **Value**: Your API key
5. Redeploy

## Testing Steps

### Test 1: US Address

1. Add recipient
2. Type in Address 1: "1600 Penn"
3. Should see: "1600 Pennsylvania Avenue Northwest, Washington, DC..."
4. Click suggestion
5. All fields should auto-fill

### Test 2: International Address

1. Add recipient
2. Set Country: "Portugal"
3. Type in Address 1: "Avenida Diogo"
4. Should see Portuguese addresses
5. Click suggestion
6. All fields should auto-fill

### Test 3: No API Key

1. Remove/rename `.env.local`
2. Restart dev server
3. Add recipient
4. Should see orange tip message
5. Autocomplete should not work (expected)

## API Limits

**Free Tier:**

- 3,000 requests per day
- Resets at midnight UTC

**Check usage:**

1. Log in to [Geoapify Dashboard](https://myprojects.geoapify.com/)
2. View API statistics
3. Monitor daily usage

**Reduce usage:**

- Autocomplete only triggers after 3+ characters
- Each keystroke = 1 API call
- Consider debouncing if needed

## Still Not Working?

### Check these files:

1. **Config file exists:**

   ```bash
   cat src/config/geoapify.ts
   ```

2. **Autocomplete utility exists:**

   ```bash
   cat src/utils/geoapify-autocomplete.ts
   ```

3. **Component has imports:**
   ```bash
   grep -n "geoapifyAutocomplete" src/views/RecipientAdmin.vue
   ```

### Enable debug mode:

Add this to your component (temporary):

```typescript
onMounted(() => {
  console.log('Geoapify enabled:', geoapifyAutocomplete.isEnabled())
  console.log('API key set:', !!import.meta.env.VITE_GEOAPIFY_API_KEY)
})
```

### Get help:

1. Check browser console for errors
2. Check network tab for API calls
3. Verify API key in Geoapify dashboard
4. Test API directly with curl
5. Check this guide: [GEOAPIFY_SETUP.md](./GEOAPIFY_SETUP.md)

## Success Indicators

✅ **Working correctly when:**

- Placeholder says "Start typing address..."
- Console shows "searchAddress called with query: ..."
- Console shows "Received suggestions: [...]"
- Dropdown appears with addresses
- Clicking suggestion fills all fields
- Console shows "Address auto-filled from suggestion: ..."

## Performance Tips

**Autocomplete is fast because:**

- Only triggers after 3 characters
- Geoapify API is very fast (< 200ms typically)
- Results are limited to 5 suggestions
- Country filter reduces search space

**To make it faster:**

- Specify Country field first
- Type more specific queries
- Use full street names

## Security Notes

- API key is exposed in browser (this is normal for client-side APIs)
- Geoapify limits usage by API key
- Free tier is sufficient for most use cases
- Rotate API key periodically
- Monitor usage in dashboard
