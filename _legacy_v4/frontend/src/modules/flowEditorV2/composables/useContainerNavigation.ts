/**
 * 📦 Container Navigation Composable
 * ✅ Прост composable за container навигация
 * Последна проверка: 2025-07-30
 */

import { ref, computed, reactive, readonly } from 'vue'
import type { 
  NavigationState, 
  NavigationStackItem, 
  BreadcrumbItem, 
  NavigationContext,
  ContainerModeInfo
} from '../types/ContainerNavigation'
import type { ContainerMetadata } from '../types/ContainerTypes'

export function useContainerNavigation() {
  // State
  const navigationState = reactive<NavigationState>({
    currentMode: 'main',
    activeContainerId: undefined,
    navigationStack: []
  })

  // Computed
  const isInContainer = computed(() => navigationState.currentMode === 'container')
  const canGoBack = computed(() => navigationState.navigationStack.length > 0)
  const currentContainerName = computed(() => {
    if (!navigationState.activeContainerId) return undefined
    const currentItem = navigationState.navigationStack[navigationState.navigationStack.length - 1]
    return currentItem?.name || 'Неизвестен Контейнер'
  })

  const breadcrumbItems = computed((): BreadcrumbItem[] => {
    return navigationState.navigationStack.map((item, index) => ({
      id: item.id,
      label: item.name,
      type: item.type,
      clickable: index < navigationState.navigationStack.length - 1
    }))
  })

  const navigationContext = computed((): NavigationContext => {
    const stack = navigationState.navigationStack
    return {
      currentLevel: stack.length > 0 ? stack[stack.length - 1].id : 'main',
      parentLevel: stack.length > 1 ? stack[stack.length - 2].id : undefined,
      canGoBack: canGoBack.value,
      canGoForward: false // За сега не поддържаме forward
    }
  })

  const containerModeInfo = computed((): ContainerModeInfo => ({
    isInContainer: isInContainer.value,
    currentContainerId: navigationState.activeContainerId,
    currentContainerName: currentContainerName.value,
    depth: navigationState.navigationStack.length
  }))

  // Methods
  function enterContainer(containerId: string, containerName: string): void {
    const stackItem: NavigationStackItem = {
      id: containerId,
      name: containerName,
      type: 'container'
    }

    navigationState.navigationStack.push(stackItem)
    navigationState.currentMode = 'container'
    navigationState.activeContainerId = containerId
  }

  function exitContainer(): void {
    if (navigationState.navigationStack.length > 0) {
      navigationState.navigationStack.pop()
      
      if (navigationState.navigationStack.length === 0) {
        navigationState.currentMode = 'main'
        navigationState.activeContainerId = undefined
      } else {
        // Връщаме се към parent container
        const parentItem = navigationState.navigationStack[navigationState.navigationStack.length - 1]
        navigationState.activeContainerId = parentItem.id
      }
    }
  }

  function navigateToMain(): void {
    navigationState.navigationStack = []
    navigationState.currentMode = 'main'
    navigationState.activeContainerId = undefined
  }

  function navigateToContainer(containerId: string, containers: ContainerMetadata[]): void {
    const container = containers.find(c => c.id === containerId)
    if (!container) return

    // Намираме позицията на контейнера в стека
    const stackIndex = navigationState.navigationStack.findIndex(item => item.id === containerId)
    
    if (stackIndex !== -1) {
      // Отрязваме стека до тази позиция
      navigationState.navigationStack = navigationState.navigationStack.slice(0, stackIndex + 1)
    } else {
      // Добавяме към стека (не трябва да се случва често)
      navigationState.navigationStack.push({
        id: containerId,
        name: container.name,
        type: 'container'
      })
    }

    navigationState.currentMode = 'container'
    navigationState.activeContainerId = containerId
  }

  function goBack(): void {
    exitContainer()
  }

  function goToLevel(levelIndex: number, containers: ContainerMetadata[]): void {
    if (levelIndex === -1) {
      navigateToMain()
      return
    }

    if (levelIndex >= 0 && levelIndex < navigationState.navigationStack.length) {
      const targetItem = navigationState.navigationStack[levelIndex]
      navigateToContainer(targetItem.id, containers)
    }
  }

  function getCurrentPath(): string {
    const parts = ['Main']
    navigationState.navigationStack.forEach(item => {
      parts.push(item.name)
    })
    return parts.join(' > ')
  }

  function isAtLevel(containerId: string): boolean {
    return navigationState.activeContainerId === containerId
  }

  function getNavigationDepth(): number {
    return navigationState.navigationStack.length
  }

  function reset(): void {
    navigateToMain()
  }

  // Export state and methods
  return {
    // State
    navigationState: readonly(navigationState),
    
    // Computed
    isInContainer,
    canGoBack,
    currentContainerName,
    breadcrumbItems,
    navigationContext,
    containerModeInfo,

    // Methods
    enterContainer,
    exitContainer,
    navigateToMain,
    navigateToContainer,
    goBack,
    goToLevel,
    getCurrentPath,
    isAtLevel,
    getNavigationDepth,
    reset
  }
}

// Helper function за external usage
export function createNavigationStackItem(
  containerId: string, 
  containerName: string
): NavigationStackItem {
  return {
    id: containerId,
    name: containerName,
    type: 'container'
  }
}