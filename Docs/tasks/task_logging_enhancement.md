# Изготвяне на подобрени логове за Програма и Автоматизация (Phase 1)

**Цел:** Осигуряване на видимост на критични събития (Logs, Pauses, Resumes) в потребителския интерфейс и коригиране на типовете логове за по-добра четимост.

## Фаза 1: Backend Разширение на Логовете (ProgramLogService)
В тази фаза ще дефинираме нови типове логове и ще ги интегрираме в логиката.

1. [x] **Дефиниране на нови Log Types** - в `ProgramLogService.ts` (или schema).
   - Добавяне на: `USER_LOG` (за LOG блока), `WAIT_START` (за WAIT блока), `SYSTEM_PAUSE`, `SYSTEM_RESUME`, `SYSTEM_STOP`.
   - Цел: Разграничаване на системни събития от потребителски съобщения.

4. [x] **Интеграция на Pause/Resume/Stop Събития** - в `ProgramLogService.ts`
   - Добавяне на listener за `automation:state_change`.
   - При Pause: Запис тип `SYSTEM_PAUSE` ("⏸️ Програмата е паузирана").
   - При Resume: Запис тип `SYSTEM_RESUME` ("▶️ Програмата продължава").
   - При Stop: Запис тип `SYSTEM_STOP` ("🛑 Програмата е спряна").

## Фаза 2: Frontend Визуализация (AdvancedExecutionLog)
В тази фаза ще актуализираме UI компонента, за да показва новите типове красиво.

1. [x] **Update `LogEntry` Interface** - в `AdvancedExecutionLog.tsx`
   - Добавяне на новите стрингове в `type` дефиницията.

2. [x] **Update Icon Mapping (`getIcon`)**
   - `USER_LOG` -> 📝 (FileText/Note)
   - `SYSTEM_PAUSE` -> ⏸️ (PauseCircle)
   - `SYSTEM_RESUME` -> ▶️ (PlayCircle)
   - `SYSTEM_STOP` -> 🛑 (StopCircle)
   - `WAIT_START` -> ⏳ (Hourglass)

3. [x] **Update Style Mapping (`getEntryStyle`)**
   - **Pause/Resume:** Да изглеждат като "High Level" събития (цветен фон, border-left).
     - Pause: Оранжев/Жълт фон.
     - Resume: Зелен/Син фон.
   - **User Log:** Да е четлив, може би леко по-тъмен текст от обикновено info.

## Фаза 3: Базова Валидация
1. [ ] Пускане на тест програма с: `LOG "Start"` -> `WAIT 5s` -> `LOG "End"`.
2. [ ] Проверка дали всички стъпки се виждат в UI-а с правилните икони.
