# High Priority Items - Implementation Plan

**Date**: 2025-01-XX  
**Purpose**: Practical implementation recommendations for high-priority architecture gaps

---

## 🔴 Critical Items (Must Implement)

### 1. GDPR Data Export Functionality

**Priority**: **CRITICAL** - Required for GDPR compliance  
**Effort**: Medium (2-4 hours)  
**Complexity**: Medium

#### Recommended Implementation Approach

**Option A: Simple Admin Function (Recommended for Small Site)**

Create a Lambda function that admins can call to export user data:

**Implementation Steps**:

1. **Create Lambda Function**: `amplify/functions/export-user-data/`

```typescript
// amplify/functions/export-user-data/handler.ts
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import {
  CognitoIdentityProviderClient,
  AdminGetUserCommand,
} from '@aws-sdk/client-cognito-identity-provider'

const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({}))
const cognitoClient = new CognitoIdentityProviderClient({})

export const handler = async (event: any) => {
  // 1. Verify admin authentication (from Cognito token)
  // 2. Get user email from request
  // 3. Query NewsletterUser by email
  // 4. Query AccessCode by usedBy (NewsletterUser ID)
  // 5. Query Recipient by accessCode match
  // 6. Format as JSON
  // 7. Return JSON response
}
```

2. **Add to Backend**: `amplify/backend.ts`

```typescript
import { exportUserData } from './functions/export-user-data/resource'

const backend = defineBackend({
  // ... existing resources
  exportUserData,
})

// Add Function URL with authentication
const exportFunctionUrl = backend.exportUserData.resources.lambda.addFunctionUrl({
  authType: FunctionUrlAuthType.AWS_IAM, // Require authentication
})
```

3. **Admin UI Button**: Add to user management page

```vue
<!-- In RecipientAdmin.vue or UserAdmin.vue -->
<Button label="Export User Data" @click="exportUserData(userEmail)" severity="secondary" />
```

**Option B: User Self-Service (Future Enhancement)**

Allow users to request their own data export via a simple form/button.

**Recommendation**: Start with **Option A** (admin function). It's simpler, meets GDPR requirements, and is appropriate for a small family site. Users can contact admin to request export.

#### Implementation Checklist

- [ ] Create `export-user-data` Lambda function
- [ ] Implement data aggregation logic (NewsletterUser + AccessCode + Recipient)
- [ ] Format JSON export according to GDPR spec
- [ ] Add authentication/authorization (admin only)
- [ ] Add Function URL or API Gateway endpoint
- [ ] Create admin UI button/functionality
- [ ] Test export with sample user
- [ ] Document in privacy policy

#### Estimated Time: 2-4 hours

---

### 2. Data Breach Notification Process

**Priority**: **CRITICAL** - Required for GDPR compliance  
**Effort**: Low (1-2 hours)  
**Complexity**: Low

#### Recommended Implementation Approach

**Simple Documentation + Basic Monitoring**

For a small family newsletter site, a formal breach detection system is overkill. Focus on:

1. **Document the Process** (Simple Procedure Document)

Create `DATA_BREACH_RESPONSE_PROCEDURE.md`:

```markdown
# Data Breach Response Procedure

## When to Notify

Notify supervisory authority if breach is "likely to result in a risk to rights and freedoms"
Notify users if breach is "likely to result in a HIGH risk"

## Response Steps

1. **Immediate Actions** (within 1 hour):

   - Assess what happened
   - Document incident (what, when, who affected)
   - Take immediate action (revoke access, fix vulnerability)

2. **Risk Assessment** (within 24 hours):

   - Was data actually accessed? By whom?
   - What data was affected?
   - Is there ongoing risk?

3. **Notification Decision** (within 48 hours):

   - Low risk: Document only, no notification needed
   - Medium risk: Notify supervisory authority within 72 hours
   - High risk: Notify both authority and users

4. **Notification** (if required):
   - Supervisory Authority: [Contact info]
   - Users: Email template below

## Contact Information

- Supervisory Authority: [Your local DPA - e.g., German/Portuguese DPA]
- Internal Contact: [Your email]

## Email Template

[Template for notifying users]
```

2. **Basic CloudWatch Alarms** (Optional but Recommended)

Set up simple alarms for obvious breaches:

```typescript
// In amplify/backend.ts or separate CDK stack
import { Alarm, Metric } from 'aws-cdk-lib/aws-cloudwatch'

// Alarm for unusual DynamoDB access patterns
const unusualAccessAlarm = new Alarm(stack, 'UnusualAccessAlarm', {
  metric: new Metric({
    namespace: 'AWS/DynamoDB',
    metricName: 'ConsumedReadCapacityUnits',
    // ... configure threshold
  }),
  threshold: 1000, // Adjust based on normal usage
  evaluationPeriods: 1,
})
```

3. **Manual Monitoring** (For Small Site)

- Check CloudWatch logs weekly
- Review failed login attempts
- Monitor for unusual activity

#### Implementation Checklist

- [ ] Create `DATA_BREACH_RESPONSE_PROCEDURE.md` document
- [ ] Add supervisory authority contact information
- [ ] Create user notification email template
- [ ] Set up basic CloudWatch alarms (optional)
- [ ] Document in privacy policy where to report breaches
- [ ] Review procedure annually

#### Estimated Time: 1-2 hours

---

## 🟠 High Priority Items (Should Address Soon)

### 3. Duplicate Account Prevention

**Priority**: **MEDIUM-HIGH** - User experience  
**Effort**: Low (30 minutes - 1 hour)  
**Complexity**: Low

#### Recommended Implementation Approach

**Document Existing Behavior + Improve UX**

Cognito already handles email uniqueness, but improve the user experience:

1. **Document Current Behavior**

Add to `ARCHITECTURE.md`:

```markdown
#### Duplicate Account Prevention

**Email Uniqueness**: Cognito enforces email uniqueness at the User Pool level. Attempting to register with an existing email will fail with error: "An account with this email already exists."

**Error Handling**:

- Frontend catches Cognito error
- Displays user-friendly message: "An account with this email already exists. Please log in instead."
- Provides "Forgot Password" link if user forgot they registered
- Provides "Log In" link
```

2. **Improve Registration Error Handling**

Update registration component:

```vue
<!-- In registration component -->
<template>
  <div v-if="registrationError">
    <Message severity="error">
      {{ registrationError }}
      <div class="mt-2">
        <Button label="Log In" @click="goToLogin" />
        <Button label="Forgot Password?" @click="goToForgotPassword" />
      </div>
    </Message>
  </div>
</template>

<script setup>
const handleRegistrationError = (error: any) => {
  if (error.code === 'UsernameExistsException') {
    registrationError.value = 'An account with this email already exists. Please log in instead, or use "Forgot Password" if you don\'t remember your password.'
  } else {
    registrationError.value = 'Registration failed. Please try again.'
  }
}
</script>
```

#### Implementation Checklist

- [ ] Document Cognito email uniqueness enforcement
- [ ] Update registration error handling in UI
- [ ] Add "Forgot Password" link to error message
- [ ] Add "Log In" link to error message
- [ ] Test duplicate registration attempt flow

#### Estimated Time: 30 minutes - 1 hour

---

### 4. Access Code Format Validation

**Priority**: **MEDIUM** - User experience  
**Effort**: Low (1 hour)  
**Complexity**: Low

#### Recommended Implementation Approach

**Frontend Validation + Auto-formatting**

1. **Add Format Validation**

```typescript
// src/utils/access-codes.ts
export const ACCESS_CODE_REGEX = /^KEL-[A-Z0-9]{4}-[A-Z0-9]{4}$/i

export function validateAccessCodeFormat(code: string): boolean {
  return ACCESS_CODE_REGEX.test(code)
}

export function normalizeAccessCode(code: string): string {
  // Remove spaces, convert to uppercase
  return code.replace(/\s+/g, '').toUpperCase()
}

export function formatAccessCodeInput(input: string): string {
  // Auto-format as user types: KEL-XXXX-XXXX
  const cleaned = input.replace(/[^A-Z0-9]/gi, '').toUpperCase()
  if (cleaned.startsWith('KEL')) {
    const parts = cleaned.slice(3).match(/.{1,4}/g) || []
    return 'KEL-' + parts.slice(0, 2).join('-')
  }
  return cleaned
}
```

2. **Update Registration Form**

```vue
<!-- In registration component -->
<template>
  <InputText
    v-model="accessCode"
    @input="accessCode = formatAccessCodeInput($event.target.value)"
    placeholder="KEL-XXXX-XXXX"
    :class="{ 'p-invalid': accessCodeError }"
  />
  <small v-if="accessCodeError" class="p-error">
    {{ accessCodeError }}
  </small>
</template>

<script setup>
import { formatAccessCodeInput, validateAccessCodeFormat } from '@/utils/access-codes'

const validateCode = () => {
  const normalized = normalizeAccessCode(accessCode.value)
  if (!validateAccessCodeFormat(normalized)) {
    accessCodeError.value = 'Invalid format. Please enter code as KEL-XXXX-XXXX'
    return false
  }
  accessCode.value = normalized
  accessCodeError.value = ''
  return true
}
</script>
```

3. **Backend Validation** (Already handled, but document)

Document that backend also validates format before querying database.

#### Implementation Checklist

- [ ] Add format validation utility functions
- [ ] Add auto-formatting to input field
- [ ] Add case-insensitive matching (normalize to uppercase)
- [ ] Add clear error messages for invalid format
- [ ] Test with various input formats
- [ ] Document validation in architecture

#### Estimated Time: 1 hour

---

### 5. SQS Dead Letter Queue (DLQ) Handling

**Priority**: **MEDIUM** - Operational reliability  
**Effort**: Medium (2-3 hours)  
**Complexity**: Medium

#### Recommended Implementation Approach

**Configure DLQ + Basic Monitoring**

1. **Configure DLQ in Backend**

```typescript
// amplify/backend.ts
import { DeadLetterQueue } from 'aws-cdk-lib/aws-sqs'

const addressValidationDLQ = new DeadLetterQueue({
  maxReceiveCount: 3, // Retry 3 times before DLQ
  queue: new Queue(stack, 'AddressValidationDLQ', {
    retentionPeriod: Duration.days(14),
  }),
})

const addressValidationQueue = new Queue(
  backend.addressValidator.resources.lambda.stack,
  'AddressValidationQueue',
  {
    visibilityTimeout: Duration.seconds(300),
    retentionPeriod: Duration.days(14),
    receiveMessageWaitTime: Duration.seconds(20),
    deadLetterQueue: addressValidationDLQ, // Add DLQ
  },
)
```

2. **CloudWatch Alarm for DLQ**

```typescript
// Add to backend.ts or separate monitoring stack
import { Alarm, Metric } from 'aws-cdk-lib/aws-cloudwatch'

const dlqAlarm = new Alarm(stack, 'AddressValidationDLQAlarm', {
  metric: new Metric({
    namespace: 'AWS/SQS',
    metricName: 'ApproximateNumberOfMessagesVisible',
    dimensionsMap: {
      QueueName: addressValidationDLQ.queue.queueName,
    },
  }),
  threshold: 1, // Alert if any messages in DLQ
  evaluationPeriods: 1,
  alarmDescription: 'Alert when address validation messages fail and go to DLQ',
})
```

3. **Admin UI to View Failed Validations** (Optional, Future)

For now, manual check via AWS Console is sufficient for small site.

#### Implementation Checklist

- [ ] Configure DLQ for address validation queue
- [ ] Set retry count (3 retries recommended)
- [ ] Set up CloudWatch alarm for DLQ messages
- [ ] Document manual retry process (via AWS Console)
- [ ] Test DLQ by causing a validation failure
- [ ] Document DLQ handling in architecture

#### Estimated Time: 2-3 hours

---

### 6. Google Maps API Failure Handling

**Priority**: **MEDIUM** - Service reliability  
**Effort**: Low (1-2 hours)  
**Complexity**: Low

#### Recommended Implementation Approach

**Improve Error Handling + Retry Logic**

1. **Update Address Validator Lambda**

```typescript
// amplify/functions/address-validator/handler.ts
async function validateWithGoogleMaps(address: Address): Promise<ValidationResult> {
  const maxRetries = 3
  const retryDelays = [1000, 5000, 30000] // 1s, 5s, 30s

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await googleMapsClient.validateAddress(address)
      return { status: 'valid', result }
    } catch (error) {
      // Check if retryable error
      if (isRetryableError(error) && attempt < maxRetries - 1) {
        await sleep(retryDelays[attempt])
        continue
      }

      // Rate limit exceeded
      if (error.code === 'RATE_LIMIT_EXCEEDED') {
        // Mark as error, can retry later
        return { status: 'error', message: 'Rate limit exceeded, will retry later' }
      }

      // Other errors
      return { status: 'error', message: error.message }
    }
  }

  return { status: 'error', message: 'Validation failed after retries' }
}

function isRetryableError(error: any): boolean {
  // Network errors, timeouts, 5xx errors are retryable
  return (
    error.code === 'ECONNRESET' ||
    error.code === 'ETIMEDOUT' ||
    (error.statusCode >= 500 && error.statusCode < 600)
  )
}
```

2. **Update Recipient Status on Error**

```typescript
// In address-validator handler
if (result.status === 'error') {
  await updateRecipientValidationStatus(recipientId, {
    status: 'error',
    message: result.message,
    validatedAt: new Date(),
  })
}
```

3. **Document Manual Override Process**

Add to admin UI: Allow admin to manually mark validation as "overridden" if needed.

#### Implementation Checklist

- [ ] Add retry logic with exponential backoff
- [ ] Handle rate limit errors gracefully
- [ ] Mark validation as "error" on failure
- [ ] Set up CloudWatch alarm for API failures (optional)
- [ ] Document manual override process
- [ ] Test with API failure scenarios

#### Estimated Time: 1-2 hours

---

### 7. DynamoDB Capacity Planning & Throttling

**Priority**: **MEDIUM** - Performance  
**Effort**: Low (30 minutes - 1 hour)  
**Complexity**: Low

#### Recommended Implementation Approach

**Document Current Setup + Basic Monitoring**

1. **Document Current Configuration**

Add to `ARCHITECTURE.md`:

```markdown
#### DynamoDB Capacity Configuration

**Current Mode**: On-Demand (default for Amplify Gen 2)

**Benefits**:

- Auto-scales based on traffic
- No capacity planning needed
- Pay only for what you use

**Throttling**: DynamoDB automatically handles throttling by scaling up. For on-demand mode, throttling is rare and typically only occurs during sudden traffic spikes.

**Monitoring**: CloudWatch metrics available:

- `ConsumedReadCapacityUnits`
- `ConsumedWriteCapacityUnits`
- `ThrottledRequests`
```

2. **Set Up Basic Throttling Alarm** (Optional)

```typescript
// In backend.ts or monitoring stack
const throttlingAlarm = new Alarm(stack, 'DynamoDBThrottlingAlarm', {
  metric: new Metric({
    namespace: 'AWS/DynamoDB',
    metricName: 'ThrottledRequests',
    // ... table dimensions
  }),
  threshold: 1, // Alert on any throttling
  evaluationPeriods: 1,
})
```

3. **Application-Level Retry** (Already handled by AWS SDK)

AWS SDK automatically retries throttled requests with exponential backoff.

#### Implementation Checklist

- [ ] Document current capacity mode (on-demand)
- [ ] Document throttling behavior
- [ ] Set up CloudWatch alarm for throttling (optional)
- [ ] Document capacity planning considerations
- [ ] Review capacity metrics monthly

#### Estimated Time: 30 minutes - 1 hour

---

### 8. Monitoring & Alerting Strategy

**Priority**: **MEDIUM** - Operational excellence  
**Effort**: Medium (2-3 hours)  
**Complexity**: Medium

#### Recommended Implementation Approach

**Essential Alarms Only (Start Simple)**

For a small family newsletter site, focus on critical alarms:

1. **Essential CloudWatch Alarms**

```typescript
// amplify/monitoring.ts (new file) or add to backend.ts
import { Alarm, Metric } from 'aws-cdk-lib/aws-cloudwatch'
import { SnsTopic } from 'aws-cdk-lib/aws-sns'

const alertTopic = new SnsTopic(stack, 'AlertTopic', {
  displayName: 'YIR Website Alerts',
})

// 1. Lambda Errors
const lambdaErrorAlarm = new Alarm(stack, 'LambdaErrorAlarm', {
  metric: new Metric({
    namespace: 'AWS/Lambda',
    metricName: 'Errors',
    // ... function dimensions
  }),
  threshold: 5, // Alert if > 5 errors in 5 minutes
  evaluationPeriods: 1,
  alarmDescription: 'Alert on Lambda function errors',
})
lambdaErrorAlarm.addAlarmAction(new SnsAction(alertTopic))

// 2. SQS DLQ Messages (from item #5)
// 3. DynamoDB Throttling (from item #7)
// 4. High Error Rate (optional)
```

2. **Email Notifications**

```typescript
// Subscribe email to SNS topic
const emailSubscription = new Subscription(stack, 'EmailSubscription', {
  topic: alertTopic,
  protocol: SubscriptionProtocol.EMAIL,
  endpoint: 'your-email@example.com', // Your email
})
```

3. **Basic Dashboard** (Optional)

Create a simple CloudWatch dashboard with key metrics.

#### Implementation Checklist

- [ ] Create SNS topic for alerts
- [ ] Set up email subscription
- [ ] Create Lambda error alarm
- [ ] Create SQS DLQ alarm (from item #5)
- [ ] Create DynamoDB throttling alarm (from item #7)
- [ ] Test alarms by triggering errors
- [ ] Create basic CloudWatch dashboard (optional)
- [ ] Document monitoring strategy

#### Estimated Time: 2-3 hours

---

## 📋 Implementation Priority & Timeline

### Phase 1: Critical Items (Week 1)

1. ✅ **Data Breach Notification Process** (1-2 hours) - Documentation only
2. ✅ **GDPR Data Export** (2-4 hours) - Simple admin function

**Total**: 3-6 hours

### Phase 2: High Priority UX Items (Week 2)

3. ✅ **Duplicate Account Prevention** (30 min - 1 hour) - Improve error handling
4. ✅ **Access Code Format Validation** (1 hour) - Frontend validation

**Total**: 1.5-2 hours

### Phase 3: Operational Reliability (Week 3)

5. ✅ **SQS DLQ Handling** (2-3 hours) - Configure DLQ + alarms
6. ✅ **Google Maps API Failure Handling** (1-2 hours) - Retry logic
7. ✅ **DynamoDB Capacity Planning** (30 min - 1 hour) - Documentation
8. ✅ **Monitoring & Alerting** (2-3 hours) - Essential alarms

**Total**: 5.5-9 hours

### Total Estimated Time: 10-17 hours

---

## 🎯 Quick Wins (Do First)

1. **Data Breach Notification Process** (1-2 hours) - Just documentation
2. **Duplicate Account Prevention** (30 min) - Quick UX improvement
3. **Access Code Format Validation** (1 hour) - Quick UX improvement

**These three can be done in one afternoon!**

---

## 📝 Notes

- **Start Simple**: Don't over-engineer for a small family site
- **Iterate**: Implement basics first, enhance later if needed
- **Focus on Value**: Prioritize user experience and legal compliance
- **Document as You Go**: Update architecture docs as you implement

---

_Last Updated: 2025-01-XX_
