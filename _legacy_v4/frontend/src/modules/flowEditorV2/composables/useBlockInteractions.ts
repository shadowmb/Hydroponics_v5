/**
 * 🎮 Block Interactions Composable
 * ✅ Handles all mouse and user interactions for block components
 * 🎯 Clean separation of interaction logic from UI rendering
 */

import { ref, type Ref } from 'vue'
import type { BlockInstance } from '../types/BlockConcept'

interface BlockInteractionEmits {
  mousedown: [event: MouseEvent, blockId: string]
  click: [event: MouseEvent, blockId: string]
  portMouseDown: [event: MouseEvent, port: any, block: BlockInstance]
  portMouseEnter: [port: any, block: BlockInstance]
  portMouseLeave: [port: any, block: BlockInstance]
}

export function useBlockInteractions(
  block: BlockInstance,
  emit: (event: keyof BlockInteractionEmits, ...args: any[]) => void
) {
  // Reactive state
  const isHovered = ref(false)
  const isDragging = ref(false)

  // Mouse interaction handlers
  function onMouseDown(event: MouseEvent) {
    isDragging.value = true
    emit('mousedown', event, block.id)
  }

  function onMouseEnter() {
    isHovered.value = true
  }

  function onMouseLeave() {
    isHovered.value = false
  }

  function onClick(event: MouseEvent) {
    emit('click', event, block.id)
  }

  // Port interaction handlers
  function onPortMouseDown(event: MouseEvent, port: any, isInput: boolean) {
    // Ultra-aggressive event stopping for connection mode
    event.stopPropagation()
    event.stopImmediatePropagation()
    event.preventDefault()
    
    // Set flag to prevent canvas click
    ;(event.target as any)._isPortClick = true
    
    emit('portMouseDown', event, { ...port, isInput }, block)
  }

  function onPortMouseEnter(port: any) {
    emit('portMouseEnter', port, block)
  }

  function onPortMouseLeave(port: any) {
    emit('portMouseLeave', port, block)
  }

  // Cleanup function for drag state
  function stopDragging() {
    isDragging.value = false
  }

  // Reset all interaction states
  function resetInteractionState() {
    isHovered.value = false
    isDragging.value = false
  }

  return {
    // Reactive state
    isHovered,
    isDragging,
    
    // Mouse handlers
    onMouseDown,
    onMouseEnter,
    onMouseLeave,
    onClick,
    
    // Port handlers
    onPortMouseDown,
    onPortMouseEnter,
    onPortMouseLeave,
    
    // Utility functions
    stopDragging,
    resetInteractionState
  }
}

export type BlockInteractionComposable = ReturnType<typeof useBlockInteractions>