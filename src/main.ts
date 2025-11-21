import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'

import './amplify-config' // sets up Amplify Gen 2
import './utils/pdfWorker' // initialize PDF.js worker

// PrimeVue & styles
import '@/assets/main.css'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import 'primeicons/primeicons.css'
import ToastService from 'primevue/toastservice'

const app = createApp(App)

app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      prefix: 'p',
      darkModeSelector: 'system',
      cssLayer: false,
    },
  },
})

app.use(ToastService)

app.use(router)
app.use(createPinia())

app.mount('#app')
