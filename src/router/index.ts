import { createRouter, createWebHistory } from 'vue-router'
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
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
  // Catch-all route for 404s - redirect to home (which will redirect to login if not authenticated)
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, from, next) => {
  // Skip auth check for login and register pages
  if (to.path === '/login' || to.path === '/register') {
    return next()
  }

  // Check authentication for protected routes
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
          // No token available, redirect to login
          return next('/login')
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
