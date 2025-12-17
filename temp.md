Анализ и Архитектура на Динамични Мерни Единици (Final Spec)
🎯 Цел
Създаване на универсална, управляванa от шаблони система за мерни единици, която:

Ясно дефинира физическите величини (measurements) в JSON шаблона (Raw vs Base).
Позволява на клиентите (Frontend, Automation Blocks) да изискват данни в конкретен формат (Raw, Base, Converted) чрез API Modes.
🏗️ 1. Configuration: Global Measurements Model
Вместо да се повтаряме роля по роля, въвеждаме глобален пропърти measurements в темплейта.

Структура (JSON)
Пример 1: Единичен Сензор (HC-SR04) - Scaling
{
  "id": "hc_sr04",
  "measurements": {
      "distance": { "rawUnit": "cm", "baseUnit": "mm" }  // Scaling Needed
  },
  "roles": {
      "monitor": { "source": "distance", ... }
  }
}
Пример 2: Комбиниран Сензор (DHT22) - Pass-through
{
  "id": "dht22",
  "measurements": {
      "temp": { "rawUnit": "C", "baseUnit": "C" },      // Pass-through
      "hum":  { "rawUnit": "%", "baseUnit": "%" }
  },
  "roles": {
      "air_temp": { "source": "temp", ... },
      "air_hum":  { "source": "hum", ... }
  }
}
🔌 2. API Architecture: Request Modes
HardwareService.testDevice ще приема флаг mode: RAW | BASE | STRATEGY.

Modes
RAW: "Дай ми каквото връща драйвера" (за debug/calibration input).
BASE (Default): "Дай ми Системната Величина" (mm, pH).
Ако rawUnit != baseUnit -> 
HardwareService
 вика UnitRegistry.convert(raw, rawUnit, baseUnit).
Ако rawUnit == baseUnit -> Pass-through.
STRATEGY: "Дай ми Display Value" (Liters, Gal).
Прилата Base -> Strategy Conversion.
🚧 3. Текущо Състояние и Стратегия за Миграция
Как е сега (Current State):
HardwareService: Разчита на UnitRegistry с "предположения" или partially hardcoded logic. Често "Raw" стойността се бърка с "Base".
Frontend (ActuatorCalibration): "Гадае" единицата на база ролята (напр. if role == distance then mm).
Templates: Липсва информация за физическите единици (measurements блока го няма).
Какво точно ще се промени (Refactoring Points):
A. Backend Refactoring (
HardwareService.ts
)
Премахване: Ако има логика тип if (driver === 'hc_sr04') val = val * 10, тя изчезва.
Добавяне: Логика, която чете template.measurements[sourceKey] и автоматично нормализира.
Нов Метод: normalizeMeasurement(value, rawUnit, baseUnit).
B. Template Updates (JSON Files)
Масово обновяване на 
hc_sr04.json
, 
dht22.json
, ph_meter.json и др. с новия блок measurements.
C. Frontend Refactoring (
ActuatorCalibration.tsx
)
Премахване: Хевристиката if (role == 'distance') setUnit('mm').
Добавяне: useEffect, който чете device.template.measurements и попълва UI-а автоматично.
✅ Предимства
Safety: Никога повече няма да сравняваме cm с mm по погрешка.
Explicit: Всеки програмист вижда в JSON-а какво става.
Universal: Работи еднакво добре за прости (Scaling) и сложни (Multi-sensor) устройства.