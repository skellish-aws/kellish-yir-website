import { createRouter, createWebHistory } from 'vue-router'
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
  },
  {
    path: '/admin/newsletters',
    name: 'NewsletterAdmin',
    component: () => import('../views/NewsletterAdmin.vue'),
    meta: { requiresAuth: true, adminOnly: true },
  },
  {
    path: '/admin/recipients',
    name: 'RecipientAdmin',
    component: () => import('../views/RecipientAdmin.vue'),
    meta: { requiresAuth: true, adminOnly: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, from, next) => {
  if (to.meta.requiresAuth) {
    try {
      await getCurrentUser()

      // Check if user is in Admin group using the ID token
      if (to.meta.adminOnly) {
        const session = await fetchAuthSession()
        const idToken = session.tokens?.idToken

        if (idToken) {
          const payload = idToken.payload
          const groups = payload['cognito:groups'] || []
          console.log('User groups from token:', groups)

          if (!Array.isArray(groups) || !groups.includes('Admin')) {
            console.log('User is not admin, redirecting to home')
            return next('/')
          }
        } else {
          // No token available, redirect to home
          return next('/')
        }
      }

      return next()
    } catch (error) {
      console.error('Auth check error:', error)
      return next('/login')
    }
  } else {
    return next()
  }
})

export default router
