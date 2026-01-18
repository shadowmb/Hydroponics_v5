# Изготвяне на архитектурен план за синхронизация на изпълнението - v1.0

## 🎯 Цел
Да се елиминират "фантомните" изпълнения (Running State Mismatch), при които `RunningProgramCard` показва изпълнение, въпреки че времевият прозорец е приключил. 
Решението въвежда **строга йерархия (Priority Locking)** и използва базата данни като **единствен източник на истината (Source of Truth)**, елиминирайки зависимостта от кешираното състояние на машината.

---

## ✅ ФАЗА 1: Backend (Automation Engine & Controller)
**Цел:** Въвеждане на механизъм за "Насилствено поемане на контрол" (Force Execution) и автоматично почистване на стари сесии.

### ✅ Стъпка 1.1: Промяна на `AutomationEngine.loadProgram` за Auto-Cleanup
В момента методът само инициализира нова сесия. Трябва да добавим логика, която проверява за *други* активни сесии в DB и ги маркира като "Stopped" (Soft Kill), преди да създаде новата.
*   **Файл:** `backend/src/modules/automation/AutomationEngine.ts`
*   **Действие:** Преди `sessionRepository.create`, изпълни `updateMany` върху `ExecutionSessionModel` за всички със статус `running/paused`, като ги установиш на `error` (вместо stopped) с `endTime: new Date()` и `error: 'Forcefully terminated: Preempted by new Execution'`.
*   **Резултат:** Гарантира се, че в базата винаги има максимум 1 активен запис, а старите се отбелязват като неуспешни за по-добър анализ.

### ✅ Стъпка 1.2: Промяна на `AutomationController.load` (API)
В момента API-то връща грешка `409 Conflict`, ако има работеща сесия.
*   **Файл:** `backend/src/api/controllers/AutomationController.ts`
*   **Действие:**
    1.  Добави опционален параметър `force: boolean` в тялото на заявката (`AutomationStartSchema`).
    2.  Ако `force === true`: Прескачай проверката за `runningSessionsCount` и директно викай `automation.loadProgram`. (Engine-ът ще се погрижи за cleanup-а от т. 1.1).
    3.  Ако `force === false` (по подразбиране): Запази текущата логика за `409 Conflict` (за да не могат ръчни тестове да прекъсват важни процеси без изрично желание).

---

## ✅ ФАЗА 2: Backend (Scheduler Service) -> The VIP Priority
**Цел:** Осигуряване на Scheduler-а с права да прекъсва всичко друго.

### ✅ Стъпка 2.1: Актуализация на `TriggerEvaluator` и `SchedulerService`
Scheduler-ът пуска потоци чрез `cycleManager.startCycle` и `triggerEvaluator`. Те трябва да подават флаг за приоритет.
*   **Файл:** `backend/src/modules/scheduler/CycleManager.ts` (и свързаните с него)
*   **Действие:** Увери се, че `CycleManager` използва `automation.loadProgram` (или еквивалента му) по начин, който *не* бива блокиран от контролера. (Тъй като CycleManager вика Engine директно, а не през HTTP, той заобикаля контролера, но трябва да сме сигурни, че Engine-ът "знае", че това е системна заявка).
*   **Уточнение:** Тъй като Стъпка 1.1 прави самопочистване (Auto-Cleanup) вътре в Engine-а, всяко директно извикване на `loadProgram` автоматично ще действа като "Force" (ще убие старите). Това е желаното поведение за Scheduler-а.

### ✅ Стъпка 2.2: Добавяне на Hard Stop при затваряне на прозорец
*   **Файл:** `backend/src/modules/scheduler/SchedulerService.ts`
*   **Действие:** В метода `processAdvancedProgram`, когато прозорец се маркира като `completed` (независимо дали от Trigger Break или Time Expire):
    *   Провери дали текущата сесия на Engine-а (`automation.getSnapshot().sessionId`) съвпада с `state.currentFlowSessionId`.
    *   Ако да -> Извикай `automation.stopProgram()` изрично.
    *   Това премахва риска Engine-ът да остане `running` след края на прозореца.

---

## ✅ ФАЗА 3: Frontend (Dashboard Logic) -> Source of Truth
**Цел:** UI-ът да спре да гадае и да показва само потвърдени данни от DB.

### ✅ Стъпка 3.1: Нова логика в `/api/automation/status`
Вместо да връща само моментната снимка на паметта (която може да е забила), API-то трябва да връща и "Официалния" статус от DB.
*   **Файл:** `backend/src/api/controllers/AutomationController.ts` -> `getStatus`
*   **Действие:**
    *   Направи заявка към `ExecutionSessionModel.findOne({ status: 'running' }).sort({ startTime: -1 })`.
    *   Върни този запис като част от отговора (`dbActiveSession`).
    *   Ако `dbActiveSession` съществува, върни и неговия `context` (който съдържа `_triggerReason`).

### ✅ Стъпка 3.2: Актуализация на `RunningProgramCard`
*   **Файл:** `frontend/src/components/dashboard/RunningProgramCard.tsx`
*   **Действие:**
    *   Промени логиката за `activeFlow`. Вместо да гледаш `executionStatus.state` (от XState), гледай `executionStatus.dbActiveSession`.
    *   Ако `dbActiveSession` е `null` (или статусът му не е running), значи **НИЩО НЕ РАБОТИ**, независимо какво смята XState.
    *   Това ще накара картата да спре да свети "Executing", веднага щом Scheduler-ът или Engine-ът маркират сесията като приключила в DB.

---

## ✅ ФАЗА 4: Validation & Testing
1.  **Test Case 1 (Zombie Kill):** Пусни дълъг `Wait` (1 мин). Докато върви, опитай да пуснеш нова програма. Старата трябва да спре, новата да тръгне.
2.  **Test Case 2 (Scheduler Priority):** Пусни ръчен тест. Нагласи Scheduler прозорец да започне след 10 сек. Когато започне, Scheduler-ът трябва да убие теста и да си пусне тригерите.
3.  **Test Case 3 (UI Accuracy):** Увери се, че веднага след края на прозореца, картата спира да показва "Executing Trigger...", дори ако Engine-ът има лаг от 1-2 сек.
