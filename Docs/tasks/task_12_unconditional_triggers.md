# Task 12: Безусловни Тригери (Unconditional Triggers)

## 🎯 Цел
Имплементиране на механизъм за "Безусловни Тригери" (Pass-through), които се изпълняват без проверка на сензорни данни. Това позволява задачи базирани само на време (влизане в прозореца) или инициализиращи действия.

## 📋 Изисквания

1.  **Backend:**
    *   Добавяне на флаг `conditionEnabled` (boolean, default: true) в `ITrigger`.
    *   Ако `conditionEnabled` е `false`, `TriggerEvaluator` връща `TRUE` за условията.
    *   Валидацията трябва да позволява празен масив `conditions`, ако флагът е `false`.

2.  **Frontend (UI/UX):**
    *   В `TriggerModal`: Добавяне на "Switch" (Toggle) бутон "Използвай Условия" (Use Conditions).
    *   Когато е **OFF**:
        *   Скриване на панела "Условия" (Сензор, Оператор, Стойност).
        *   Показване на информативен текст (Info Alert): "Тригерът ще се изпълни безусловно при проверка."
    *   Когато е **ON**:
        *   Стандартно поведение (видими условия).
    *   Запазване на логиката за `Behavior` (Break/Continue) и `Repeat Mode` (Once/Count/Always) непроменена.

3.  **Логика на Изпълнение (Interaction Check):**
    *   `conditionEnabled: false` + `Repeat: Once` -> Изпълнява се веднъж при първия тик.
    *   `conditionEnabled: false` + `Repeat: Count N` -> Изпълнява се N пъти последователно (всеки тик).
    *   `conditionEnabled: false` + `Repeat: Always` -> **ВНИМАНИЕ:** Изпълнява се при ВСЕКИ тик до края на прозореца.

## 🛠️ План за Изпълнение

### Фаза 1: Backend (Schema & Logic)
- [x] **1.1. Update Schema (`Program.schema.ts`):** 
    - Добавяне на `conditionEnabled: { type: Boolean, default: true }` в `TriggerSchema`.
- [x] **1.2. Update Types (`program.types.ts`):**
    - Обновяване на интерфейса `ITrigger` в бекенда.
- [x] **1.3. Update Evaluator (`TriggerEvaluator.ts`):**
    - В `checkConditions()`: Добавяне на проверка най-отгоре.
    - `if (trigger.conditionEnabled === false) return true;`

### Фаза 2: Frontend (UI Components)
- [x] **2.1. Update Types (`types.ts`):** 
    - Добавяне на `conditionEnabled` в `ITrigger` (Frontend).
- [x] **2.2. Update `TriggerModal.tsx`:**
    - Добавяне на State: `const [useConditions, setUseConditions] = useState(true);`
    - Добавяне на UI Toggle Switch над секцията "Условия".
    - Условна визуализация:  `{useConditions ? ( ...Cond UI... ) : ( ...Info Alert... )}`.
    - `handleSave`: Ако `!useConditions`, изчистване на conditions масива (или игнорирането му) и сетване на флага.
    - `useEffect` (onOpen): Инициализация на `useConditions` спрямо `editingTrigger`.
- [x] **2.3. Update Trigger List Views:**
    - Update `TimeWindowCard.tsx` (Editor Mode) -> `⚠️ БЕЗ УСЛОВИЕ`.
    - Update `AdvancedProgramManager.tsx` (Active Dashboard) -> `⚠️ БЕЗ УСЛОВИЕ`.

### Фаза 3: Тестване и Валидация
- [x] **3.1. Verification Test:**
    - Създаване на тригер без условия с "Repeat Once". Проверка дали се изпълнява веднъж.
    - Създаване на тригер без условия с "Repeat Count 3". Проверка дали се изпълнява 3 пъти.

## ⚠️ Рискове и Бележки
*   **Risk:** `Repeat: Always` без условие може да наводни логовете. Потребителят носи отговорност за тази конфигурация.
*   **Legacy:** Старите тригери, които нямат полето `conditionEnabled`, ще приемат стойност `true` (default), така че съвместимостта е запазена.
