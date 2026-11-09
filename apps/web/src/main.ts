import '@/shared/styles/index.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { PiniaColada } from '@pinia/colada'
import App from './app/App.vue'
import { router } from './app/router'
import { i18n } from './app/i18n'

createApp(App).use(createPinia()).use(PiniaColada).use(router).use(i18n).mount('#app')
