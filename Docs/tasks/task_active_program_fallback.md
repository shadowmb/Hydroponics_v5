# Задача: Linked Fallback за Активни Програми

Целта е да се позволи промяна на Fallback логиката на **Активна (работеща)** програма чрез Control Panel, използвайки новата функционалност за Linked Trigger.

## 📋 Фаза 1: Backend & Schema Verification
- [ ] **Schema Check:** Проверка дали `ActiveProgram.schema.ts` поддържа `fallbackTriggerId` в `timeWindows`.
- [ ] **API Endpoint:** Проверка кой endpoint обработва обновяването на активна програма и дали позволява patch-ване на прозорец.
- [ ] **Scheduler Logic:** Уверяване, че `SchedulerService` използва актуалните данни от базата/паметта при всеки цикъл.

## 🖥️ Фаза 2: Frontend Implementation (Control Panel)
- [ ] **Identify Component:** Намиране на компонента, визуализиращ активните прозорци (напр. `LiveProgramDashboard.tsx`, `ActiveWindowCard.tsx`).
- [ ] **Port UI Logic:** Пренасяне на логиката за `Select` (Linked Trigger) от `TimeWindowCard.tsx`.
    - **Важно:** При активни програми не можем да добавяме *нови* тригъри, така че опцията "Manual Fallback" може да е ограничена или read-only, но "Linked Fallback" трябва да е editable.
- [ ] **State Management:** Свързване на промяната (`onChange`) с API повикаване за обновяване на активната програма.

## ✅ Фаза 3: Verification
- [ ] **Test:** Стартиране на програма.
- [ ] **Test:** Промяна на Fallback тригъра (Live).
- [ ] **Verify:** Уверяване, че при следващия тик (ако няма активни тригъри) се изпълнява флоу-а на новия Linked Fallback.

## 🛠️ Phase 5: Refinement & Polish
- [x] **Feature:** Remove number input spinners in `TriggerModal.tsx`.
- [x] **Feature:** Make flows section in `TriggerModal` scrollable/grid.
- [x] **Fix:** Tooltips for Fallback icon in `TimeWindowCard`.

## 🐛 Phase 6: Logic & UI Hardening (User Reported Bugs)
- [x] **Fix UI Visibility:** Ensure Manual Fallback flows are visible in Active Program Dashboard even if not linked to a trigger (Added 'Manual' option).
- [x] **Fix Execution Logic:** Update `SchedulerService` to respect `fallbackTriggerId` when executing fallback.
- [x] **Fix Variable Context:** Ensure Linked Trigger fallback uses the correct variable context (`t_0_f_0`) instead of missing `fb_linked_...` keys, resolving `NaN` errors.
- [x] **Enhance Logging:** Explicitly mark Fallback execution in logs ("Стартиран поток (Fallback): ...").
- [x] **Fix Stop Logic:** Ensure "Stop Program" resets all Window States to `pending` (zero out progress).
- [x] **Feature:** Resume Logic for Expired Windows (Grace Period).
    - If user resumes after window expiry: Prompt to "Run Logic" or "Skip".
    - "Run Logic" forces immediate trigger evaluation -> Fallback check.
- [ ] **Verify:** User to confirm execution and UI persistence.
