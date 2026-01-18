# План за Реализация: Smart Active Program Card

**Цел:** Създаване на интелигентен компонент за визуализация на активната програма в Dashboard-а. Компонентът ще комбинира "леки" данни от Store-а (статус, име) с "тежки" данни от API-то (windows schema) за да покаже контекст и прогрес.

## Фаза 1: Създаване на Компонент (Logic & UI)
Разработка на специализиран компонент `RunningProgramCard.tsx`, който да бъде изолиран и преизползваем.

1.  **Структура и State:**
    - Създаване на `frontend/src/components/dashboard/RunningProgramCard.tsx`.
    - Използване на `useStore` за `activeSession` (моментален статус).
    - Local State за `fullProgramDetails` (схемата с прозорците).

2.  **Зареждане на Данни (Smart Fetch):**
    - `useEffect` на mount: Извикване на `activeProgramService.getActive()`.
    - Съхраняване на резултата за изчисление на прогрес (Кой е текущия прозорец?).

3.  **Таймер Логика (Live Uptime):**
    - Имплементация на `setInterval`, който обновява UI всяка секунда.
    - Формула: `Now - StartTime - PausedDuration`.

4.  **Визуализация на Прогрес:**
    - Изчисляване на: `Active Window Index` / `Total Windows`.
    - Visual: Progress Bar (Shadcn UI) + Текстово описание (напр. "Обед: 12:00 - 15:00").

5.  **Контроли:**
    - Бутони `Pause` / `Resume` и `Stop` вързани към `activeProgramService`.
    - Диалог за потвърждение при `Stop`.

## Фаза 2: Интеграция в Dashboard V2 (Sandbox)
Тестване на компонента в безопасна среда.

1.  **Замяна на Mock Данните:**
    - В `DashboardV2.tsx`, замяна на хардкоднатия JSON с новия `<RunningProgramCard />`.
    - Conditional Rendering: Ако няма активна сесия -> Покажи "System Idle" или скрий картата.

2.  **Валидация на UI:**
    - Проверка как изглежда при различни състояния (Running, Paused).
    - Проверка на респонсив дизайна.

## Фаза 3: Миграция към Dashboard V1 (Finalization)
След като потвърдим, че работи безупречно.

1.  **Внедряване:**
    - Импортиране на трудовия компонент в `Dashboard.tsx`.
    - Премахване на старите "Command Center" компоненти.

2.  **Почистване:**
    - Изтриване на неизползван код и mock данни.
