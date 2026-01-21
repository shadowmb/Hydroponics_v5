# Task B: Start/Resume Refactor

## Цел
Опростяване и подобряване на логиката за стартиране и възобновяване на активни програми, включително премахване на сложни стратегии, добавяне на задължителни Resume диалози и интелигентно управление на 00:00 reset.

## Контекст
След успешното завършване на Task A (Stop/Pause), имаме работеща Pause логика която записва позиция (`pauseBlockId`, `pauseFlowSessionId`, `pauseWindowId`). Сега трябва да рефакторираме Start/Resume логиката за да:
1. Премахнем сложните resume стратегии
2. Добавим задължителни Resume диалози за Safety
3. Имплементираме 00:00 reset логика
4. Опростим expired windows handling

---

## Архитектурни Решения

### 1. Премахване на Resume Strategies
**Текущо състояние:**
- 5 различни стратегии: `resume_flow`, `skip_active`, `stop_program`, `run_expired`, `skip_expired`
- Сложна context detection логика (редове 368-543 в ActiveProgramService.ts)

**Ново състояние:**
- Само `resume_flow` (продължава от паузиран поток)
- Expired windows → Auto Skip All (без user стратегии)
- Опростена логика

### 2. Задължителни Resume Диалози (Safety First)
**Принцип:** Винаги показваме dialog при Resume, независимо от контекста.

**3 Сценария:**

#### Сценарий 1: Active Flow (има паузиран поток)
- **Условие:** `pauseFlowSessionId` съществува
- **Dialog съдържание:**
  ```
  🔄 Активен Процес
  
  Прозорец: "Прозорец 1"
  Поток: "Тест Луп"
  Текущ блок: "ACTUATOR_SET (Разбъркване)"
  
  ⏸️ Паузирано в: 20.01.2026 11:22:54
  
  Продължи изпълнението?
  
  [Resume Flow]  [Stop Program] (default, 30 мин)
  ```
- **Default:** Stop Program (Safety - ако user не вижда dialog, по-добре да спре)
- **Timeout:** 30 минути

#### Сценарий 2: Expired Windows (няма поток, има expired)
- **Условие:** Няма `pauseFlowSessionId`, но има expired windows (текущо време > endTime)
- **Dialog съдържание:**
  ```
  ⏰ Пропуснати Прозорци
  
  Програмата е била на пауза и са изтекли:
  • Прозорец 1 (08:00-12:00)
  • Прозорец 2 (12:00-16:00)
  
  Как да продължим?
  
  [Skip All] (default, 55s)  [Check Last]  [Stop Program]
  ```
- **Default:** Skip All (Safety)
- **Timeout:** 55 секунди

#### Сценарий 3: Clean Resume (няма поток, няма expired)
- **Условие:** Няма активен поток, няма expired windows
- **Dialog съдържание:**
  ```
  ▶️ Възобновяване на Програма
  
  Програма: "Test Resume Advanced"
  Статус: Спряна/Паузирана
  Прозорци:
    • Прозорец 1: Очаква изпълнение
    • Прозорец 2: Очаква изпълнение
  
  Сигурни ли сте, че искате да продължите?
  
  [Start Program]  [Cancel]
  ```
- **Default:** Няма (user трябва да избере)
- **Timeout:** Няма

### 3. Same-Day Tracking
**Логика:** Проверка дали програмата се изпълнява в същия ден.

```typescript
const isSameDay = () => {
  if (!active.startTime) return false;
  
  const startDate = active.startTime.toDateString();
  const today = new Date().toDateString();
  
  return startDate === today;
};
```

**Поведение:**
- **Same day:** Запазва completed/skipped windows
- **New day:** Reset-ва всички windows на pending (освен ако няма активен flow)

### 4. 00:00 Reset Механизъм
**Проблем:** Ако flow се изпълнява в 23:58 и продължава след полунощ, не трябва да прекъсваме.

**Решение:** Интелигентен reset с pending flag.

**Логика:**
```typescript
// В Scheduler tick, при 00:00 detection:
if (newDayDetected) {
  const snapshot = automation.getSnapshot();
  const hasActiveFlow = ['running', 'paused'].includes(snapshot.value);
  
  if (hasActiveFlow) {
    // Flag за pending reset
    active.pendingDayReset = true;
    await active.save();
    return; // НЕ reset-ваме още
  }
  
  // Няма flow → Reset веднага
  await this.performDayReset(active);
}

// В flow finish логиката:
if (flowFinished) {
  // ... нормална логика ...
  
  // Проверка за pending reset
  if (active.pendingDayReset) {
    await this.performDayReset(active);
    active.pendingDayReset = false;
  }
}
```

**performDayReset() метод:**
```typescript
private async performDayReset(active: IActiveProgram) {
  logger.info('📅 Performing Day Reset');
  
  // 1. Reset windows
  if (active.windowsState) {
    active.windowsState.forEach(ws => {
      ws.status = 'pending';
      ws.triggersExecuted = [];
      ws.triggersExecuting = [];
      ws.triggerCounts = {};
      ws.currentFlowSessionId = undefined;
    });
  }
  
  // 2. Clear pause state
  active.pauseBlockId = undefined;
  active.pauseFlowSessionId = undefined;
  active.pauseWindowId = undefined;
  active.pauseBlockLabel = undefined;
  active.pausedAt = undefined;
  
  // 3. Reset day flag
  active.dayCompleteEmitted = false;
  
  // 4. Keep status = running (scheduler ще продължи проверките)
  await active.save();
}
```

---

## Schema Промени

### ActiveProgram.schema.ts

**Нови полета:**
```typescript
pauseBlockLabel?: string;     // Label на блока при pause (за UI dialog)
pendingDayReset?: boolean;    // Flag че чака reset след flow finish
```

**Пълен списък pause полета (за справка):**
```typescript
pausedAt?: Date;                    // Кога е паузирана
pauseFlowSessionId?: string;        // ID на паузирания flow
pauseBlockId?: string;              // ID на блока при pause
pauseBlockLabel?: string;           // Label на блока (ново)
pauseWindowId?: string;             // ID на прозореца (ADVANCED)
pauseTimeout?: number;              // Timeout в секунди (default 600)
pendingDayReset?: boolean;          // Чака 00:00 reset (ново)
```

---

## Фази на Имплементация

### Фаза 1: Backend - Schema Update
**Цел:** Добавяне на нови полета в схемата

**Файл:** `backend/src/modules/persistence/schemas/ActiveProgram.schema.ts`

**Промени:**
1. Добави `pauseBlockLabel?: string;` в IActiveProgram interface
2. Добави `pendingDayReset?: boolean;` в IActiveProgram interface
3. Добави съответните полета в Mongoose schema

**Успех:** Schema compile-ва без грешки

---

### Фаза 2: Backend - Pause Enhancement
**Цел:** Записване на `pauseBlockLabel` при pause

**Файл:** `backend/src/modules/scheduler/ActiveProgramService.ts`

**Промени в `pause()` метод (ред ~646-659):**

**Текущо:**
```typescript
active.pauseBlockId = engineSnapshot.context?.currentBlockId || undefined;
```

**Ново:**
```typescript
const currentBlockId = engineSnapshot.context?.currentBlockId;
active.pauseBlockId = currentBlockId;

// Намираме block label от flow definition
if (currentBlockId && active.pauseFlowSessionId) {
  try {
    // Опит 1: От execution context
    const blockConfig = engineSnapshot.context?.execContext?.blockConfigs?.[currentBlockId];
    active.pauseBlockLabel = blockConfig?.label || currentBlockId;
  } catch {
    active.pauseBlockLabel = currentBlockId; // Fallback
  }
}
```

**Успех:** `pauseBlockLabel` се записва правилно в DB при pause

---

### Фаза 3: Backend - Start/Resume Refactor
**Цел:** Опростяване на `start()` метода и премахване на сложни стратегии

**Файл:** `backend/src/modules/scheduler/ActiveProgramService.ts`

**Промени:**

#### 3.1: Премахване на Context Detection (ред 368-421)
**Действие:** Изтриване на цялата секция "RESUME LOGIC & CONTEXT DETECTION"

**Причина:** Контекста ще се определя във Frontend (при показване на dialog)

#### 3.2: Премахване на Strategy Handling (ред 423-542)
**Действие:** Изтриване на цялата секция за handling на strategies

**Причина:** Остава само `resume_flow` logика

#### 3.3: Опростена Resume Логика
**Нова логика:**

```typescript
async start(startTime?: Date, options?: { resumeStrategy?: 'resume_flow' }): Promise<IActiveProgram> {
    const active = await this.getActive();
    if (!active) throw new Error('No active program loaded');

    if (active.status === 'running') return active;

    const previousStatus = active.status;

    // Scheduled start
    if (startTime && new Date(startTime) > new Date()) {
        active.status = 'scheduled';
        active.startTime = new Date(startTime);
        await active.save();
        logger.info({ startTime: active.startTime }, '⏳ Active Program Scheduled');
        return active;
    }

    // Start/Resume
    active.status = 'running';
    if (!active.startTime) active.startTime = new Date();
    
    logger.info('▶️ Active Program Started/Resumed');

    // Handle RESUME from PAUSE
    if (previousStatus === 'paused' && options?.resumeStrategy === 'resume_flow') {
        logger.info('▶️ Resuming Paused Program in Automation Engine');
        const { automation } = await import('../automation/AutomationEngine');
        automation.resumeProgram();
    }

    // Reset FAILED and RUNNING items to PENDING
    active.schedule.forEach(item => {
        if (item.status === 'failed' || item.status === 'running') {
            item.status = 'pending';
        }
    });

    await active.save();

    // For ADVANCED programs, trigger immediate check (unless resuming active flow)
    if (active.type === 'ADVANCED' && active.status === 'running') {
        const isResumingActiveFlow = (options?.resumeStrategy === 'resume_flow');

        if (!isResumingActiveFlow) {
            setImmediate(async () => {
                try {
                    const { schedulerService } = await import('./SchedulerService');
                    await schedulerService.triggerImmediateCheck({ silent: false });
                } catch (error: any) {
                    logger.error({ error: error.message }, '❌ Failed to trigger immediate check');
                }
            });
        } else {
            logger.info('⏭️ Skipping Force Check (resuming active flow)');
        }
    }

    return active;
}
```

**Успех:** `start()` метод е опростен и работи с resume_flow

---

### Фаза 4: Backend - 00:00 Reset Implementation
**Цел:** Интелигентен reset при смяна на деня

**Файл:** `backend/src/modules/scheduler/SchedulerService.ts`

**Промени:**

#### 4.1: Добави helper метод `performDayReset()`
**Локация:** След метода `processAdvancedProgram()` (ред ~780)

**Код:** (виж секцията "Архитектурни Решения" -> "4. 00:00 Reset Механизъм")

#### 4.2: Модифицирай Day Detection логиката (ред 344-378)
**Текущо:**
```typescript
if (lastCheckDate.getDate() !== now.getDate()) {
    // Reset веднага
    state.status = 'pending';
    // ...
}
```

**Ново:**
```typescript
if (lastCheckDate.getDate() !== now.getDate()) {
    // Проверка за активен flow
    const snapshot = automation.getSnapshot();
    const hasActiveFlow = ['running', 'paused'].includes(snapshot.value as string);
    
    if (hasActiveFlow) {
        // Отлагаме reset
        if (!activeProgram.pendingDayReset) {
            activeProgram.pendingDayReset = true;
            logger.info('⏰ Day changed but flow is active - pending reset');
            await activeProgram.save();
        }
        return; // НЕ reset-ваме
    }
    
    // Няма flow → Reset веднага
    await this.performDayReset(activeProgram);
}
```

#### 4.3: Добави reset trigger при flow finish (ред ~447-568)
**Локация:** В секцията където се обработва flow completion

**Добавяне:**
```typescript
if (isFinished && currentSessionId) {
    logger.info({ windowId: window.id, sessionId: currentSessionId }, '✅ Trigger/Fallback flow finished');
    
    // ... existing logic ...
    
    // НОВО: Проверка за pending day reset
    if (activeProgram.pendingDayReset) {
        logger.info('🔄 Executing pending day reset after flow finish');
        await this.performDayReset(activeProgram);
        activeProgram.pendingDayReset = false;
        await activeProgram.save();
    }
}
```

**Успех:** 00:00 reset чака активен flow да завърши

---

### Фаза 5: Backend - Resume Context Detection
**Цел:** Предоставяне на контекст за Frontend Resume Dialog

**Нов файл:** `backend/src/modules/scheduler/ResumeContextService.ts`

**Съдържание:**
```typescript
import { activeProgramService } from './ActiveProgramService';
import { timeService } from '../../core/TimeService';
import { logger } from '../../core/LoggerService';

export interface ResumeContext {
    type: 'active_flow' | 'expired_windows' | 'clean';
    activeFlow?: {
        windowName: string;
        flowName: string;
        blockLabel: string;
        blockType: string;
        pausedAt: Date;
    };
    expiredWindows?: Array<{
        id: string;
        name: string;
        startTime: string;
        endTime: string;
    }>;
    programInfo?: {
        name: string;
        pendingWindows: number;
        completedWindows: number;
    };
}

class ResumeContextService {
    async getResumeContext(): Promise<ResumeContext | null> {
        const active = await activeProgramService.getActive();
        if (!active || active.status !== 'paused') return null;

        // Сценарий 1: Active Flow
        if (active.pauseFlowSessionId && active.pauseWindowId) {
            const window = active.windows?.find(w => w.id === active.pauseWindowId);
            
            return {
                type: 'active_flow',
                activeFlow: {
                    windowName: window?.name || 'Unknown',
                    flowName: 'Unknown', // TODO: resolve from trigger
                    blockLabel: active.pauseBlockLabel || active.pauseBlockId || 'Unknown',
                    blockType: active.pauseBlockId?.split('_')[0] || 'Unknown',
                    pausedAt: active.pausedAt!
                }
            };
        }

        // Сценарий 2: Expired Windows
        if (active.type === 'ADVANCED' && active.windowsState) {
            const now = timeService.now();
            const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            
            const timeToMin = (t: string) => {
                const [h, m] = t.split(':').map(Number);
                return h * 60 + m;
            };
            const currentMin = timeToMin(currentTimeStr);

            const expiredWindows: any[] = [];
            active.windowsState.forEach(ws => {
                const winDef = active.windows?.find(w => w.id === ws.windowId);
                if (winDef && ws.status !== 'completed' && ws.status !== 'skipped') {
                    const endMin = timeToMin(winDef.endTime);
                    if (currentMin > endMin) {
                        expiredWindows.push({
                            id: winDef.id,
                            name: winDef.name,
                            startTime: winDef.startTime,
                            endTime: winDef.endTime
                        });
                    }
                }
            });

            if (expiredWindows.length > 0) {
                return {
                    type: 'expired_windows',
                    expiredWindows
                };
            }
        }

        // Сценарий 3: Clean
        const pendingCount = active.windowsState?.filter(w => w.status === 'pending').length || 0;
        const completedCount = active.windowsState?.filter(w => w.status === 'completed').length || 0;

        return {
            type: 'clean',
            programInfo: {
                name: active.name || active.sourceProgramId,
                pendingWindows: pendingCount,
                completedWindows: completedCount
            }
        };
    }
}

export const resumeContextService = new ResumeContextService();
```

**Успех:** Service връща правилен контекст за всеки сценарий

---

### Фаза 6: Backend - Resume Context API
**Цел:** Експозване на Resume Context през API

**Файл:** `backend/src/api/controllers/ActiveProgramController.ts`

**Добавяне на нов endpoint:**
```typescript
static async getResumeContext(req: FastifyRequest, reply: FastifyReply) {
    try {
        const { resumeContextService } = require('../../modules/scheduler/ResumeContextService');
        const context = await resumeContextService.getResumeContext();
        
        if (!context) {
            return reply.status(404).send({ 
                success: false, 
                error: 'No paused program found' 
            });
        }
        
        reply.send({ success: true, data: context });
    } catch (error: any) {
        reply.status(500).send({ 
            success: false, 
            error: error.message 
        });
    }
}
```

**Файл:** `backend/src/api/routes.ts`

**Добавяне на route:**
```typescript
// Resume context check
app.get('/api/active-program/resume-context', ActiveProgramController.getResumeContext);
```

**Успех:** API endpoint работи и връща контекст

---

### Фаза 7: Frontend - Resume Dialog Component
**Цел:** Създаване на универсален Resume Dialog компонент

**Нов файл:** `frontend/src/components/activeProgram/ResumeProgramDialog.tsx`

**Съдържание:** (Компонентът е съществуващ, трябва да се модифицира)

**Промени:**
1. Fetch context от `/api/active-program/resume-context`
2. Рендериране на подходящия UI базиран на `context.type`
3. Timer логика с `useRef` за запазване на state при close/reopen
4. Различен timeout за всеки сценарий

**Структура:**
```tsx
const ResumeProgramDialog = ({ open, onClose }) => {
  const [context, setContext] = useState<ResumeContext | null>(null);
  const timerStartTime = useRef(Date.now());
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (open) {
      fetchContext();
      // Start timer
    }
  }, [open]);

  const fetchContext = async () => {
    const res = await fetch('/api/active-program/resume-context');
    const { data } = await res.json();
    setContext(data);
    
    // Set timeout based on context type
    if (data.type === 'active_flow') {
      setRemaining(30 * 60); // 30 min
    } else if (data.type === 'expired_windows') {
      setRemaining(55); // 55 sec
    }
  };

  const renderContent = () => {
    if (!context) return null;

    switch (context.type) {
      case 'active_flow':
        return <ActiveFlowContent data={context.activeFlow} />;
      case 'expired_windows':
        return <ExpiredWindowsContent windows={context.expiredWindows} />;
      case 'clean':
        return <CleanResumeContent info={context.programInfo} />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      {/* Prevent close on outside click */}
      <DialogContent onInteractOutside={(e) => e.preventDefault()}>
        {renderContent()}
        <TimerBar remaining={remaining} />
        <DialogActions context={context} onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
};
```

**Успех:** Dialog се показва с правилен контекст и timer

---

### Фаза 8: Frontend - Resume Logic Integration
**Цел:** Промяна на Resume button логиката

**Файл:** `frontend/src/components/activeProgram/AdvancedProgramManager.tsx`

**Промени в Resume button handler:**

**Текущо:**
```typescript
const handleResume = async () => {
  await activeProgramService.start(); // Директен старт
};
```

**Ново:**
```typescript
const [showResumeDialog, setShowResumeDialog] = useState(false);

const handleResumeClick = () => {
  setShowResumeDialog(true); // Показва dialog
};

const handleResumeConfirm = async (strategy: string) => {
  if (strategy === 'resume_flow') {
    await activeProgramService.start(undefined, { resumeStrategy: 'resume_flow' });
  } else if (strategy === 'skip_all') {
    // Mark expired as skipped
    // Then start
  }
  setShowResumeDialog(false);
};
```

**Успех:** Resume винаги показва dialog

---

### Фаза 9: Frontend - Timer State Persistence
**Цел:** Запазване на timer при close/reopen на dialog

**Файл:** `frontend/src/components/activeProgram/ResumeProgramDialog.tsx`

**Логика:**
```typescript
const timerStartTime = useRef(Date.now());

// При ре-отваряне:
useEffect(() => {
  if (open) {
    const elapsed = (Date.now() - timerStartTime.current) / 1000;
    const newRemaining = initialTimeout - elapsed;
    
    if (newRemaining > 0) {
      setRemaining(newRemaining);
    } else {
      // Auto-trigger default action
      handleDefaultAction();
    }
  }
}, [open]);
```

**Успех:** Timer не се reset-ва при close/reopen

---

### Фаза 10: Frontend - Global Pause Indicator (Header)
**Цел:** Показване на pause countdown timer навсякъде в приложението

**Файл:** `frontend/src/components/layout/Header.tsx`

**Промени:**

#### 10.1: Създаване на PauseIndicator Component

**Нов файл:** `frontend/src/components/activeProgram/PauseIndicator.tsx`

```tsx
import { useEffect, useState } from 'react';

interface PauseIndicatorProps {
  program: {
    name: string;
    pausedAt: Date;
    pauseTimeout: number;
  };
  onClick: () => void;
}

export const PauseIndicator = ({ program, onClick }: PauseIndicatorProps) => {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = (Date.now() - new Date(program.pausedAt).getTime()) / 1000;
      const remaining = program.pauseTimeout - elapsed;
      
      if (remaining <= 0) {
        // Timeout reached - refresh to show stopped state
        window.location.reload();
      } else {
        setRemaining(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [program]);

  const formatTime = (sec: number) => {
    const min = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${min}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      onClick={onClick}
      className="px-4 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 cursor-pointer transition-colors rounded flex items-center gap-2 text-sm"
    >
      <span>⏸️</span>
      <span className="font-medium">{program.name}</span>
      <span>·</span>
      <span>Paused</span>
      <span>·</span>
      <span className="font-mono">⏱️ {formatTime(remaining)} до stop</span>
    </div>
  );
};
```

#### 10.2: Интеграция в Header

**Файл:** `frontend/src/components/layout/Header.tsx`

**Добавяне:**
```tsx
import { PauseIndicator } from '../activeProgram/PauseIndicator';
import { useState, useEffect } from 'react';
import { socket } from '../../services/socket';

const Header = () => {
  const [pausedProgram, setPausedProgram] = useState(null);
  const [showResumeDialog, setShowResumeDialog] = useState(false);

  useEffect(() => {
    // Listen for pause events
    socket.on('active-program:paused', (data) => {
      setPausedProgram(data);
    });

    socket.on('active-program:resumed', () => {
      setPausedProgram(null);
    });

    // Fetch current state on mount
    fetch('/api/active-program')
      .then(res => res.json())
      .then(({ data }) => {
        if (data?.status === 'paused') {
          setPausedProgram({
            name: data.name,
            pausedAt: data.pausedAt,
            pauseTimeout: data.pauseTimeout || 1800
          });
        }
      });

    return () => {
      socket.off('active-program:paused');
      socket.off('active-program:resumed');
    };
  }, []);

  return (
    <header className="flex items-center justify-between p-4">
      {/* Existing header content */}
      
      {pausedProgram && (
        <PauseIndicator 
          program={pausedProgram}
          onClick={() => setShowResumeDialog(true)}
        />
      )}
      
      <ResumeProgramDialog 
        open={showResumeDialog}
        onClose={() => setShowResumeDialog(false)}
      />
    </header>
  );
};
```

**Успех:** Pause indicator се показва в header на всички страници

---

### Фаза 11: Backend - Socket.IO Pause Events
**Цел:** Real-time sync на pause state към всички клиенти

**Файл:** `backend/src/modules/scheduler/ActiveProgramService.ts`

**Промени в `pause()` метод:**

```typescript
async pause(): Promise<IActiveProgram> {
    // ... existing pause logic ...
    
    await active.save();

    // Emit Socket.IO event
    const { io } = require('../../api/server');
    io.emit('active-program:paused', {
        programId: active.sourceProgramId,
        programName: active.name || active.sourceProgramId,
        pausedAt: active.pausedAt,
        pauseTimeout: active.pauseTimeout || 1800
    });

    return active;
}
```

**Промени в `start()` метод:**

```typescript
async start(...): Promise<IActiveProgram> {
    // ... existing start logic ...
    
    // Emit Socket.IO event (resume or start)
    if (previousStatus === 'paused') {
        const { io } = require('../../api/server');
        io.emit('active-program:resumed');
    }

    return active;
}
```

**Промени в `stop()` метод:**

```typescript
async stop(): Promise<IActiveProgram> {
    // ... existing stop logic ...
    
    // Emit Socket.IO event (if was paused)
    if (active.status === 'paused') {
        const { io } = require('../../api/server');
        io.emit('active-program:resumed'); // Clear pause indicator
    }

    return active;
}
```

**Успех:** Socket.IO events се излъчват правилно

---

## Тестови Сценарии

### Тест 1: Active Flow Resume
**Стъпки:**
1. Стартирай ADVANCED програма с Loop flow
2. Паузирай по време на ACTUATOR_SET блок
3. Провери DB: `pauseBlockLabel` = "Разбъркване"
4. Натисни Resume
5. Провери Dialog: Показва правилен блок и прозорец
6. Избери "Resume Flow"
7. Провери: Flow продължава от същия блок

**Очакван резултат:** Flow продължава, Loop iteration не се reset-ва

---

### Тест 2: Expired Windows Resume
**Стъпки:**
1. Създай програма с 2 windows: 08:00-12:00, 12:00-16:00
2. Стартирай в 10:00
3. Паузирай в 10:30
4. Симулирай време 16:30
5. Натисни Resume
6. Провери Dialog: Списък с 2 expired windows
7. Не натискай нищо, изчакай 55 сек
8. Провери: И двата windows са skipped

**Очакван резултат:** Auto Skip All след timeout

---

### Тест 3: Clean Resume
**Стъпки:**
1. Стартирай програма
2. Stop програма
3. Натисни Resume (без да има pause state)
4. Провери Dialog: Показва program info
5. Избери "Start Program"
6. Провери: Програмата стартира отначало

**Очакван резултат:** Чист старт без dialog timeout

---

### Тест 4: 00:00 Reset с Active Flow
**Стъпки:**
1. Стартирай програма в 23:55
2. Trigger flow който отнема 10 мин (до 00:05)
3. Провери в 00:00: `pendingDayReset = true`
4. Изчакай flow да завърши
5. Провери DB: Windows са reset-нати, `pendingDayReset = false`

**Очакван резултат:** Reset се изпълнява след flow finish

---

### Тест 5: Dialog Timer Persistence
**Стъпки:**
1. Паузирай програма
2. Натисни Resume → Dialog се отваря
3. Изчакай 10 сек
4. Затвори dialog с X
5. Отвори отново Resume dialog
6. Провери: Timer продължава от 20 сек (не от 30)

**Очакван резултат:** Timer не се reset-ва

---

### Тест 6: Global Pause Indicator (Header)
**Стъпки:**
1. Паузирай програма
2. Провери Header: Pause indicator се показва с countdown timer
3. Отвори друга страница (напр. Dashboard)
4. Провери Header: Pause indicator все още се показва
5. Изчакай 5 сек
6. Провери: Timer се е намалил с 5 сек
7. Кликни на Pause Indicator
8. Провери: Resume Dialog се отваря
9. Затвори Dialog с Cancel
10. Провери: Pause Indicator все още се показва
11. Дай Resume от dialog
12. Провери: Pause Indicator изчезва от header

**Очакван резултат:** Pause Indicator работи коректно и се синхронизира на всички страници

---

## Checklist

### Фаза 1: Schema
- [ ] Добавени `pauseBlockLabel` и `pendingDayReset`
- [ ] Schema compile-ва

### Фаза 2: Pause Enhancement
- [ ] `pauseBlockLabel` се записва при pause

### Фаза 3: Start/Resume Refactor
- [ ] Премахната context detection логика
- [ ] Премахнати strategy handlers
- [ ] Опростен `start()` метод

### Фаза 4: 00:00 Reset
- [ ] Добавен `performDayReset()` метод
- [ ] Модифицирана day detection логика
- [ ] Добавен trigger при flow finish

### Фаза 5: Resume Context Service
- [ ] Създаден `ResumeCont Service.ts`
- [ ] Service връща правилен контекст

### Фаза 6: Resume Context API
- [ ] Добавен GET `/api/active-program/resume-context` endpoint
- [ ] API работи

### Фаза 7: Resume Dialog Component
- [ ] Модифициран `ResumeProgramDialog.tsx`
- [ ] 3-те сценария се рендерират правилно

### Фаза 8: Resume Logic Integration
- [ ] Resume button показва dialog
- [ ] Confirm handler работи

### Фаза 9: Timer Persistence
- [ ] Timer не се reset-ва при close/reopen

### Фаза 10: Global Pause Indicator
- [ ] Създаден `PauseIndicator.tsx` компонент
- [ ] Интегриран в Header.tsx
- [ ] Показва се на всички страници
- [ ] Кликаем и отваря Resume Dialog

### Фаза 11: Socket.IO Events
- [ ] Socket.IO events в `pause()`, `start()`, `stop()`
- [ ] Frontend listeners работят
- [ ] Real-time sync работи

### Тестване
- [ ] Тест 1: Active Flow Resume
- [ ] Тест 2: Expired Windows Resume
- [ ] Тест 3: Clean Resume
- [ ] Тест 4: 00:00 Reset
- [ ] Тест 5: Dialog Timer Persistence
- [ ] Тест 6: Global Pause Indicator (Header)

---

## Зависимости

**От Task A (Stop/Pause):**
- ✅ Pause записва `pauseBlockId`, `pauseFlowSessionId`, `pauseWindowId`
- ✅ PauseTimeoutService работи

**Към Task C (SafetyService):**
- 🔄 Hardware cleanup при pause (ще се имплементира в Task C)

---

## Забележки

1. **Dialog Close Protection:** DialogContent има `onInteractOutside={(e) => e.preventDefault()}` за да предотврати затваряне
2. **Timer Accuracy:** `useRef` запазва `timerStartTime` извън React render cycle
3. **00:00 Reset:** Не прекъсва активни flows, само отлага reset
4. **Expired Windows:** "Check Last" опцията ще използва съществуващия `TriggerEvaluator.evaluateWindow()`
5. **blockLabel Fallback:** Ако не може да се resolved label, използва blockId
6. **Global Pause Indicator:** 
   - Показва се в header на ВСИЧКИ страници
   - Компактен дизайн (1 ред)
   - Жълт background (⚠️)
   - Кликаем → отваря Resume Dialog
   - Няма бутони в самия indicator (само в dialog)
7. **Resume Dialog:**
   - НЕ се показва автоматично при timeout
   - Показва се САМО при user click (Resume button или Pause Indicator)
   - Timer countdown е само визуален - при timeout автоматично STOP без dialog

---

## Рискове

| Риск | Вероятност | Въздействие | Митигация |
|:---|:---|:---|:---|
| Dialog не блокира UI правилно | Средна | Средно | Тестване с click outside |
| Timer десинхронизация | Ниска | Средно | Използваме system time, не интервали |
| 00:00 reset прекъсва flow | Ниска | Високо | Pending flag логика |
| Frontend не получава context | Средна | Високо | Error handling в API |

---

## Следващи Стъпки (Task C)

След завършване на Task B, преминаваме към Task C: SafetyService
- Hardware cleanup при pause/stop
- Zombie process detection
- Emergency stop механизъм

---

## 🐛 Bug Fixes & Improvements (Phase 2) - **COMPLETED ✅**

### Идентифицирани Проблеми (Resolved in Session 20.01.2026)

#### ❌ Проблем 1: pauseBlockLabel показва Block ID вместо Label
**Статус:** ✅ RESOLVED (BaseRepository fix + Flow/Program fallback)

**Причина:**
- `BaseRepository.findById()` не филтрираше `deletedAt: null`
- `ActiveProgramService.pause()` търсеше само в `programs` вместо `flows`

**Решение:**
- ✅ BaseRepository добавен `deletedAt: null` filter
- ✅ ActiveProgramService проверява и в FlowRepository

---

#### ❌ Проблем 2: Pause записва грешни данни при Clean Pause
**Текущо състояние:**
```typescript
// ❌ Винаги записва pauseFlowSessionId, дори ако flow е завършен
if (currentBlockId && engineSnapshot.sessionId) {
    active.pauseFlowSessionId = engineSnapshot.sessionId;
}
```

**Проблем:**
`engineSnapshot.sessionId` съдържа последния изпълнен session, дори ако flow вече е `completed`.

**Решение:**
```typescript
// ✅ Проверка дали има активен flow
const activeSession = await ExecutionSessionModel.findOne({ 
    status: 'running' 
});

if (activeSession) {
    // Има активен flow
    active.pauseFlowSessionId = activeSession._id;
    active.pauseFlowName = activeSession.programName;
    active.pauseBlockId = engineSnapshot.currentBlockId;
    active.pauseBlockLabel = /* fetch from flow */;
} else {
    // Clean Pause
    active.pauseFlowSessionId = null;
    active.pauseFlowName = null;
    active.pauseBlockId = null;
    active.pauseBlockLabel = null;
}

// Current window от windowsState
const currentWindow = active.windowsState?.find(w => w.status === 'active');
if (currentWindow) {
    active.pauseWindowId = currentWindow.windowId;
}
```

**Файл:** `backend/src/modules/scheduler/ActiveProgramService.ts:pause()`

---

#### ❌ Проблем 3: Dialog не показва Flow Name
**Текущо състояние:**
```
Активен прозорец: Прозорец 1
Паузиран на блок: Разбъркване
```

**Липсва:** Име на потока

**Желано състояние:**
```
Прозорец: Прозорец 1
Поток: Тест Луп → Блок "Разбъркване"
```

**Решение:**
1. Добавяне на `pauseFlowName` в ActiveProgram schema
2. Записва се при pause от `ExecutionSession.programName`
3. Показва се в Dialog UI

**Файлове:**
- `backend/src/modules/persistence/schemas/ActiveProgram.schema.ts`
- `backend/src/modules/scheduler/ActiveProgramService.ts:pause()`
- `backend/src/modules/scheduler/ResumeContextService.ts`
- `frontend/src/components/activeProgram/ResumeProgramDialog.tsx`

---

#### ❌ Проблем 4: Clean Resume показва Dialog но не трябва
**Статус:** ❌ NOT A BUG - Design Decision

Clean Resume **ТРЯБВА** да показва dialog (защита от случайно натискане).

**Dialog съдържание:**
```
✅ Чисто Състояние

Програмата е паузирана, но няма активни или пропуснати прозорци.
Искате ли да продължите нормално?

[STOP PROGRAM] [Continue]
Default: Continue (60s)
```

**Файл:** `frontend/src/components/activeProgram/ResumeProgramDialog.tsx` (вече имплементирано)

---

#### ❌ Проблем 5: Resume Logic starва програма отначало
**Причина:** Resume не check-ва за pauseFlowSessionId правилно

**Решение:**
Трябва да се провери в `ActiveProgramService.start()` дали има `pauseFlowSessionId` и да се извика `automationService.resume()` вместо `start()`.

**Файл:** `backend/src/modules/scheduler/ActiveProgramService.ts:start()`

---

#### ❌ Проблем 6: Dialog Timer губи се при close/reopen
**Текущо състояние:**
Timer е local в Dialog component → Reset при re-render

**Желано:** Global timer който продължава да тече независимо от Dialog state

**Решение:** Backend PauseTimeoutService + Socket.IO

---

### 📋 Детайлен План за Поправки

---

#### **Fix 1: Pause Logic Validation**

**Цел:** Записване на pause данни само ако има активен flow

**Стъпки:**

1. **Модификация на `ActiveProgramService.pause()`**

```typescript
// Location: backend/src/modules/scheduler/ActiveProgramService.ts

async pause(options?: { timeout?: number }): Promise<void> {
    const active = await this.getActive();
    if (!active) throw new Error('No active program');

    // 1. Check for active flow via ExecutionSession
    const { ExecutionSessionModel } = await import('../persistence/schemas/ExecutionSession.schema');
    const activeSession = await ExecutionSessionModel.findOne({ status: 'running' });

    if (activeSession) {
        // ✅ Has active flow - record full context
        active.pauseFlowSessionId = activeSession._id;
        active.pauseFlowName = activeSession.programName;
        
        // Get current block from engine
        const engineSnapshot = await automationService.getEngineSnapshot();
        active.pauseBlockId = engineSnapshot.currentBlockId;
        
        // Get block label from flow
        const { flowRepository } = await import('../persistence/repositories/FlowRepository');
        const flow = await flowRepository.findById(activeSession.programId);
        
        if (flow) {
            const flowData = flow.toObject() as any;
            const blocks = flowData.blocks || flowData.nodes || [];
            const block = blocks.find((b: any) => b.id === engineSnapshot.currentBlockId);
            active.pauseBlockLabel = block?.params?.label || engineSnapshot.currentBlockId;
        }
        
        // Pause the automation engine
        await automationService.pause();
    } else {
        // ✅ Clean pause - no active flow
        active.pauseFlowSessionId = null;
        active.pauseFlowName = null;
        active.pauseBlockId = null;
        active.pauseBlockLabel = null;
    }

    // Find current window from windowsState
    const currentWindow = active.windowsState?.find(w => w.status === 'active');
    if (currentWindow) {
        const windowDef = active.windows?.find(w => w.id === currentWindow.windowId);
        active.pauseWindowId = currentWindow.windowId;
        active.pauseWindowName = windowDef?.name;
    }

    // Set pause metadata
    active.status = 'paused';
    active.pausedAt = new Date();
    active.pauseTimeout = options?.timeout || 600;

    await active.save();

    // Start timeout service
    const { pauseTimeoutService } = await import('./PauseTimeoutService');
    await pauseTimeoutService.startTimeout(active.pauseTimeout);

    // Emit Socket.IO event
    const io = global.socketIO;
    if (io) {
        io.emit('program:paused', {
            programId: active.sourceProgramId,
            pausedAt: active.pausedAt,
            timeout: active.pauseTimeout
        });
    }
}
```

**Тестване:**
- [ ] Pause по време на flow → проверка че `pauseFlowSessionId` е записан
- [ ] Pause без flow → проверка че `pauseFlowSessionId` е `null`
- [ ] Pause след завършен flow → проверка че НЕ записва старата sessionId

---

#### **Fix 2: Resume Context Service Validation**

**Цел:** Auto-cleanup на невалидни pause данни

**Файл:** `backend/src/modules/scheduler/ResumeContextService.ts`

```typescript
async getResumeContext(): Promise<ResumeContext | null> {
    const active = await ActiveProgramModel.findOne({ status: 'paused' });
    if (!active) return null;

    let pauseFlowName: string | undefined;
    let hasActiveFlow = false;

    if (active.pauseFlowSessionId) {
        const { ExecutionSessionModel} = await import('../persistence/schemas/ExecutionSession.schema');
        const session = await ExecutionSessionModel.findById(active.pauseFlowSessionId);
        
        // ✅ Validation: Check if session still exists and is paused
        if (session && session.status === 'paused') {
            hasActiveFlow = true;
            pauseFlowName = session.programName || active.pauseFlowName;
        } else {
            // ❌ Invalid session - auto cleanup
            active.pauseFlowSessionId = null;
            active.pauseFlowName = null;
            active.pauseBlockId = null;
            active.pauseBlockLabel = null;
            await active.save();
        }
    }

    // Determine expired windows...
    // ... (existing logic)

    // Determine context type
    let type: ResumeContext['type'];
    const hasExpired = expiredWindows.length > 0;

    if (hasActiveFlow && hasExpired) {
        type = 'active_with_expired';
    } else if (hasActiveFlow) {
        type = 'active_flow';
    } else if (hasExpired) {
        type = 'expired';
    } else {
        type = 'clean';
    }

    return {
        type,
        programId: active.sourceProgramId,
        programName: active.name,
        pausedAt: active.pausedAt,
        pauseTimeout: active.pauseTimeout,
        pauseFlowName,
        pauseBlockLabel: active.pauseBlockLabel,
        pauseWindowId: active.pauseWindowId,
        pauseWindowName: active.pauseWindowName,
        activeWindows,
        expiredWindows
    };
}
```

**Тестване:**
- [ ] Resume Context с валиден pauseFlowSessionId → правилно показване
- [ ] Resume Context с изтрит/завършен session → auto cleanup

---

#### **Fix 3: Active Program Schema Update**

**Цел:** Добавяне на `pauseFlowName` и `pauseWindowName` полета

**Файл:** `backend/src/modules/persistence/schemas/ActiveProgram.schema.ts`

```typescript
// Add to IActiveProgram interface
export interface IActiveProgram extends Document {
    // ... existing fields
    pauseFlowSessionId?: Types.ObjectId | null;
    pauseFlowName?: string | null;  // ✅ NEW
    pauseBlockId?: string | null;
    pauseBlockLabel?: string | null;
    pauseWindowId?: string | null;
    pauseWindowName?: string | null;  // ✅ NEW
    pausedAt?: Date | null;
    pauseTimeout?: number;
}

// Add to ActiveProgramSchema
const ActiveProgramSchema = new Schema<IActiveProgram>({
    // ... existing fields
    pauseFlowSessionId: { type: Schema.Types.ObjectId, default: null },
    pauseFlowName: { type: String, default: null },  // ✅ NEW
    pauseBlockId: { type: String, default: null },
    pauseBlockLabel: { type: String, default: null },
    pauseWindowId: { type: String, default: null },
    pauseWindowName: { type: String, default: null },  // ✅ NEW
    pausedAt: { type: Date, default: null },
    pauseTimeout: { type: Number, default: 600 },
});
```

**Тестване:**
- [ ] Schema migrations работят (MongoDB автоматично добавя полета)
- [ ] Pause записва нови полета
- [ ] Resume Context чете нови полета

---

#### **Fix 4: Resume Dialog UI Update**

**Цел:** Показване на Flow name в Active Flow сценарий

**Файл:** `frontend/src/components/activeProgram/ResumeProgramDialog.tsx`

```tsx
// Update Active Flow case rendering
case 'active_flow':
    return (
        <>
            <DialogDescription className="text-gray-300">
                Има активен процес (помпа/цикъл), който беше прекъснат.
                Как искате да продължите?
            </DialogDescription>
            <div className="bg-blue-900/20 border border-blue-800 p-4 rounded-md my-4">
                {/* ✅ Window Info */}
                <div className="mb-2">
                    <p className="text-sm font-medium text-blue-200">
                        Прозорец: {context.pauseWindowName || 'N/A'}
                    </p>
                </div>
                
                {/* ✅ Flow + Block Info */}
                {(context.pauseFlowName || context.pauseBlockLabel) && (
                    <div className="ml-4 text-sm text-gray-400">
                        Поток: <span className="font-mono text-blue-300">{context.pauseFlowName || 'Unknown'}</span>
                        {context.pauseBlockLabel && (
                            <> → Блок "<span className="text-green-300">{context.pauseBlockLabel}</span>"</>
                        )}
                    </div>
                )}

                {/* ✅ Static Timer Info (не countdown!) */}
                <div className="mt-3 pt-3 border-t border-blue-800/50 text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        <span>
                            Паузирано преди: {formatElapsed(context.pausedAt)}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>
                            Остава време: {formatRemaining(context.pauseTimeout, context.pausedAt)}
                        </span>
                    </div>
                </div>
            </div>
        </>
    );
```

**Helper Functions:**
```tsx
function formatElapsed(pausedAt?: string): string {
    if (!pausedAt) return 'N/A';
    const elapsed = Date.now() - new Date(pausedAt).getTime();
    const minutes = Math.floor(elapsed / 60000);
    if (minutes < 60) return `${minutes} минути`;
    const hours = Math.floor(minutes / 60);
    return `${hours} часа`;
}

function formatRemaining(timeout?: number, pausedAt?: string): string {
    if (!timeout || !pausedAt) return 'N/A';
    const elapsed = (Date.now() - new Date(pausedAt).getTime()) / 1000;
    const remaining = Math.max(0, timeout - elapsed);
    const minutes = Math.floor(remaining / 60);
    const seconds = Math.floor(remaining % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
```

**Тестване:**
- [ ] Active Flow Dialog показва Flow name
- [ ] Block label се показва правилно
- [ ] Static timer info е correct

---

#### **Fix 5: Resume Logic Cleanup**

**Цел:** Cleanup на pause данни след resume + правилен resume на flow

**Файл:** `backend/src/modules/scheduler/ActiveProgramService.ts`

```typescript
async start(resumeOptions?: { resumeStrategy?: string }): Promise<void> {
    const active = await this.getActive();
    if (!active) throw new Error('No active program loaded');

    if (active.status === 'paused') {
        // ✅ Resume from pause
        
        if (active.pauseFlowSessionId) {
            // Resume active flow
            const { automationService } = await import('../automation/AutomationService');
            await automationService.resume();
        }
        
        // ✅ Cleanup pause data
        active.pauseFlowSessionId = null;
        active.pauseFlowName = null;
        active.pauseBlockId = null;
        active.pauseBlockLabel = null;
        active.pauseWindowId = null;
        active.pauseWindowName = null;
        active.pausedAt = null;
        
        // Stop timeout service
        const { pauseTimeoutService } = await import('./PauseTimeoutService');
        await pauseTimeoutService.stopTimeout();
    }

    // Update status
    active.status = 'running';
    active.startedAt = active.startedAt || new Date();
    await active.save();

    // Start scheduler
    const { schedulerService } = await import('./SchedulerService');
    await schedulerService.start();

    // Emit Socket.IO
    const io = global.socketIO;
    if (io) {
        io.emit('program:resumed', {
            programId: active.sourceProgramId
        });
    }
}
```

**Тестване:**
- [ ] Resume от Active Flow → продължава откъдето е спрял
- [ ] Resume от Clean Pause → програмата продължава нормално
- [ ] Pause данни се cleanup-ват след resume

---

#### **Fix 6: Dialog Remove Countdown**

**Цел:** Премахване на местния countdown timer от Dialog

**Файл:** `frontend/src/components/activeProgram/ResumeProgramDialog.tsx`

```tsx
// ❌ REMOVE: Local countdown timer state
const [timeLeft, setTimeLeft] = useState(TIMEOUT_SECONDS);
const [progress, setProgress] = useState(100);
const timerRef = useRef<number | null>(null);

// ❌ REMOVE: Timer useEffect

// ✅ KEEP: Static info display (no countdown)
<div className="text-sm text-gray-400">
    Остава време: {formatRemaining(context.pauseTimeout, context.pausedAt)}
</div>
```

**NOTE:** Global countdown ще се имплементира в Header (Фаза 10 - отделна задача)

---

### ✅ Приоритизация на Фиксове

| Fix | Приоритет | Зависимости | Очаквано време |
|-----|-----------|-------------|----------------|
| Fix 1: Pause Logic Validation | 🔴 HIGH | Няма | 30 мин |
| Fix 2: Resume Context Validation | 🔴 HIGH | Fix 1 | 20 мин |
| Fix 3: Schema Update | 🟡 MEDIUM | Няма | 10 мин |
| Fix 4: Dialog UI Update | 🟡 MEDIUM | Fix 2, Fix 3 | 20 мин |
| Fix 5: Resume Cleanup | 🔴 HIGH | Fix 1 | 15 мин |
| Fix 6: Remove Dialog Countdown | 🟢 LOW | Няма | 10 мин |

**Total:** ~2 часа

---

### 🧪 Testing Plan

#### Test Case 1: Active Flow Pause/Resume
1. Start program → Trigger стартира flow
2. По време на flow execution → Pause
3. **Verify DB:**
   - `pauseFlowSessionId` е записан
   - `pauseFlowName` е правилен
   - `pauseBlockLabel` е правилен
4. Click Resume → Dialog се показва
5. **Verify Dialog:**
   - Показва Flow name
   - Показва Block label
   - Показва Window name
6. Click "Resume Flow"
7. **Verify:** Flow продължава откъдето е спрял

#### Test Case 2: Clean Pause/Resume
1. Start program → Няма активни triggers
2. Pause
3. **Verify DB:**
   - `pauseFlowSessionId` е `null`
   - `pauseFlowName` е `null`
   - `pauseBlockId` е `null`
4. Click Resume → Dialog се показва
5. **Verify Dialog:**
   - Type: "clean"
   - Показва "Чисто Състояние"
6. Click "Continue"
7. **Verify:** Програмата продължава нормално (проверка на triggers)

#### Test Case 3: Invalid Session Cleanup
1. Simulate invalid `pauseFlowSessionId` (в DB, задай несъществуващ ObjectId)
2. Click Resume
3. **Verify API:**
   - `ResumeContextService` автоматично cleanup-ва данни
   - Response е `type: 'clean'`

---

### 📝 Checklist за Изпълнение

- [ ] Fix 1: Pause Logic Validation implemented
- [ ] Fix 2: Resume Context Validation implemented
- [ ] Fix 3: ActiveProgram Schema updated
- [ ] Fix 4: Dialog UI updated with Flow name
- [ ] Fix 5: Resume cleanup implemented
- [ ] Fix 6: Dialog countdown removed
- [ ] Test Case 1 passed
- [ ] Test Case 2 passed
- [ ] Test Case 3 passed
- [ ] Code review (self-check)
- [ ] Documentation updated (if needed)

## Implementation Update: Terminate Flow (Interrupted Status)
- ✅ **Done**: Added `terminate_flow` strategy handling:
  - Marks window and session as `interrupted`.
  - Uses `automation.cancelFlow()` (new silent stop method) to stop execution without emitting global 'program:stopped' event.
  - Updated Scheduler logic to respect `interrupted` status (frozen state until next day reset).
  - 🛠️ **Fixed Race Condition**: Moved `_suppressStopEvent` reset to `loadProgram` and `startProgram` to ensure it stays active throughout all transition listeners during cancellation.
