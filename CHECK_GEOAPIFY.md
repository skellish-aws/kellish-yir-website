# Check Geoapify Configuration

## Step 1: Check Browser Console

Open your browser DevTools (F12) and run this in the console:

```javascript
import.meta.env.VITE_GEOAPIFY_API_KEY
```

**Expected output:**

```
"11b3be8a12b94e7789be6c299450d3c0"
```

**If you see `undefined` instead:**

- The dev server wasn't restarted after adding the env variable
- Vite only reads `.env.local` when the dev server starts

## Step 2: Restart Dev Server

```bash
# Stop the current server (Ctrl+C or Cmd+C)
npm run dev
```

## Step 3: Hard Refresh Browser

After server restarts:

- **Mac:** Cmd + Shift + R
- **Windows/Linux:** Ctrl + Shift + R

## Step 4: Test Again

1. Edit the Portugal recipient
2. Look for the **yellow warning banner**:

   - If you see it → Geoapify is still not loaded (check console)
   - If you DON'T see it → Geoapify is configured ✅

3. Click Update and check console logs:
   ```
   Detected international address, country: Portugal
   Using Geoapify to validate international address
   Validating international address with Geoapify: ...
   ```

## Debugging

Run this in the browser console to see the full Geoapify config:

```javascript
// Check if API key is loaded
console.log('API Key:', import.meta.env.VITE_GEOAPIFY_API_KEY)

// Check if autocomplete is working
console.log('Geoapify enabled:', !!import.meta.env.VITE_GEOAPIFY_API_KEY)
```

## Common Issues

### Issue: Undefined API key after restart

**Solution:** Make sure `.env.local` is in the project root (same level as `package.json`)

### Issue: Still shows warning banner

**Solution:** Hard refresh the browser after restarting server

### Issue: No validation dialog appears

**Possible reasons:**

1. Geoapify returned the exact same address (no changes needed)
2. Geoapify confidence was < 0.5 (address might be too vague)
3. Geoapify API error (check console for errors)

### Issue: Validation fails with API error

**Check:**

1. API key is correct in `.env.local`
2. No extra spaces or quotes around the key
3. Free tier limit not exceeded (3,000 requests/day)
