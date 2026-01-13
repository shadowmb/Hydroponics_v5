# Задача: Linked Fallback Trigger (Споделен Тригър за Fallback)

Целта е да се позволи на потребителя да избира съществуващ тригър като Fallback механизъм, вместо да дублира настройките за изпълнение. Това решава проблема с "Dual Maintenance" и подобрява UX.

## 📋 Фаза 1: Backend (Schema & Logic)
- [x] **Schema Update:** Добавяне на `fallbackTriggerId` в `ITimeWindow` и Mongoose Schema (`Program.schema.ts`).
- [x] **Execution Logic:** Модификация на `ActionScheduler` (или `ActiveProgramService`), за да зарежда действията от свързания тригър, ако `fallbackTriggerId` е наличен и `fallbackFlowIds` са празни/игнорирани.
- [/] **Validation:** Уверяване, че при изтриване на тригър, свързаният fallback не чупи логиката (или просто се игнорира/лога грешка).

## 🖥️ Фаза 2: Frontend (Types & Modal)
- [x] **Type Definitions:** Обновяване на TypeScript интерфейсите за `Program` / `TimeWindow`.
- [x] **TimeWindow Modal:** Промяна на Fallback секцията:
    - Toggle "Enable Custom Fallback" (или подобно).
    - Ако е OFF -> Записва `fallbackFlowIds: []` (и позволява Link от Dashboard).
    - Ако е ON -> Показва текущия UI за добавяне на блокове.

## 🎨 Фаза 3: Frontend (Dashboard UI)
- [x] **Fallback Strip UI:**
    - Ако е в режим "Linked" (fallbackFlowIds.length == 0):
        - Показва Dropdown с налични тригъри от същия прозорец.
        - Показва индикация "Linked to: [Trigger Name]".
    - Ако е в режим "Manual" (fallbackFlowIds.length > 0):
        - Показва стандартния списък с икони.

## ✅ Фаза 4: Verification & Cleanup
- [x] **Test:** Създаване на прозорец с Linked Fallback.
- [x] **Test:** Проверка дали се изпълнява правилно при симулация.
- [x] **Test:** Проверка на UI състоянията (Enable/Disable в модала).

## 💅 Фаза 5: UI/UX Refinements (Trigger Modal)
- [x] **Layout:** Преминаване към Stack Layout (етикети над полетата) за по-добро използване на ширината.
- [x] **Input Fix:** Оправяне на `padding` на числовите полета, за да не се закриват от spin-бутоните.
- [x] **Flow List:** Двуколонен grid за потоците и добавяне на двупосочно сортиране (Up/Down).
- [x] **Scrollbar:** Стилизиран native scrollbar за тъмната тема.
- [x] **Visuals:** Подравняване на заглавия и оператори за по-чист вид.
