# Как да добавиш нова Arduino команда

**Цел:** Пълна работеща команда която се показва в UI и генерира код за Arduino.

---

## Стъпка 1: Arduino Templates

**Локация:** `/Arduino/templates/commands/`

**Действие:** Създай 2 файла:

### `serial/[command_name].ino`
```cpp
// === DISPATCHER ===
else if (strcmp(cmd, "COMMAND_NAME") == 0) {
  handleCommandName(doc);
}

// === FUNCTIONS ===
void handleCommandName(JsonDocument& doc) {
  // 1. Вземи параметри: doc["paramName"]
  // 2. Валидирай
  // 3. Изпълни логика
  // 4. Върни резултат:
  doc.clear();
  doc["ok"] = 1;
  doc["resultField"] = value;
  serializeJson(doc, Serial);
  Serial.println();
}
```

### `wifi/[command_name].ino`
```cpp
// === DISPATCHER ===
else if (strcmp(cmd, "COMMAND_NAME") == 0) {
  return handleCommandName();
}

// === FUNCTIONS ===
String handleCommandName() {
  // 1. Вземи параметри: jsonDoc["paramName"]
  // 2. Валидирай
  // 3. Изпълни логика
  // 4. Върни резултат:
  StaticJsonDocument<512> doc;
  doc["ok"] = 1;
  doc["resultField"] = value;
  String response;
  serializeJson(doc, response);
  return response;
}
```

**Разлики serial/wifi:**
- Serial: пише в `Serial`, параметри от `doc`
- WiFi: връща `String`, параметри от `jsonDoc`

---

## Стъпка 2: generator-config.json

**Локация:** `/Arduino/generator-config.json`

**Добави в `"commands"`:**
```json
{
  "name": "COMMAND_NAME",
  "displayName": "Команда име",
  "description": "Описание",
  "category": "sensors|actuators|communication",
  "memoryFootprint": 0,
  "requiredByDevices": ["Устройство 1"],
  "isActive": true
}
```

**Ако е за устройство, добави в `"deviceTemplates"`:**
```json
{
  "id": "device_id",
  "displayName": "Име на устройство",
  "technicalType": "Technical_Type",
  "requiredCommand": "COMMAND_NAME",
  "description": "Описание"
}
```

---

## Стъпка 3: seedCommands.ts

**Локация:** `/backend/src/data/seedCommands.ts`

**Добави в `commandSeeds` масив:**
```typescript
{
  name: 'COMMAND_NAME',
  displayName: 'Команда име',
  filePath: 'Arduino/templates/commands/command_name.ino',
  compatibleControllers: ['arduino_uno'],
  description: 'Описание',
  isActive: true,
  memoryFootprint: null
}
```

**Важно:** Това се seed-ва в MongoDB при `npm run build && pm2 restart backend`

---

## Стъпка 4: Device Template файл (ако е за устройство)

**Локация:** `/backend/src/data/deviceTemplates/[device_id].ts`

**Създай нов файл:**
```typescript
import { IDeviceTemplate } from '../../models/DeviceTemplate'

const deviceTemplate: Omit<IDeviceTemplate, '_id' | 'createdAt' | 'updatedAt'> = {
  type: 'DEVICE_TYPE',
  physicalType: 'light|flow|temperature|etc',
  displayName: 'Device Name',
  requiredCommand: 'COMMAND_NAME',

  portRequirements: [
    { role: 'signal', type: 'digital', required: true, defaultPin: 'D2' }
  ],

  executionConfig: {
    strategy: 'arduino_native',
    commandType: 'COMMAND_NAME',  // ТРЯБВА = requiredCommand
    parameters: { /* ... */ },
    timeout: 2000
  },

  isActive: true,
  version: '1.0.0'
}

export default deviceTemplate
```

**Критично:** `requiredCommand` = `commandType`

---

## Стъпка 5: DeviceCommandService.ts (ако има специална логика)

**Локация:** `/backend/src/services/DeviceCommandService.ts`

**Добави handler:**
```typescript
// В executeArduinoNativeCommand():
if (commandType === 'COMMAND_NAME') {
  return await this.executeCommandNameCommand(controllerId, command, device, template)
}

// Нов метод:
private async executeCommandNameCommand(...): Promise<IStartupResponse> {
  const param = this.parsePort(device.ports[0])

  const arduinoCommand = {
    cmd: 'COMMAND_NAME',
    param: param
  }

  const arduinoResponse = await this.hardwareCommunication.sendCommand(...)

  // Конвертирай резултата ако трябва
  return arduinoResponse
}
```

---

## Проверка

1. ✅ `/Arduino/templates/commands/serial/command_name.ino`
2. ✅ `/Arduino/templates/commands/wifi/command_name.ino`
3. ✅ `generator-config.json` → `commands[]`
4. ✅ `seedCommands.ts` → `commandSeeds[]`
5. ✅ Ако device: `/backend/src/data/deviceTemplates/device.ts`
6. ✅ Backend restart

---

## Тестване

1. Отвори Arduino Generator от UI
2. Избери контролер
3. **Командата трябва да се вижда в списъка**
4. Генерирай код с командата
5. Качи на Arduino и тествай

---

## Често срещани грешки

❌ **Командата не се вижда в UI**
→ Липсва в `seedCommands.ts` или не е рестартнат backend

❌ **"Cannot find controller with command X"**
→ `requiredCommand` ≠ `commandType` в device template файл

❌ **Template не се генерира**
→ Файловете serial/wifi липсват или имат грешно име

❌ **Backend error при изпълнение**
→ Липсва handler в `DeviceCommandService.ts`
