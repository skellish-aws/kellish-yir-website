<template>
  <div class="register-container">
    <div class="register-card">
      <h1 class="text-3xl font-bold mb-6">Register for Newsletter Access</h1>

      <!-- Access Code Input -->
      <div class="mb-6">
        <label for="accessCode" class="block text-sm font-medium mb-2">
          Invitation Code <span class="text-red-500">*</span>
        </label>
        <InputText
          id="accessCode"
          v-model="accessCode"
          @input="handleAccessCodeInput"
          placeholder="KEL-XXXX-XXXX"
          :class="{ 'p-invalid': accessCodeError }"
          class="w-full"
        />
        <small v-if="accessCodeError" class="p-error">{{ accessCodeError }}</small>
        <small v-else class="text-gray-500"
          >Enter the invitation code from your registration link</small
        >
      </div>

      <!-- Registration Form (shown after access code validation) -->
      <div v-if="accessCodeValid && !registrationComplete">
        <Message v-if="registrationError" severity="error" class="mb-4">
          <div>{{ registrationError }}</div>
          <div class="mt-2 flex gap-2">
            <Button label="Log In" @click="goToLogin" size="small" />
            <Button label="Forgot Password?" @click="goToForgotPassword" size="small" text />
          </div>
        </Message>

        <div class="mb-4">
          <label for="name" class="block text-sm font-medium mb-2">
            Full Name <span class="text-red-500">*</span>
          </label>
          <InputText id="name" v-model="name" required class="w-full" />
        </div>

        <!-- Identity Validation (based on invitation type) -->
        <div v-if="needsZipCode" class="mb-4">
          <label for="zipCode" class="block text-sm font-medium mb-2">
            Zip Code <span class="text-red-500">*</span>
          </label>
          <InputText id="zipCode" v-model="zipCode" required class="w-full" />
          <small class="text-gray-500">Enter the zip code from your mailing address</small>
        </div>

        <div v-if="needsEmail" class="mb-4">
          <label for="validationEmail" class="block text-sm font-medium mb-2">
            Email Address <span class="text-red-500">*</span>
          </label>
          <InputText
            id="validationEmail"
            v-model="validationEmail"
            type="email"
            required
            class="w-full"
          />
          <small class="text-gray-500">Enter the email address used for your invitation</small>
        </div>

        <div class="mb-4">
          <label for="email" class="block text-sm font-medium mb-2">
            Account Email <span class="text-red-500">*</span>
          </label>
          <InputText id="email" v-model="email" type="email" required class="w-full" />
          <small class="text-gray-500">This will be your login email address</small>
        </div>

        <div class="mb-4">
          <label for="password" class="block text-sm font-medium mb-2">
            Password <span class="text-red-500">*</span>
          </label>
          <Password
            id="password"
            v-model="password"
            :feedback="true"
            toggleMask
            required
            class="w-full"
          />
        </div>

        <div class="mb-6">
          <label for="confirmPassword" class="block text-sm font-medium mb-2">
            Confirm Password <span class="text-red-500">*</span>
          </label>
          <Password
            id="confirmPassword"
            v-model="confirmPassword"
            :feedback="false"
            toggleMask
            required
            class="w-full"
          />
        </div>

        <Button
          label="Register"
          @click="handleRegister"
          :loading="registering"
          :disabled="!isFormValid"
          class="w-full"
        />
      </div>

      <!-- Success Message -->
      <Message v-if="registrationComplete" severity="success" class="mb-4">
        <div>Registration successful! Redirecting to your account...</div>
      </Message>

      <!-- Back to Login -->
      <div class="mt-4 text-center">
        <Button label="Back to Login" @click="goToLogin" text />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { signUp } from 'aws-amplify/auth'
import { generateClient } from 'aws-amplify/api'
import type { Schema } from '@amplify/data/resource'
import amplifyOutputs from '../../amplify_outputs.json'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'
import {
  validateAccessCodeFormat,
  normalizeAccessCode,
  formatAccessCodeInput,
} from '@/utils/access-codes'

const router = useRouter()
const route = useRoute()

// Use API key mode for unauthenticated access code validation
const client = generateClient<Schema>({
  authMode: 'apiKey', // Use API key for public access
})

// Form state
const accessCode = ref('')
const accessCodeError = ref('')
const accessCodeValid = ref(false)
const accessCodeData = ref<{
  id?: string
  invitationType?: string | null
  used?: boolean | null
} | null>(null)

const name = ref('')
const zipCode = ref('')
const validationEmail = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')

const registering = ref(false)
const registrationError = ref('')
const registrationComplete = ref(false)

// Determine if zip code or email is needed for validation
const needsZipCode = computed(() => {
  // For bulk invitations (paper recipients), need zip code
  return accessCodeData.value?.invitationType === 'bulk' || !accessCodeData.value?.invitationType
})

const needsEmail = computed(() => {
  // For on-demand invitations, need email
  return accessCodeData.value?.invitationType === 'on-demand'
})

const isFormValid = computed(() => {
  return (
    name.value.trim() &&
    email.value.trim() &&
    password.value &&
    confirmPassword.value &&
    password.value === confirmPassword.value &&
    (needsZipCode.value ? zipCode.value.trim() : true) &&
    (needsEmail.value ? validationEmail.value.trim() : true)
  )
})

// Extract access code from URL on mount
onMounted(() => {
  // Get code from URL query parameter directly
  const codeParam = route.query.code
  if (codeParam && typeof codeParam === 'string') {
    // Always populate the field with what's in the URL
    accessCode.value = formatAccessCodeInput(codeParam)
    // Auto-validate if format looks complete
    if (accessCode.value.length >= 12) {
      validateAccessCode()
    }
  }
})

// Handle access code input with auto-formatting
function handleAccessCodeInput(event: Event) {
  const input = event.target as HTMLInputElement
  const formatted = formatAccessCodeInput(input.value)
  accessCode.value = formatted
  accessCodeError.value = ''

  // Auto-validate when format looks complete
  if (formatted.length >= 12) {
    validateAccessCode()
  }
}

// Validate access code format and check in database
async function validateAccessCode() {
  accessCodeError.value = ''
  accessCodeValid.value = false

  const normalized = normalizeAccessCode(accessCode.value)

  // Format validation
  if (!validateAccessCodeFormat(normalized)) {
    accessCodeError.value = 'Invalid format. Please enter code as KEL-XXXX-XXXX'
    return
  }

  try {
    // Call Lambda function to validate access code (public endpoint)
    // Get the function URL from Amplify outputs
    const validateUrl = (amplifyOutputs.custom as { validateAccessCodeUrl?: string })
      ?.validateAccessCodeUrl
    if (!validateUrl) {
      throw new Error('Validation endpoint not configured. Please ensure the backend is deployed.')
    }

    const response = await fetch(validateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: normalized }),
    })

    if (!response.ok) {
      throw new Error(`Validation failed: ${response.status}`)
    }

    const validationResult: {
      valid: boolean
      exists: boolean
      used?: boolean
      invitationType?: string
      message?: string
      codeId?: string
    } = await response.json()

    if (!validationResult.valid || !validationResult.exists) {
      accessCodeError.value =
        validationResult.message ||
        'Invalid invitation link. Please check the link and try again, or contact an administrator for assistance.'
      return
    }

    if (validationResult.used) {
      accessCodeError.value =
        'This invitation link has already been used. Each invitation link can only be used once. Please contact an administrator if you need access.'
      return
    }

    // Code is valid - store the code ID and invitation type
    accessCodeData.value = {
      id: validationResult.codeId,
      invitationType: validationResult.invitationType ?? undefined,
      used: false,
    }
    accessCodeValid.value = true
  } catch (error) {
    console.error('Error validating access code:', error)
    accessCodeError.value =
      'Unable to validate invitation link. Please try again or contact an administrator for assistance.'
  }
}

// Handle registration
async function handleRegister() {
  if (!isFormValid.value) {
    return
  }

  registering.value = true
  registrationError.value = ''

  try {
    // TODO: Validate identity (name + zip or name + email) against recipient data
    // For now, proceed with registration

    // Sign up user in Cognito
    const { userId } = await signUp({
      username: email.value,
      password: password.value,
      options: {
        userAttributes: {
          email: email.value,
          name: name.value,
        },
        autoSignIn: {
          enabled: true,
        },
      },
    })

    // Create NewsletterUser record
    await client.models.NewsletterUser.create({
      email: email.value,
      accessCode: normalizeAccessCode(accessCode.value),
      registeredAt: new Date().toISOString(),
      accessLevel: 'viewer',
    })

    // Mark access code as used
    if (accessCodeData.value?.id) {
      await client.models.AccessCode.update({
        id: accessCodeData.value.id,
        used: true,
        usedAt: new Date().toISOString(),
        usedBy: userId,
      })
    }

    registrationComplete.value = true

    // Redirect to home after short delay
    setTimeout(() => {
      router.push('/')
    }, 2000)
  } catch (error: unknown) {
    console.error('Registration error:', error)

    // Handle specific Cognito errors
    const err = error as { name?: string; message?: string }
    if (err.name === 'UsernameExistsException') {
      registrationError.value =
        'An account with this email address already exists. Please log in instead, or use "Forgot Password" if you don\'t remember your password.'
    } else if (err.name === 'InvalidPasswordException') {
      registrationError.value =
        'Password does not meet requirements. Please use a stronger password.'
    } else if (err.name === 'InvalidParameterException') {
      registrationError.value = 'Please check that all required fields are filled correctly.'
    } else {
      registrationError.value =
        'Registration failed. Please try again. If the problem persists, contact an administrator for assistance.'
    }
  } finally {
    registering.value = false
  }
}

function goToLogin() {
  router.push('/login')
}

function goToForgotPassword() {
  router.push('/login?forgotPassword=true')
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: var(--surface-ground);
}

.register-card {
  max-width: 500px;
  width: 100%;
  background: var(--surface-card);
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}
</style>
