/**
 * 📦 ID Generator - Simple ID Generation Utility
 * ✅ Проста утилита за генериране на уникални ID-та
 * Последна проверка: 2025-07-30
 */

let counter = 0

/**
 * Генерира уникален ID с prefix
 */
export function generateId(prefix: string = 'id'): string {
  counter++
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substr(2, 5)
  
  return `${prefix}_${timestamp}_${randomPart}_${counter}`
}

/**
 * Генерира къс ID (за по-компактни нужди)
 */
export function generateShortId(prefix: string = 'id'): string {
  counter++
  const randomPart = Math.random().toString(36).substr(2, 4)
  
  return `${prefix}_${randomPart}_${counter}`
}

/**
 * Проверява дали ID е валиден format
 */
export function isValidId(id: string): boolean {
  return typeof id === 'string' && id.length > 0 && /^[a-zA-Z0-9_-]+$/.test(id)
}