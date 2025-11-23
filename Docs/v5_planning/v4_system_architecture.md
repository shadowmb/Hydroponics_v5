# Hydroponics v4 - System Architecture & Module Inventory

**Status**: Initial Inventory
**Language**: Bulgarian

## 1. Въведение
Този документ описва пълната архитектура на текущата система (v4). Целта е да се разбере логиката на всеки компонент, преди да се пристъпи към проектиране на v5.

## 2. Backend Modules (Services)
*Списък на всички бекенд услуги, тяхната роля и зависимости.*

## 2. Backend Modules (Services)

### 2.1. Core Infrastructure

#### **StartupService.ts** ("The Smart Router Hub")
*   **Function**: Централна точка за инициализация на системата и рутиране на заявки.
*   **Logic**:
    *   Действа като "Facade" или "Hub". Вместо контролерите да викат директно услуги, те минават през `StartupService.execute('category:service:method')`.
    *   Поддържа "Service Registry" (карта на всички услуги).
    *   Има кеширане на критични операции (`criticalServicesCache`) за бързодействие.
    *   Делегира работата на специализирани услуги (`ConnectionManager`, `SystemRecovery` и др.).
*   **Dependencies**: Всички основни услуги (`ConnectionManager`, `HardwareHealth`, `DeviceCommand` и др.).
*   **Importance**: **CRITICAL**. Това е гръбнакът на текущата архитектура.
*   **Implementation**: Singleton. Използва `Map` за registry и cache.

#### **UnifiedLoggingService.ts** ("The Black Box")
*   **Function**: Централизирано логиране на събития.
*   **Logic**:
    *   Създава "Module Loggers" за всеки файл.
    *   Поддържа различни нива (`info`, `warn`, `error`, `debug`).
    *   Структурира логовете с метаданни (`source`, `business`, `tags`).
    *   Интегрира се с `LogStorageManager` за запис в базата/файлове.
*   **Dependencies**: `LogStorageManager`.
*   **Importance**: **HIGH**. Без него нямаме видимост какво се случва.
*   **Implementation**: Singleton factory за логъри.

#### **ConnectionManagerService.ts** ("The Switchboard")
*   **Function**: Управлява активните връзки с хардуерните контролери.
*   **Logic**:
    *   Пази карта на активните връзки (`activeConnections`) и парсери (`activeParsers`).
    *   Позволява споделяне на връзките между услугите (`shareConnections`).
    *   Управлява жизнения цикъл (отваряне/затваряне) на `SerialPort`.
*   **Dependencies**: `SerialPort`, `ReadlineParser`.
*   **Importance**: **CRITICAL**. Държи връзката с физическия свят.
*   **Implementation**: Singleton. Map<ControllerId, Connection>.

#### **SystemRecoveryService.ts** ("The Medic")
*   **Function**: Възстановява връзките при срив.
*   **Logic**:
    *   Извиква се при неуспешен ping/heartbeat.
    *   Затваря старата връзка.
    *   Прави 3 опита за повторно свързване през интервал (1s, 3s, 5s).
    *   Изпраща нотификации при успех/неуспех.
*   **Dependencies**: `ConnectionManager`, `SystemInitialization`, `NotificationService`.
*   **Importance**: **HIGH**. Гарантира устойчивост на системата.

#### **SchedulerService.ts** ("The Clock")
*   **Function**: Главен планировчик.
*   **Logic**:
    *   Използва `node-cron` за "тиктакане" всяка минута.
    *   Проверява `ActiveProgram` за активни цикли.
    *   Проверява `MonitoringFlow` за планирани проверки.
    *   Управлява конфликти: Програмите са с приоритет пред мониторинга.
*   **Dependencies**: `ActiveProgramService`, `FlowExecutor`.
*   **Importance**: **CRITICAL**. Движи автоматизацията във времето.

### 2.2. Hardware & Communication

#### **HardwareCommunicationService.ts** ("The Translator")
*   **Function**: Ниско ниво комуникация с Arduino (Serial Protocol).
*   **Logic**:
    *   Изпраща JSON команди към серийния порт.
    *   Чака за отговор (ACK/Response) с timeout.
    *   Парсва входящите данни от `ReadlineParser`.
    *   Управлява опашка от команди (макар и имплицитно чрез Promise-и).
*   **Dependencies**: `ConnectionManagerService`.
*   **Importance**: **CRITICAL**. Превежда логическите команди във физически байтове.

#### **DeviceCommandService.ts** ("The Commander")
*   **Function**: Изпълнение на команди към конкретни устройства (Pins).
*   **Logic**:
    *   Абстрахира хардуера: `executeCommand(deviceId, command, params)`.
    *   Намира контролера, към който е вързано устройството.
    *   Форматира командата (напр. `RELAY_ON`, `SENSOR_READ`).
    *   Използва `HardwareCommunicationService` за изпращане.
*   **Dependencies**: `HardwareCommunicationService`, `PhysicalController` (Model).
*   **Importance**: **HIGH**. Основният интерфейс за управление на периферия.

#### **UdpDiscoveryService.ts** ("The Scout")
*   **Function**: Откриване на устройства в мрежата (Auto-discovery).
*   **Logic**:
    *   Слуша на UDP порт 4210.
    *   Обработва `DISCOVERY_RESPONSE` пакети от контролерите.
    *   Автоматично регистрира или обновява IP адреса на контролера в базата.
*   **Dependencies**: `dgram` (Node.js UDP), `PhysicalController` (Model).
*   **Importance**: **MEDIUM**. Улеснява първоначалната настройка.

#### **ArduinoGeneratorService.ts** ("The Architect")
*   **Function**: Генериране на .ino фърмуер за контролерите.
*   **Logic**:
    *   Използва шаблони (`templates/base`, `templates/commands`).
    *   Сглобява кода динамично според конфигурацията на контролера (какви сензори/релета има).
    *   Генерира уникален `CONTROLLER_ID` във фърмуера.
*   **Dependencies**: Файлова система (Templates).
*   **Importance**: **HIGH**. Позволява "No-Code" конфигурация на хардуера.

#### **HardwareHealthChecker.ts** ("The Doctor")
*   **Function**: Периодична проверка на състоянието.
*   **Logic**:
    *   Ping-ва контролерите през определен интервал.
    *   Ако контролер не отговори -> маркира като `offline` и вика `SystemRecovery`.
*   **Dependencies**: `HardwareCommunicationService`, `SystemRecoveryService`.
*   **Importance**: **MEDIUM**.

### 2.3. Flow & Automation

#### **FlowExecutor (Module)** ("The Brain")
*   **Function**: Изпълнение на логически потоци (Flows).
*   **Logic**:
    *   **Interpreter**: Парсва JSON дефиницията на потока.
    *   **BlockExecutor**: Изпълнява логиката на всеки блок (If, Wait, Sensor, Actuator).
    *   **State Management**: Пази състоянието на променливите в потока.
    *   **Concurrency**: Управлява се от по-горни нива (Scheduler), но самият Executor поддържа `CancellationToken` за спиране.
*   **Dependencies**: `DeviceCommandService`, `HardwareCommunicationService`.
*   **Importance**: **CRITICAL**. Тук се случва истинската "умна" работа.

#### **ActionTemplateExecutionService.ts** ("The Task Runner")
*   **Function**: Изпълнение на параметризирани шаблони (Action Templates) като самостоятелни задачи.
*   **Logic**:
    *   Зарежда `ActionTemplate` и свързания `FlowTemplate`.
    *   Инжектира параметрите (Global Variables) в потока.
    *   Създава `ExecutionSession` за проследяване.
    *   Стартира `FlowExecutor` в изолиран контекст.
*   **Dependencies**: `FlowExecutor`, `ActionTemplate` (Model).
*   **Importance**: **HIGH**. Позволява ръчно пускане на сложни процеси (напр. "Разбъркай за 10 мин").

#### **ActiveProgramService.ts** ("The Schedule Manager")
*   **Function**: Управление на текущо заредената програма (ActiveProgram).
*   **Logic**:
    *   Превръща статичната `Program` в динамична `ActiveProgram`.
    *   Следи за `cycles` (цикли), `skips` (пропускания) и `delays` (отлагания).
# Hydroponics v4 - System Architecture & Module Inventory

**Status**: Initial Inventory
**Language**: Bulgarian

## 1. Въведение
Този документ описва пълната архитектура на текущата система (v4). Целта е да се разбере логиката на всеки компонент, преди да се пристъпи към проектиране на v5.

## 2. Backend Modules (Services)
*Списък на всички бекенд услуги, тяхната роля и зависимости.*

## 2. Backend Modules (Services)

### 2.1. Core Infrastructure

#### **StartupService.ts** ("The Smart Router Hub")
*   **Function**: Централна точка за инициализация на системата и рутиране на заявки.
*   **Logic**:
    *   Действа като "Facade" или "Hub". Вместо контролерите да викат директно услуги, те минават през `StartupService.execute('category:service:method')`.
    *   Поддържа "Service Registry" (карта на всички услуги).
    *   Има кеширане на критични операции (`criticalServicesCache`) за бързодействие.
    *   Делегира работата на специализирани услуги (`ConnectionManager`, `SystemRecovery` и др.).
*   **Dependencies**: Всички основни услуги (`ConnectionManager`, `HardwareHealth`, `DeviceCommand` и др.).
*   **Importance**: **CRITICAL**. Това е гръбнакът на текущата архитектура.
*   **Implementation**: Singleton. Използва `Map` за registry и cache.

#### **UnifiedLoggingService.ts** ("The Black Box")
*   **Function**: Централизирано логиране на събития.
*   **Logic**:
    *   Създава "Module Loggers" за всеки файл.
    *   Поддържа различни нива (`info`, `warn`, `error`, `debug`).
    *   Структурира логовете с метаданни (`source`, `business`, `tags`).
    *   Интегрира се с `LogStorageManager` за запис в базата/файлове.
*   **Dependencies**: `LogStorageManager`.
*   **Importance**: **HIGH**. Без него нямаме видимост какво се случва.
*   **Implementation**: Singleton factory за логъри.

#### **ConnectionManagerService.ts** ("The Switchboard")
*   **Function**: Управлява активните връзки с хардуерните контролери.
*   **Logic**:
    *   Пази карта на активните връзки (`activeConnections`) и парсери (`activeParsers`).
    *   Позволява споделяне на връзките между услугите (`shareConnections`).
    *   Управлява жизнения цикъл (отваряне/затваряне) на `SerialPort`.
*   **Dependencies**: `SerialPort`, `ReadlineParser`.
*   **Importance**: **CRITICAL**. Държи връзката с физическия свят.
*   **Implementation**: Singleton. Map<ControllerId, Connection>.

#### **SystemRecoveryService.ts** ("The Medic")
*   **Function**: Възстановява връзките при срив.
*   **Logic**:
    *   Извиква се при неуспешен ping/heartbeat.
    *   Затваря старата връзка.
    *   Прави 3 опита за повторно свързване през интервал (1s, 3s, 5s).
    *   Изпраща нотификации при успех/неуспех.
*   **Dependencies**: `ConnectionManager`, `SystemInitialization`, `NotificationService`.
*   **Importance**: **HIGH**. Гарантира устойчивост на системата.

#### **SchedulerService.ts** ("The Clock")
*   **Function**: Главен планировчик.
*   **Logic**:
    *   Използва `node-cron` за "тиктакане" всяка минута.
    *   Проверява `ActiveProgram` за активни цикли.
    *   Проверява `MonitoringFlow` за планирани проверки.
    *   Управлява конфликти: Програмите са с приоритет пред мониторинга.
*   **Dependencies**: `ActiveProgramService`, `FlowExecutor`.
*   **Importance**: **CRITICAL**. Движи автоматизацията във времето.

### 2.2. Hardware & Communication

#### **HardwareCommunicationService.ts** ("The Translator")
*   **Function**: Ниско ниво комуникация с Arduino (Serial Protocol).
*   **Logic**:
    *   Изпраща JSON команди към серийния порт.
    *   Чака за отговор (ACK/Response) с timeout.
    *   Парсва входящите данни от `ReadlineParser`.
    *   Управлява опашка от команди (макар и имплицитно чрез Promise-и).
*   **Dependencies**: `ConnectionManagerService`.
*   **Importance**: **CRITICAL**. Превежда логическите команди във физически байтове.

#### **DeviceCommandService.ts** ("The Commander")
*   **Function**: Изпълнение на команди към конкретни устройства (Pins).
*   **Logic**:
    *   Абстрахира хардуера: `executeCommand(deviceId, command, params)`.
    *   Намира контролера, към който е вързано устройството.
    *   Форматира командата (напр. `RELAY_ON`, `SENSOR_READ`).
    *   Използва `HardwareCommunicationService` за изпращане.
*   **Dependencies**: `HardwareCommunicationService`, `PhysicalController` (Model).
*   **Importance**: **HIGH**. Основният интерфейс за управление на периферия.

#### **UdpDiscoveryService.ts** ("The Scout")
*   **Function**: Откриване на устройства в мрежата (Auto-discovery).
*   **Logic**:
    *   Слуша на UDP порт 4210.
    *   Обработва `DISCOVERY_RESPONSE` пакети от контролерите.
    *   Автоматично регистрира или обновява IP адреса на контролера в базата.
*   **Dependencies**: `dgram` (Node.js UDP), `PhysicalController` (Model).
*   **Importance**: **MEDIUM**. Улеснява първоначалната настройка.

#### **ArduinoGeneratorService.ts** ("The Architect")
*   **Function**: Генериране на .ino фърмуер за контролерите.
*   **Logic**:
    *   Използва шаблони (`templates/base`, `templates/commands`).
    *   Сглобява кода динамично според конфигурацията на контролера (какви сензори/релета има).
    *   Генерира уникален `CONTROLLER_ID` във фърмуера.
*   **Dependencies**: Файлова система (Templates).
*   **Importance**: **HIGH**. Позволява "No-Code" конфигурация на хардуера.

#### **HardwareHealthChecker.ts** ("The Doctor")
*   **Function**: Периодична проверка на състоянието.
*   **Logic**:
    *   Ping-ва контролерите през определен интервал.
    *   Ако контролер не отговори -> маркира като `offline` и вика `SystemRecovery`.
*   **Dependencies**: `HardwareCommunicationService`, `SystemRecoveryService`.
*   **Importance**: **MEDIUM**.

### 2.3. Flow & Automation

#### **FlowExecutor (Module)** ("The Brain")
*   **Function**: Изпълнение на логически потоци (Flows).
*   **Logic**:
    *   **Interpreter**: Парсва JSON дефиницията на потока.
    *   **BlockExecutor**: Изпълнява логиката на всеки блок (If, Wait, Sensor, Actuator).
    *   **State Management**: Пази състоянието на променливите в потока.
    *   **Concurrency**: Управлява се от по-горни нива (Scheduler), но самият Executor поддържа `CancellationToken` за спиране.
*   **Dependencies**: `DeviceCommandService`, `HardwareCommunicationService`.
*   **Importance**: **CRITICAL**. Тук се случва истинската "умна" работа.

#### **ActionTemplateExecutionService.ts** ("The Task Runner")
*   **Function**: Изпълнение на параметризирани шаблони (Action Templates) като самостоятелни задачи.
*   **Logic**:
    *   Зарежда `ActionTemplate` и свързания `FlowTemplate`.
    *   Инжектира параметрите (Global Variables) в потока.
    *   Създава `ExecutionSession` за проследяване.
    *   Стартира `FlowExecutor` в изолиран контекст.
*   **Dependencies**: `FlowExecutor`, `ActionTemplate` (Model).
*   **Importance**: **HIGH**. Позволява ръчно пускане на сложни процеси (напр. "Разбъркай за 10 мин").

#### **ActiveProgramService.ts** ("The Schedule Manager")
*   **Function**: Управление на текущо заредената програма (ActiveProgram).
*   **Logic**:
    *   Превръща статичната `Program` в динамична `ActiveProgram`.
    *   Следи за `cycles` (цикли), `skips` (пропускания) и `delays` (отлагания).
    *   Предоставя методи за `start`, `pause`, `stop`, `skipCycle`.
    *   Не изпълнява самата логика, а само управлява състоянието на графика.
*   **Dependencies**: `ActiveProgram` (Model).
*   **Importance**: **HIGH**. Държи състоянието на графика.

#### **ActiveExecutionService.ts** ("The Monitor")
*   **Function**: Следи какво се изпълнява в момента (Dashboard visibility).
*   **Logic**:
    *   Агрегира информация от `SchedulerService` и `FlowExecutor`.
### 2.5. Frontend Architecture (Overview)

#### **FlowEditorV2 (Module)** ("The Canvas")
*   **Function**: Визуален редактор за създаване на автоматизации.
*   **Logic**:
    *   **FlowDefinition**: Строга TypeScript дефиниция на структурата (Blocks, Connections, Meta).
    *   **FlowEditor.vue**: Основен компонент. Управлява Canvas, Drag & Drop, и селекция.
    *   **Container Mode**: Поддържа влагане на логика в "контейнери" (под-потоци) със собствена навигация (Breadcrumbs).
    *   **Validation**: Smart validation с кеширане (hash-based) за производителност.
*   **Dependencies**: `Vue 3`, `Quasar`, `Pinia`.
*   **Importance**: **CRITICAL**. Основният инструмент за потребителя.

#### **WebSocket Store (`websocket.js`)** ("The Live Wire")
*   **Function**: Управление на реално-времевата комуникация.
*   **Logic**:
    *   **Persistent Connection**: Поддържа една глобална връзка, която не се прекъсва при навигация.
    *   **Reconnection**: Автоматично възстановяване при прекъсване.
    *   **Action History**: Пази история на изпълнените блокове за визуализация на прогреса.
    *   **Event Handling**: Обработва събития като `block_started`, `block_executed`, `cycle_completed`.
*   **Dependencies**: Native `WebSocket`.
*   **Importance**: **HIGH**. Осигурява обратна връзка в реално време.

## 3. Data Models (MongoDB)
*Основни същности в базата данни.*

*   `PhysicalController`: Хардуерен контролер (Arduino/ESP).
*   `Device`: Свързано устройство (Сензор/Реле).
*   `FlowDefinition`: Дефиниция на поток (JSON структура с блокове и връзки).
*   `ActionTemplate`: Параметризиран шаблон за изпълнение.
*   `Program`: График от цикли и действия.
*   `ActiveProgram`: Текущо изпълнявана програма (Runtime state).
*   `ExecutionSession`: История на изпълнението (Logs & Metrics).
*   `MonitoringFlow`: Периодични задачи за наблюдение.
*   `LogEntry`: Системен лог (съхраняван хибридно).
*   `NotificationMessage`: Шаблон за известие.
