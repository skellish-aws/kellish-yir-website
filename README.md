# kellish-yir-website

Year-in-Review newsletter management system built with Vue 3, AWS Amplify, and Vite.

## Features

- **Recipient Management**: Add, edit, delete, and import recipients from Excel/CSV
- **Address Validation**:
  - Address validation using Google Maps Address Validation API (US and international)
- **Access Code Generation**: Unique codes for newsletter access
- **Bulk Operations**: Delete or generate codes for multiple recipients
- **Search & Filter**: Find recipients by name, email, city, or state

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Configure Address Validation

Address validation uses Google Maps Address Validation API, which handles both US and international addresses.

#### Step 1: Get a Google Maps API Key

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create or select a project**:
   - Click the project dropdown at the top of the page
   - **Option A**: If you see an existing project, you can use it
   - **Option B**: Click "New Project"
     - If prompted for a parent organization/folder, you can:
       - Select "No organization" if available
       - Or select your existing organization/folder
       - If you don't have an organization, Google may have automatically created one - look in the dropdown
     - Enter a project name (e.g., "kellish-yir-address-validation")
     - Click "Create"
   - **Option C**: If you have trouble with organization, try creating a project directly at: https://console.cloud.google.com/projectcreate
3. **Enable billing** (required for Google Maps APIs):
   - Go to "Billing" in the left menu
   - Link a billing account (Google provides $200/month free credit for Maps APIs)
4. **Enable the Address Validation API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Address Validation API"
   - Click on it and click "Enable"
5. **Create an API Key**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the API key (you'll see it once)
6. **Restrict the API Key** (recommended for security):
   - Click on the API key you just created
   - Under "API restrictions", select "Restrict key"
   - Check only "Address Validation API"
   - Under "Application restrictions", you can restrict by:
     - IP addresses (add your Lambda function IPs if known)
     - HTTP referrers (for web apps)
     - Or leave unrestricted for Lambda proxy use
   - Click "Save"

> **Note**: Google Maps APIs have pricing. Address Validation API costs $0.00475 per request after the free tier ($200/month credit). See [Google Maps Pricing](https://mapsplatform.google.com/pricing/)

#### Step 2: Store the API Key in AWS SSM Parameter Store

Once you have your API key, store it securely in AWS Systems Manager Parameter Store:

```bash
aws ssm put-parameter \
  --name "/kellish-yir/googlemaps/api-key" \
  --value "YOUR_GOOGLE_MAPS_API_KEY_HERE" \
  --type "SecureString" \
  --description "Google Maps Address Validation API key" \
  --profile softsys \
  --region us-east-1
```

Replace `YOUR_GOOGLE_MAPS_API_KEY_HERE` with your actual API key.

#### Step 3: Deploy the Backend

Now you can deploy the Amplify sandbox:

```bash
npm run amplify:sandbox
```

The deployment will succeed because the SSM parameter now exists.

#### Troubleshooting

**Error: "Address Validation API has not been used in project X before or it is disabled"**

This means your API key is associated with a different Google Cloud project where the API isn't enabled. Fix this by:

1. **Enable the API in that project**: Click the link provided in the error message to enable the API in project `451043453717` (or whatever project ID appears in the error)

2. **Or use the correct project**: Make sure you created the API key in the same project where you enabled the Address Validation API (check the project selector in the top bar of Google Cloud Console)

3. **Wait a few minutes**: If you just enabled the API, wait 2-5 minutes for it to propagate through Google's systems

4. **Verify API is enabled**: Go to APIs & Services > Library, search for "Address Validation API", and confirm it shows "API Enabled" with a green checkmark

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
