# 📋 План: Унифициране на Мерни Единици и Логически Статус (Task 8 & 9)

Този план обединява задачите за правилно отчитане на състоянието на изпълнителните механизми (Actuators - Task 8) и стандартизирането на мерните единици (Task 9). Целта е базата данни да бъде "Единствен източник на истината" (Single Source of Truth) с пълна мета-информация.

## ✅ Фаза 0: Анализ и Проучване (Приключена)
- [x] Анализ на `ExpandedControllerView` и защо Actuators показват "OFF".
- [x] Анализ на `HardwareService` и `SensorProcessor` - проследяване на загубата на `unit`.
- [x] Проверка на `HardwareDrivers` (Templates) за наличие на `baseUnit`.
- [x] Концептуализиране на решението: `baseUnit` в DB + `unit` в `lastReading`.

---

## 🏗️ Фаза 1: Backend Архитектура (Schema & Logic)
**Цел:** Гарантиране, че всяко устройство и всяко четене имат ясно дефинирана мерна единица в Базата Данни.

### 1.1. Обновяване на Mongoose Schemas (`Device.ts`)
- [x] Добавяне на поле `baseUnit` (String, Immutable) в `DeviceSchema`.
    - *Описание:* Това е "Родната" единица на драйвера (напр. 'pH', 'mS/cm', 'boolean').
- [x] Добавяне на поле `unit` в `lastReading` (вложена схема).
    - *Описание:* Единицата, валидна за конкретното измерване.

### 1.2. Обновяване на Създаването (`HardwareController.ts`)
- [x] Модифициране на `createDevice`:
    - Извличане на `baseUnit` от `template.measurements[role].baseUnit`.
    - Записване в `device.baseUnit`.
    - Ако е ACTUATOR и няма unit -> записване на `boolean`.
    - Записване на `device.displayUnit` (ако не е подадено, копираме `baseUnit`).

### 1.3. Обновяване на Четенето (`HardwareService` & `SensorProcessor`)
- [x] В `SensorProcessor.processRawToBasic`:
    - Уверяване, че връщаме правилния `unit`.
- [x] В `HardwareService.readSensorValue`:
    - При запис на `device.lastReading`, да включваме и `unit`.

### 1.4. Обновяване на Actuator Командите (`HardwareService`)
- [x] При `sendCommand` (Run/Stop):
    - Веднага след успешна команда, да се записва `lastReading` със стойност `1` (ON) или `0` (OFF) и unit `boolean`.
    - Това ще гарантира моментално обновяване на статуса в DB.

---

## 🧹 Фаза 2: Миграция на Данни (Self-Healing)
**Цел:** Поправка на съществуващите устройства, които нямат `baseUnit` или `displayUnit`.

- [x] Създаване на миграционна логика (пр. в `HardwareService.initialize` или отделен скрипт):
    - Обхождане на всички Devices.
    - Зареждане на съответния Template по `driverId`.
    - Ако `baseUnit` липсва -> попълване от темплейта.
    - Ако `displayUnit` липсва -> попълване от `baseUnit`.
    - За Actuators: set `baseUnit` = 'boolean'.

---

## 🖥️ Фаза 3: Frontend Визуализация (UI)
**Цел:** UI-ът да показва истината, базирана на Units.

### 3.1. `ExpandedControllerView.tsx` - Actuator Logic
- [x] Рефакториране на `renderActuatorCard`:
    - Проверка: Ако `device.baseUnit === 'boolean'` (или `displayUnit`):
        - Игнорирай Relay Loop логиката, ако имаш директно `lastReading`.
        - `isOn` = `lastReading.value > 0`.
    - Ако не е boolean -> Показвай Стойност + Единица.

### 3.2. Сензори (pH, EC, Moisture)
- [x] Уверяване, че всички сензори показват `displayUnit` (или `lastReading.unit`) до числото.
- [x] Тест: Проверка на pH сензора (който преди нямаше unit).

---

## 🧪 Фаза 4: Тестване и Валидация
- [x] **Тест 1 (New Device):** Създаване на нов Actuator -> Проверка в DB за `baseUnit: boolean`.
- [x] **Тест 2 (Migration):** Рестарт на сървъра -> Проверка дали старите сензори са си получили Units.
- [x] **Тест 3 (UI State):** Пускане на помпа от Test Dialog -> Refresh на Dashboard -> Трябва да е Зелено (ON).
