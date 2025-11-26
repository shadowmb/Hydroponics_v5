<template>
  <q-card>
    <q-card-section class="bg-blue-grey-1">
      <div class="text-h6">
        <q-icon name="refresh" class="q-mr-sm" />
        Активни цикли
      </div>
      <div class="text-caption">Управление на циклите и тяхното изпълнение</div>
    </q-card-section>

    <q-card-section>
      <div v-if="activeCycles.length === 0" class="text-center text-grey-6 q-py-lg">
        <q-icon name="info" size="lg" class="q-mb-sm" />
        <div>Няма активни цикли</div>
      </div>

      <!-- Timeline View -->
      <div v-else class="cycles-timeline">
        <div class="timeline-connector"></div>
        
        <div 
          v-for="(cycle, index) in activeCycles" 
          :key="cycle.cycleId"
          class="timeline-item"
          :class="{ 'is-last': index === activeCycles.length - 1 }"
        >
          <!-- Timeline Dot -->
          <div class="timeline-dot" :class="getTimelineDotClass(cycle)">
            <q-icon :name="getCycleStatusIcon(cycle)" size="sm" color="white" />
          </div>
          
          <!-- Cycle Card -->
          <q-card 
            flat 
            bordered 
            :class="getCycleCardClass(cycle)"
            class="cycle-card-timeline"
          >
            <q-expansion-item
              v-model="expandedCycles[cycle.cycleId]"
              :header-class="'cycle-header'"
              expand-icon-class="text-primary"
            >
              <template v-slot:header>
                <div class="row items-center justify-between full-width q-pr-md">
                  <!-- Left: Time and Status -->
                  <div class="row items-center q-gutter-md">
                    <div class="cycle-time">
                      <q-icon name="access_time" size="sm" class="q-mr-xs text-primary" />
                      <span class="text-h6 text-weight-bold">{{ cycle.startTime }}</span>
                      <q-btn
                        @click.stop="openChangeTimeDialog(cycle)"
                        icon="schedule"
                        size="sm"
                        color="grey-6"
                        flat
                        round
                        dense
                        class="q-ml-xs time-edit-btn"
                      >
                        <q-tooltip>Промени началния час</q-tooltip>
                      </q-btn>
                    </div>
                    
                    <div class="row items-center q-gutter-xs">
                      <q-chip 
                        :color="getCycleStatusColor(cycle)"
                        text-color="white"
                        size="md"
                        :icon="getCycleStatusIcon(cycle)"
                        class="status-chip"
                      >
                        {{ getCycleStatusText(cycle) }}
                      </q-chip>
                      
                      <q-btn
                        @click.stop="refreshCycleData(cycle)"
                        :icon="refreshingCycle === cycle.cycleId ? 'hourglass_empty' : 'refresh'"
                        size="sm"
                        color="grey-6"
                        flat
                        round
                        dense
                        :loading="refreshingCycle === cycle.cycleId"
                        class="refresh-cycle-btn"
                      >
                        <q-tooltip>Обнови информацията за цикъла</q-tooltip>
                      </q-btn>
                    </div>
                    
                    <!-- Skip indicator -->
                    <q-chip 
                      v-if="isSkipped(cycle.cycleId)"
                      color="orange-2"
                      text-color="orange-9"
                      size="sm"
                      icon="schedule"
                      class="skip-indicator"
                    >
                      Прескочен
                    </q-chip>
                  </div>
                  
                  <!-- Right: Actions -->
                  <div class="row q-gutter-xs">
                    <q-btn 
                      @click.stop="handleSkipCycle(cycle.cycleId)"
                      size="sm"
                      :color="isSkipped(cycle.cycleId) ? 'positive' : 'orange'"
                      :icon="isSkipped(cycle.cycleId) ? 'play_arrow' : 'pause'"
                      round
                      flat
                      dense
                    >
                      <q-tooltip>{{ isSkipped(cycle.cycleId) ? 'Активирай цикъл' : 'Прескочи цикъл' }}</q-tooltip>
                    </q-btn>
                  </div>
                </div>
              </template>
              
              <!-- Expanded Content -->
              <q-card-section class="expanded-content bg-grey-1">
                <!-- Real-time Execution Monitor for Active Cycles -->
                <div v-if="cycle.isActive && (cycle.isCurrentlyExecuting || actionHistory.length > 0)" class="q-mb-lg">
                  <div class="execution-monitor q-pa-md bg-grey-1">
                    <div class="row items-center justify-between q-mb-md">
                      <div class="text-subtitle1 text-weight-medium row items-center">
                        Изпълнение на цикъл "{{ cycle.cycleId }}"
                        <span v-if="currentActionTemplateName" class="q-ml-sm text-grey-7">
                          → {{ currentActionTemplateName }}
                        </span>
                        <span v-if="getFlowStatus()" :class="getFlowStatusClass()">
                          - {{ getFlowStatusText() }}
                        </span>
                        <q-btn
                          v-if="getFlowStatus() === 'paused'"
                          flat
                          round
                          dense
                          icon="play_arrow"
                          color="positive"
                          size="sm"
                          class="q-ml-sm"
                          @click="resumeActionTemplate()"
                        >
                          <q-tooltip>Възобнови</q-tooltip>
                        </q-btn>
                      </div>
                    </div>

                    <div class="blocks-scroll-container" v-if="actionHistory.length > 0">
                      <q-list bordered separator>
                        <q-item
                          v-for="block in actionHistory"
                          :key="block.blockId"
                        >
                          <q-item-section avatar>
                            <q-icon
                              :name="getBlockIcon(block)"
                              :color="getBlockColor(block)"
                              :class="{ 'rotating': block.isStarted }"
                            />
                          </q-item-section>

                          <q-item-section>
                            <q-item-label>{{ block.text }}</q-item-label>
                            <q-item-label caption>
                              {{ formatBlockDuration(block) }}
                            </q-item-label>
                            <q-item-label caption v-if="getBlockDetails(block)" :class="block.success === false ? 'text-negative' : 'text-primary'">
                              {{ getBlockDetails(block) }}
                            </q-item-label>
                          </q-item-section>

                          <q-item-section side>
                            <q-badge
                              :color="getStatusColor(block)"
                            >
                              {{ getStatusText(block) }}
                            </q-badge>
                          </q-item-section>
                        </q-item>
                      </q-list>
                    </div>

                    <div
                      v-else
                      class="text-center q-py-lg text-grey-6"
                    >
                      <q-icon name="hourglass_empty" size="md" class="q-mb-sm" />
                      <div>Чака се да се стартира блок...</div>
                    </div>
                  </div>
                </div>
                
                <div class="row q-gutter-lg">
                  <!-- Basic Info -->
                  <div class="col-12 col-md-6">
                    <div class="text-subtitle2 text-weight-medium q-mb-sm text-primary">
                      <q-icon name="info" class="q-mr-xs" />
                      Основна информация
                    </div>
                    
                    <q-list dense class="info-list">
                      
                      <q-item v-if="cycle.duration">
                        <q-item-section avatar class="min-width-auto">
                          <q-icon name="hourglass_top" color="purple-6" />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label caption>Продължителност</q-item-label>
                          <q-item-label>{{ cycle.duration }} минути</q-item-label>
                        </q-item-section>
                      </q-item>
                      
                      <q-item>
                        <q-item-section avatar class="min-width-auto">
                          <q-icon name="analytics" color="green-6" />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label caption>Изпълнения</q-item-label>
                          <q-item-label>
                            <q-chip 
                              @click="showExecutionLogs(cycle.cycleId, cycle.executionCount)"
                              color="positive" 
                              text-color="white" 
                              size="sm"
                              clickable
                              class="execution-count-chip"
                            >
                              <q-icon name="visibility" size="xs" class="q-mr-xs" />
                              {{ cycle.executionCount }}
                              <q-tooltip>Показване на логове от изпълненията</q-tooltip>
                            </q-chip>
                          </q-item-label>
                        </q-item-section>
                      </q-item>
                    </q-list>
                  </div>
                  
                  <!-- Timing Info -->
                  <div class="col-12 col-md-6">
                    <div class="text-subtitle2 text-weight-medium q-mb-sm text-primary">
                      <q-icon name="schedule" class="q-mr-xs" />
                      Разписание
                    </div>
                    
                    <q-list dense class="info-list">
                      <q-item>
                        <q-item-section avatar class="min-width-auto">
                          <q-icon name="play_circle" color="teal-6" />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label caption>Следващо изпълнение</q-item-label>
                          <q-item-label class="text-weight-medium">{{ formatDateTime(cycle.nextExecution) }}</q-item-label>
                        </q-item-section>
                      </q-item>
                      
                      <q-item v-if="cycle.lastExecuted">
                        <q-item-section avatar class="min-width-auto">
                          <q-icon name="history" color="grey-6" />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label caption>Последно изпълнение</q-item-label>
                          <q-item-label>{{ formatDateTime(cycle.lastExecuted) }}</q-item-label>
                        </q-item-section>
                      </q-item>
                    </q-list>
                    
                    <!-- Skip Information -->
                    <div v-if="isSkipped(cycle.cycleId)" class="q-mt-md">
                      <q-card flat class="bg-orange-1 border-orange q-pa-sm">
                        <div class="row items-center q-gutter-sm">
                          <q-icon name="schedule" color="orange" />
                          <div>
                            <div class="text-caption text-weight-medium text-orange-9">Прескочен до</div>
                            <div class="text-body2 text-weight-bold text-orange-9">
                              {{ getSkipUntil(cycle.cycleId) ? formatDateTime(getSkipUntil(cycle.cycleId)!) : 'N/A' }}
                            </div>
                            <div v-if="getSkipReason(cycle.cycleId)" class="text-caption text-orange-8">
                              {{ getSkipReason(cycle.cycleId) }}
                            </div>
                          </div>
                        </div>
                      </q-card>
                    </div>
                  </div>
                </div>
                
                
                <!-- Parameters Section -->
                <div v-if="cycle.cycleGlobalParameters && cycle.cycleGlobalParameters.length > 0" class="q-mt-lg">
                  <div class="text-subtitle2 text-weight-medium q-mb-sm text-primary">
                    <q-icon name="tune" class="q-mr-xs" />
                    Параметри
                  </div>
                  
                  <div 
                    v-for="actionTemplate in cycle.cycleGlobalParameters" 
                    :key="actionTemplate.actionTemplateId"
                    class="q-mb-md"
                  >
                    <!-- ActionTemplate Header with chip style -->
                    <div class="row q-gutter-sm items-center q-mb-sm">
                      <div class="col-auto">
                        <q-chip 
                          :icon="getActionTemplateIcon(actionTemplate.actionTemplateName)"
                          color="blue-grey-2" 
                          text-color="blue-grey-8"
                          size="md"
                          class="action-template-chip"
                        >
                          {{ actionTemplate.actionTemplateName }}
                          <q-tooltip v-if="actionTemplate.actionTemplateDescription">{{ actionTemplate.actionTemplateDescription }}</q-tooltip>
                        </q-chip>
                      </div>
                      <div class="col-auto">
                        <q-btn 
                          @click="startEditingActionTemplateParameters(cycle.cycleId, actionTemplate)"
                          icon="edit"
                          color="primary"
                          size="sm"
                          flat
                          round
                          dense
                          v-if="!editingActionTemplateParameters[`${cycle.cycleId}_${actionTemplate.actionTemplateId}`]"
                        >
                          <q-tooltip>Редактирай параметри за {{ actionTemplate.actionTemplateName }}</q-tooltip>
                        </q-btn>
                      </div>
                    </div>
                    
                    <!-- ActionTemplate Description -->
                    <div v-if="actionTemplate.actionTemplateDescription" class="text-caption text-grey-7 q-mb-sm q-ml-sm">
                      {{ actionTemplate.actionTemplateDescription }}
                    </div>
                    
                    <!-- Parameters Display Mode -->
                    <div v-if="!editingActionTemplateParameters[`${cycle.cycleId}_${actionTemplate.actionTemplateId}`]" class="parameters-display">
                      <div class="row q-gutter-sm">
                        <div 
                          v-for="param in actionTemplate.parameters" 
                          :key="param.name"
                          class="col-auto"
                        >
                          <q-chip 
                            color="blue-grey-1" 
                            text-color="blue-grey-8"
                            size="md"
                            class="parameter-chip"
                          >
                            <strong>{{ param.displayName }}:</strong>&nbsp;{{ param.value }}
                            <q-tooltip v-if="param.comment">{{ param.comment }}</q-tooltip>
                          </q-chip>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Parameters Edit Mode -->
                    <div v-else class="parameters-edit">
                      <div class="row q-gutter-sm q-mb-sm">
                        <div
                          v-for="param in actionTemplate.parameters"
                          :key="param.name"
                          class="col-12 col-sm-6 col-md-4"
                        >
                          <q-input
                            v-model="editingActionTemplateParametersValues[`${cycle.cycleId}_${actionTemplate.actionTemplateId}`][param.name]"
                            :label="param.displayName"
                            :hint="param.comment"
                            dense
                            outlined
                            class="parameter-input"
                          />
                        </div>
                      </div>
                      <div class="row q-gutter-sm justify-end">
                        <q-btn 
                          @click="cancelEditingActionTemplateParameters(cycle.cycleId, actionTemplate.actionTemplateId)"
                          label="Откажи"
                          color="grey"
                          size="sm"
                          flat
                        />
                        <q-btn 
                          @click="saveActionTemplateParameters(cycle.cycleId, actionTemplate.actionTemplateId)"
                          label="Запази"
                          color="primary"
                          size="sm"
                          :loading="savingActionTemplateParameters[`${cycle.cycleId}_${actionTemplate.actionTemplateId}`]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </q-card-section>
            </q-expansion-item>
          </q-card>
        </div>
      </div>
    </q-card-section>

    <!-- Cycle Details Dialog -->
    <q-dialog v-model="showDetailsDialog" :maximized="$q.screen.lt.sm">
      <q-card style="min-width: 400px; max-width: 600px">
        <q-card-section>
          <div class="text-h6">Детайли на цикъл</div>
        </q-card-section>

        <q-card-section v-if="selectedCycle">
          <q-list separator>
            <q-item>
              <q-item-section>
                <q-item-label caption>ID на цикъл</q-item-label>
                <q-item-label>{{ selectedCycle.cycleId }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label caption>ID на задача</q-item-label>
                <q-item-label>{{ selectedCycle.taskId }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label caption>Време за стартиране</q-item-label>
                <q-item-label>{{ selectedCycle.startTime }}</q-item-label>
              </q-item-section>
            </q-item>


            <q-item v-if="selectedCycle.duration">
              <q-item-section>
                <q-item-label caption>Продължителност (минути)</q-item-label>
                <q-item-label>{{ selectedCycle.duration }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label caption>Брой изпълнения</q-item-label>
                <q-item-label>{{ selectedCycle.executionCount }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label caption>Активен</q-item-label>
                <q-item-label>
                  <q-chip :color="selectedCycle.isActive ? 'positive' : 'negative'" text-color="white" size="sm">
                    {{ selectedCycle.isActive ? 'Да' : 'Не' }}
                  </q-chip>
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Затвори" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Skip Cycle Dialog -->
    <q-dialog v-model="showSkipDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">
            {{ isCurrentlySkipped ? 'Активиране на цикъл' : 'Прескачане на цикъл' }}
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none" v-if="!isCurrentlySkipped">
          <q-input
            v-model.number="skipDays"
            type="number"
            label="Дни за прескачане"
            min="1"
            max="365"
            :rules="[val => val >= 1 && val <= 365 || 'Между 1 и 365 дни']"
            outlined
          />
          
          <q-input
            v-model="skipReason"
            label="Причина (по избор)"
            class="q-mt-md"
            outlined
            type="textarea"
            rows="2"
          />
        </q-card-section>

        <q-card-section v-else class="q-pt-none">
          <div class="text-body2">
            Сигурни ли сте, че искате да активирате този цикъл?
          </div>
          <div class="text-caption text-grey-6 q-mt-sm">
            Цикълът ще започне да се изпълнява според разписанието си.
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Отказ" color="primary" v-close-popup />
          <q-btn
            @click="handleSkipConfirm"
            :color="isCurrentlySkipped ? 'positive' : 'negative'"
            :label="isCurrentlySkipped ? 'Активирай' : 'Прескочи'"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Execution Logs Dialog - Action Files List -->
    <q-dialog v-model="showLogsDialog" :maximized="$q.screen.lt.md">
      <q-card style="min-width: 500px; max-width: 700px">
        <q-card-section class="bg-primary text-white">
          <div class="text-h6">
            <q-icon name="list_alt" class="q-mr-sm" />
            Логове от изпълнения
          </div>
          <div class="text-caption">
            Цикъл {{ selectedCycleId }} - {{ selectedExecutionCount }} изпълнения
          </div>
        </q-card-section>

        <q-card-section>
          <div v-if="cycleBlocks.length === 0" class="text-center q-pa-lg text-grey-6">
            <q-icon name="info" size="lg" class="q-mb-sm" />
            <div>Няма налични логове</div>
          </div>

          <div v-else>
            <div class="text-subtitle2 q-mb-md">
              📋 Изпълнени блокове: {{ cycleBlocks.length }}
              <span class="q-ml-lg">⏱️ Общо време: {{ calculateTotalCycleDuration() }}</span>
            </div>

            <q-list separator>
              <q-expansion-item
                v-for="(block, index) in cycleBlocks"
                :key="block.blockId"
                :model-value="false"
                class="block-item"
              >
                <template v-slot:header>
                  <q-item-section avatar>
                    <q-icon :name="getBlockIcon(block.blockType)" :color="getBlockColor(block.blockType)" />
                  </q-item-section>

                  <q-item-section>
                    <q-item-label class="text-weight-medium">
                      {{ getBlockDisplayName(block) }}
                    </q-item-label>
                    <q-item-label caption>
                      <q-icon name="schedule" size="xs" class="q-mr-xs" />
                      {{ formatTime(block.blockStartTime) }}
                      <span class="q-ml-md">
                        <q-icon name="timer" size="xs" class="q-mr-xs" />
                        {{ formatDurationInSeconds(block.duration) }}
                      </span>
                      <span class="q-ml-md">
                        <q-chip :color="getStatusColor(block.blockStatus)" text-color="white" size="sm">
                          {{ block.blockStatus }}
                        </q-chip>
                      </span>
                    </q-item-label>
                  </q-item-section>
                </template>

                <!-- Block Details -->
                <div class="q-pa-md block-details">
                  <div v-if="block.blockType === 'sensor'">
                    <div class="row q-gutter-md">
                      <div class="col">
                        <q-item-label class="text-weight-medium text-blue-8">📊 Sensor Reading</q-item-label>
                        <q-item-label v-if="block.outputData?.value">
                          <strong>Value:</strong> {{ block.outputData.value }}
                          <span v-if="block.outputData.sensorType === 'dfrobot_ec'">µS/cm</span>
                        </q-item-label>
                        <q-item-label v-if="block.outputData?.deviceType">
                          <strong>Device:</strong> {{ block.outputData.deviceType }}
                        </q-item-label>
                        <q-item-label v-if="block.outputData?.ports">
                          <strong>Port:</strong> {{ block.outputData.ports.join(', ') }}
                        </q-item-label>
                      </div>
                    </div>
                  </div>

                  <div v-else-if="block.blockType === 'actuator'">
                    <q-item-label class="text-weight-medium text-green-8">🔧 Actuator Action</q-item-label>
                    <q-item-label v-if="block.outputData?.action">
                      <strong>Action:</strong> {{ block.outputData.action }}
                    </q-item-label>
                    <q-item-label v-if="block.outputData?.deviceType">
                      <strong>Device:</strong> {{ block.outputData.deviceType }}
                    </q-item-label>
                  </div>

                  <div class="q-mt-md text-caption text-grey-7">
                    <div><strong>Duration:</strong> {{ formatDurationInSeconds(block.duration) }}</div>
                    <div><strong>Time:</strong> {{ formatTime(block.blockStartTime) }} → {{ formatTime(block.blockEndTime) }}</div>
                  </div>
                </div>
              </q-expansion-item>
            </q-list>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="bg-grey-1">
          <q-btn 
            flat 
            label="Обнови" 
            color="primary" 
            icon="refresh"
            @click="loadExecutionLogs"
          />
          <q-btn flat label="Затвори" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Action Details Dialog -->
    <q-dialog v-model="showActionDetailsDialog" :maximized="$q.screen.lt.md">
      <q-card style="min-width: 600px; max-width: 800px; max-height: 80vh">
        <q-card-section class="bg-secondary text-white">
          <div class="text-h6">
            <q-icon name="extension" class="q-mr-sm" />
            Action {{ selectedActionFile?.actionIndex }} - Детайли
          </div>
          <div class="text-caption">
            {{ selectedActionFile?.filename }}
          </div>
        </q-card-section>

        <q-card-section class="q-pa-none">
          <div v-if="actionDetails.length === 0" class="text-center q-pa-lg text-grey-6">
            <q-icon name="info" size="lg" class="q-mb-sm" />
            <div>Зарежда данни...</div>
          </div>
          
          <q-list v-else separator>
            <q-item 
              v-for="(detail, index) in actionDetails" 
              :key="index"
              class="detail-item"
            >
              <q-item-section avatar>
                <q-icon 
                  :name="getLogIcon(detail.level)" 
                  :color="getLogColor(detail.level)" 
                />
              </q-item-section>
              
              <q-item-section>
                <q-item-label class="text-weight-medium">
                  {{ detail.message }}
                </q-item-label>
                <q-item-label caption v-if="detail.timestamp">
                  <q-icon name="schedule" size="xs" class="q-mr-xs" />
                  {{ formatDateTime(detail.timestamp) }}
                </q-item-label>
              </q-item-section>
              
              <q-item-section side v-if="detail.duration">
                <q-chip size="sm" color="blue-grey-2" text-color="blue-grey-8">
                  {{ detail.duration }}ms
                </q-chip>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-card-actions align="right" class="bg-grey-1">
          <q-btn 
            flat 
            label="Назад" 
            color="primary" 
            icon="arrow_back"
            @click="showActionDetailsDialog = false"
          />
          <q-btn flat label="Затвори" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Change Time Dialog 1: Confirmation -->
    <q-dialog v-model="showChangeTimeDialog">
      <q-card style="min-width: 400px">
        <q-card-section class="bg-primary text-white">
          <div class="text-h6">Промяна на началния час</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="text-body1 q-mb-md">
            Искате ли да промените началния час на цикъл {{ selectedCycleForTimeChange?.cycleId }}?
          </div>
          <div class="text-body2 text-orange-8 bg-orange-1 q-pa-sm rounded-borders">
            <q-icon name="warning" class="q-mr-sm" />
            Ако новото време е след сегашното време и цикълът вече е изпълнен днес, 
            ще се приложи автоматична пауза за днес.
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Не" color="primary" @click="cancelTimeChange" />
          <q-btn flat label="Да" color="primary" @click="confirmTimeChange" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Change Time Dialog 2: Time Picker -->
    <q-dialog v-model="showTimePickerDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section class="bg-primary text-white">
          <div class="text-h6">Избор на ново време</div>
          <div class="text-caption" v-if="timePickerCycleIndex > 0">
            Минимално време: {{ getMinimumTimeForCycle(timePickerCycleIndex) }}
            ({{ minCycleInterval }} мин след предишен цикъл)
          </div>
        </q-card-section>

        <q-card-section>
          <div class="text-body2 q-mb-md">
            Текущо време: <strong>{{ selectedCycleForTimeChange?.startTime }}</strong>
          </div>

          <div class="row items-center q-gutter-md">
            <q-select
              v-model="tempHour"
              :options="validHourOptions"
              label="Час"
              outlined
              style="width: 120px"
              @update:model-value="onHourChange"
            />
            <div class="text-h4 text-grey-6">:</div>
            <q-select
              v-model="tempMinute"
              :options="validMinuteOptions"
              label="Минути"
              outlined
              style="width: 120px"
              :disable="tempHour === null"
            />
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Отказ" color="primary" @click="cancelTimeChange" />
          <q-btn
            :color="hasUnsavedTimeChanges && canSaveTime ? 'negative' : 'positive'"
            label="Напред"
            icon="arrow_forward"
            :disable="!canSaveTime"
            @click="confirmNewTime"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Change Time Dialog 3: Final Confirmation -->
    <q-dialog v-model="showConfirmTimeDialog">
      <q-card style="min-width: 400px">
        <q-card-section class="bg-primary text-white">
          <div class="text-h6">Потвърждение за промяна</div>
        </q-card-section>

        <q-card-section>
          <div class="text-body1">
            Потвърждавате ли промяната на времето за цикъл {{ selectedCycleForTimeChange?.cycleId }}?
          </div>
          <div class="q-mt-md">
            <div class="row items-center q-gutter-sm">
              <q-icon name="schedule" color="grey-6" />
              <span class="text-body2">
                От <strong>{{ selectedCycleForTimeChange?.startTime }}</strong> 
                на <strong>{{ newSelectedTime }}</strong>
              </span>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Не" color="primary" @click="cancelTimeChange" />
          <q-btn flat label="Да, запази" color="primary" @click="saveTimeChange" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Change Time Dialog 4: Cascading Confirmation -->
    <q-dialog v-model="showCascadingDialog">
      <q-card style="min-width: 500px">
        <q-card-section class="bg-warning text-white">
          <div class="text-h6">
            <q-icon name="warning" class="q-mr-sm" />
            Каскадна промяна на време
          </div>
        </q-card-section>

        <q-card-section>
          <div class="text-body1 q-mb-md">
            Новото време нарушава минималния интервал от <strong>{{ minCycleInterval }} минути</strong>.
            Следните цикли ще бъдат автоматично преместени:
          </div>

          <q-list bordered separator class="rounded-borders">
            <q-item v-for="change in cascadingChanges" :key="change.cycleId">
              <q-item-section avatar>
                <q-icon name="schedule" color="orange" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-medium">{{ change.cycleId }}</q-item-label>
                <q-item-label caption>
                  <span class="text-strike">{{ change.oldTime }}</span>
                  <q-icon name="arrow_forward" size="xs" class="q-mx-xs" />
                  <span class="text-weight-bold text-primary">{{ change.newTime }}</span>
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Не, отмени" color="primary" @click="cancelCascading" />
          <q-btn flat label="Да, приеми промените" color="warning" @click="confirmCascading" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { date } from 'quasar'
import type { IActiveCycle, ISkippedCycle, IActionTemplateParameters } from '../../services/activeProgramService'
import { activeProgramService } from '../../services/activeProgramService'
import { useActiveProgramStore } from '../../stores/activeProgram'
import { useMainStore } from '../../stores/main'
import { useWebSocketStore } from '../../stores/websocket'
import { API_BASE_URL } from '../../config/ports'

// Props
const props = defineProps<{
  activeCycles: IActiveCycle[]
  skippedCycles: ISkippedCycle[]
}>()

// Emits
const emit = defineEmits<{
  'skip-cycle': [data: { cycleId: string; skipDays: number; reason?: string }]
  'refresh-cycle': [cycleId: string]
}>()

// Local state
const showDetailsDialog = ref(false)
const showSkipDialog = ref(false)
const showLogsDialog = ref(false)
const showActionDetailsDialog = ref(false)
const selectedCycle = ref<IActiveCycle | null>(null)
const skipCycleId = ref('')
const skipDays = ref(1)
const skipReason = ref('')
const selectedCycleId = ref('')
const selectedExecutionCount = ref(0)
const executionLogs = ref<IExecutionLog[]>([])
const cycleBlocks = ref<any[]>([])
const actionDetails = ref<IActionDetail[]>([])
const selectedActionFile = ref<IActionFile | null>(null)
const executionInfo = ref<any>(null)
const refreshingCycle = ref('')
const editingActionTemplateParameters = ref<Record<string, boolean>>({})
const editingActionTemplateParametersValues = ref<Record<string, Record<string, any>>>({})
const savingActionTemplateParameters = ref<Record<string, boolean>>({})
const expandedCycles = ref<Record<string, boolean>>({})

// Store instances
const activeProgramStore = useActiveProgramStore()
const mainStore = useMainStore()
const webSocketStore = useWebSocketStore()
const { actionHistory, wsConnected, currentActionTemplateName } = storeToRefs(webSocketStore)

// Get minCycleInterval from active program
const minCycleInterval = computed(() => activeProgramStore.activeProgram?.minCycleInterval || 120)

// Action file interface
interface IActionFile {
  actionIndex: number
  actionTemplateId: string
  filename: string
  time: string
  filepath: string
  totalBlocks: number
  duration: number
}

// Action detail interface  
interface IActionDetail {
  timestamp?: Date | string
  level: 'info' | 'success' | 'warning' | 'error'
  message: string
  duration?: number
}

// Execution log interface
interface IExecutionLog {
  timestamp: Date | string
  level: 'info' | 'success' | 'warning' | 'error'
  message: string
  executionId?: string
  duration?: number
  actionIndex?: number
  details?: any
}

// Computed
const isCurrentlySkipped = computed(() => {
  return isSkipped(skipCycleId.value)
})

// Methods
function formatDateTime(dateValue: Date | string): string {
  const d = typeof dateValue === 'string' ? new Date(dateValue) : dateValue
  return date.formatDate(d, 'DD.MM.YYYY HH:mm')
}

function getCycleCardClass(cycle: IActiveCycle): string {
  if (!cycle.isActive) return 'bg-grey-1'
  if (isSkipped(cycle.cycleId)) return 'bg-orange-1'
  
  const now = new Date().getTime()
  const nextExecution = new Date(cycle.nextExecution).getTime()
  const lastExecution = cycle.lastExecuted ? new Date(cycle.lastExecuted).getTime() : null
  
  // If currently executing
  if (cycle.isCurrentlyExecuting) {
    return 'bg-green-1' // Active
  }
  
  // If next execution is in the future
  if (nextExecution > now) {
    if (lastExecution) {
      return 'bg-blue-1' // Completed
    } else {
      return 'bg-grey-1' // Waiting
    }
  }
  
  return 'bg-grey-1' // Default waiting
}

function getTimelineDotClass(cycle: IActiveCycle): string {
  if (!cycle.isActive) return 'dot-inactive'
  if (isSkipped(cycle.cycleId)) return 'dot-skipped'
  
  // If currently executing
  if (cycle.isCurrentlyExecuting) {
    return 'dot-active' // Green - currently running
  }
  
  const now = new Date().getTime()
  const nextExecution = new Date(cycle.nextExecution).getTime()
  const lastExecution = cycle.lastExecuted ? new Date(cycle.lastExecuted).getTime() : null
  
  // If next execution is in the future
  if (nextExecution > now) {
    if (lastExecution) {
      return 'dot-completed' // Blue - completed
    } else {
      return 'dot-waiting' // Grey - waiting
    }
  }
  
  return 'dot-waiting' // Default
}

function getCycleStatusColor(cycle: IActiveCycle): string {
  if (!cycle.isActive) return 'grey'
  if (isSkipped(cycle.cycleId)) return 'orange'
  
  // If currently executing
  if (cycle.isCurrentlyExecuting) {
    return 'green' // Currently active/running
  }
  
  const now = new Date().getTime()
  const nextExecution = new Date(cycle.nextExecution).getTime()
  const lastExecution = cycle.lastExecuted ? new Date(cycle.lastExecuted).getTime() : null
  
  // If next execution is in the future
  if (nextExecution > now) {
    // If has been executed before, it's completed
    if (lastExecution) {
      return 'blue' // Completed
    } else {
      return 'grey' // Waiting for first execution
    }
  }
  
  // Default to waiting
  return 'grey'
}

function getCycleStatusIcon(cycle: IActiveCycle): string {
  if (!cycle.isActive) return 'pause'
  if (isSkipped(cycle.cycleId)) return 'schedule'
  
  // If currently executing
  if (cycle.isCurrentlyExecuting) {
    return 'play_arrow' // Currently active
  }
  
  const now = new Date().getTime()
  const nextExecution = new Date(cycle.nextExecution).getTime()
  const lastExecution = cycle.lastExecuted ? new Date(cycle.lastExecuted).getTime() : null
  
  // If next execution is in the future
  if (nextExecution > now) {
    if (lastExecution) {
      return 'check_circle' // Completed
    } else {
      return 'schedule' // Waiting
    }
  }
  
  return 'schedule' // Default waiting
}

function getCycleStatusText(cycle: IActiveCycle): string {
  if (!cycle.isActive) return 'Неактивен'
  if (isSkipped(cycle.cycleId)) return 'Прескочен'
  
  // If currently executing
  if (cycle.isCurrentlyExecuting) {
    return 'Активен' // Currently running
  }
  
  const now = new Date().getTime()
  const nextExecution = new Date(cycle.nextExecution).getTime()
  const lastExecution = cycle.lastExecuted ? new Date(cycle.lastExecuted).getTime() : null
  
  // If next execution is in the future
  if (nextExecution > now) {
    if (lastExecution) {
      return 'Завършен' // Has been executed, waiting for next
    } else {
      return 'Изчакване' // Waiting for first execution
    }
  }
  
  return 'Изчакване' // Default
}

function isSkipped(cycleId: string): boolean {
  const skip = props.skippedCycles.find(skip => skip.cycleId === cycleId)
  if (!skip) return false
  return new Date() < new Date(skip.skipUntil)
}

function getSkipUntil(cycleId: string): Date | null {
  const skip = props.skippedCycles.find(skip => skip.cycleId === cycleId)
  return skip ? new Date(skip.skipUntil) : null
}

function getSkipReason(cycleId: string): string | null {
  const skip = props.skippedCycles.find(skip => skip.cycleId === cycleId)
  return skip?.reason || null
}

function showCycleDetails(cycle: IActiveCycle): void {
  selectedCycle.value = cycle
  showDetailsDialog.value = true
}

function handleSkipCycle(cycleId: string): void {
  skipCycleId.value = cycleId
  
  if (isSkipped(cycleId)) {
    // If already skipped, ask for activation
    showSkipDialog.value = true
  } else {
    // If not skipped, ask for skip parameters
    skipDays.value = 1
    skipReason.value = ''
    showSkipDialog.value = true
  }
}

function handleSkipConfirm(): void {
  if (isCurrentlySkipped.value) {
    // Activate cycle (skip for 0 days effectively removes the skip)
    emit('skip-cycle', {
      cycleId: skipCycleId.value,
      skipDays: 0,
      reason: 'Активиран от потребителя'
    })
  } else {
    // Skip cycle
    emit('skip-cycle', {
      cycleId: skipCycleId.value,
      skipDays: skipDays.value,
      reason: skipReason.value || undefined
    })
  }
  
  showSkipDialog.value = false
}

function showExecutionLogs(cycleId: string, executionCount: number): void {
  selectedCycleId.value = cycleId
  selectedExecutionCount.value = executionCount
  showLogsDialog.value = true
  loadExecutionLogs()
}

async function loadExecutionLogs(): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/active-programs/logs/${selectedCycleId.value}`)
    const result = await response.json()
    
    if (result.success && result.data) {
      cycleBlocks.value = result.data.blocks || []
      executionInfo.value = result.data.executionInfo || null

      console.log('📊 Cycle blocks loaded:', cycleBlocks.value.length)
    } else {
      console.error('Failed to load execution logs:', result.error)
      cycleBlocks.value = []
      executionInfo.value = null
    }
  } catch (error) {
    console.error('Error loading execution logs:', error)
    cycleBlocks.value = []
    executionInfo.value = null
  }
}

function generateMockLogs(executionCount: number): IExecutionLog[] {
  const logs: IExecutionLog[] = []
  
  for (let i = 1; i <= executionCount; i++) {
    const baseTime = new Date(Date.now() - (executionCount - i) * 24 * 60 * 60 * 1000)
    const executionId = `exec-${selectedCycleId.value}-${i}`
    
    logs.push(
      {
        timestamp: new Date(baseTime.getTime()),
        level: 'info',
        message: `Започване на изпълнение ${i}`,
        executionId
      },
      {
        timestamp: new Date(baseTime.getTime() + 5000),
        level: 'success',
        message: `ActionTemplate "Ниво на ГР" завършен успешно`,
        executionId,
        duration: 4500
      },
      {
        timestamp: new Date(baseTime.getTime() + 15000),
        level: 'success',
        message: `Изпълнение ${i} завършено`,
        executionId,
        duration: 15000
      }
    )
  }
  
  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

function getLogIcon(level: string): string {
  const iconMap: Record<string, string> = {
    'info': 'info',
    'success': 'check_circle',
    'warning': 'warning',
    'error': 'error'
  }
  return iconMap[level] || 'info'
}

function getLogColor(level: string): string {
  const colorMap: Record<string, string> = {
    'info': 'blue',
    'success': 'green',
    'warning': 'orange',
    'error': 'red'
  }
  return colorMap[level] || 'grey'
}

async function refreshCycleData(cycle: IActiveCycle): Promise<void> {
  try {
    refreshingCycle.value = cycle.cycleId
    emit('refresh-cycle', cycle.cycleId)
    
    // Small delay to show loading state
    await new Promise(resolve => setTimeout(resolve, 500))
  } catch (error) {
    console.error('Error refreshing cycle data:', error)
  } finally {
    refreshingCycle.value = ''
  }
}

function viewActionDetails(actionFile: IActionFile): void {
  selectedActionFile.value = actionFile
  showActionDetailsDialog.value = true
  loadActionDetails(actionFile)
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}сек`
  const minutes = Math.floor(seconds / 60)
  return `${minutes}мин ${seconds % 60}сек`
}

async function loadActionDetails(actionFile: IActionFile): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/active-programs/logs/action/${actionFile.filename}/${actionFile.actionIndex}`)
    const result = await response.json()
    
    if (result.success && result.data) {
      // Transform block details to action details format
      actionDetails.value = result.data.blockDetails.map((block: any) => ({
        level: block.status === 'completed' ? 'success' : block.status === 'error' ? 'error' : 'info',
        message: `${block.blockType.toUpperCase()}: ${block.action}`,
        timestamp: new Date(block.startTime),
        duration: block.duration,
        blockType: block.blockType,
        result: block.result
      }))
      
      console.log('📊 Block details loaded:', actionDetails.value.length)
    } else {
      console.error('Failed to load action details:', result.error)
      actionDetails.value = [{
        level: 'error',
        message: 'Неуспешно зареждане на детайлите',
        timestamp: new Date()
      }]
    }
  } catch (error) {
    console.error('Error loading action details:', error)
    actionDetails.value = [{
      level: 'error',
      message: 'Грешка при зареждане на данните',
      timestamp: new Date()
    }]
  }
}

// ActionTemplate parameters editing functions
function startEditingActionTemplateParameters(cycleId: string, actionTemplate: IActionTemplateParameters): void {
  const key = `${cycleId}_${actionTemplate.actionTemplateId}`
  editingActionTemplateParameters.value[key] = true
  
  const parametersValues: Record<string, any> = {}
  actionTemplate.parameters.forEach(param => {
    parametersValues[param.name] = param.value
  })
  editingActionTemplateParametersValues.value[key] = parametersValues
}

function cancelEditingActionTemplateParameters(cycleId: string, actionTemplateId: string): void {
  const key = `${cycleId}_${actionTemplateId}`
  editingActionTemplateParameters.value[key] = false
  delete editingActionTemplateParametersValues.value[key]
}

async function saveActionTemplateParameters(cycleId: string, actionTemplateId: string): Promise<void> {
  const key = `${cycleId}_${actionTemplateId}`

  try {
    savingActionTemplateParameters.value[key] = true

    const parameters = editingActionTemplateParametersValues.value[key]
    if (!parameters) {
      throw new Error('Parameters not found')
    }
    await activeProgramService.updateActionTemplateParameters(cycleId, actionTemplateId, parameters)

    // Refresh active program data to get updated parameters
    await activeProgramStore.fetchActiveProgram()

    editingActionTemplateParameters.value[key] = false
    delete editingActionTemplateParametersValues.value[key]

    mainStore.showNotification('Параметрите са запазени успешно', 'positive')
  } catch (error) {
    console.error('Error saving ActionTemplate parameters:', error)
    mainStore.showNotification('Грешка при запазване на параметрите', 'negative')
  } finally {
    savingActionTemplateParameters.value[key] = false
  }
}

function getActionTemplateIcon(actionTemplateName: string): string {
  // Map ActionTemplate names to icons
  const iconMap: Record<string, string> = {
    'Ниво на ГР': 'water_drop',
    'Time Test': 'schedule'
  }
  return iconMap[actionTemplateName] || 'settings'
}

// Change Time Dialog functionality
const showChangeTimeDialog = ref(false)
const showTimePickerDialog = ref(false)
const showConfirmTimeDialog = ref(false)
const showCascadingDialog = ref(false)
const selectedCycleForTimeChange = ref<any>(null)
const newSelectedTime = ref('')
const tempHour = ref<number | null>(null)
const tempMinute = ref<number | null>(null)
const savedHour = ref<number | null>(null)
const savedMinute = ref<number | null>(null)
const timePickerCycleIndex = ref(-1)
const cascadingChanges = ref<Array<{ cycleId: string; oldTime: string; newTime: string }>>([])
const hasUnsavedTimeChanges = computed(() => {
  return tempHour.value !== savedHour.value || tempMinute.value !== savedMinute.value
})
const canSaveTime = computed(() => {
  return tempHour.value !== null &&
         tempMinute.value !== null &&
         hasUnsavedTimeChanges.value
})

// Helper function to get minimum time for a cycle based on previous cycle
function getMinimumTimeForCycle(cycleIndex: number): string {
  if (cycleIndex === 0) return '00:00'

  const sortedCycles = [...props.activeCycles].sort((a, b) => {
    return a.startTime.localeCompare(b.startTime)
  })

  const previousCycle = sortedCycles[cycleIndex - 1]
  if (!previousCycle) return '00:00'

  const [prevHours = 0, prevMinutes = 0] = previousCycle.startTime.split(':').map(Number)
  const prevTotalMinutes = prevHours * 60 + prevMinutes
  const minTotalMinutes = prevTotalMinutes + minCycleInterval.value

  const minHours = Math.floor(minTotalMinutes / 60) % 24
  const minMinutes = minTotalMinutes % 60

  return `${String(minHours).padStart(2, '0')}:${String(minMinutes).padStart(2, '0')}`
}

// Valid hour options based on minimum interval
const validHourOptions = computed(() => {
  if (timePickerCycleIndex.value === 0) {
    return Array.from({ length: 24 }, (_, i) => i)
  }
  const minTime = getMinimumTimeForCycle(timePickerCycleIndex.value)
  const [minHourStr = '0'] = minTime.split(':')
  const minHour = parseInt(minHourStr)
  return Array.from({ length: 24 - minHour }, (_, i) => minHour + i)
})

// Valid minute options based on selected hour and minimum interval
const validMinuteOptions = computed(() => {
  if (tempHour.value === null) return []
  const minuteSteps = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

  if (timePickerCycleIndex.value === 0) {
    return minuteSteps
  }

  const minTime = getMinimumTimeForCycle(timePickerCycleIndex.value)
  const [minHour = 0, minMinute = 0] = minTime.split(':').map(Number)

  if (tempHour.value > minHour) {
    return minuteSteps
  } else if (tempHour.value === minHour) {
    return minuteSteps.filter(m => m >= minMinute)
  }
  return []
})

function onHourChange() {
  tempMinute.value = null
}

function openChangeTimeDialog(cycle: any) {
  const cycleIndex = props.activeCycles.findIndex(c => c.cycleId === cycle.cycleId)
  timePickerCycleIndex.value = cycleIndex
  selectedCycleForTimeChange.value = cycle
  showChangeTimeDialog.value = true
}

function confirmTimeChange() {
  showChangeTimeDialog.value = false
  showTimePickerDialog.value = true

  // Initialize hour and minute from current time
  const [hours, minutes] = selectedCycleForTimeChange.value.startTime.split(':').map(Number)
  tempHour.value = hours
  tempMinute.value = minutes
  savedHour.value = hours
  savedMinute.value = minutes
  newSelectedTime.value = selectedCycleForTimeChange.value.startTime
}

function confirmNewTime() {
  // Build new time from hour and minute
  if (tempHour.value !== null && tempMinute.value !== null) {
    newSelectedTime.value = `${String(tempHour.value).padStart(2, '0')}:${String(tempMinute.value).padStart(2, '0')}`
  }

  showTimePickerDialog.value = false

  // Check for cascading changes
  const cascading = calculateCascadingChanges()
  if (cascading.length > 0) {
    cascadingChanges.value = cascading
    showCascadingDialog.value = true
  } else {
    showConfirmTimeDialog.value = true
  }
}

function calculateCascadingChanges(): Array<{ cycleId: string; oldTime: string; newTime: string }> {
  const changes: Array<{ cycleId: string; oldTime: string; newTime: string }> = []

  // Sort cycles by time
  const sortedCycles = [...props.activeCycles].sort((a, b) => {
    return a.startTime.localeCompare(b.startTime)
  })

  // Find changed cycle index in sorted array
  const changedCycleId = selectedCycleForTimeChange.value.cycleId
  let changedIndex = sortedCycles.findIndex(c => c.cycleId === changedCycleId)

  // Create copy with new time for changed cycle
  const updatedCycles = [...sortedCycles]
  const cycleToUpdate = updatedCycles[changedIndex]
  if (!cycleToUpdate) return changes
  updatedCycles[changedIndex] = { ...cycleToUpdate, startTime: newSelectedTime.value }

  // Re-sort after change
  updatedCycles.sort((a, b) => a.startTime.localeCompare(b.startTime))

  // Check each subsequent cycle
  for (let i = 1; i < updatedCycles.length; i++) {
    const currentCycle = updatedCycles[i]
    const previousCycle = updatedCycles[i - 1]
    if (!currentCycle || !previousCycle) continue

    const [prevHours = 0, prevMinutes = 0] = previousCycle.startTime.split(':').map(Number)
    const prevTotalMinutes = prevHours * 60 + prevMinutes
    const minTotalMinutes = prevTotalMinutes + minCycleInterval.value

    const [currHours = 0, currMinutes = 0] = currentCycle.startTime.split(':').map(Number)
    const currTotalMinutes = currHours * 60 + currMinutes

    if (currTotalMinutes < minTotalMinutes) {
      // Need to adjust this cycle
      const newHours = Math.floor(minTotalMinutes / 60) % 24
      const newMinutes = minTotalMinutes % 60

      // Round minutes to nearest 5
      const roundedMinutes = Math.ceil(newMinutes / 5) * 5
      const finalHours = roundedMinutes === 60 ? (newHours + 1) % 24 : newHours
      const finalMinutes = roundedMinutes === 60 ? 0 : roundedMinutes

      const newTime = `${String(finalHours).padStart(2, '0')}:${String(finalMinutes).padStart(2, '0')}`

      changes.push({
        cycleId: currentCycle.cycleId,
        oldTime: currentCycle.startTime,
        newTime: newTime
      })

      // Update for next iteration
      updatedCycles[i] = { ...currentCycle, startTime: newTime }
    }
  }

  return changes
}

async function saveTimeChange() {
  try {
    await activeProgramService.updateCycleStartTime(
      selectedCycleForTimeChange.value.cycleId,
      newSelectedTime.value
    )

    // Refresh data
    await activeProgramStore.fetchActiveProgram()

    showConfirmTimeDialog.value = false
    mainStore.showNotification(
      `Времето на цикъл ${selectedCycleForTimeChange.value.cycleId} е променено на ${newSelectedTime.value}`,
      'positive'
    )

    resetTimeChangeState()
  } catch (error: any) {
    console.error('Error updating cycle time:', error)
    mainStore.showNotification('Грешка при промяна на времето: ' + error.message, 'negative')
  }
}

function cancelCascading() {
  showCascadingDialog.value = false
  cascadingChanges.value = []
  cancelTimeChange()
}

async function confirmCascading() {
  showCascadingDialog.value = false

  try {
    // Apply main change first
    await activeProgramService.updateCycleStartTime(
      selectedCycleForTimeChange.value.cycleId,
      newSelectedTime.value
    )

    // Apply cascading changes
    for (const change of cascadingChanges.value) {
      await activeProgramService.updateCycleStartTime(change.cycleId, change.newTime)
    }

    // Refresh data
    await activeProgramStore.fetchActiveProgram()

    mainStore.showNotification(
      `Променени са ${cascadingChanges.value.length + 1} цикъла`,
      'positive'
    )

    resetTimeChangeState()
  } catch (error: any) {
    console.error('Error applying cascading changes:', error)
    mainStore.showNotification('Грешка при каскадна промяна: ' + error.message, 'negative')
  }
}

function cancelTimeChange() {
  showChangeTimeDialog.value = false
  showTimePickerDialog.value = false
  showConfirmTimeDialog.value = false
  showCascadingDialog.value = false
  resetTimeChangeState()
}

function resetTimeChangeState() {
  selectedCycleForTimeChange.value = null
  newSelectedTime.value = ''
  tempHour.value = null
  tempMinute.value = null
  savedHour.value = null
  savedMinute.value = null
  timePickerCycleIndex.value = -1
  cascadingChanges.value = []
}

// Block helper functions for logs dialog
function getBlockDisplayName(block: any): string {
  return block.blockName || block.blockType
}

function formatTime(timestamp: string): string {
  if (!timestamp) return 'N/A'
  return new Date(timestamp).toLocaleTimeString('bg-BG', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function formatDurationInSeconds(ms: number): string {
  if (!ms) return '0сек'
  const seconds = Math.round(ms / 1000 * 10) / 10 // закръгля до 1 знак
  return seconds >= 1 ? `${seconds}сек` : `${ms}ms`
}

function calculateTotalCycleDuration(): string {
  if (!executionInfo.value || !cycleBlocks.value.length) return 'N/A'

  // Общо време от блоковете
  const totalBlockTime = cycleBlocks.value.reduce((sum, block) => sum + (block.duration || 0), 0)

  // Или използваме времето от executionInfo ако има
  if (executionInfo.value.cycleStartTime && executionInfo.value.cycleEndTime) {
    const startTime = new Date(executionInfo.value.cycleStartTime).getTime()
    const endTime = new Date(executionInfo.value.cycleEndTime).getTime()
    const totalTime = endTime - startTime
    return formatDurationInSeconds(totalTime)
  }

  return formatDurationInSeconds(totalBlockTime)
}

// Helper functions for execution monitor (copied from ActionTemplatesPage.vue)
function getBlockIcon(block: any): string {
  const icons: Record<string, string> = {
    sensor: 'sensors',
    actuator: 'settings_input_component',
    if: 'call_split',
    loop: 'loop',
    completion: 'check_circle',
    'system.end': 'check_circle',
    'system.start': 'play_circle'
  }

  if (block.isStarted) return 'sync'
  if (block.success === false) return 'error'
  if (block.success === true && block.type !== 'system.end' && block.type !== 'completion') return 'check_circle'

  return icons[block.type] || 'radio_button_unchecked'
}

function getBlockColor(block: any): string {
  if (block.isStarted) return 'orange'
  if (block.success === false) return 'negative'
  if (block.success === true) return 'positive'
  return 'grey'
}

function getStatusColor(block: any): string {
  if (block.isStarted) return 'orange'
  if (block.success) return 'positive'
  if (block.success === false) return 'negative'
  return 'grey'
}

function getStatusText(block: any): string {
  if (block.isStarted) return 'Running'
  if (block.success) return 'Done'
  if (block.success === false) return 'Failed'
  return 'Pending'
}

// Timer for live updates
const currentTime = ref(Date.now())
let timerInterval: NodeJS.Timeout | null = null

// Watch for active cycles and auto-expand them
watch(() => props.activeCycles, (newCycles) => {
  newCycles.forEach((cycle) => {
    // Auto-expand when cycle starts executing
    if (cycle.isCurrentlyExecuting && !expandedCycles.value[cycle.cycleId]) {
      expandedCycles.value[cycle.cycleId] = true
    }
  })
}, { deep: true })

onMounted(() => {
  // Auto-expand any currently executing cycles on mount
  props.activeCycles.forEach(cycle => {
    if (cycle.isCurrentlyExecuting) {
      expandedCycles.value[cycle.cycleId] = true
    }
  })

  timerInterval = setInterval(() => {
    currentTime.value = Date.now()
  }, 1000)
})

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
  }
})

const formatBlockDuration = (block: any): string => {
  let duration: number

  // Check if block is completed (not running)
  if (!block.isStarted && block.endTime && block.startTime) {
    // Block completed - use final fixed duration
    const startTime = new Date(block.startTime).getTime()
    const endTime = new Date(block.endTime).getTime()
    duration = Math.floor((endTime - startTime) / 1000)
  } else if (block.isStarted && (block.startTime || block.timestamp)) {
    // Block is currently running - count up
    const startTime = new Date(block.startTime || block.timestamp).getTime()
    duration = Math.floor((currentTime.value - startTime) / 1000)
  } else {
    // No timing info available
    duration = 0
  }

  const minutes = Math.floor(duration / 60)
  const seconds = duration % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const getBlockDetails = (block: any): string => {
  if (!block.blockData) return ''

  const data = block.blockData

  // Convert operator name to symbol
  const operatorToSymbol = (operator: string): string => {
    const map: Record<string, string> = {
      'greater_than': '>',
      'less_than': '<',
      'greater_equal': '≥',
      'less_equal': '≤',
      'equals': '=',
      'not_equals': '≠'
    }
    return map[operator] || operator
  }

  // Show error message if block failed
  if (block.success === false) {
    return data.displayText || 'Грешка'
  }

  if (block.type === 'sensor') {
    const result = data.result
    console.log('[ActiveCyclesCard] Sensor result:', result)
    if (result && result.value !== undefined) {
      const unit = result.unit || ''
      console.log('[ActiveCyclesCard] Unit value:', unit)
      return `Стойност: ${result.value}${unit}`
    }
  }

  if (block.type === 'actuator') {
    const result = data.result
    const params = data.parameters

    // During execution - show parameters
    if (params && !result) {
      const deviceName = data.deviceName || 'Устройство'
      const actionType = params.actionType
      let duration = params.duration || 0

      // If using global variable, get value from ActiveProgram cycles
      if (params.useGlobalVariable && params.selectedGlobalVariable) {
        // Find the current cycle and its ActionTemplate parameters
        const currentCycle = props.activeCycles.find(c => c.isCurrentlyExecuting)
        if (currentCycle?.cycleGlobalParameters) {
          for (const atParams of currentCycle.cycleGlobalParameters) {
            const param = atParams.parameters.find(p => p.name === params.selectedGlobalVariable)
            if (param) {
              duration = Number(param.value)
              break
            }
          }
        }
      }

      const actionMap: Record<string, string> = {
        'on': 'Вкл.',
        'off': 'Изкл.',
        'on_off_timed': 'Вкл. → Изкл.',
        'off_on_timed': 'Изкл. → Вкл.',
        'toggle': 'Превключване'
      }
      const action = actionMap[actionType] || actionType

      let details = `${deviceName}: ${action}`

      if (duration > 0) {
        details += ` (${duration}s)`
      }

      if (params.powerLevel > 0 && params.powerLevel !== 100) {
        details += ` PWM: ${params.powerLevel}%`
      }

      return details
    }

    // After execution - show result with actual execution time
    if (result) {
      const deviceName = result.deviceName || data.deviceName || 'Устройство'
      return `${deviceName}: Завършено`
    }
  }

  if (block.type === 'if') {
    const result = data.result
    if (result) {
      const leftValue = result.leftValue !== undefined ? result.leftValue : ''
      const operator = operatorToSymbol(result.operator || result.comparison || '>')
      const rightValue = result.rightValue !== undefined ? result.rightValue : ''
      const conditionResult = result.conditionResult ? 'True' : 'False'
      return `${leftValue} ${operator} ${rightValue} = ${conditionResult}`
    }
  }

  if (block.type === 'loop') {
    const result = data.result
    console.log('[ActiveCyclesCard] Loop result:', result)
    if (result) {
      const iteration = result.iteration !== undefined ? result.iteration : (result.currentIteration !== undefined ? result.currentIteration : result.iterations)
      const maxIter = result.maxIterations !== undefined ? result.maxIterations : '∞'

      if (result.conditionDetails && result.conditionDetails.result !== undefined) {
        const leftValue = result.conditionDetails.leftValue !== undefined ? result.conditionDetails.leftValue : ''
        const operator = operatorToSymbol(result.conditionDetails.operator || '>')
        const rightValue = result.conditionDetails.rightValue !== undefined ? result.conditionDetails.rightValue : ''
        const condResult = result.conditionDetails.result ? 'True' : 'False'
        return `Итерация ${iteration}/${maxIter}: ${leftValue} ${operator} ${rightValue} = ${condResult}`
      } else {
        return `Итерация ${iteration}/${maxIter}`
      }
    }
  }

  return ''
}

const getFlowStatus = (): string | null => {
  return (webSocketStore as any).flowStatus || null
}

const getFlowStatusText = (): string => {
  const status = getFlowStatus()
  if (status === 'paused') return 'Пауза'
  if (status === 'stopped') return 'Спрян'
  if (status === 'active') return 'Активен'
  return 'Активен'
}

const getFlowStatusClass = (): string => {
  const status = getFlowStatus()
  if (status === 'paused') return 'text-orange'
  if (status === 'stopped') return 'text-grey'
  if (status === 'active') return 'text-positive'
  return 'text-positive'
}

const resumeActionTemplate = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/action-templates/resume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()

    if (result.success) {
      mainStore.showNotification('Изпълнението е възобновено успешно', 'positive')
    } else {
      throw new Error(result.message || 'Failed to resume')
    }
  } catch (error: any) {
    console.error('Error resuming ActionTemplate:', error)
    mainStore.showNotification(`Грешка при възобновяване: ${error.message}`, 'negative')
  }
}
</script>

<style scoped>
.cycle-card {
  transition: all 0.3s ease;
  border-width: 2px;
}

.cycle-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.border-green {
  border-color: #4caf50;
}

.border-orange {
  border-color: #ff9800;
}

/* Timeline Styles */
.cycles-timeline {
  position: relative;
  padding-left: 40px;
}

.timeline-connector {
  position: absolute;
  left: 20px;
  top: 20px;
  bottom: 20px;
  width: 2px;
  background: linear-gradient(to bottom, #e3f2fd 0%, #1976d2 50%, #e3f2fd 100%);
  border-radius: 2px;
}

.timeline-item {
  position: relative;
  margin-bottom: 24px;
}

.timeline-item.is-last {
  margin-bottom: 0;
}

.timeline-dot {
  position: absolute;
  left: -28px;
  top: 16px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  z-index: 2;
}

.timeline-dot.dot-active {
  background: linear-gradient(135deg, #4caf50, #66bb6a);
}

.timeline-dot.dot-completed {
  background: linear-gradient(135deg, #2196f3, #64b5f6);
}

.timeline-dot.dot-waiting {
  background: linear-gradient(135deg, #9e9e9e, #bdbdbd);
}

.timeline-dot.dot-skipped {
  background: linear-gradient(135deg, #ff9800, #ffb74d);
}

.timeline-dot.dot-inactive {
  background: linear-gradient(135deg, #757575, #9e9e9e);
}

.cycle-card-timeline {
  border-radius: 12px;
  transition: all 0.3s ease;
  border-width: 1px;
  margin-bottom: 8px;
}

.cycle-card-timeline:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.cycle-header {
  padding: 16px 20px;
  border-radius: 12px 12px 0 0;
}

.cycle-time {
  display: flex;
  align-items: center;
}

.status-chip {
  font-weight: 600;
  border-radius: 16px;
}

.skip-indicator {
  font-size: 0.75rem;
  font-weight: 500;
}

.expanded-content {
  border-top: 1px solid #e0e0e0;
}

.info-list {
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.info-list .q-item {
  border-radius: 6px;
  margin: 4px;
  transition: background-color 0.2s ease;
}

.info-list .q-item:hover {
  background-color: #f5f5f5;
}

.min-width-auto {
  min-width: auto;
}

.border-orange {
  border-left: 4px solid #ff9800;
}

.action-template-chip {
  font-size: 0.8rem;
  font-weight: 500;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.action-template-chip:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}

.execution-count-chip {
  cursor: pointer;
  transition: all 0.2s ease;
}

.execution-count-chip:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.log-item {
  transition: background-color 0.2s ease;
}

.log-item:hover {
  background-color: #f5f5f5;
}

.refresh-cycle-btn {
  opacity: 0.7;
  transition: all 0.2s ease;
}

.refresh-cycle-btn:hover {
  opacity: 1;
  transform: scale(1.1);
}

.action-file-item {
  transition: background-color 0.2s ease;
}

.action-file-item:hover {
  background-color: #f0f4ff;
}

.parameter-chip {
  margin: 2px;
  font-size: 0.85rem;
}

.parameter-input {
  min-width: 120px;
}

.parameters-display .row {
  align-items: center;
}

.detail-item {
  transition: background-color 0.2s ease;
}

.detail-item:hover {
  background-color: #f5f5f5;
}

/* Execution Monitor Styles */
.execution-monitor {
  border-radius: 8px;

  .rotating {
    animation: rotation 2s infinite linear;
  }

  .blocks-scroll-container {
    height: 200px;
    overflow-y: auto;
  }
}

@keyframes rotation {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(359deg);
  }
}
</style>