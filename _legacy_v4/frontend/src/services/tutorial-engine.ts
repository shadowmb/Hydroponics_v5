// ABOUTME: Tutorial engine for interactive element detection and action tracking
// ABOUTME: Handles DOM queries, event listeners, and step lifecycle management

import type { TutorialStep } from './tutorial-service'

// Tutorial Engine Interfaces
export interface ElementPosition {
  top: number
  left: number
  width: number
  height: number
}

export interface TutorialEngineConfig {
  highlightPadding?: number
  scrollBehavior?: ScrollBehavior
  eventListenerOptions?: AddEventListenerOptions
}

// Event emitter for tutorial events
export type TutorialEventType = 'element:found' | 'element:not-found' | 'action:detected' | 'action:performed' | 'step:activated' | 'step:deactivated' | 'step:completed'

interface TutorialEventListener {
  (data?: any): void
}

// Tutorial Engine Class
export class TutorialEngine {
  private config: TutorialEngineConfig
  private currentElement: HTMLElement | null = null
  private eventListeners: Map<TutorialEventType, TutorialEventListener[]> = new Map()
  private activeListeners: Array<{ element: HTMLElement | Window, event: string, handler: EventListener }> = []

  constructor(config?: TutorialEngineConfig) {
    this.config = {
      highlightPadding: 8,
      scrollBehavior: 'smooth',
      eventListenerOptions: { passive: true },
      ...config
    }
  }

  // Element Detection
  findElement(selector: string): HTMLElement | null {
    try {
      console.log('[TutorialEngine] Finding element with selector:', selector)
      const element = document.querySelector(selector) as HTMLElement
      console.log('[TutorialEngine] querySelector result:', element)

      if (element) {
        this.currentElement = element
        this.emit('element:found', { selector, element })
        console.log('[TutorialEngine] Element FOUND!')
        return element
      }

      console.log('[TutorialEngine] Element NOT FOUND - checking if selector exists in DOM...')
      const allElements = document.querySelectorAll('[data-test]')
      console.log('[TutorialEngine] Available [data-test] elements:', Array.from(allElements).map((el: any) => el.getAttribute('data-test')))

      this.emit('element:not-found', { selector })
      return null
    } catch (error) {
      console.error('[TutorialEngine] Error finding element:', error)
      this.emit('element:not-found', { selector, error })
      return null
    }
  }

  getElementPosition(element: HTMLElement): ElementPosition {
    const rect = element.getBoundingClientRect()
    return {
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
      height: rect.height
    }
  }

  scrollToElement(element: HTMLElement): void {
    element.scrollIntoView({
      behavior: this.config.scrollBehavior,
      block: 'center',
      inline: 'center'
    })
  }

  // Event Management
  attachStepListeners(step: TutorialStep): void {
    this.removeStepListeners()

    const selector = step.targetSelector || step.targetElement
    if (!selector) return

    const element = this.findElement(selector)
    if (!element) return

    // Attach listeners based on step type
    switch (step.type) {
      case 'action':
        this.attachActionListeners(element, step)
        break
      case 'interaction':
        this.attachInteractionListeners(element, step)
        break
    }
  }

  private attachActionListeners(element: HTMLElement, step: TutorialStep): void {
    const clickHandler = (event: Event) => {
      this.emit('action:detected', { type: 'click', element, step, event })
    }

    element.addEventListener('click', clickHandler as EventListener, this.config.eventListenerOptions)
    this.activeListeners.push({ element, event: 'click', handler: clickHandler as EventListener })
  }

  private attachInteractionListeners(element: HTMLElement, step: TutorialStep): void {
    const inputHandler = (event: Event) => {
      this.emit('action:detected', { type: 'input', element, step, event })
    }

    const changeHandler = (event: Event) => {
      this.emit('action:detected', { type: 'change', element, step, event })
    }

    element.addEventListener('input', inputHandler as EventListener, this.config.eventListenerOptions)
    element.addEventListener('change', changeHandler as EventListener, this.config.eventListenerOptions)

    this.activeListeners.push({ element, event: 'input', handler: inputHandler as EventListener })
    this.activeListeners.push({ element, event: 'change', handler: changeHandler as EventListener })
  }

  removeStepListeners(): void {
    this.activeListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler)
    })
    this.activeListeners = []
  }

  // Step Lifecycle
  activateStep(step: TutorialStep): void {
    this.attachStepListeners(step)

    const selector = step.targetSelector || step.targetElement
    if (selector) {
      const element = this.findElement(selector)
      if (element) {
        this.scrollToElement(element)
      }
    }

    this.emit('step:activated', { step })
  }

  deactivateStep(): void {
    this.removeStepListeners()
    this.currentElement = null
    this.emit('step:deactivated')
  }

  // Event Emitter
  on(event: TutorialEventType, listener: TutorialEventListener): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(listener)
  }

  off(event: TutorialEventType, listener: TutorialEventListener): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  private emit(event: TutorialEventType, data?: any): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(listener => listener(data))
    }
  }

  // Cleanup
  cleanup(): void {
    this.removeStepListeners()
    this.eventListeners.clear()
    this.currentElement = null
  }

  // Getters
  getCurrentElement(): HTMLElement | null {
    return this.currentElement
  }
}

// Export singleton instance
export const tutorialEngine = new TutorialEngine()
