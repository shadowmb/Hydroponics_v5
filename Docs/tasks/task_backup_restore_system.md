# План за реализация: Backup & Restore System + Demo Data

## Цел
Създаване на надеждна система за архивиране, възстановяване и пренос на конфигурацията. Това е основата за функцията "Backup/Restore" и "Load Demo Data".

---

## 📅 Фаза 1: Backend - BackupService (Ядрото)
Реализация на бизнес логиката за експорт и импорт на "чисти" данни.

1.  **Създаване на `BackupService` (`src/services/BackupService.ts`):**
    *   **Методи:** `createBackup(options)`, `restoreBackup(fileBuffer, options)`.
    *   **Inventory Definition:** Дефиниране на поддържаните колекции и групирането им (виж раздел "Данни").
    *   **Legacy Filter:** Изрично изключване на мъртви схеми (`cycles`, `actiontemplates`, `monitorings`).
    *   **Raw Insert Strategy:** Използване на `mongoose.connection.db.collection(name).insertMany()` за заобикаляне на Mongoose hooks, с цел запазване на `_id`, `createdAt`, `v` (version key).

2.  **API Endpoints (`src/api/controllers/BackupController.ts`):**
    *   `GET /api/backup/download`: Генерира файла.
    *   `POST /api/backup/inspect`: Приема файл, връща JSON с метаданни (Preview).
    *   `POST /api/backup/restore`: Изпълнява възстановяването.

---

## 📁 Обхват на Данните (Inventory Groups)
Мапинг между UI категории и DB колекции.

### 1. 🏗️ Infrastructure (Хардуер)
*   `controllers` (Контролери)
*   `relays` (Релета)
*   `devices` (Сензори и устройства)
*   **Забележка:** `ControllerTemplate` и `DeviceTemplate` се игнорират (статични).

### 2. 🧠 Automation (Логика)
*   `flows` (Потоци - Source code)
*   `programs` (Програми - Templates)
*   `activeprograms` (Работещи инстанции)

### 3. 📊 History (История)
*   `programdailylogs` (Логове на програми)
*   `executionsessions` (Сесии на изпълнение)
*   `readings` (Сензорни данни - ако са в Mongo)

### 4. ⚙️ System (Настройки)
*   `systemsettings` (Глобални настройки)
*   `users` (Потребители)
*   `resourceroles` (Роли на ресурсите)
*   `ai_actions`, `ai_chatsessions` (AI Memory - опционално)

---

## 🖥️ Фаза 2: Frontend - UI/UX (Backup Manager)
Интеграция в страницата "Settings".

1.  **Компонент `BackupTab.tsx`:**
    *   **Mode Toggle:** "Basic" (Default) vs "Advanced".
    *   **Basic Mode:** Показва 4-те главни групи като чекбоксове.
    *   **Advanced Mode:** Accordion стурктура, позволяваща избор на конкретни колекции (напр. само `devices` без `controllers`).
    *   **Smart Hints:** Ако избереш `Automation`, но не `Infrastructure` -> ⚠️ Warning: "Missing dependencies".

2.  **Restore Flow:**
    *   Upload зона.
    *   **Preview Dialog:** Показва какво е открито във файла преди старт.
    *   **Confirmation:** Изисква изрично потвърждение за изтриване на текущите данни.

---

## 🧪 Фаза 3: Demo Data (Snapshot)
Създаване на "Златен Image" за нови инсталации.

1.  **Capture:** Използване на новия `BackupService` за сваляне на текущата конфигурация на User-а.
2.  **Embed:** Записване на файла като `backend/src/seeds/demo_v5.json`.
3.  **Activate:** Добавяне на бутон "Load Demo Data" (в секция Demo/Restore), който вика `restoreBackup` с този файл.

---

## 🛡️ Правила за Implementaciq
1.  **Атомарност:** Ако restore гръмне по средата, връщаме грешка (в идеалния случай ползваме Transaction, но поне Stop-on-Error).
2.  **Date Preservation:** Всички дати се третират като стрингове/обекти и се наливат 1:1.
3.  **Validation Bypass:** При restore не проверяваме дали портът е свободнен. Доверяваме се на архива.
