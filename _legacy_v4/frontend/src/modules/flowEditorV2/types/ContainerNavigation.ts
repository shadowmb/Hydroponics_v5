/**
 * 📦 Container Navigation - Type Definitions  
 * ✅ Прости типове за навигация в Container система
 * Последна проверка: 2025-07-30
 */

// Navigation mode types
export type NavigationMode = 'main' | 'container'

// Navigation state
export interface NavigationState {
  currentMode: NavigationMode
  activeContainerId?: string
  navigationStack: NavigationStackItem[]
}

// Navigation stack item
export interface NavigationStackItem {
  id: string
  name: string
  type: 'main' | 'container'
}

// Breadcrumb item
export interface BreadcrumbItem {
  id: string
  label: string  
  type: 'main' | 'container'
  clickable: boolean
}

// Navigation context
export interface NavigationContext {
  currentLevel: string
  parentLevel?: string
  canGoBack: boolean
  canGoForward: boolean
}

// Navigation events
export interface NavigationEvents {
  onEnterContainer: (containerId: string) => void
  onExitContainer: () => void
  onNavigateToMain: () => void
  onNavigateToContainer: (containerId: string) => void
}

// Container mode info
export interface ContainerModeInfo {
  isInContainer: boolean
  currentContainerId?: string
  currentContainerName?: string
  depth: number
}

// Navigation history item
export interface NavigationHistoryItem {
  containerId?: string
  timestamp: number
  action: 'enter' | 'exit' | 'create' | 'delete'
}