# Controller Communication Protocol

Документация за комуникационния протокол между Backend и Arduino контролери.

---

## 1. Communication Layers

### WiFi Controllers
- **Transport**: HTTP POST на `/command` endpoint
- **Discovery**: UDP broadcast на порт 8888
- **Контролери**: NodeMCU Amica V2, WeMos D1 R2, Arduino Uno R4 WiFi
- **Format**: JSON (`ArduinoJson` библиотека)

### Serial Controllers (TODO)
- **Transport**: USB Serial (115200 baud)
- **Discovery**: Port scanning
- **Format**: JSON (планиран)
- **⚠️ Stop-on-Disconnect**: Планирана функционалност (аналогично на WiFi)

---

## 2. Built-in Commands

Команди, вградени в базовите template файлове за всички контролери.

| Команда | Цел | Request | Response |
|---------|-----|---------|----------|
| `INFO` | Системна информация | `{"cmd":"INFO"}` | `{"ok":1,"chipId":"...", "ip":"...", "ssid":"..."}` |
| `PING` | Проверка на връзка | `{"cmd":"PING"}` | `{"ok":1,"message":"pong"}` |
| `SET_PIN` | Управление на цифров пин | `{"cmd":"SET_PIN","pin":5,"state":1,"stopOnDisconnect":true}` | `{"ok":1,"pin":5,"state":1}` |
| `ANALOG` | Четене на аналогов вход | `{"cmd":"ANALOG","pin":"A0"}` | `{"ok":1,"value":512,"volt":2.5}` |
| `GET_CAPABILITIES` | Списък с поддържани команди | `{"cmd":"GET_CAPABILITIES"}` | `{"ok":1,"capabilities":["INFO","PING",...]}` |

### Общи параметри за SET_PIN:
- `pin` - GPIO номер (например: 5 за D5)
- `state` - 0 (LOW) или 1 (HIGH)
- `stopOnDisconnect` - **true** (default): спира пина при загуба на връзка, **false**: продължава работа

---

## 3. WiFi Safety Features

### 3.1 Multi-Network Fallback
```cpp
#define PRIMARY_SSID "..."      // Първа мрежа (приоритет)
#define PRIMARY_PASSWORD "..."
#define SECONDARY_SSID "..."    // Резервна мрежа
#define SECONDARY_PASSWORD "..."
```

**Логика:**
1. Опит за свързване към PRIMARY
2. Ако неуспешно → опит към SECONDARY
3. Ако и двете неуспешни → повтаряне на цикъла

**Съхранение**: EEPROM (WiFi credentials се записват при първо свързване)

### 3.2 Auto-Reconnect
```cpp
#define WIFI_CHECK_INTERVAL 5000         // Проверка на всеки 5 секунди
#define MAX_RECONNECT_ATTEMPTS 5         // 5 опита преди дълга пауза
#define RECONNECT_DELAY 2000             // 2 секунди между опитите
```

**Функция**: `checkWiFiConnectionAndReconnect()`
- Проверява `WiFi.status()` на всеки 5 секунди (non-blocking)
- При disconnect → автоматични опити за reconnect
- След 5 неуспешни опита → 60 секунди пауза, после нов цикъл

### 3.3 Stop-on-Disconnect 🛡️

**Безопасна логика**: При загуба на WiFi връзка, контролерът **веднага спира** активните пинове.

**Управление на пинове**:
- Array `pinsToStop[]` съдържа пинове които трябва да се спрат при disconnect
- `SET_PIN` с `state=HIGH` и `stopOnDisconnect=true` → добавя в array
- `SET_PIN` с `state=HIGH` и `stopOnDisconnect=false` → НЕ добавя
- `SET_PIN` с `state=LOW` → премахва от array (пинът е неактивен)

**Времева линия при загуба на връзка**:
```
T=0s     → WiFi връзката се прекъсва
T=0-5s   → Контролерът чака следваща проверка
T=5s     → checkWiFiConnectionAndReconnect() открива disconnect
          → ВЕДНАГА спира всички пинове в pinsToStop[]
          → Започва reconnect опити
```

**Helper функции**:
```cpp
void addPinToStopList(int pin);          // Добавя пин към списъка
void removePinFromStopList(int pin);     // Премахва пин от списъка
void stopAllPinsOnDisconnect();          // Спира всички пинове и изчиства array
```

**Симетрична безопасност**:
- Backend загуби връзка с контролер → ВЕДНАГА спира потока ✅
- Arduino загуби WiFi връзка → ВЕДНАГА спира пиновете ✅

---

## 4. Generator Commands

Командите от типа `SET_PIN`, `ANALOG` и т.н. се генерират динамично от Arduino Generator Config (`generator-config.json`).

**Как работи генераторът**:
- Чете device templates от `backend/src/device-templates/`
- Генерира Arduino `.ino` файл с вградени команди
- Команди се добавят в `capabilities[]` array

**Пример** (за relay device):
```json
{
  "executionConfig": {
    "strategy": "single",
    "commandType": "ACTIVATE_RELAY"
  }
}
```

→ Генерира handler функция в `.ino` файла

**⚠️ Важно**: Built-in команди (INFO, PING, SET_PIN, ANALOG) винаги присъстват независимо от generator config.

---

## 5. Error Handling

### Response Format

**Success**:
```json
{
  "ok": 1,
  "message": "...",
  "data": { ... }
}
```

**Error**:
```json
{
  "ok": 0,
  "error": "Error description"
}
```

### Често срещани грешки

| Код | Причина | Решение |
|-----|---------|---------|
| `Unknown command` | Командата не е регистрирана | Проверка на `GET_CAPABILITIES` |
| `Missing or invalid pin/state` | Липсващи параметри | Проверка на JSON request |
| `Invalid port format` | Грешен формат на порт (напр. "X5") | Използвай "D5" или число |
| `Device not found` | DeviceId не съществува в БД | Проверка на device registry |
| `Controller connection not found` | Контролерът не е свързан | Проверка на network/serial connection |

### Backend Debug Logging

DeviceCommandService логва всички команди:
```
[DeviceCommandService] 🔧 SET_PIN Command: {
  "cmd": "SET_PIN",
  "pin": 5,
  "state": 0,
  "stopOnDisconnect": true
}
```

Arduino Serial Monitor логва изпълнението:
```
[Auto-Reconnect] Disconnected
[Stop-on-Disconnect] Stopping all pins IMMEDIATELY
[Auto-Reconnect] Restored
```

---

## 6. Architecture Overview

```
Backend (Node.js)
    │
    ├─ DeviceCommandService
    │   ├─ executeTemplateBasedCommand()
    │   ├─ handleSemanticRelayCommand()
    │   └─ handlePWMCommand()
    │
    ├─ HardwareCommunicationService
    │   └─ sendCommand(controllerId, command)
    │
    └─ ConnectionManager
        │
        ├─ WiFi: HttpControllerAdapter
        │   └─ POST http://<ip>/command
        │
        └─ Serial: SerialControllerAdapter (TODO)
            └─ Serial.write(JSON)

Arduino Controller
    │
    ├─ Built-in Commands (handleSetPin, handleAnalog...)
    ├─ Generated Commands (от generator-config.json)
    ├─ WiFi Features (Multi-Network, Auto-Reconnect, Stop-on-Disconnect)
    └─ Response JSON formatting
```

---

## 7. Future Improvements (Roadmap)

### Serial Communication
- [ ] Implement Stop-on-Disconnect за Serial controllers
- [ ] Serial connection health monitoring
- [ ] Automatic COM port discovery

### WiFi Enhancements
- [ ] Configurable WIFI_CHECK_INTERVAL from backend
- [ ] WebSocket push notifications (вместо HTTP polling)
- [ ] OTA firmware updates

---

**Последна актуализация**: 2025-11-04
**Автор**: Hydroponics v4 Development Team
