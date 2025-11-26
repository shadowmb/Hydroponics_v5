import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { Program, ActiveProgram } from '../types'
import { programApi } from '../services/api'
import { useMainStore } from './main'

export const useProgramStore = defineStore('program', () => {
  const mainStore = useMainStore()
  
  // State
  const programs = ref<Program[]>([])
  const activePrograms = ref<ActiveProgram[]>([])
  const selectedProgram = ref<Program | null>(null)
  const lastFetch = ref<Date | null>(null)

  // Getters
  const activeProgramsCount = computed(() => activePrograms.value.length)
  const runningProgramsCount = computed(() => 
    activePrograms.value.filter(ap => ap.status === 'running').length
  )
  const totalPrograms = computed(() => programs.value.length)

  // Actions
  async function fetchPrograms() {
    try {
      mainStore.setLoading(true, 'Loading programs...')
      const data = await programApi.getAll()
      programs.value = data
      lastFetch.value = new Date()
      mainStore.clearError()
    } catch (error: any) {
      mainStore.setError(true, `Failed to load programs: ${error.message}`, error)
      throw error
    } finally {
      mainStore.setLoading(false)
    }
  }

  async function fetchProgramById(id: string) {
    try {
      mainStore.setLoading(true, 'Loading program...')
      const program = await programApi.getById(id)
      selectedProgram.value = program
      
      // Update in programs array if exists
      const index = programs.value.findIndex(p => p._id === id)
      if (index !== -1) {
        programs.value[index] = program
      }
      
      mainStore.clearError()
      return program
    } catch (error: any) {
      mainStore.setError(true, `Failed to load program: ${error.message}`, error)
      throw error
    } finally {
      mainStore.setLoading(false)
    }
  }

  async function createProgram(programData: Partial<Program>) {
    try {
      mainStore.setLoading(true, 'Creating program...')
      const newProgram = await programApi.create(programData)
      programs.value.push(newProgram)
      mainStore.showNotification('Program created successfully', 'positive')
      return newProgram
    } catch (error: any) {
      mainStore.setError(true, `Failed to create program: ${error.message}`, error)
      throw error
    } finally {
      mainStore.setLoading(false)
    }
  }

  async function updateProgram(id: string, programData: Partial<Program>) {
    try {
      mainStore.setLoading(true, 'Updating program...')
      const updatedProgram = await programApi.update(id, programData)
      
      const index = programs.value.findIndex(p => p._id === id)
      if (index !== -1) {
        programs.value[index] = updatedProgram
      }
      
      if (selectedProgram.value?._id === id) {
        selectedProgram.value = updatedProgram
      }
      
      mainStore.showNotification('Program updated successfully', 'positive')
      return updatedProgram
    } catch (error: any) {
      mainStore.setError(true, `Failed to update program: ${error.message}`, error)
      throw error
    } finally {
      mainStore.setLoading(false)
    }
  }

  async function deleteProgram(id: string) {
    try {
      mainStore.setLoading(true, 'Deleting program...')
      await programApi.delete(id)
      
      programs.value = programs.value.filter(p => p._id !== id)
      
      if (selectedProgram.value?._id === id) {
        selectedProgram.value = null
      }
      
      mainStore.showNotification('Program deleted successfully', 'positive')
    } catch (error: any) {
      mainStore.setError(true, `Failed to delete program: ${error.message}`, error)
      throw error
    } finally {
      mainStore.setLoading(false)
    }
  }

  async function startProgram(id: string) {
    try {
      mainStore.setLoading(true, 'Starting program...')
      await programApi.start(id)
      
      // Update program status
      const program = programs.value.find(p => p._id === id)
      if (program) {
        program.isRunning = true
      }
      
      mainStore.showNotification('Program started successfully', 'positive')
      // Refresh data
      await fetchPrograms()
    } catch (error: any) {
      mainStore.setError(true, `Failed to start program: ${error.message}`, error)
      throw error
    } finally {
      mainStore.setLoading(false)
    }
  }

  async function stopProgram(id: string) {
    try {
      mainStore.setLoading(true, 'Stopping program...')
      await programApi.stop(id)
      
      // Update program status
      const program = programs.value.find(p => p._id === id)
      if (program) {
        program.isRunning = false
      }
      
      mainStore.showNotification('Program stopped successfully', 'positive')
      // Refresh data
      await fetchPrograms()
    } catch (error: any) {
      mainStore.setError(true, `Failed to stop program: ${error.message}`, error)
      throw error
    } finally {
      mainStore.setLoading(false)
    }
  }

  async function pauseProgram(id: string) {
    try {
      mainStore.setLoading(true, 'Pausing program...')
      await programApi.pause(id)
      
      mainStore.showNotification('Program paused successfully', 'positive')
      // Refresh data
      await fetchPrograms()
    } catch (error: any) {
      mainStore.setError(true, `Failed to pause program: ${error.message}`, error)
      throw error
    } finally {
      mainStore.setLoading(false)
    }
  }

  function selectProgram(program: Program | null) {
    selectedProgram.value = program
  }

  function clearSelectedProgram() {
    selectedProgram.value = null
  }

  return {
    // State
    programs,
    activePrograms,
    selectedProgram,
    lastFetch,
    
    // Getters
    activeProgramsCount,
    runningProgramsCount,
    totalPrograms,
    
    // Actions
    fetchPrograms,
    fetchProgramById,
    createProgram,
    updateProgram,
    deleteProgram,
    startProgram,
    stopProgram,
    pauseProgram,
    selectProgram,
    clearSelectedProgram
  }
})