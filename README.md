# kellish-yir-website

Year-in-Review newsletter management system built with Vue 3, AWS Amplify, and Vite.

## Features

- **Recipient Management**: Add, edit, delete, and import recipients from Excel/CSV
- **Address Validation**:
  - US addresses validated with USPS API
  - International addresses validated with Geoapify API
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

### Configure Address Validation (Optional)

#### USPS API (US Addresses)

See [USPS_SETUP.md](./USPS_SETUP.md) for instructions on setting up USPS address validation.

#### Geoapify API (International Addresses)

See [GEOAPIFY_SETUP.md](./GEOAPIFY_SETUP.md) for instructions on setting up international address validation.

**Quick Start:**

1. Sign up at [https://www.geoapify.com/](https://www.geoapify.com/) (free, no credit card)
2. Get your API key
3. Add to `.env.local`:
   ```
   VITE_GEOAPIFY_API_KEY=your_api_key_here
   ```

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
