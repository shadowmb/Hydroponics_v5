# План за Имплементация: Повтарящи се Тригери (Repeating Triggers)

**Цел:** Реализиране на логика за многократно изпълнение на тригери в рамките на един времеви прозорец (Advanced Programs).

## Изисквания за Преглед от Потребителя
> [!IMPORTANT]
> Трябва да се внимава със "Starvation" (Блокиране) ефекта. При режим `Always` или `Count`, ако условието е постоянно `True`, тригерът ще се стартира отново веднага след приключване на предишния цикъл. Това е желано поведение според последните уточнения, но трябва да се има предвид при дизайна на програмите.

## Предложени Промени

### 1. База Данни & Схеми (Backend)

#### [MODIFY] [Program.schema.ts](file:///c:/Projects/Hydroponics_v5/backend/src/modules/persistence/schemas/Program.schema.ts)
Добавяне на настройки за повторяемост в `ITrigger` интерфейса и схемата.

```typescript
export type TriggerRepeatMode = 'once' | 'count' | 'always';

// В ITrigger / TriggerSchema:
repeatMode: { type: String, enum: ['once', 'count', 'always'], default: 'once' },
repeatCount: { type: Number, default: 0 } // Използва се само при mode='count'
```

#### [MODIFY] [ActiveProgram.schema.ts](file:///c:/Projects/Hydroponics_v5/backend/src/modules/persistence/schemas/ActiveProgram.schema.ts)
Добавяне на брояч за изпълненията в `IWindowState`.

```typescript
// В IWindowState / WindowStateSchema:
triggerCounts: { type: Map, of: Number, default: {} } // Map<TriggerId, executedCount>
```

### 2. Логика на Изпълнение (Backend)

#### [MODIFY] [TriggerEvaluator.ts](file:///c:/Projects/Hydroponics_v5/backend/src/modules/scheduler/TriggerEvaluator.ts)
Промяна на филтъра за "pending" тригери в `evaluateWindow`.

*   **Текуща логика:** `!triggersExecuted.includes(t.id)`
*   **Нова логика:**
    1.  Вземи `count = state.triggerCounts.get(t.id) || 0`.
    2.  Ако `Once`: Провери `!triggersExecuted.includes(t.id)`.
    3.  Ако `Count`: Провери `count < t.repeatCount`.
    4.  Ако `Always`: Винаги позволявай (освен ако не е в `triggersExecuting`).

#### [MODIFY] [SchedulerService.ts](file:///c:/Projects/Hydroponics_v5/backend/src/modules/scheduler/SchedulerService.ts)
Промяна на логиката при приключване на поток (Flow Finished).

*   **Текуща логика:** Директно добавяне в `triggersExecuted`.
*   **Нова логика:**
    1.  Увеличи брояча в `triggerCounts`.
    2.  Провери дефиницията на тригера.
    3.  Добави в `triggersExecuted` **САМО АКО**:
        *   Режимът е `Once`.
        *   ИЛИ Режимът е `Count` и лимитът е достигнат.
    4.  Ако е `Always`, **НЕ** добавяй в `triggersExecuted` (за да остане "pending" за следващия цикъл).

### 3. Frontend (Wizard UI)
*Ще бъде реализирано в отделна стъпка след Backend промените.*

#### [MODIFY] [TriggerWizard.tsx] (Design Mode)
*   Добавяне на стъпка за `Repeat Mode` (Once/Count/Always).
*   Валидация на `Repeat Count`.

#### [MODIFY] [ActiveProgramDashboard / TriggerEditor] (Runtime Mode)
*   Осигуряване на възможност за промяна на `Repeat Mode` и `Count` в реално време за стартирана програма.
*   Backend-ът (`ActiveProgramService.updateProgram`) вече поддържа обновяване на `windows`, така че UI-ът трябва просто да подаде новите данни.

## План за Верификация

### Ръчен Тест (Сценарий "Count Limit")
1.  Създай програма с прозорец (10 мин).
2.  Добави тригер (Continue):
    *   Условие: `Always True` (или сензор, който манипулираме).
    *   Mode: `Count`.
    *   Limit: `2`.
    *   Action: Кратък поток (Log Message).
3.  Стартирай програмата.
4.  Наблюдавай логовете:
    *   Трябва да се изпълни веднъж.
    *   Веднага след края – втори път.
    *   След втория път – трябва да спре (Join `triggersExecuted`).

### Ръчен Тест (Сценарий "Always")
1.  Промени тригера на Mode: `Always`.
2.  Стартирай.
3.  Трябва да се върти в безкраен цикъл докато трае прозореца.
