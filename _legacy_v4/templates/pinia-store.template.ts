import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import ExampleService from '../services/exampleService'
import type { IExampleItem, ICreateExampleRequest, IUpdateExampleRequest } from '../services/exampleService'

export const useExampleStore = defineStore('example', () => {
  // State
  const items = ref<IExampleItem[]>([])
  const currentItem = ref<IExampleItem | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  
  // Pagination state
  const currentPage = ref(1)
  const totalItems = ref(0)
  const itemsPerPage = ref(10)
  
  // Filters
  const searchQuery = ref('')
  const statusFilter = ref<'all' | 'active' | 'inactive'>('all')

  // Computed properties
  const hasItems = computed(() => items.value.length > 0)
  const hasError = computed(() => !!error.value)
  const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value))
  const hasNextPage = computed(() => currentPage.value < totalPages.value)
  const hasPreviousPage = computed(() => currentPage.value > 1)
  
  const filteredItems = computed(() => {
    let filtered = items.value
    
    // Apply status filter
    if (statusFilter.value !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter.value)
    }
    
    // Apply search filter
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase()
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      )
    }
    
    return filtered
  })

  const activeItems = computed(() => 
    items.value.filter(item => item.status === 'active')
  )

  const inactiveItems = computed(() => 
    items.value.filter(item => item.status === 'inactive')
  )

  // Actions
  async function loadItems(page: number = 1): Promise<void> {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await ExampleService.getAll(page, itemsPerPage.value)
      items.value = response.items
      totalItems.value = response.total
      currentPage.value = response.page
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load items'
      console.error('Failed to load items:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function loadItemById(id: string): Promise<void> {
    isLoading.value = true
    error.value = null
    
    try {
      currentItem.value = await ExampleService.getById(id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load item'
      console.error(`Failed to load item ${id}:`, err)
    } finally {
      isLoading.value = false
    }
  }

  async function createItem(data: ICreateExampleRequest): Promise<IExampleItem | null> {
    isLoading.value = true
    error.value = null
    
    try {
      const newItem = await ExampleService.create(data)
      
      // Add to local state
      items.value.unshift(newItem)
      totalItems.value++
      
      return newItem
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create item'
      console.error('Failed to create item:', err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function updateItem(id: string, data: IUpdateExampleRequest): Promise<IExampleItem | null> {
    isLoading.value = true
    error.value = null
    
    try {
      const updatedItem = await ExampleService.update(id, data)
      
      // Update local state
      const index = items.value.findIndex(item => item._id === id)
      if (index !== -1) {
        items.value[index] = updatedItem
      }
      
      // Update current item if it matches
      if (currentItem.value?._id === id) {
        currentItem.value = updatedItem
      }
      
      return updatedItem
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update item'
      console.error(`Failed to update item ${id}:`, err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function deleteItem(id: string): Promise<boolean> {
    isLoading.value = true
    error.value = null
    
    try {
      await ExampleService.delete(id)
      
      // Remove from local state
      items.value = items.value.filter(item => item._id !== id)
      totalItems.value--
      
      // Clear current item if it matches
      if (currentItem.value?._id === id) {
        currentItem.value = null
      }
      
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete item'
      console.error(`Failed to delete item ${id}:`, err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function toggleItemStatus(id: string): Promise<boolean> {
    isLoading.value = true
    error.value = null
    
    try {
      const updatedItem = await ExampleService.toggleStatus(id)
      
      // Update local state
      const index = items.value.findIndex(item => item._id === id)
      if (index !== -1) {
        items.value[index] = updatedItem
      }
      
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to toggle item status'
      console.error(`Failed to toggle status for item ${id}:`, err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function searchItems(query: string): Promise<void> {
    searchQuery.value = query
    isLoading.value = true
    error.value = null
    
    try {
      const response = await ExampleService.search(query, 1, itemsPerPage.value)
      items.value = response.items
      totalItems.value = response.total
      currentPage.value = 1
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to search items'
      console.error('Failed to search items:', err)
    } finally {
      isLoading.value = false
    }
  }

  // Pagination actions
  async function nextPage(): Promise<void> {
    if (hasNextPage.value) {
      await loadItems(currentPage.value + 1)
    }
  }

  async function previousPage(): Promise<void> {
    if (hasPreviousPage.value) {
      await loadItems(currentPage.value - 1)
    }
  }

  async function goToPage(page: number): Promise<void> {
    if (page >= 1 && page <= totalPages.value) {
      await loadItems(page)
    }
  }

  // Utility actions
  function clearError(): void {
    error.value = null
  }

  function clearCurrentItem(): void {
    currentItem.value = null
  }

  function setStatusFilter(status: 'all' | 'active' | 'inactive'): void {
    statusFilter.value = status
  }

  function clearFilters(): void {
    searchQuery.value = ''
    statusFilter.value = 'all'
  }

  // Reset store to initial state
  function $reset(): void {
    items.value = []
    currentItem.value = null
    isLoading.value = false
    error.value = null
    currentPage.value = 1
    totalItems.value = 0
    searchQuery.value = ''
    statusFilter.value = 'all'
  }

  return {
    // State
    items,
    currentItem,
    isLoading,
    error,
    currentPage,
    totalItems,
    itemsPerPage,
    searchQuery,
    statusFilter,
    
    // Computed
    hasItems,
    hasError,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    filteredItems,
    activeItems,
    inactiveItems,
    
    // Actions
    loadItems,
    loadItemById,
    createItem,
    updateItem,
    deleteItem,
    toggleItemStatus,
    searchItems,
    nextPage,
    previousPage,
    goToPage,
    clearError,
    clearCurrentItem,
    setStatusFilter,
    clearFilters,
    $reset
  }
})