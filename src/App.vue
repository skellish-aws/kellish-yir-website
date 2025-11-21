<template>
  <div>
    <Toolbar>
      <template #start>
        <span class="text-xl font-bold">Kellish YIR</span>
      </template>
      <template #end>
        <Button v-if="!isAuthenticated" label="Login" @click="goLogin" />
        <div v-else class="flex items-center gap-2">
          <span v-if="isAdmin" class="admin-badge">Admin</span>
          <Button v-if="isAdmin" label="Manage Newsletters" @click="goNewsletterAdmin" />
          <Button v-if="isAdmin" label="Manage Recipients" @click="goRecipientAdmin" />
          <Button label="Logout" @click="handleSignOut" />
        </div>
      </template>
    </Toolbar>
    <router-view />
    <Toast position="top-right" />
  </div>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router'
import Toolbar from 'primevue/toolbar'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { getCurrentUser, signOut } from 'aws-amplify/auth'
import { useInactivityTracker } from './utils/inactivityTracker'
import { fetchAuthSession } from 'aws-amplify/auth'
import { Hub } from 'aws-amplify/utils'

const router = useRouter()
const isAuthenticated = ref(false)
const isAdmin = ref(false)

// Initialize inactivity tracker with 1 minute timeout
const { startTracking, stopTracking } = useInactivityTracker(15 * 60 * 1000)

// Set up event listeners for auth state changes
function setupAuthListeners() {
  const authListener = Hub.listen('auth', ({ payload }) => {
    const { event } = payload
    console.log('Auth event:', event)

    switch (event) {
      case 'signedIn':
      case 'tokenRefresh':
        checkAuth() // Update auth state when user signs in or token refreshes
        break
      case 'signedOut':
        isAuthenticated.value = false
        isAdmin.value = false
        break
      case 'tokenRefresh_failure':
        // Session might be expired, check auth
        checkAuth()
        break
    }
  })

  // Return cleanup function
  return () => {
    authListener()
  }
}

// Check authentication state
async function checkAuth() {
  try {
    await getCurrentUser()
    isAuthenticated.value = true

    // Get the ID token from the current session
    const session = await fetchAuthSession()
    const idToken = session.tokens?.idToken

    if (idToken) {
      const payload = idToken.payload
      console.log('Token payload:', payload)

      // Check for 'cognito:groups' in the token payload
      const groups = payload['cognito:groups'] || []
      console.log('User groups from token:', groups)

      isAdmin.value = Array.isArray(groups)
        ? groups.includes('Admin')
        : String(groups).includes('Admin')
    } else {
      isAdmin.value = false
    }
  } catch (error) {
    console.error('Auth check error:', error)
    isAuthenticated.value = false
    isAdmin.value = false
  }
}

async function handleSignOut() {
  try {
    await signOut()
    isAuthenticated.value = false
    router.push('/')
  } catch (error) {
    console.error('Error signing out:', error)
  }
}

function goLogin() {
  console.log('Login button clicked')
  router.push('/login')
}

function goNewsletterAdmin() {
  console.log('Navigating to newsletter admin')
  router.push('/admin/newsletters')
}

function goRecipientAdmin() {
  console.log('Navigating to recipient admin')
  router.push('/admin/recipients')
}

// Watch authentication state to start/stop tracking
watch(isAuthenticated, (newValue) => {
  if (newValue) {
    // Start tracking when user is authenticated
    startTracking()
  } else {
    // Stop tracking when user is not authenticated
    stopTracking()
  }
})

// Check on mount and periodically
onMounted(() => {
  // Initial auth check
  checkAuth()

  // Set up event listeners instead of polling
  const cleanup = setupAuthListeners()

  // Clean up on component unmount
  onUnmounted(cleanup)
})
</script>

<style scoped>
.admin-badge {
  background-color: #4caf50;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: bold;
  margin-right: 0.5rem;
}

.flex {
  display: flex;
}

.items-center {
  align-items: center;
}

.gap-2 {
  gap: 0.5rem;
}
</style>

<style>
/* Toast notification styling for better readability */
.toast-success {
  background-color: #ffffff !important;
  color: #1f2937 !important;
  border-left: 4px solid #10b981 !important;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
}

.toast-success .p-toast-summary {
  color: #059669 !important;
  font-weight: 600 !important;
}

.toast-success .p-toast-detail {
  color: #374151 !important;
}

/* Position toast to avoid overlapping toolbar buttons */
.p-toast-top-right {
  top: 80px !important; /* Position below toolbar */
  right: 20px !important;
}
</style>
