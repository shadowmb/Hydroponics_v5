# Task: Stop/Pause Refactor

## Обща информация

| Поле | Стойност |
|:---|:---|
| **Дата на създаване** | 2026-01-20 |
| **Приоритет** | Висок |
| **Зависимости** | Няма |
| **Следващ task** | Task B: Start/Resume Refactor |

---

## Цел

Опростяване на `stop()` и `pause()` методите в `ActiveProgramService` с фокус върху:
1. **Stop**: Не нулира `completed` windows – запазва прогреса
2. **Pause**: Записва позицията на текущия блок за бъдещо продължение

---

## Предистория (Защо?)

### Текущ проблем със Stop:
- При `stop()` (редове 622-636 в `ActiveProgramService.ts`) **ВСИЧКИ windows** се нулират до `pending`
- Това означава, че при рестарт на **същата програма** същия ден, системата "забравя" вече изпълнените windows
- Потребителят вижда повторно маркирани като "пропуснати" windows, които реално са изпълнени

### Текущ проблем с Pause:
- При `pause()` (редове 646-656) **само статусът се сменя** на `paused`
- **НЕ се записва** къде точно е спрял flow-а (кой блок)
- При Resume няма начин да се знае от коя точка да продължим

---

## Фаза 1: Модифициране на Stop логиката

### 1.1 Промяна на `ActiveProgramService.stop()`

**Файл:** `backend/src/modules/scheduler/ActiveProgramService.ts`  
**Редове:** 604-641

**Какво се променя:**
- Премахване на пълния reset на `windowsState`
- Запазване на `completed` и `skipped` статуси
- Reset само на `active` и `running` windows

**Текущ код (за премахване):**
```typescript
// For ADVANCED programs: Reset all window states to pending
if (active.type === 'ADVANCED' && active.windowsState) {
    active.windowsState.forEach(ws => {
        ws.status = 'pending';  // ❌ Губи completed!
        ws.triggersExecuted = [];
        ws.triggersExecuting = [];
        ws.triggerCounts = new Map();
        ws.lastCheck = undefined;
        ws.currentFlowSessionId = undefined;
        ws.skipUntil = undefined;
    });
    active.markModified('windowsState');
}
```

**Нов код:**
```typescript
// For ADVANCED programs: Preserve completed, reset only in-progress
if (active.type === 'ADVANCED' && active.windowsState) {
    active.windowsState.forEach(ws => {
        // ЗАПАЗИ completed и skipped!
        if (ws.status === 'active' || ws.status === 'pending') {
            // Само ако беше активен в момента на спиране
            if (ws.currentFlowSessionId) {
                ws.status = 'pending'; // Беше активен, сега pending
            }
            ws.triggersExecuting = [];
            ws.currentFlowSessionId = undefined;
        }
        // НЕ пипаме: status='completed', status='skipped', triggersExecuted, triggerCounts
    });
    active.markModified('windowsState');
}
```

### 1.2 Аналогична промяна за BASIC mode

**Файл:** `backend/src/modules/scheduler/ActiveProgramService.ts`  
**Редове:** 614-620

**Текущ код:**
```typescript
active.schedule.forEach(item => {
    if (item.status === 'failed' || item.status === 'running') {
        item.status = 'pending';
    }
});
```

**Нов код (без промяна - това е правилно):**
- `completed` и `skipped` остават непроменени ✓
- Само `failed` и `running` стават `pending` ✓

> **Забележка:** BASIC mode вече работи правилно! Не е нужна промяна.

---

## Фаза 2: Модифициране на Pause логиката

### 2.1 Добавяне на нови полета в ActiveProgram схемата

**Файл:** `backend/src/modules/persistence/schemas/ActiveProgram.schema.ts`

**Нови полета в `IActiveProgram`:**
```typescript
// Pause State (за resume)
pausedAt?: Date;                    // Кога е паузирана
pauseFlowSessionId?: string;        // ID на спрения flow
pauseBlockId?: string;              // ID на текущия блок при pause
pauseWindowId?: string;             // ID на window-а при pause (ADVANCED)
pauseTimeout?: number;              // Секунди до auto-stop (0 = без timeout)
```

**Защо тези полета:**
| Поле | Цел |
|:---|:---|
| `pausedAt` | За изчисляване на timeout |
| `pauseFlowSessionId` | За да знаем кой flow е бил активен |
| `pauseBlockId` | За resume от точния блок |
| `pauseWindowId` | За да знаем в кой window сме (ADVANCED) |
| `pauseTimeout` | Конфигурируем timeout |

### 2.2 Промяна на `ActiveProgramService.pause()`

**Файл:** `backend/src/modules/scheduler/ActiveProgramService.ts`  
**Редове:** 646-656

**Текущ код:**
```typescript
async pause(): Promise<IActiveProgram> {
    const active = await this.getActive();
    if (!active) throw new Error('No active program loaded');

    if (active.status === 'running') {
        active.status = 'paused';
        await active.save();
        logger.info('⏸️ Active Program Paused');
    }
    return active;
}
```

**Нов код:**
```typescript
async pause(options?: { timeout?: number }): Promise<IActiveProgram> {
    const active = await this.getActive();
    if (!active) throw new Error('No active program loaded');

    if (active.status === 'running') {
        // 1. Вземи snapshot от AutomationEngine
        const { automation } = await import('../automation/AutomationEngine');
        const engineSnapshot = automation.getSnapshot();
        
        // 2. Записване на pause state
        active.status = 'paused';
        active.pausedAt = new Date();
        active.pauseBlockId = engineSnapshot.context?.currentBlockId || undefined;
        active.pauseFlowSessionId = engineSnapshot.sessionId || undefined;
        active.pauseTimeout = options?.timeout || 600; // Default 10 min
        
        // 3. За ADVANCED mode - намери активния window
        if (active.type === 'ADVANCED' && active.windowsState) {
            const activeWindow = active.windowsState.find(ws => ws.currentFlowSessionId);
            if (activeWindow) {
                active.pauseWindowId = activeWindow.windowId;
            }
        }
        
        // 4. Извикай AutomationEngine.pauseProgram()
        automation.pauseProgram();
        
        await active.save();
        logger.info({ 
            blockId: active.pauseBlockId, 
            timeout: active.pauseTimeout 
        }, '⏸️ Active Program Paused (with position saved)');
    }
    return active;
}
```

### 2.3 Добавяне на Timeout механизъм

**Нов файл:** `backend/src/modules/scheduler/PauseTimeoutService.ts`

**Логика:**
```typescript
// Singleton service който проверява за изтекли pause timeouts
class PauseTimeoutService {
    private checkInterval: NodeJS.Timeout | null = null;
    
    start() {
        // Проверка на всеки 30 секунди
        this.checkInterval = setInterval(() => this.check(), 30000);
    }
    
    async check() {
        const active = await activeProgramService.getActive();
        if (!active || active.status !== 'paused') return;
        
        if (active.pausedAt && active.pauseTimeout) {
            const elapsed = (Date.now() - active.pausedAt.getTime()) / 1000;
            if (elapsed >= active.pauseTimeout) {
                logger.warn('⏰ Pause Timeout Expired - Auto-Stopping');
                await activeProgramService.stop();
                // TODO: Emit notification event
            }
        }
    }
    
    stop() {
        if (this.checkInterval) clearInterval(this.checkInterval);
    }
}
```

---

## Важно: Защо простият Pause/Resume работи

### Ключово прозрение:

**Грешката/паузата ВИНАГИ идва ПРЕДИ реалното изпълнение на блока:**

```
Block Start → Validate/Read → [ERROR/PAUSE тук] → Execute → Block End
```

| Блок | Кога идва грешката | Изпълнение започнало? |
|:---|:---|:---:|
| **SENSOR_READ** | Не може да се свърже | ❌ Не |
| **LOOP** | Невалидни данни за условие | ❌ Не |
| **ACTUATOR_SET** | Device offline | ❌ Не |
| **IF** | Неочакван тип данни | ❌ Не |

### Какво означава това:

1. **При Resume** → блокът се изпълнява от начало → ✅ **Правилно!**
2. **Няма нужда** от сложен block-level resume state
3. **XState вече пази** `currentBlockId` и `variables`
4. **LOOP iteration** се пази в `resumeState` (съществува)
5. **WAIT блок** не е важен (не се използва реално)

### Извод:

Pause = XState `PAUSE` + записваме metadata в DB за UI visibility.
Resume = XState `RESUME` (продължава от `currentBlockId`).

---

## Фаза 3: Backend API промени

### 3.1 Промяна на Pause endpoint

**Файл:** `backend/src/modules/scheduler/ActiveProgramController.ts`

**Търси:** Pause route (вероятно `POST /api/active-program/pause`)

**Промяна:** Добавяне на optional `timeout` параметър в body

```typescript
// Пример:
router.post('/pause', async (req, res) => {
    const { timeout } = req.body; // Нов параметър
    const result = await activeProgramService.pause({ timeout });
    res.json({ success: true, data: result });
});
```

---

## Фаза 4: Frontend промени

### 4.1 UI за Pause timeout (опционално)

**Файл:** `frontend/src/components/activeProgram/ActiveProgramDashboard.tsx` (или подобен)

**Промяна:** При click на Pause бутон, може да се показва малък dropdown за timeout:
- "10 минути"
- "30 минути"  
- "Без timeout"

> **Забележка:** Това е опционално за Phase 1. Може да се имплементира по-късно.

### 4.2 UI индикатор за Pause Timeout

Когато програмата е в `paused` status, показваме:
- Оставащо време до auto-stop
- Countdown timer

---

## Тестови сценарии

### Сценарий 1: Stop запазва completed windows
1. Стартирай ADVANCED програма с 3 windows
2. Изчакай Window 1 и Window 2 да се изпълнят (status = completed)
3. По време на Window 3 натисни STOP
4. **Очаквано:** Window 1 и 2 остават `completed`, Window 3 става `pending`

### Сценарий 2: Pause записва позиция
1. Стартирай ADVANCED програма
2. По време на изпълнение на поток (примерно WAIT блок) натисни PAUSE
3. Провери в DB: `pauseBlockId` е записан
4. **Очаквано:** Полето съдържа ID на текущия блок

### Сценарий 3: Pause timeout
1. Настрой timeout = 60 секунди
2. Натисни PAUSE
3. Изчакай 60+ секунди без Resume
4. **Очаквано:** Програмата автоматично преминава в `stopped`

---

## Файлове за промяна (Summary)

| Файл | Тип промяна |
|:---|:---|
| `ActiveProgram.schema.ts` | Добавяне на нови полета |
| `ActiveProgramService.ts` | Промяна на `stop()` и `pause()` |
| `ActiveProgramController.ts` | Добавяне на timeout параметър |
| `PauseTimeoutService.ts` | **НОВ ФАЙЛ** |
| `index.ts` (backend startup) | Регистрация на PauseTimeoutService |

---

## Checklist

- [ ] Фаза 1.1: Промяна на `stop()` за ADVANCED mode
- [ ] Фаза 1.2: Верификация на BASIC mode (няма промяна)
- [ ] Фаза 2.1: Добавяне на pause полета в схемата
- [ ] Фаза 2.2: Промяна на `pause()` метода
- [ ] Фаза 2.3: Създаване на PauseTimeoutService
- [ ] Фаза 3.1: Промяна на Pause API endpoint
- [ ] Тестване на сценарий 1
- [ ] Тестване на сценарий 2
- [ ] Тестване на сценарий 3

---

## Бележки

- **Hardware cleanup** остава в `AutomationEngine` временно (ще се изнесе в Task C: SafetyService)
- Resume логиката ще се рефакторира в Task B: Start/Resume Refactor
- Този task НЕ променя Resume поведението - само записва данните за бъдещо използване
