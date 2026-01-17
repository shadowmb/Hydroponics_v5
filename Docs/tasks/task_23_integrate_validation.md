# Task 23: Интеграция на Валидация и Fallback Логика (Sensor Guard)

## 🎯 Цел
Да се активират "мъртвите" в момента настройки за валидация (Retry, Range, Fallback) чрез интегриране на `SensorValidationService` в главния поток на четене на данни (`HardwareService`). Това ще осигури защита срещу грешни данни и ще предотврати фалшиви задействания на автоматизацията.

## 📋 Изисквания (Architecture Decision Record)
1.  **Validation Layer:** Валидацията (Min/Max) се прилага върху **финалната конвертирана стойност** (Value), а не върху суровите данни (Raw).
2.  **Pipeline Integration:** `HardwareService` трябва да използва `executeProtectedRead` за всички четения.
3.  **Fallback Policies:**
    *   ❌ **Skip:** Премахва се като опция (опасно и неясно).
    *   🔴 **Error (Stop):** Хвърля грешка (Default behavior).
    *   🟡 **Last Valid:** Връща последната добра стойност, НО само ако е "прясна" (под `staleTimeout`). Ако е стара -> ГРЕШКА.
    *   🔵 **Default Value:** Връща фиксирана константа (напр. 0).
4.  **Metadata:** Добавяне на флаг `isFallback: true` в резултата, за да може UI и логовете да знаят, че това не е реално измерване.

---

## 📅 План за изпълнение

### Фаза 1: Backend Refactoring (SensorValidationService)
- [ ] **Review & Update `SensorValidationService.ts`:**
    - [ ] Премахване на логиката за `skip`.
    - [ ] Усъвършенстване на `useLastValid` логиката: Ако `staleTimeout` е надвишен -> **Throw Error** (вместо да връща грешка като обект, трябва да сме сигурни, че се държи консистентно).
    - [ ] Добавяне на JSDoc и типизация за `ReadResult` с `isFallback`.

### Фаза 2: Интеграция в HardwareService
- [ ] **Refactor `readSensorValue`:**
    - [ ] Дефиниране на `readFn` (closure), която включва:
        1. `sensorProcessor.read()` (Physcial + Noise Filtering)
        2. `applyConversion()` (Raw -> Value)
    - [ ] Извикване на `validationService.executeProtectedRead(device, readFn)`.
    - [ ] Обработка на резултата:
        - Ако `success: false` -> Throw Error (за да я хванат Блоковете/API).
        - Ако `success: true` -> Връщане на `value` + логване ако е `isFallback`.

### Фаза 3: Frontend UI (Device Settings)
- [ ] **Update `DeviceValidationSettings.tsx`:**
    - [ ] Премахване на опцията "Skip" от Dropdown-а.
    - [ ] Добавяне на поле за **"Stale Timeout (sec)"**, което се показва САМО когато е избрано "Use Last Valid Value".
    - [ ] Валидация на input-а (да е положително число).

### Фаза 4: Testing & Verification
- [ ] **Тест 1: Valid Range:** Настройка на Min=10. Симулация на стойност 5. Проверка дали връща грешка.
- [ ] **Тест 2: Retry:** Разкачане на сензор. Проверка в логовете дали прави 3 опита преди да се откаже.
- [ ] **Тест 3: Last Valid (Fresh):** Успешно четене -> Разкачане -> Четене (трябва да върне старото).
- [ ] **Тест 4: Last Valid (Stale):** Горният тест, но изчакване на Timeout-а. Трябва да върне ГРЕШКА.

---
**Бележка:** Тази задача е критична за безопасността на системата. Всички промени трябва да се правят внимателно, за да не счупят съществуващите драйвери.
