<template>
  <q-page class="q-pa-md">
    <!-- Page Header -->
    <div class="page-header q-mb-lg">
      <div class="row items-center">
        <q-btn
          flat
          round
          dense
          icon="arrow_back"
          @click="goBack"
          class="q-mr-md"
        />
        <div>
          <h4 class="q-ma-none text-weight-bold">
            {{ isEdit ? 'Редактиране на Action Template' : 'Създаване на Action Template' }}
          </h4>
          <p class="text-grey-6 q-mb-none">
            {{ isEdit ? 'Промени настройките на action template' : 'Създай нов шаблон за действие' }}
          </p>
        </div>
      </div>
    </div>

    <div class="row q-gutter-lg">
      <!-- Main Form -->
      <div class="col-md-8 col-sm-12">
        <q-form @submit="saveActionTemplate" class="q-gutter-md">
          <!-- Basic Information Card -->
          <q-card>
            <q-card-section>
              <div class="text-h6 q-mb-md">Основна информация</div>
              
              <!-- Name -->
              <q-input
                v-model="form.name"
                label="Име на действието *"
                outlined
                dense
                :rules="[
                  val => !!val || 'Името е задължително',
                  val => val.length >= 4 || 'Минимум 4 символа',
                  val => val.length <= 20 || 'Максимум 20 символа'
                ]"
                :error="!!errors.name"
                :error-message="errors.name"
              />

              <!-- Description -->
              <q-input
                v-model="form.description"
                label="Коментар/описание"
                outlined
                dense
                type="textarea"
                rows="2"
                maxlength="200"
                counter
              />

              <!-- Icon Selection -->
              <div class="q-mt-md">
                <div class="text-subtitle2 q-mb-sm">Иконка *</div>
                <div class="row q-gutter-sm">
                  <q-btn
                    v-for="icon in iconOptions"
                    :key="icon"
                    :color="form.icon === icon ? 'primary' : 'grey-3'"
                    :text-color="form.icon === icon ? 'white' : 'dark'"
                    size="md"
                    :label="icon"
                    @click="form.icon = icon"
                    class="text-h6"
                  />
                </div>
              </div>

              <!-- Flow File -->
              <q-input
                v-model="form.flowFile"
                label="Flow файл (опционално)"
                outlined
                dense
                placeholder="напр. ec_control_v1.json"
              >
                <template v-slot:append>
                  <q-btn
                    flat
                    icon="folder_open"
                    @click="selectFlowFile"
                    size="sm"
                  >
                    <q-tooltip>Избери flow файл</q-tooltip>
                  </q-btn>
                </template>
              </q-input>

              <!-- Active Status -->
              <q-toggle
                v-model="form.isActive"
                label="Активен"
                color="primary"
              />
            </q-card-section>
          </q-card>
          <!-- Global Variables Card -->
          <q-card class="q-mt-md">
            <q-card-section>
              <div class="text-h6 q-mb-md">Глобални променливи</div>
              
              <div v-if="!globalVariables.length" class="text-center q-py-lg text-grey-6">
                Изберете flow файл за автоматично откриване на глобални променливи
              </div>
              
              <div v-else>
                <div v-for="globalVar in globalVariables" :key="globalVar.name" class="q-mb-sm">
                  <!-- Header with form fields - non-expandable -->
                  <div class="global-var-header bg-orange-1 q-pa-md" style="border-radius: 4px;">
                    <div class="row items-center q-gutter-md">
                      <div class="col-auto">
                        <q-checkbox
                          v-model="globalVar.showInPreview"
                          color="orange"
                          size="sm"
                          @click.stop
                          @focus.stop
                          @mousedown.stop
                        />
                      </div>
                      <div class="col-1">
                        <div class="text-caption text-grey-6">{{ globalVar.variableName }}</div>
                      </div>
                      <div class="col-2">
                        <q-input
                          v-model="globalVar.displayName"
                          dense
                          outlined
                          placeholder="Визуално име на глобалната"
                          style="min-width: 50px"
                          @click.stop
                          @focus.stop
                          @mousedown.stop
                        />
                      </div>
                      <div class="col">
                        <q-input
                          v-model="globalVar.comment"
                          dense
                          outlined
                          placeholder="Коментар за глобалната"
                          style="min-width: 250px"
                          @click.stop
                          @focus.stop
                          @mousedown.stop
                        />
                      </div>
                      <div class="col-auto">
                        <q-input
                          v-model="globalVar.value"
                          dense
                          outlined
                          type="number"
                          step="0.1"
                          style="width: 100px"
                          @click.stop
                          @focus.stop
                          @mousedown.stop
                        />
                      </div>
                      <div class="col-auto">
                        <q-select
                          v-model="globalVar.unit"
                          :options="unitOptions"
                          dense
                          outlined
                          style="width: 80px"
                          @click.stop
                          @focus.stop
                          @mousedown.stop
                        />
                      </div>
                      <div class="col-auto">
                        <q-btn
                          :icon="globalVar.showDetails ? 'expand_less' : 'expand_more'"
                          flat
                          round
                          size="sm"
                          @click="globalVar.showDetails = !globalVar.showDetails"
                        >
                          <q-tooltip>{{ globalVar.showDetails ? 'Скрий детайли' : 'Покажи детайли' }}</q-tooltip>
                        </q-btn>
                      </div>
                    </div>
                  </div>

                  <!-- Expandable details section -->
                  <q-slide-transition>
                    <q-card v-show="globalVar.showDetails" flat bordered class="q-mt-xs">
                      <q-card-section class="q-pa-sm">
                        <div class="text-subtitle2 q-mb-sm text-grey-7">Използва се в блокове:</div>
                        <div v-for="blockInfo in globalVar.blockInfos" :key="blockInfo.id" class="q-mb-sm">
                          <div class="block-info-card q-pa-sm" style="background: #f5f5f5; border-radius: 4px; border-left: 3px solid #1976d2;">
                            <div class="row items-center q-mb-xs">
                              <q-icon :name="getBlockIcon(blockInfo.blockType)" size="sm" color="primary" class="q-mr-sm" />
                              <span class="text-weight-bold text-dark">{{ blockInfo.name }}</span>
                              <q-badge v-if="blockInfo.mode" :label="blockInfo.mode" color="positive" class="q-ml-sm" />
                            </div>
                            <div v-if="blockInfo.comment" class="text-caption text-grey-7 q-ml-md" style="font-style: italic;">
                              {{ blockInfo.comment }}
                            </div>
                          </div>
                        </div>
                      </q-card-section>
                    </q-card>
                  </q-slide-transition>
                </div>
              </div>

              <div class="text-caption text-grey-6 q-mt-sm">
                * Глобални променливи се използват в множество блокове за споделяне на стойности
              </div>
            </q-card-section>
          </q-card>

          <!-- Form Actions -->
          <div class="row q-gutter-sm justify-end">
            <q-btn
              label="Отказ"
              color="grey"
              flat
              @click="goBack"
            />
            <q-btn
              :label="isEdit ? 'Запази промени' : 'Създай'"
              color="primary"
              type="submit"
              :loading="saving"
              :disable="!isFormValid"
            />
          </div>
        </q-form>
      </div>

      <!-- Preview Card -->
      <div class="col-md-4 col-sm-12">
        <q-card>
          <q-card-section>
            <div class="text-h6 q-mb-md">Преглед</div>
            
            <!-- Action Preview -->
            <div class="action-preview q-pa-md" style="border: 1px dashed #ccc; border-radius: 4px;">
              <div class="row items-center q-mb-sm">
                <div class="text-h5 q-mr-md">{{ form.icon || '🔧' }}</div>
                <div>
                  <div class="text-weight-medium">
                    {{ form.name || 'Име на действието' }}
                  </div>
                  <div v-if="form.description" class="text-caption text-grey-6">
                    {{ form.description }}
                  </div>
                </div>
              </div>

              <!-- Preview Parameters -->
              <div v-if="previewParameters.length" class="q-mt-md">
                <div class="text-caption text-grey-7 q-mb-xs">Параметри в преглед:</div>
                <div class="row q-gutter-xs">
                  <q-chip
                    v-for="param in previewParameters"
                    :key="param.name"
                    dense
                    :label="`${param.displayName}: ${param.value}`"
                    color="primary"
                    outline
                    size="sm"
                  />
                </div>
              </div>

              <!-- Flow File Info -->
              <div v-if="form.flowFile" class="q-mt-md">
                <div class="text-caption text-grey-7">Flow файл:</div>
                <div class="text-body2">{{ form.flowFile }}</div>
              </div>

              <!-- Status -->
              <div class="q-mt-md">
                <q-badge
                  :color="form.isActive ? 'positive' : 'negative'"
                  :label="form.isActive ? 'Активен' : 'Неактивен'"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>

       
      </div>
    </div>

    <!-- Flow File Selection Dialog -->
    <q-dialog v-model="showFlowDialog" persistent>
      <q-card style="min-width: 500px; max-width: 600px">
        <q-card-section>
          <div class="text-h6">Избор на Flow шаблон</div>
          <div class="text-caption text-grey-6">
            Валидирани flow шаблони от базата данни
          </div>
        </q-card-section>

        <q-card-section>
          <div v-if="loadingFlowFiles" class="text-center q-py-md">
            <q-spinner size="24px" />
            <div class="text-caption q-mt-sm">Зареждане на flow шаблони...</div>
          </div>

          <div v-else-if="!availableFlowFiles.length" class="text-center q-py-md">
            <q-icon name="account_tree" size="48px" color="grey-4" />
            <div class="text-body2 text-grey-6 q-mt-sm">Няма валидирани flow шаблони</div>
            <div class="text-caption text-grey-5">
              Създайте и валидирайте flow шаблони от FlowEditor
            </div>
            
            <q-separator class="q-my-md" />
            
            <div class="text-subtitle2 q-mb-sm">Или въведете ръчно:</div>
            <q-input
              v-model="flowFileInput"
              label="Име на flow файл"
              outlined
              dense
              placeholder="напр. ec_control_v1"
              suffix=".json"
            />
          </div>

          <div v-else>
            <div class="text-subtitle2 q-mb-sm">Налични flow шаблони:</div>
            <q-list bordered separator>
              <q-item
                v-for="file in availableFlowFiles"
                :key="file.name"
                clickable
                v-ripple
                @click="selectFlowFromList(file)"
                :class="{ 'bg-primary-1': selectedFlowFile?.name === file.name }"
              >
                <q-item-section avatar>
                  <q-icon name="account_tree" color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ file.displayName }}</q-item-label>
                  <q-item-label caption v-if="file.description">{{ file.description }}</q-item-label>
                  <q-item-label caption class="text-grey-5">{{ file.flowId }} v{{ file.version }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-icon
                    v-if="selectedFlowFile?.name === file.name"
                    name="check_circle"
                    color="primary"
                  />
                </q-item-section>
              </q-item>
            </q-list>

            <q-separator class="q-my-md" />

            <div class="text-subtitle2 q-mb-sm">Или въведете ръчно:</div>
            <q-input
              v-model="flowFileInput"
              label="Име на flow файл"
              outlined
              dense
              placeholder="напр. ec_control_v1"
              suffix=".json"
            />
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Отказ" @click="closeFlowDialog" />
          <q-btn
            flat
            icon="refresh"
            label="Обнови"
            @click="loadFlowFiles"
            :loading="loadingFlowFiles"
          />
          <q-btn
            color="primary"
            label="Избери"
            @click="confirmFlowFile"
            :disable="!selectedFlowFile && !flowFileInput"
          >

          </q-btn>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { API_BASE_URL } from '../config/ports'

const router = useRouter()
const route = useRoute()
const $q = useQuasar()

// Data
const isEdit = computed(() => !!route.params.id)
const saving = ref(false)
const showFlowDialog = ref(false)
const flowFileInput = ref('')
const errors = ref<Record<string, string>>({})
const loadingFlowFiles = ref(false)
const availableFlowFiles = ref<any[]>([])
const selectedFlowFile = ref<any>(null)

// Form data
const form = ref({
  name: '',
  description: '',
  icon: '🔧',
  flowFile: '',
  isActive: true,
  parameters: [] as any[]
})

// Global variables data
const globalVariables = ref<any[]>([])

// Load block definitions dynamically from .block.ts files
const loadBlockDefinition = async (definitionId: string) => {
  try {
    const { getRealBlockLoader } = await import('../modules/flowEditorV2/blocks/BlockLoader')
    const loader = getRealBlockLoader()
    await loader.scanAndLoad()
    
    const blockDef = loader.getBlock(definitionId)
    return blockDef?.executorFields || []
  } catch (error) {
    console.warn(`Failed to load block definition for ${definitionId}:`, error)
    return []
  }
}

const generateDynamicParameters = async () => {
  if (!form.value.flowFile) {
    form.value.parameters = []
    return
  }

  try {
    // Load flow data from the selected template
    const response = await fetch(`${API_BASE_URL}/flow-templates/${selectedFlowFile.value?._id}`)
    if (!response.ok) throw new Error('Failed to load flow data')
    
    const result = await response.json()
    if (!result.success) throw new Error(result.error)
    
    const flowData = result.data.flowData || result.data
    
    // Extract executor fields from blocks in flow dynamically
    const dynamicParams: any[] = []
    const globalVars: any[] = []
    
    if (flowData.blocks) {
      // Get unique definition IDs from blocks
      const uniqueDefinitionIds = [...new Set(flowData.blocks.map((block: any) => block.definitionId))]
      
      // Load block definitions for each unique type
      const blockDefinitions: Record<string, string[]> = {}
      for (const definitionId of uniqueDefinitionIds) {
        blockDefinitions[definitionId] = await loadBlockDefinition(definitionId)
      }
      
      // Collect global variables usage
      const globalVarUsage: Record<string, { blocks: any[], comments: string[] }> = {}
      
      // Generate parameters for each block
      flowData.blocks.forEach((block: any) => {
        const executorFields = blockDefinitions[block.definitionId] || []
        
        // Check for global variables usage
        if (block.parameters?.useGlobalVariable && block.parameters?.selectedGlobalVariable) {
          const globalVar = block.parameters.selectedGlobalVariable
          if (!globalVarUsage[globalVar]) {
            globalVarUsage[globalVar] = { blocks: [], comments: [] }
          }
          globalVarUsage[globalVar].blocks.push(block)
          if (block.parameters?.comment) {
            globalVarUsage[globalVar].comments.push(block.parameters.comment)
          }
        }
        
        executorFields.forEach(fieldName => {
          const targetKey = `target.${block.definitionId}_${fieldName}_${block.id.slice(-6)}`
          const displayName = getFieldDisplayName(block.definitionId, fieldName)
          
          dynamicParams.push({
            name: targetKey,
            displayName: displayName,
            customDisplayName: displayName, // Default to technical display name
            value: block.parameters?.[fieldName] || 0,
            unit: 'сек', // Default unit
            showInPreview: false,
            blockId: block.id,
            blockName: (block.parameters?.customName || (block.parameters?.deviceType ? getDeviceTypeDisplayName(block.parameters.deviceType) : `${block.definitionId}_${block.id.slice(-6)}`)) + (block.parameters?.comment ? ` - ${block.parameters.comment}` : ''),
            fieldName: fieldName
          })
        })
      })
      
      // Generate global variables from usage
      Object.keys(globalVarUsage).forEach(varName => {
        const usage = globalVarUsage[varName]
        
        // Generate block display names
        const blockInfos = usage.blocks.map(block => ({
          id: block.id,
          displayName: getBlockDisplayNameForGlobal(block),
          blockType: block.definitionId,
          name: getBlockName(block),
          comment: block.parameters?.comment || '',
          mode: getBlockMode(block)
        }))
        
        globalVars.push({
          name: `global.${varName}`,
          variableName: varName,
          displayName: '',
          comment: '',
          value: 0,
          unit: '', // Default unit
          showInPreview: false,
          showDetails: false, // Add showDetails property
          usedInBlocks: usage.blocks.map(b => b.id),
          blockInfos: blockInfos
        })
      })
    }
    
    form.value.parameters = dynamicParams
    globalVariables.value = globalVars
    
  } catch (error: any) {
    console.error('Error generating dynamic parameters:', error)
    $q.notify({
      type: 'negative',
      message: 'Грешка при генериране на параметри: ' + error.message
    })
    form.value.parameters = []
    globalVariables.value = []
  }
}

const getDeviceTypeDisplayName = (deviceType: string): string => {
  const deviceTypeLabels: Record<string, string> = {
    'pump_water': 'Помпа за поливане',
    'pump_mix': 'Помпа за разбъркване', 
    'pump_nutrientsA': 'Помпа за A',
    'pump_nutrientsB': 'Помпа за B',
    'pump_back': 'Помпа връщане',
    'fan': 'Вентилатор',
    'led_light': 'LED осветление',
    'ec': 'EC сензор',
    'ph': 'pH сензор',
    'temp': 'Температурен сензор'
  }
  
  return deviceTypeLabels[deviceType] || deviceType
}

const getFieldDisplayName = (blockType: string, fieldName: string): string => {
  const fieldLabels: Record<string, Record<string, string>> = {
    'actuator': {
      'duration': 'Продължителност (сек)',
      'dose': 'Дози (бр)'
    },
    'if': {
      'manualComparisonValue': 'Стойност за сравнение'
    },
    'loop': {
      'maxIterations': 'Макс итерации',
      'delay': 'Забавяне (сек)'
    },
    'sensor': {
      'readingInterval': 'Интервал четене (сек)'
    }
  }
  
  return fieldLabels[blockType]?.[fieldName] || `${blockType} ${fieldName}`
}

const getBlockDisplayNameForGlobal = (block: any): string => {
  // First try customName
  if (block.parameters?.customName) {
    const comment = block.parameters?.comment ? ` - ${block.parameters.comment}` : ''
    return `${block.parameters.customName}${comment}`
  }
  
  // For actuator, use deviceType mapping
  if (block.definitionId === 'actuator' && block.parameters?.deviceType) {
    const deviceName = getDeviceTypeDisplayName(block.parameters.deviceType)
    const comment = block.parameters?.comment ? ` - ${block.parameters.comment}` : ''
    return `${deviceName}${comment}`
  }
  
  // For other blocks (if, loop, etc), use definitionId mapping
  const blockTypeLabels: Record<string, string> = {
    'if': 'Условие',
    'loop': 'Цикъл', 
    'sensor': 'Сензор',
    'merge': 'Обединяване',
    'delay': 'Забавяне'
  }
  
  const blockName = blockTypeLabels[block.definitionId] || block.definitionId
  const comment = block.parameters?.comment ? ` - ${block.parameters.comment}` : ''
  return `${blockName}${comment}`
}

const getBlockName = (block: any): string => {
  // First try customName
  if (block.parameters?.customName) {
    return block.parameters.customName
  }
  
  // For actuator, use deviceType mapping
  if (block.definitionId === 'actuator' && block.parameters?.deviceType) {
    return getDeviceTypeDisplayName(block.parameters.deviceType)
  }
  
  // For other blocks, use definitionId mapping
  const blockTypeLabels: Record<string, string> = {
    'if': 'Условие',
    'loop': 'Цикъл', 
    'sensor': 'Сензор',
    'merge': 'Обединяване',
    'delay': 'Забавяне'
  }
  
  return blockTypeLabels[block.definitionId] || block.definitionId
}

const getBlockMode = (block: any): string => {
  if (block.definitionId === 'actuator' && block.parameters?.controlMode) {
    return block.parameters.controlMode === 'duration' ? 'ВРЕМЕ' : 'ДОЗА'
  }
  return ''
}

const getBlockIcon = (blockType: string): string => {
  const blockIcons: Record<string, string> = {
    'actuator': 'settings',
    'if': 'help',
    'loop': 'loop',
    'sensor': 'sensors',
    'merge': 'merge',
    'delay': 'schedule'
  }
  
  return blockIcons[blockType] || 'widgets'
}

// Icon options
const iconOptions = ['🔧', '💧', '⚗️', '🌿', '💡', '🔄', '⏰', '📊', '🎯', '⚡']

// Unit options for parameters
const unitOptions = ['сек', 'мин', 'ч', 'бр', 'мл', 'л', 'гр', 'кг', 'mS', 'pH', '°C', '%']

// Computed
const isFormValid = computed(() => {
  return form.value.name.length >= 4 && 
         form.value.name.length <= 20 && 
         form.value.icon
})

const previewParameters = computed(() => {
  const params = form.value.parameters.filter(param => param.showInPreview).map(param => ({
    ...param,
    displayName: param.customDisplayName || param.displayName,
    value: `${param.value} ${param.unit || ''}`
  }))
  
  const globals = globalVariables.value.filter(globalVar => globalVar.showInPreview).map(globalVar => ({
    ...globalVar,
    displayName: globalVar.displayName || globalVar.variableName,
    value: `${globalVar.value} ${globalVar.unit || ''}`
  }))
  
  return [...params, ...globals]
})

// Group parameters by block
// const groupedParameters = computed(() => {
//   const groups: Record<string, any> = {}
  
//   form.value.parameters.forEach(param => {
//     if (!groups[param.blockId]) {
//       groups[param.blockId] = {
//         blockName: param.blockName,
//         blockId: param.blockId,
//         parameters: []
//       }
//     }
//     groups[param.blockId].parameters.push(param)
//   })
  
//   return Object.values(groups)
// })

// Methods
const loadActionTemplate = async (id: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/action-templates/${id}`)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const result = await response.json()
    
    if (result.success) {
      const templateData = result.data
      
      // Load basic template info
      form.value.name = templateData.name
      form.value.description = templateData.description || ''
      form.value.icon = templateData.icon
      form.value.flowFile = templateData.flowFile
      form.value.isActive = templateData.isActive
      
      //console.log('🔍 [DEBUG] Template data loaded:', templateData)
      
      // If there's a flow file, regenerate parameters and apply saved overrides
      if (templateData.flowFile) {
        //console.log('🔍 [DEBUG] Loading flow files...')
        
        // Load flow files to find the correct template with _id
        await loadFlowFiles()
        
        // Find the flow template by name
        selectedFlowFile.value = availableFlowFiles.value.find(f => f.name === templateData.flowFile)
        //console.log('🔍 [DEBUG] Selected flow file:', selectedFlowFile.value)
        
        if (selectedFlowFile.value) {
          //console.log('🔍 [DEBUG] Generating dynamic parameters...')
          
          // Generate fresh parameters and global variables from flow
          await generateDynamicParameters()
          
          //console.log('🔍 [DEBUG] Generated globalVariables:', globalVariables.value)
         // console.log('🔍 [DEBUG] Generated parameters:', form.value.parameters)
          
          // Wait for next tick to ensure globalVariables are fully generated
          await new Promise(resolve => setTimeout(resolve, 0))
          
          // Apply saved parameter overrides
          if (templateData.parameterOverrides) {
           // console.log('🔍 [DEBUG] Applying parameterOverrides:', templateData.parameterOverrides)
            applyParameterOverrides(templateData.parameterOverrides)
          }
          
          // Apply saved global variables metadata
          if (templateData.globalVariablesMetadata) {
           // console.log('🔍 [DEBUG] Applying globalVariablesMetadata:', templateData.globalVariablesMetadata)
            applyGlobalVariablesMetadata(templateData.globalVariablesMetadata)
           // console.log('🔍 [DEBUG] GlobalVariables after apply:', globalVariables.value)
          } else {
           // console.log('🔍 [DEBUG] No globalVariablesMetadata found in templateData')
          }
          
          // Apply saved parameter settings (custom display names, showInPreview)
          if (templateData.parameters) {
            //console.log('🔍 [DEBUG] Applying parameter settings:', templateData.parameters)
            applySavedParameterSettings(templateData.parameters)
          }
        }
      }
    } else {
      throw new Error(result.error)
    }
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: 'Грешка при зареждане: ' + error.message
    })
    router.push('/action-templates')
  }
}



const generateParameterOverrides = () => {
  // Return empty object - parameters disabled
  return {}
}

const generateGlobalVariables = () => {
  const globalVars: Record<string, any> = {}
  
  // Process global variables
  globalVariables.value.forEach(globalVar => {
    if (globalVar.value !== null && globalVar.value !== undefined && globalVar.value !== '') {
      globalVars[globalVar.variableName] = globalVar.value
    }
  })
  
  return globalVars
}

const saveActionTemplate = async (confirmEdit = false) => {
  saving.value = true
  errors.value = {}

  try {
    const url = isEdit.value 
      ? `${API_BASE_URL}/action-templates/${route.params.id}`
      : `${API_BASE_URL}/action-templates`
    
    const method = isEdit.value ? 'PUT' : 'POST'
    
    // Generate parameter overrides from checked parameters (with validation)
    const parameterOverrides = generateParameterOverrides()
    
    // Generate global variables
    const globalVars = generateGlobalVariables()
    
    // Prepare payload with parameterOverrides and globalVariables instead of raw parameters
    const payload = {
      ...form.value,
      parameterOverrides,
      globalVariables: globalVars,
      globalVariablesMetadata: globalVariables.value, // Save full metadata
      confirmEdit
    }
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (response.status === 409) {
      const result = await response.json()
      if (result.requiresConfirmation) {
        saving.value = false
        $q.dialog({
          title: 'Предупреждение',
          message: `${result.error}\n\nИскате ли да продължите с редакцията?`,
          ok: {
            label: 'Да, продължи',
            color: 'orange'
          },
          cancel: {
            label: 'Не, отказвам',
            color: 'grey'
          }
        }).onOk(() => {
          saveActionTemplate(true)
        })
        return
      }
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()

    if (result.success) {
      $q.notify({
        type: 'positive',
        message: isEdit.value 
          ? 'Action Template е обновен успешно'
          : 'Action Template е създаден успешно'
      })
      router.push('/action-templates')
    } else {
      if (result.error.includes('already exists')) {
        errors.value.name = 'Action Template с това име вече съществува'
      } else {
        throw new Error(result.error)
      }
    }
  } catch (error: any) {
    console.error('Error saving action template:', error)
    $q.notify({
      type: 'negative',
      message: 'Грешка при запазване: ' + error.message
    })
  } finally {
    saving.value = false
  }
}

const loadFlowFiles = async () => {
  loadingFlowFiles.value = true
  try {
    const response = await fetch(`${API_BASE_URL}/action-templates/flow-files`)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const result = await response.json()
    if (result.success) {
      availableFlowFiles.value = result.data
    } else {
      throw new Error(result.error)
    }
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: 'Грешка при зареждане на flow файлове: ' + error.message
    })
    availableFlowFiles.value = []
  } finally {
    loadingFlowFiles.value = false
  }
}

const selectFlowFile = () => {
  flowFileInput.value = form.value.flowFile.replace('.json', '')
  selectedFlowFile.value = availableFlowFiles.value.find(f => f.name === form.value.flowFile)
  showFlowDialog.value = true
  loadFlowFiles()
}

const selectFlowFromList = (file: any) => {
  selectedFlowFile.value = file
  flowFileInput.value = ''
}

const confirmFlowFile = async () => {
  if (selectedFlowFile.value) {
    form.value.flowFile = selectedFlowFile.value.name
  } else if (flowFileInput.value) {
    form.value.flowFile = flowFileInput.value.endsWith('.json') 
      ? flowFileInput.value 
      : flowFileInput.value + '.json'
  }
  
  // Generate dynamic parameters based on selected flow
  await generateDynamicParameters()
  
  closeFlowDialog()
}

const closeFlowDialog = () => {
  showFlowDialog.value = false
  selectedFlowFile.value = null
  flowFileInput.value = ''
}

// const getBlockDisplayName = (blockName: string): string => {
//   const parts = blockName.split(' - ')
//   return parts[0] // Връща само името без коментара
// }

const applyParameterOverrides = (parameterOverrides: Record<string, Record<string, any>>) => {
  form.value.parameters.forEach(param => {
    const blockId = param.blockId
    const fieldName = param.fieldName
    
    if (parameterOverrides[blockId] && parameterOverrides[blockId][fieldName] !== undefined) {
      param.value = parameterOverrides[blockId][fieldName]
      // Don't automatically check showInPreview - let user decide what to show
    }
  })
}

const applyGlobalVariablesMetadata = (savedMetadata: any[]) => {
  if (!savedMetadata || savedMetadata.length === 0) return

  globalVariables.value.forEach(globalVar => {
    const savedVar = savedMetadata.find(sv => sv.variableName === globalVar.variableName)
    if (savedVar) {
      globalVar.displayName = savedVar.displayName || ''
      globalVar.comment = savedVar.comment || ''
      globalVar.value = savedVar.value || 0
      globalVar.unit = savedVar.unit || ''
      globalVar.showInPreview = savedVar.showInPreview || false
      // Always start with panels closed for better UX
      globalVar.showDetails = false
    }
  })
}

// Load saved custom display names and showInPreview states from legacy parameters array
const applySavedParameterSettings = (savedParameters: any[]) => {
  if (!savedParameters || savedParameters.length === 0) return
  
  form.value.parameters.forEach(param => {
    const savedParam = savedParameters.find(sp => sp.name === param.name)
    if (savedParam) {
      param.customDisplayName = savedParam.displayName || savedParam.customDisplayName || param.displayName
      param.showInPreview = savedParam.showInPreview || false
    }
  })
}

// const getBlockComment = (blockName: string): string => {
//   if (!blockName) return ''
//   const parts = blockName.split(' - ')
//   return parts.length > 1 ? parts.slice(1).join(' - ') : '' // Връща коментара ако има
// }

const goBack = () => {
  router.push('/action-templates')
}

// Initialize form
const initializeForm = () => {
  form.value.parameters = []
}

// Lifecycle
onMounted(() => {
  if (isEdit.value && route.params.id) {
    loadActionTemplate(route.params.id as string)
  } else {
    initializeForm()
  }
})
</script>

<style lang="scss" scoped>
.q-page {
  overflow-y: auto;
}

.page-header {
  h4 {
    color: #1976d2;
  }
}

.action-preview {
  background-color: #f8f9fa;
  min-height: 120px;
}

.editor-tabs {
  .q-tab {
    min-height: 48px;
  }
}
</style>