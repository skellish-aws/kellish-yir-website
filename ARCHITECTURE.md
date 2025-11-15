# Architecture Documentation

## Overview

**kellish-yir-website** is a Year-in-Review newsletter management system that enables administrators to manage recipients, validate addresses, generate access codes, and distribute newsletters. The application is built as a full-stack serverless web application using Vue 3, AWS Amplify Gen 2, and modern cloud infrastructure.

### Core Purpose

- **Recipient Management**: CRUD operations for newsletter recipients with address validation
- **Address Validation**: Automated validation using Google Maps Address Validation API (US and international)
- **Access Control**: Unique access code generation and management for newsletter access
- **Newsletter Distribution**: Management of newsletters and access links for recipients
- **Bulk Operations**: Import recipients from Excel/CSV, bulk code generation, bulk deletion

---

## Technology Stack

### Frontend

- **Framework**: Vue 3 (Composition API)
- **UI Library**: PrimeVue 4.3.5 with Aura theme
- **Styling**: Tailwind CSS 3.4.17 + PrimeFlex 4.0.0
- **State Management**: Pinia 3.0.1
- **Routing**: Vue Router 4.5.0
- **Build Tool**: Vite 6.2.4
- **TypeScript**: 5.8.3 (strict mode)
- **PDF Processing**: PDF.js 5.3.31 (for thumbnail generation)

### Backend

- **Framework**: AWS Amplify Gen 2
- **Runtime**: Node.js (Lambda functions)
- **Database**: Amazon DynamoDB (via Amplify Data)
- **Authentication**: Amazon Cognito (User Pools)
- **Storage**: Amazon S3
- **Compute**: AWS Lambda
- **Queue**: Amazon SQS (for async address validation)
- **Infrastructure as Code**: AWS CDK (via Amplify Gen 2)

### External Services

- **Google Maps Address Validation API**: Address validation and standardization
- **AWS Systems Manager Parameter Store**: Secure storage for API keys

---

## System Architecture

### High-Level Architecture

```
┌─────────────────┐
│   Vue 3 Client  │
│   (Browser)     │
└────────┬────────┘
         │
         │ HTTPS
         │
┌────────▼────────────────────────────────────────────┐
│           AWS Amplify Gen 2 Backend                 │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐                │
│  │   Cognito    │  │  DynamoDB    │                │
│  │  (Auth)      │  │  (Data)      │                │
│  └──────────────┘  └──────────────┘                │
│                                                      │
│  ┌──────────────────────────────────────┐           │
│  │         Lambda Functions             │           │
│  │  • googlemaps-proxy                  │           │
│  │  • queue-address-validation         │           │
│  │  • address-validator (SQS consumer)  │           │
│  └──────────────────────────────────────┘           │
│                                                      │
│  ┌──────────────┐                                   │
│  │  SQS Queue   │                                   │
│  │  (Async)     │                                   │
│  └──────────────┘                                   │
│                                                      │
│  ┌──────────────┐                                   │
│  │  S3 Bucket   │                                   │
│  │  (Storage)   │                                   │
│  └──────────────┘                                   │
└──────────────────────────────────────────────────────┘
         │
         │ HTTPS
         │
┌────────▼────────┐
│  Google Maps    │
│  Address API    │
└─────────────────┘
```

### Frontend Architecture

#### Application Structure

```
src/
├── main.ts                 # Application entry point
├── App.vue                 # Root component with navigation
├── amplify-config.ts       # Amplify configuration loader
├── router/
│   └── index.ts           # Vue Router with auth guards
├── stores/
│   ├── authStore.ts       # Authentication state (Pinia)
│   └── counter.ts         # Example store
├── views/
│   ├── Home.vue           # Public home page
│   ├── Login.vue          # Authentication page
│   ├── NewsletterAdmin.vue # Newsletter management
│   └── RecipientAdmin.vue  # Recipient management (main feature)
├── components/            # Reusable Vue components
├── utils/
│   ├── googlemaps-validator.ts    # Address validation client
│   ├── address-validation-queue.ts # Queue integration
│   ├── access-codes.ts            # Access code utilities
│   ├── pdfWorker.ts               # PDF.js worker setup
│   ├── pdfThumbnail.ts            # Thumbnail generation
│   ├── thumbnailGenerator.ts     # Thumbnail utilities
│   └── inactivityTracker.ts       # Session management
└── assets/                # Static assets and styles
```

#### Key Frontend Patterns

1. **Composition API**: All components use Vue 3 Composition API with `<script setup>`
2. **Type Safety**: Full TypeScript coverage with strict mode
3. **Component Library**: PrimeVue components for consistent UI
4. **Dark Mode**: System-aware dark mode via Tailwind CSS
5. **Responsive Design**: Mobile-first approach with Tailwind utilities

### Backend Architecture

#### Amplify Gen 2 Structure

```
amplify/
├── backend.ts              # Main backend definition
├── auth/
│   └── resource.ts        # Cognito configuration
├── data/
│   └── resource.ts        # DynamoDB schema (GraphQL)
├── storage/
│   └── resource.ts        # S3 bucket configuration
└── functions/
    ├── googlemaps-proxy/
    │   ├── handler.ts     # Google Maps API proxy
    │   └── resource.ts
    ├── queue-address-validation/
    │   ├── handler.ts     # Queue validation requests
    │   └── resource.ts
    └── address-validator/
        ├── handler.ts     # Process validation queue
        └── resource.ts
```

#### Lambda Functions

1. **googlemaps-proxy**
   - **Purpose**: Proxy requests to Google Maps Address Validation API
   - **Trigger**: Function URL (public, no auth)
   - **Permissions**: SSM read access for API key
   - **CORS**: Handled in handler code

2. **queue-address-validation**
   - **Purpose**: Queue address validation requests to SQS
   - **Trigger**: Function URL (public, no auth - auth handled in app)
   - **Permissions**: SQS send, DynamoDB read/write
   - **Input**: Recipient ID(s) to validate

3. **address-validator**
   - **Purpose**: Process address validation from SQS queue
   - **Trigger**: SQS event source (batch size: 10)
   - **Permissions**: SSM read, DynamoDB read/write
   - **Process**: Validates addresses via Google Maps, updates DynamoDB

#### Data Flow: Address Validation

```
1. User enters/edits address in RecipientAdmin.vue
2. Frontend calls queue-address-validation Lambda (Function URL)
3. Lambda queues message to SQS with recipient ID
4. SQS triggers address-validator Lambda (batch processing)
5. address-validator:
   a. Fetches recipient from DynamoDB
   b. Calls googlemaps-proxy Lambda
   c. googlemaps-proxy calls Google Maps API
   d. address-validator processes response
   e. Updates DynamoDB with validation results
6. Frontend polls/refreshes to see updated status
```

---

## Data Models

### DynamoDB Schema (via Amplify Data)

#### Recipient Model

```typescript
{
  id: string (auto-generated)
  title?: string
  firstName: string (required)
  secondName?: string
  lastName: string (required)
  suffix?: string
  mailingName?: string  // Override for envelope/label
  address1?: string
  address2?: string
  city?: string
  state?: string
  zipcode?: string
  country?: string
  email?: string
  wantsPaper: boolean (default: true)
  sendCard: boolean (default: true)
  accessCode?: string
  accessCodeUsed: boolean (default: false)
  accessCodeUsedAt?: datetime
  // Address validation fields
  addressValidationStatus: string (default: 'pending')
    // Values: 'pending', 'queued', 'valid', 'invalid', 'error', 'overridden'
  addressValidationMessage?: string
  addressValidatedAt?: datetime
  validatedAddress1?: string
  validatedAddress2?: string
  validatedCity?: string
  validatedState?: string
  validatedZipcode?: string
  validatedCountry?: string
  accessLinks: hasMany(NewsletterAccessLink)
  createdAt: datetime (required)
  updatedAt: datetime (required)
}
```

#### Newsletter Model

```typescript
{
  id: string (auto-generated)
  title: string (required)
  year: integer (required)
  hasCardImage?: boolean
  cardWidthIn?: float
  cardHeightIn?: float
  pdfWidthIn?: float
  pdfHeightIn?: float
  pdfPageCount?: integer
  accessLinks: hasMany(NewsletterAccessLink)
}
```

#### AccessCode Model

```typescript
{
  id: string (auto-generated)
  code: string (required)  // Format: "KEL-XXXX-XXXX"
  recipientName: string (required)
  recipientAddress?: string
  used: boolean (default: false)
  usedAt?: datetime
  usedBy?: string  // NewsletterUser ID
  createdAt: datetime (required)
}
```

#### NewsletterAccessLink Model

```typescript
{
  id: string (auto-generated)
  uniqueUrlToken: string (required)
  used: boolean (default: false)
  newsletterId: string (required)
  recipientId: string (required)
  newsletter: belongsTo(Newsletter)
  recipient: belongsTo(Recipient)
}
```

#### NewsletterUser Model

```typescript
{
  id: string (auto-generated)
  email: string (required)
  accessCode: string (required)
  registeredAt: datetime (required)
  lastLoginAt?: datetime
  accessLevel: string (default: 'viewer')  // 'viewer' | 'admin'
}
```

### Authorization Rules

- **Recipient, Newsletter, AccessCode, NewsletterAccessLink**: Admin group only
- **NewsletterUser**: Admin group + owner (self-access)

---

## Key Features & Workflows

### 1. Recipient Management

**Location**: `src/views/RecipientAdmin.vue`

**Features**:
- CRUD operations (Create, Read, Update, Delete)
- Bulk import from Excel/CSV
- Search and filter (name, email, city, state, access code)
- Status filtering (access code status, address validation status)
- Bulk operations (delete, generate access codes)
- Address validation integration
- Dark mode support

**Workflow - Add Recipient**:
1. User clicks "Add Recipient"
2. Form dialog opens
3. User enters recipient details
4. If address provided, validation can be triggered
5. On save, recipient created in DynamoDB
6. If address exists, validation queued automatically

**Workflow - Import Recipients**:
1. User clicks "Import CSV"
2. File picker opens
3. File parsed (XLSX library)
4. Preview shown with validation
5. User confirms import
6. Recipients created in batch
7. Address validation queued for each recipient with address

### 2. Address Validation

**Architecture**: Asynchronous queue-based processing

**Status Flow**:
```
pending → queued → (valid | invalid | error)
```

**Validation Logic**:
- **US Addresses**: Uses USPS DPV confirmation codes ("Y", "D", "S" = deliverable)
- **International Addresses**: Uses Google Maps verdict
- **SUB_PREMISE** addresses (apartments): Considered deliverable
- Auto-fills missing fields (zipcode, state, city, country)

**UI Indicators**:
- ✓ Valid (green)
- ⚠️ Invalid (yellow)
- ❌ Error (red)
- ⏳ Queued (blue, pulsing)
- ? Pending (gray)

### 3. Access Code Management

**Format**: `KEL-XXXX-XXXX` (e.g., "KEL-A1B2-C3D4")

**Generation**:
- Unique codes generated per recipient
- Stored in both `Recipient.accessCode` and `AccessCode.code`
- Bulk generation available

**Usage Tracking**:
- `accessCodeUsed` flag
- `accessCodeUsedAt` timestamp
- Links to `NewsletterUser` who used it

### 4. Newsletter Management

**Location**: `src/views/NewsletterAdmin.vue`

**Features**:
- Create/edit newsletters
- Upload PDF files
- Generate thumbnails
- Manage access links

---

## Security & Authentication

### Authentication

- **Provider**: Amazon Cognito User Pools
- **Method**: Email/password
- **Groups**: `Admin` (required for all admin features)
- **Session**: JWT tokens (ID token, access token, refresh token)

### Authorization

- **Route Guards**: Vue Router `beforeEach` checks authentication and admin group
- **API Authorization**: Amplify Data uses Cognito groups for DynamoDB access
- **Storage Authorization**: S3 bucket policies based on Cognito groups

### API Key Management

- **Storage**: AWS Systems Manager Parameter Store (SecureString)
- **Parameter Path**: `/kellish-yir/googlemaps/api-key`
- **Access**: Lambda functions have IAM permissions to read
- **Rotation**: Update parameter without code deployment

### CORS

- Handled in Lambda function code (not at Function URL level)
- Allows frontend origin

### Session Management

- **Inactivity Tracking**: 15-minute timeout
- **Token Refresh**: Automatic via Amplify SDK
- **Logout**: Clears session and redirects

---

## External Integrations

### Google Maps Address Validation API

**Purpose**: Validate and standardize addresses (US and international)

**Integration**:
- **Proxy Pattern**: Frontend → `googlemaps-proxy` Lambda → Google Maps API
- **Why Proxy**: 
  - Keeps API key server-side
  - Handles CORS
  - Rate limiting control
  - Error handling

**API Key**:
- Stored in SSM Parameter Store
- Lambda fetches on invocation (with caching)
- Restricted to Address Validation API only

**Pricing**: $0.00475 per request (after $200/month free credit)

### AWS Services Integration

- **DynamoDB**: Primary data store (via Amplify Data/GraphQL)
- **S3**: Newsletter PDFs and thumbnails
- **SQS**: Async address validation queue
- **SSM Parameter Store**: API keys and secrets
- **CloudWatch**: Logging and monitoring

---

## Deployment & Configuration

### Development

```bash
# Start Amplify sandbox (hot-reload backend)
npm run amplify:sandbox

# Start Vite dev server (hot-reload frontend)
npm run dev
```

### Production Deployment

```bash
# One-time deployment
npm run amplify:deploy

# Build frontend
npm run build
```

### AWS Profile

- **Profile Name**: `softsys`
- **Configuration**: `~/.aws/credentials` and `~/.aws/config`
- **Usage**: All AWS CLI commands use `AWS_PROFILE=softsys`

### Environment Configuration

- **Amplify Outputs**: `amplify_outputs.json` (auto-generated)
- **SSM Parameters**: Created manually via AWS Console or CLI
- **No `.env` files**: All config via Amplify outputs and SSM

### Required SSM Parameters

1. `/kellish-yir/googlemaps/api-key` (SecureString)

---

## File Structure

### Root Directory

```
kellish-yir-website/
├── amplify/              # Backend infrastructure
├── src/                  # Frontend source code
├── public/               # Static assets
├── helper-scripts/       # Utility scripts
├── samples/              # Example files
├── amplify_outputs.json  # Generated config (git-ignored)
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

### Key Configuration Files

- `vite.config.ts`: Vite build configuration
- `tailwind.config.js`: Tailwind CSS configuration
- `tsconfig.json`: TypeScript configuration
- `amplify/backend.ts`: Amplify backend definition
- `amplify/data/resource.ts`: DynamoDB schema

---

## Development Patterns

### TypeScript

- **Strict Mode**: Enabled
- **Type Generation**: Amplify generates GraphQL types
- **Component Props**: `defineProps<T>()` with interfaces
- **Composables**: Type-safe utility functions

### State Management

- **Pinia Stores**: For global state (auth, etc.)
- **Component State**: `ref()` and `reactive()` for local state
- **Server State**: Amplify Data client handles caching

### Error Handling

- **Frontend**: Try-catch with user-friendly messages
- **Backend**: Lambda error responses with status codes
- **Logging**: `console.error` for production errors

### Code Organization

- **Views**: Page-level components
- **Components**: Reusable UI components
- **Utils**: Pure functions and utilities
- **Stores**: Global state management
- **Router**: Route definitions and guards

---

## Performance Considerations

### Frontend

- **Code Splitting**: Vue Router lazy loading
- **Bundle Size**: Tree-shaking via Vite
- **Image Optimization**: Thumbnail generation for PDFs
- **Caching**: Amplify Data client caching

### Backend

- **Lambda Cold Starts**: Minimized with small bundle sizes
- **SQS Batching**: Process 10 addresses per Lambda invocation
- **DynamoDB**: Efficient queries with proper indexes
- **API Key Caching**: Lambda-level caching for SSM parameters

### Scalability

- **Serverless**: Auto-scales with demand
- **SQS**: Handles burst traffic
- **DynamoDB**: NoSQL scales horizontally
- **S3**: Unlimited storage

---

## Monitoring & Debugging

### Logging

- **Frontend**: Browser console (development), CloudWatch (production)
- **Backend**: CloudWatch Logs for Lambda functions
- **Log Groups**: `/aws/lambda/amplify-*`

### Debugging Tools

- **Vue DevTools**: Browser extension
- **AWS CloudWatch**: Lambda logs and metrics
- **Amplify Console**: Deployment status

### Common Debugging Commands

```bash
# View Lambda logs
aws logs tail /aws/lambda/amplify-* --follow --profile softsys

# Check SSM parameter
aws ssm get-parameter --name "/kellish-yir/googlemaps/api-key" --profile softsys
```

---

## Known Limitations & Future Considerations

### Current Limitations

1. **Address Validation**: Queue-based, not real-time (acceptable for async workflow)
2. **No Email Notifications**: Access codes distributed manually
3. **Single Admin Group**: No role-based access control beyond Admin
4. **No Audit Logging**: Changes not tracked in detail
5. **CSV Import**: Basic validation, could be enhanced

### Potential Enhancements

1. **Real-time Updates**: WebSocket/GraphQL subscriptions for validation status
2. **Email Integration**: Send access codes via SES
3. **Advanced Filtering**: More filter options (date ranges, etc.)
4. **Export Functionality**: Export recipients to CSV/Excel
5. **Batch Validation**: Manual trigger for bulk re-validation
6. **Address History**: Track address changes over time
7. **Multi-language Support**: i18n for international users
8. **Analytics Dashboard**: Usage statistics and metrics

### Technical Debt

1. **Unused Lambda Functions**: `addresszen-proxy`, `geoapify-proxy`, `usps-proxy` (legacy, can be removed)
2. **Type Safety**: Some `any` types in backend.ts (CDK workarounds)
3. **Error Messages**: Could be more user-friendly in some areas
4. **Testing**: No automated tests (unit, integration, e2e)

---

## Dependencies

### Critical Dependencies

- `aws-amplify`: Amplify SDK for frontend
- `@aws-amplify/backend`: Amplify Gen 2 backend framework
- `vue`: Frontend framework
- `primevue`: UI component library
- `@aws-sdk/client-ssm`: SSM Parameter Store client (Lambda)

### Development Dependencies

- `vite`: Build tool
- `typescript`: Type checking
- `vue-tsc`: Vue TypeScript compiler
- `eslint`: Linting
- `prettier`: Code formatting

---

## Conclusion

This architecture provides a scalable, serverless foundation for managing newsletter recipients with address validation. The separation of concerns (frontend/backend), use of managed services (Amplify, Lambda, DynamoDB), and secure API key management make it production-ready while maintaining developer experience.

**Key Strengths**:
- ✅ Serverless scalability
- ✅ Type-safe full-stack
- ✅ Secure API key management
- ✅ Modern UI/UX
- ✅ Async processing for validation

**Areas for Growth**:
- Testing infrastructure
- Real-time updates
- Enhanced error handling
- Performance monitoring

---

*Last Updated: 2025-01-XX*
*Version: 1.0*

