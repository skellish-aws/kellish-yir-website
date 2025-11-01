<!-- src/views/Login.vue -->
<template>
  <div class="login-container">
    <Authenticator v-if="!isAuthenticated" />
  </div>
</template>

<script lang="ts" setup>
import { Authenticator } from '@aws-amplify/ui-vue'
import '@aws-amplify/ui-vue/styles.css'
import { useRouter } from 'vue-router'
import { onMounted, ref } from 'vue'
import { getCurrentUser } from 'aws-amplify/auth'

const router = useRouter()
const isAuthenticated = ref(false)

// Check authentication state
async function checkAuth() {
  try {
    const user = await getCurrentUser()
    // Redirect immediately when authenticated
    if (!isAuthenticated.value) {
      console.log('User is authenticated:', user)
      router.push('/')
    }
    isAuthenticated.value = true
  } catch {
    isAuthenticated.value = false
  }
}

// Check on mount and periodically
onMounted(() => {
  checkAuth()

  // Check auth state every 2 seconds
  const interval = setInterval(checkAuth, 2000)

  // Clean up interval on component unmount
  return () => clearInterval(interval)
})
</script>

<style scoped>
.login-container {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
}
</style>
