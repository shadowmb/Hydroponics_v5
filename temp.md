Имплементационен План: Фаза 4 - AI Действия и Автоматизация
Цел: Създаване на система за автоматично изпълнение на AI задачи, базирани на времеви график или сензорни събития.

1. Архитектура на Данните (Backend)
Ще създадем нова колекция ai_actions в MongoDB.

Schema: IAIAction
{
  name: String,        // "Дневен отчет", "Ниско pH"
  enabled: Boolean,    // true/false
  
  // 1. КОГА? (Trigger)
  trigger: {
    type: 'schedule' | 'sensor',
    
    // Ако е Schedule (График)
    cron: String,      // "0 22 * * *" (CRON формат)
    humanTime: String, // "22:00" (За UI)
    days: [Number],    // [1, 2, 3, 4, 5] (Дни от седмицата)
    
    // Ако е Sensor (Събитие)
    sensorId: String,  // "ph_meter_main"
    operator: '>' | '<' | '=',
    value: Number,     // 5.5
    cooldownMinutes: Number // 60 (Да не спами)
  },
  // 2. КАКВО? (Intelligence)
  payload: {
    systemPrompt: String, // "Ти си агроном. Анализирай..."
    
    // Какви данни да се подадат на AI преди въпроса?
    context: {
      includeSensorValue: Boolean, // true (За sensor triggers)
      includeHistory: 'none' | '1h' | '24h' // Исторически данни
    }
  },
  // 3. КЪДЕ? (Output)
  outputs: {
    saveInsight: Boolean, // Запис в "Insights" панела
    notifyTelegram: Boolean, // Изпращане в Telegram
    notifyEmail: Boolean  // (Опционално)
  },
  lastRun: Date,       // Последно изпълнение
  createdAt: Date
}
2. Backend Логика
2.1 Services
AIActionsService: CRUD операции за действията (Create, Read, Update, Delete).
ActionScheduler:
При старт на сървъра зарежда всички активни schedule действия.
Използва node-cron за да ги планира.
SensorWatcher:
Abonira се (Subscribe) към Event Emitter-а на системата за нови данни.
При всяко отчитане проверява: Има ли активно действие за този сензор? -> Минало ли е отряме (cooldown)? -> Изпълнено ли е условието?.
2.2 Execution Flow (executeAction)
Когато настъпи часът или условието:

Събиране на контекст:
Ако е сензор -> взима текущата стойност.
Ако е избрана история -> прави заявка към InfluxDB/Mongo за последните X часа.
Форматиране на Prompt:
Слепва: System Prompt + Context Data (като JSON/Text).
AI Заявка:
Изпраща към конфигурирания Provider (Gemini/ChatGPT).
Обработка на резултата:
Ако outputs.notifyTelegram -> вика TelegramService.
Ако outputs.saveInsight -> записва в базата данни.
3. UI/UX (Frontend)
Ще разширим 
SettingsAI
 компонента с нов таб "Действия".

3.1 Списък с Действия (List View)
Таблица, показваща:

Име на действието.
Тригер (напр. "Всеки ден 22:00" или "pH < 5.5").
Статус (Активно/Спряно).
Бутони: Edit, Delete, Run Now (Тест).
3.2 Редактор на Действие (Action Dialog)
wizard-style диалог в 3 стъпки (Tabs):

Tab 1: Тригер (Trigger)

Radio: [🕒 По Време] или [🌡️ По Сензор]
Ако е Време: Time Picker, Day Selector.
Ако е Сензор: Dropdown със сензори, Оператор (> <), Стойност, Cooldown Input.
Tab 2: Интелект (Brain)

Label: "Инструкция към AI"
Textarea: (Място за промпта)
Checkbox: [x] Прикачи история за последните 24ч (полезно за анализи).
Tab 3: Известия (Output)

Switch: Включи Telegram
Switch: Запази като Insight
4. План за изпълнение (Steps)
Backend Setup:
Създаване на AIAction модел.
Създаване на API endpoints (GET/POST/PUT /api/ai/actions).
Scheduler & Watcher Core:
Имплементация на Cron logic.
Имплементация на Event Listener за сензори.
Service Integration:
Свързване на executeAction с 
AIService
.
Frontend UI:
Създаване на AIActionsList.
Създаване на ActionDialog (React Hook Form).
Testing:
Тест с "Дневен отчет" (ръчно стартиране).
Тест със "Сензорен тригер" (симулиране на ниско pH).