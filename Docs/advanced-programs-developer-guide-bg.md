# Насоки за имплементация: Advanced Programs

> **За**: Разработчик на Advanced Programs функционалност  
> **Дата**: 2025-12-31  
> **Референции**: 
> - [Концепция](./advanced-programs-concept-bg.md)
> - [UI/UX Спецификация](./advanced-programs-uiux-bg.md)

---

## Обзор на съществуващата архитектура

### Ключови файлове

| Файл | Роля | Какво прави |
|------|------|-------------|
| `Program.schema.ts` | Шаблон | Дефинира структурата на програма (schedule с time + steps) |
| `ActiveProgram.schema.ts` | Runtime | Активна програма със статус на всеки schedule item |
| `ActiveProgramService.ts` | Управление | CRUD операции за активната програма |
| `SchedulerService.ts` | Scheduler | CronJob всяка минута, проверява за match на time |
| `AutomationEngine.ts` | Изпълнение | XState машина, изпълнява потоци блок по блок |
| `CycleManager.ts` | Координация | Стартира поредица от потоци (steps) |

---

## Как работи текущата система

### 1. Program.schema.ts (Шаблон)

```typescript
schedule: [{
    time: string;        // "08:00" - точен час
    name: string;        // Име на събитието
    steps: [{
        flowId: string;
        overrides: Record<string, any>;
    }];
}];
```

**Ключов момент**: `time` е **точен час** (HH:mm), не диапазон.

### 2. SchedulerService.ts (Tick логика)

```typescript
// Изпълнява се всяка минута
this.job = new CronJob('* * * * *', () => this.tick());

// В tick():
const timeString = now.toTimeString().slice(0, 5); // "HH:mm"
const scheduledItem = activeProgram.schedule.find(s =>
    s.time === timeString && s.status === 'pending'
);
```

**Ключов момент**: Проверява за **точно съвпадение** на часа.

### 3. AutomationEngine.ts (Изпълнение)

- Използва **XState** за управление на състоянието
- Изпълнява потоци (flows) блок по блок
- Има executors за различни типове блокове (SensorRead, RelayControl, etc.)

---

## Какво трябва да се добави за Advanced Programs

### 1. Разширяване на Program.schema.ts

```typescript
// НОВА структура
schedule: [{
    // Съществуващо (за Basic mode)
    time?: string;        // "08:00" - точен час (Basic)
    
    // НОВО (за Advanced mode)
    type: 'basic' | 'advanced';
    timeWindow?: {
        start: string;    // "07:00"
        end: string;      // "09:00"
        name: string;     // "Сутрешно поливане"
        pollingInterval: number;  // минути (напр. 5)
        dataSource: 'cached' | 'live';
        markAsCompleted: boolean;
    };
    triggers?: [{
        id: string;
        priority: number;
        sensorId: string;
        sensorValue: string;  // "par", "temperature", etc.
        operator: 'between' | '>' | '<' | '>=' | '<=' | '=' | '!=';
        value: number;
        valueMax?: number;   // за "between"
        flowIds: string[];
        behavior: 'continue' | 'break';
        status: 'pending' | 'executed'; // runtime tracking
    }];
    fallbackFlowId?: string;
    
    // Общо за двата режима
    steps: [{ flowId, overrides }];  // за Basic
    name: string;
}];
```

### 2. Нова логика в SchedulerService.tick()

```typescript
// ПСЕВДОКОД - не е реален код

async tick() {
    const timeString = now.toTimeString().slice(0, 5);
    
    for (const item of activeProgram.schedule) {
        if (item.type === 'basic') {
            // Съществуваща логика - точно съвпадение
            if (item.time === timeString && item.status === 'pending') {
                await this.handleScheduledCycle(...);
            }
        } 
        else if (item.type === 'advanced') {
            // НОВА логика - времеви прозорец
            if (this.isWithinTimeWindow(timeString, item.timeWindow)) {
                if (this.shouldPoll(item)) {
                    await this.evaluateTriggers(item);
                }
            } else if (this.isAfterTimeWindow(timeString, item.timeWindow)) {
                // Времето изтече - изпълни fallback ако нищо не е triggered
                if (!this.hasAnyBreakExecuted(item)) {
                    await this.executeFallback(item);
                }
            }
        }
    }
}
```

### 3. Нови методи в SchedulerService

| Метод | Описание |
|-------|----------|
| `isWithinTimeWindow(time, window)` | Проверява дали часът е в диапазона |
| `shouldPoll(item)` | Проверява дали е време за нова проверка (polling interval) |
| `evaluateTriggers(item)` | Чете сензори, сравнява с условията |
| `executeTrigger(trigger, item)` | Изпълнява потоци за тригер, маркира статус |
| `executeFallback(item)` | Изпълнява fallback поток |
| `hasAnyBreakExecuted(item)` | Проверява дали break тригер е изпълнен |
| `areAllTriggersExecuted(item)` | Проверява дали всички са изпълнени |

### 4. Четене на сензори

За Advanced Programs ще трябва да се чете стойност от сензор в реално време:

```typescript
// Използвай съществуващия HardwareService
import { hardware } from '../hardware/HardwareService';

async readSensorValue(sensorId: string, valuePath: string): Promise<number> {
    // 1. Намери сензора в системата
    // 2. Изпрати READ команда до контролера
    // 3. Върни стойността
}
```

**Референция**: Виж как `SensorReadBlockExecutor` чете сензори в automation блоковете.

---

## Компоненти за Frontend

### Нови компоненти

| Компонент | Описание |
|-----------|----------|
| `AdvancedProgramEditor.tsx` | Главен редактор |
| `TimeWindowCard.tsx` | Карта за един времеви прозорец |
| `TimeWindowModal.tsx` | Модал за редакция на прозорец |
| `TriggerRow.tsx` | Един ред тригер |
| `TriggerModal.tsx` | Модал за добавяне на тригер |
| `SensorSelector.tsx` | Dropdown с групирани сензори |

### Зареждане на наличните сензори

```typescript
// В компонента
const { data: devices } = useQuery(['devices'], fetchDevices);

// Филтрирай само сензорите
const sensors = devices?.filter(d => d.type === 'sensor') || [];

// Групирай по categoryGroup
const groupedSensors = groupBy(sensors, 'categoryGroup');
```

---

## План за имплементация

### Фаза 1: Backend схема
1. Разшири `Program.schema.ts` с нови полета
2. Разшири `ActiveProgram.schema.ts` за runtime tracking
3. Добави миграция ако е нужно (backwards compatible)

### Фаза 2: Backend логика
1. Добави нови методи в `SchedulerService.ts`
2. Създай `TimeWindowEvaluator.ts` за логиката на проверка
3. Интегрирай с `HardwareService` за четене на сензори

### Фаза 3: Frontend UI
1. Добави toggle Basic/Advanced в `ProgramEditor.tsx`
2. Създай нови компоненти за Advanced mode
3. Тествай с реален хардуер

### Фаза 4: Интеграция и тестове
1. End-to-end тестове
2. Тестове с различни сценарии (break, continue, fallback)

---

## Важни въпроси за уточняване

1. **Как се обработва грешка при четене на сензор?**
   - Skip тригера? Retry? Fallback?

2. **Какво става ако потокът е дълъг и прозорецът свърши?**
   - Прекъсни? Изчакай? Маркирай като failed?

3. **Трябва ли history/logs за trigger evaluations?**
   - За debugging и анализ

4. **Как се визуализира текущия статус в UI?**
   - Live preview на "кой тригер се проверява сега"

---

## Референции към съществуващ код

- **SensorReadBlockExecutor**: `backend/src/modules/automation/blocks/SensorReadBlockExecutor.ts`
- **HardwareService**: `backend/src/modules/hardware/HardwareService.ts`
- **ProgramEditor UI**: `frontend/src/pages/ProgramEditor.tsx`
- **Flow Editor**: `frontend/src/pages/FlowEditor.tsx` (за референция на UI patterns)
