import { route } from 'quasar/wrappers'
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router'

import routes from './routes'

export default route(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory)

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE)
  })

  // Global navigation guards
  Router.beforeEach(async (to, from, next) => {
    // Add any global navigation logic here
    // For example: authentication checks, loading states, etc.

    // Tutorial mode guard
    if (to.meta?.tutorialMode) {
      // Import tutorial store dynamically to avoid circular dependencies
      const { useTutorialStore } = await import('../stores/tutorial')
      const tutorialStore = useTutorialStore()

      // Check if tutorial is active and matches the category
      if (!tutorialStore.isActive ||
          (to.meta.tutorialCategory &&
           tutorialStore.currentTutorial?.category !== to.meta.tutorialCategory)) {

        // Redirect to normal route if tutorial not active for this category
        const normalPath = to.path.replace('/tutorial', '')
        next(normalPath || '/dashboard')
        return
      }

      // Setup demo mode if not already active
      if (!tutorialStore.isDemoMode && tutorialStore.currentTutorial) {
        try {
          await tutorialStore.setupDemoMode(tutorialStore.currentTutorial._id)
        } catch (error) {
          console.warn('Failed to setup demo mode:', error)
        }
      }
    }

    // Set page title
    if (to.meta?.title) {
      document.title = `${to.meta.title} - Хидропонна Система`
    } else {
      document.title = 'Хидропонна Система'
    }

    next()
  })

  Router.afterEach((to, from) => {
    // Add any post-navigation logic here
    // For example: analytics, scroll restoration, etc.
    console.log(`Navigated from ${from.path} to ${to.path}`)
  })

  return Router
})