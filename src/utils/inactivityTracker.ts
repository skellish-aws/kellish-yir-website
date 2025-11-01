import { signOut } from 'aws-amplify/auth'
import { ref } from 'vue'

// Default timeout in milliseconds (e.g., 30 minutes)
const DEFAULT_TIMEOUT = 30 * 60 * 1000

export function useInactivityTracker(timeout = DEFAULT_TIMEOUT) {
  const timer = ref<number | null>(null)

  // Reset the timer when user activity is detected
  const resetTimer = () => {
    if (timer.value) {
      window.clearTimeout(timer.value)
    }

    timer.value = window.setTimeout(async () => {
      console.log('User inactive, logging out')
      await signOut()
      window.location.href = '/'
    }, timeout)
  }

  // Start tracking user activity
  const startTracking = () => {
    // Reset timer on common user interactions
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']

    events.forEach((event) => {
      document.addEventListener(event, resetTimer)
    })

    // Initial timer start
    resetTimer()
  }

  // Stop tracking and clear timer
  const stopTracking = () => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']

    events.forEach((event) => {
      document.removeEventListener(event, resetTimer)
    })

    if (timer.value) {
      window.clearTimeout(timer.value)
      timer.value = null
    }
  }

  return { startTracking, stopTracking }
}
