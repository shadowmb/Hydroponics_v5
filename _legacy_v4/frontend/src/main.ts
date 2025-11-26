import { createApp } from 'vue'
import { Quasar } from 'quasar'
import { createPinia } from 'pinia'

// Import icon libraries
import '@quasar/extras/material-icons/material-icons.css'
import '@quasar/extras/mdi-v7/mdi-v7.css'

// Import Quasar css
import 'quasar/src/css/index.sass'

// Assumes your root component is App.vue
// and placed in same folder as main.js
import App from './App.vue'
import router from './router'

// Import custom global CSS
import './css/app.scss'

// main.ts
import '@/utils/productionDebug'


// Import debug system (development only)
import debugSystem from './utils/debugSystem'
import componentMapWatcher from './utils/componentMapWatcher'


const myApp = createApp(App)

myApp.use(Quasar, {
  plugins: {}, // import Quasar plugins and add here
})

// Install Pinia
const pinia = createPinia()
myApp.use(pinia)

// Install Vue Router
myApp.use(router)

// Assumes you have a <div id="app"></div> in your index.html
myApp.mount('#app')