import { store } from 'quasar/wrappers'
import { createPinia } from 'pinia'

// Import all stores
export { useMainStore } from './main'
export { useProgramStore } from './program'
export { useDeviceStore } from './device' 
export { useSettingsStore } from './settings'

export default store((/* { ssrContext } */) => {
  const pinia = createPinia()

  // You can add Pinia plugins here
  // pinia.use(SomePiniaPlugin)

  return pinia
})