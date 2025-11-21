# Testing Strategy

**Date**: 2025-01-XX  
**Purpose**: Comprehensive testing strategy for Year-in-Review newsletter website

---

## Overview

This document outlines a practical testing strategy appropriate for a small family newsletter website. The focus is on **high-value tests** that catch real bugs and prevent regressions, without over-engineering for a small project.

---

## Testing Philosophy

**Principles**:

- ✅ **Test critical paths** - Focus on user-facing functionality
- ✅ **Test edge cases** - Catch common mistakes
- ✅ **Keep it simple** - Don't over-mock, test real behavior
- ✅ **Iterate** - Start with manual testing, add automation gradually
- ✅ **Pragmatic** - For a small site, some manual testing is acceptable

**Testing Pyramid** (Adapted for Small Project):

```
        /\
       /  \  E2E Tests (Critical flows only)
      /____\
     /      \  Integration Tests (Key integrations)
    /________\
   /          \  Unit Tests (Utilities, helpers)
  /____________\
```

---

## 1. Unit Tests

**Purpose**: Test individual functions, utilities, and components in isolation  
**Framework**: Vitest (recommended for Vite projects)  
**Priority**: Medium  
**Coverage Target**: 60-70% for utilities, 40-50% for components

### What to Test

#### High Priority (Must Have)

1. **Utility Functions** (`src/utils/`):

   - ✅ `access-codes.ts`: Format validation, normalization
   - ✅ `address-validation-queue.ts`: Request formatting
   - ✅ `pdfThumbnail.ts`: Thumbnail generation logic
   - ✅ `inactivityTracker.ts`: Timeout logic

2. **Data Validation**:
   - ✅ Access code format validation
   - ✅ Email validation
   - ✅ Address normalization

#### Medium Priority (Should Have)

3. **Component Logic** (Vue components):
   - ✅ Form validation logic
   - ✅ Data transformation (CSV parsing, etc.)
   - ✅ Computed properties with complex logic

#### Low Priority (Nice to Have)

4. **Simple Components**: Skip testing simple presentational components

### Example Unit Test

```typescript
// src/utils/__tests__/access-codes.test.ts
import { describe, it, expect } from 'vitest'
import {
  validateAccessCodeFormat,
  normalizeAccessCode,
  formatAccessCodeInput,
} from '../access-codes'

describe('access-codes utilities', () => {
  describe('validateAccessCodeFormat', () => {
    it('validates correct format', () => {
      expect(validateAccessCodeFormat('KEL-A1B2-C3D4')).toBe(true)
      expect(validateAccessCodeFormat('KEL-1234-5678')).toBe(true)
    })

    it('rejects invalid format', () => {
      expect(validateAccessCodeFormat('KEL-A1B2')).toBe(false)
      expect(validateAccessCodeFormat('KEL-A1B2-C3D4-EXTRA')).toBe(false)
      expect(validateAccessCodeFormat('INVALID-CODE')).toBe(false)
    })

    it('is case-insensitive', () => {
      expect(validateAccessCodeFormat('kel-a1b2-c3d4')).toBe(true)
      expect(validateAccessCodeFormat('Kel-A1B2-C3D4')).toBe(true)
    })
  })

  describe('normalizeAccessCode', () => {
    it('converts to uppercase', () => {
      expect(normalizeAccessCode('kel-a1b2-c3d4')).toBe('KEL-A1B2-C3D4')
    })

    it('removes spaces', () => {
      expect(normalizeAccessCode('KEL A1B2 C3D4')).toBe('KEL-A1B2-C3D4')
    })
  })

  describe('formatAccessCodeInput', () => {
    it('formats as user types', () => {
      expect(formatAccessCodeInput('KEL')).toBe('KEL-')
      expect(formatAccessCodeInput('KELA1B2')).toBe('KEL-A1B2')
      expect(formatAccessCodeInput('KELA1B2C3D4')).toBe('KEL-A1B2-C3D4')
    })
  })
})
```

### Setup

```bash
# Install Vitest
npm install -D vitest @vue/test-utils happy-dom

# Add to package.json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

---

## 2. Integration Tests

**Purpose**: Test interactions between components, APIs, and services  
**Framework**: Vitest (with mocks for AWS services)  
**Priority**: High  
**Coverage Target**: Critical integrations only

### What to Test

#### High Priority (Must Have)

1. **Lambda Functions**:

   - ✅ `googlemaps-proxy`: API request/response handling
   - ✅ `address-validator`: SQS message processing
   - ✅ `queue-address-validation`: Queue message creation
   - ✅ `export-user-data`: Data aggregation (when implemented)

2. **API Integrations**:

   - ✅ Google Maps API error handling
   - ✅ DynamoDB read/write operations
   - ✅ SQS message queuing

3. **Data Flow**:
   - ✅ Registration flow (access code → user creation)
   - ✅ Address validation flow (queue → process → update)

#### Medium Priority (Should Have)

4. **Amplify Data API**:
   - ✅ CRUD operations for Recipient, Newsletter, NewsletterUser
   - ✅ Authorization rules (admin vs. viewer access)

### Example Integration Test

```typescript
// amplify/functions/__tests__/googlemaps-proxy.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handler } from '../googlemaps-proxy/handler'

// Mock SSM
vi.mock('@aws-sdk/client-ssm', () => ({
  SSMClient: vi.fn(),
  GetParameterCommand: vi.fn(),
}))

describe('googlemaps-proxy Lambda', () => {
  it('validates address successfully', async () => {
    const event = {
      requestContext: { http: { method: 'POST' } },
      body: JSON.stringify({
        address: {
          address1: '123 Main St',
          city: 'City',
          state: 'State',
          zipcode: '12345',
          country: 'USA',
        },
      }),
    }

    // Mock Google Maps API response
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result: { verdict: { inputGranularity: 'PREMISE' } } }),
    })

    const result = await handler(event as any)

    expect(result.statusCode).toBe(200)
    expect(JSON.parse(result.body)).toHaveProperty('result')
  })

  it('handles API errors gracefully', async () => {
    const event = {
      requestContext: { http: { method: 'POST' } },
      body: JSON.stringify({
        address: { address1: 'Invalid' },
      }),
    }

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => 'Invalid request',
    })

    const result = await handler(event as any)

    expect(result.statusCode).toBe(400)
    expect(JSON.parse(result.body)).toHaveProperty('error')
  })
})
```

---

## 3. End-to-End (E2E) Tests

**Purpose**: Test complete user workflows from start to finish  
**Framework**: Playwright (recommended) or Cypress  
**Priority**: High for critical flows, Low for edge cases  
**Coverage Target**: 3-5 critical user journeys

### What to Test

#### Critical User Flows (Must Have)

1. **Registration Flow**:

   - ✅ User receives access code link
   - ✅ User enters access code
   - ✅ User completes registration
   - ✅ User can log in
   - ✅ User can view newsletters

2. **Admin Workflows**:

   - ✅ Admin can create recipient
   - ✅ Admin can import CSV
   - ✅ Admin can generate access codes
   - ✅ Admin can upload newsletter

3. **Newsletter Access**:
   - ✅ Viewer can see newsletter list
   - ✅ Viewer can view newsletter PDF
   - ✅ Viewer can download newsletter

#### Medium Priority (Should Have)

4. **Error Scenarios**:

   - ✅ Invalid access code shows error
   - ✅ Expired access code shows error
   - ✅ Duplicate email registration shows error

5. **Address Validation**:
   - ✅ Address validation queues correctly
   - ✅ Validation status updates in UI

### Example E2E Test

```typescript
// e2e/registration.spec.ts
import { test, expect } from '@playwright/test'

test.describe('User Registration', () => {
  test('user can register with valid access code', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/register?code=KEL-TEST-1234')

    // Fill registration form
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'TestPassword123!')
    await page.fill('input[name="confirmPassword"]', 'TestPassword123!')

    // Submit form
    await page.click('button[type="submit"]')

    // Should redirect to home page
    await expect(page).toHaveURL('/')

    // Should see newsletter list
    await expect(page.locator('h1')).toContainText('Newsletters')
  })

  test('user sees error for invalid access code', async ({ page }) => {
    await page.goto('/register?code=INVALID-CODE')

    await expect(page.locator('.error-message')).toContainText('Invalid invitation link')
  })
})
```

### Setup

```bash
# Install Playwright
npm install -D @playwright/test
npx playwright install

# Add to package.json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

---

## 4. Manual Testing

**Purpose**: Test scenarios that are difficult to automate or require human judgment  
**Priority**: High (especially before releases)  
**Frequency**: Before each deployment, after major changes

### Manual Testing Checklist

#### Pre-Deployment Checklist

**Authentication & Authorization**:

- [ ] Admin can log in
- [ ] Viewer can log in
- [ ] Viewer cannot access admin pages
- [ ] Logout works correctly
- [ ] Session timeout works (15 minutes)

**Registration Flow**:

- [ ] Valid access code allows registration
- [ ] Invalid access code shows error
- [ ] Expired access code shows error
- [ ] Used access code shows error
- [ ] Duplicate email shows error with recovery options
- [ ] Email verification works

**Recipient Management** (Admin):

- [ ] Create recipient with address
- [ ] Edit recipient
- [ ] Delete recipient
- [ ] Import CSV file
- [ ] Search/filter recipients
- [ ] Generate access codes (bulk and individual)

**Address Validation**:

- [ ] US address validates correctly
- [ ] International address validates correctly
- [ ] Invalid address shows error
- [ ] Validation status updates in UI
- [ ] Manual override works

**Newsletter Management** (Admin):

- [ ] Upload newsletter PDF
- [ ] Upload card images
- [ ] Edit newsletter metadata
- [ ] Delete newsletter
- [ ] Thumbnails generate correctly

**Newsletter Access** (Viewer):

- [ ] See list of newsletters
- [ ] View newsletter PDF in browser
- [ ] Download newsletter PDF
- [ ] View card images
- [ ] Download card images

**Error Handling**:

- [ ] Network errors show user-friendly messages
- [ ] API errors are handled gracefully
- [ ] Form validation works
- [ ] Error messages are clear and actionable

**Mobile Responsiveness**:

- [ ] Site works on mobile device
- [ ] Forms are usable on mobile
- [ ] PDF viewing works on mobile
- [ ] Navigation works on mobile

#### Browser Compatibility

Test on:

- [ ] Chrome (latest)
- [ ] Safari (latest)
- [ ] Firefox (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

---

## 5. Performance Testing

**Purpose**: Ensure system performs well under normal load  
**Priority**: Low (for small site)  
**Frequency**: Before major releases, if performance issues suspected

### What to Test

1. **Page Load Times**:

   - Home page loads in < 2 seconds
   - Newsletter list loads in < 3 seconds
   - PDF viewing starts in < 5 seconds

2. **API Response Times**:

   - DynamoDB queries < 500ms
   - Lambda functions < 2 seconds
   - S3 signed URL generation < 1 second

3. **Concurrent Users**:
   - System handles 10 concurrent users
   - No degradation with 5 simultaneous registrations

### Tools

- **Browser DevTools**: Network tab, Performance tab
- **AWS CloudWatch**: Lambda duration, DynamoDB latency
- **Lighthouse**: Performance audit

---

## 6. Security Testing

**Purpose**: Verify security measures work correctly  
**Priority**: High  
**Frequency**: Before production deployment, after security changes

### What to Test

1. **Authentication**:

   - [ ] Cannot access protected routes without login
   - [ ] Session expires after inactivity
   - [ ] Password requirements enforced
   - [ ] Rate limiting works (login attempts)

2. **Authorization**:

   - [ ] Viewers cannot access admin functions
   - [ ] Users can only see their own data
   - [ ] API endpoints require authentication

3. **Input Validation**:

   - [ ] XSS attempts are blocked
   - [ ] SQL injection attempts fail (DynamoDB mitigates)
   - [ ] File upload validation works
   - [ ] Access code format validation works

4. **Data Protection**:
   - [ ] Sensitive data encrypted in transit (HTTPS)
   - [ ] API keys not exposed in client code
   - [ ] Signed URLs expire correctly

### Tools

- **OWASP ZAP**: Security scanning
- **Browser DevTools**: Check for exposed secrets
- **Manual Testing**: Try to break security measures

---

## 7. Testing Priorities

### Phase 1: Foundation (Week 1)

**Must Have**:

1. ✅ Manual testing checklist
2. ✅ Unit tests for utility functions (access codes, validation)
3. ✅ Integration tests for Lambda functions

**Estimated Time**: 4-6 hours

### Phase 2: Critical Flows (Week 2)

**Must Have**:

1. ✅ E2E tests for registration flow
2. ✅ E2E tests for admin workflows
3. ✅ Security testing checklist

**Estimated Time**: 6-8 hours

### Phase 3: Comprehensive (Week 3+)

**Should Have**:

1. ⚠️ E2E tests for newsletter access
2. ⚠️ Performance testing
3. ⚠️ Component unit tests

**Estimated Time**: 4-6 hours

---

## 8. Test Organization

### Directory Structure

```
project-root/
├── src/
│   ├── utils/
│   │   └── __tests__/
│   │       ├── access-codes.test.ts
│   │       └── address-validation.test.ts
│   └── components/
│       └── __tests__/
│           └── RegistrationForm.test.ts
├── amplify/
│   └── functions/
│       └── __tests__/
│           ├── googlemaps-proxy.test.ts
│           └── address-validator.test.ts
├── e2e/
│   ├── registration.spec.ts
│   ├── admin.spec.ts
│   └── newsletter-access.spec.ts
├── tests/
│   ├── manual/
│   │   └── checklist.md
│   └── fixtures/
│       └── test-data.json
└── vitest.config.ts
```

---

## 9. Continuous Integration

**Purpose**: Run tests automatically on code changes  
**Priority**: Medium  
**Implementation**: GitHub Actions (recommended)

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
        env:
          TEST_URL: ${{ secrets.TEST_URL }}
```

---

## 10. Test Data Management

### Test Fixtures

Create reusable test data:

```typescript
// tests/fixtures/test-data.ts
export const testRecipient = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  address1: '123 Main St',
  city: 'City',
  state: 'State',
  zipcode: '12345',
  country: 'USA',
}

export const testAccessCode = 'KEL-TEST-1234'

export const testNewsletter = {
  title: 'Test Newsletter 2024',
  year: 2024,
}
```

### Test Environment

- Use separate test AWS account or sandbox environment
- Use test DynamoDB tables (prefixed with `test-`)
- Use test Cognito User Pool
- Mock external APIs (Google Maps) in unit tests

---

## 11. Testing Best Practices

### Do's ✅

- ✅ Test user-facing behavior, not implementation details
- ✅ Use descriptive test names: `it('should show error when access code is invalid')`
- ✅ Keep tests independent (no shared state)
- ✅ Test edge cases and error scenarios
- ✅ Use real data structures when possible
- ✅ Clean up test data after tests

### Don'ts ❌

- ❌ Don't over-mock (test real behavior when possible)
- ❌ Don't test framework code (Vue, AWS SDK)
- ❌ Don't write tests for simple getters/setters
- ❌ Don't test implementation details
- ❌ Don't write flaky tests (avoid timeouts, random data)

---

## 12. Recommended Tools

### Testing Frameworks

- **Vitest**: Unit and integration tests (Vite-native, fast)
- **Playwright**: E2E tests (modern, reliable, cross-browser)
- **Vue Test Utils**: Vue component testing

### Testing Utilities

- **@testing-library/vue**: Component testing utilities
- **MSW (Mock Service Worker)**: API mocking
- **happy-dom**: DOM implementation for tests

### Code Quality

- **ESLint**: Linting (already configured)
- **TypeScript**: Type checking (already configured)
- **Prettier**: Code formatting (already configured)

---

## 13. Getting Started

### Step 1: Set Up Unit Tests (30 minutes)

```bash
npm install -D vitest @vue/test-utils happy-dom
```

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: true,
  },
})
```

Write first test for `access-codes.ts` utilities.

### Step 2: Set Up E2E Tests (1 hour)

```bash
npm install -D @playwright/test
npx playwright install
```

Create `playwright.config.ts` and write first E2E test for registration flow.

### Step 3: Create Manual Testing Checklist (30 minutes)

Create `tests/manual/checklist.md` with pre-deployment checklist.

### Step 4: Set Up CI (1 hour)

Create `.github/workflows/test.yml` to run tests on PR.

---

## Summary

**Recommended Testing Approach for Small Family Site**:

1. **Start with Manual Testing** - Create checklist, test before each deployment
2. **Add Unit Tests for Utilities** - Test access code validation, formatting, etc.
3. **Add Integration Tests for Lambdas** - Test API integrations, error handling
4. **Add E2E Tests for Critical Flows** - Registration, admin workflows
5. **Add CI/CD** - Automate test running

**Total Estimated Setup Time**: 8-12 hours  
**Ongoing Maintenance**: 1-2 hours per week

**Key Principle**: Start simple, add tests as you find bugs. Don't aim for 100% coverage - focus on critical paths and edge cases.

---

_Last Updated: 2025-01-XX_
