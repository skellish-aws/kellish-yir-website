// src/stores/authStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getCurrentUser, signOut } from 'aws-amplify/auth'
import type { AuthUser } from 'aws-amplify/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const isAuthenticated = ref(false)

  async function checkAuthState() {
    try {
      const currentUser = await getCurrentUser()
      user.value = currentUser
      isAuthenticated.value = true
    } catch {
      user.value = null
      isAuthenticated.value = false
    }
  }

  async function logout() {
    try {
      await signOut()
      user.value = null
      isAuthenticated.value = false
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  // Initialize auth state
  checkAuthState()

  return { user, isAuthenticated, checkAuthState, logout }
})
