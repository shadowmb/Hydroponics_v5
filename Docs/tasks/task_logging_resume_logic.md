# Plan: Logging & Resume Logic Enhancement

Този план описва 4-те фази за подобряване на логовете и логиката за възобновяване (Resume) на програмите. Всяка фаза ще се изпълнява последователно, с тест и потвърждение от потребителя след всяка стъпка.

## Phase 1: Enhanced Logging for LOG Block & System States
**Цел:** По-ясни и информативни логове за LOG блока (Message + Action) и системните състояния (Pause/Resume).

- [x] **1.1. Modify Log Block Executor (`LogBlockExecutor.ts`):**
    - [x] Update `execute` method to set `summary` to the human-readable System Action (e.g. "Pause Program", "Stop Program", "Log Only").
    - [x] Ensure `blockLabel` is correctly propagated via metadata.
- [x] **1.2. Update `ProgramLogService.ts`:**
    - [x] Change `LOG` case formatting to: `message = \`${name} - ${summary}\``.
    - [x] Ensure `SYSTEM_PAUSE` logs "⏸️ Програмата е на ПАУЗА".
    - [x] Ensure `SYSTEM_RESUME` logs "▶️ Програмата е възобновена".
- [x] **1.3. Test Phase 1:**
    - [x] Verify Log Block outputs correct text + action.
    - [x] Verify Pause/Resume logs appear correctly in the UI.

## Phase 2: Smart Resume Dialog (Backend Implementation)
**Цел:** Имплементиране на интелигентна логика за Resume, която разпознава 3 основни сценария и изисква потвърждение от потребителя чрез унифициран диалог.

**Сценарии за детекция:**
1.  **Active Flow:** Има прозорец със статус `active` (работеща помпа/процес).
2.  **Actve Flow + Expired:** Има активен прозорец + други, които са изтекли през паузата.
3.  **Expired Only:** Няма активен процес, но има изтекли прозорци.
4.  **Clean:** Всичко е наред, просто продължаваме.

- [x] **2.1. Backend: Update `ActiveProgramService` (`start` logic):**
    - [x] Add logic to check for `activeWindows` (status === 'active' || triggersExecuting.length > 0).
    - [x] Update return type to include `resumeContext` payload:
        - `type`: 'active_flow' | 'expired' | 'clean'
        - `activeWindowName`: string (if active)
        - `expiredWindows`: array
    - [x] Ensure `confirmation_required` is returned if `activeWindows` exist OR `expiredWindows` exist.
- [x] **2.2. Backend: Implement "Skip/Abort" Action Logic:**
    - [x] Implement handling for "Abort Window" (mark current as aborted/skipped + stop engine).
    - [x] Ensure "Stop Program" action is available (already exists).
- [x] **2.3. Test Phase 2 (Backend only):**
    - [x] Verify `start()` returns correct payload structure for each scenario.

## Phase 3: Frontend Resume Dialog (UI)
**Цел:** Актуализиране на React компонентите да показват правилния диалог според payload-а от Backend.

- [x] **3.1. Update `ResumeProgramDialog.tsx` (or equivalent):**
    - [x] Handle `active_flow` type: Show "Resume Flow" vs "STOP PROGRAM".
    - [x] Handle `active_flow_mixed` type: Show "Resume Flow" vs "Skip Active & Continue" vs "STOP PROGRAM".
    - [x] Handle `expired` type: Show "Run Now" vs "Skip".
    - [x] Implement Timeout logic (Default Actions).
- [ ] **3.2. Integration Test:**
    - [ ] Verify all 3 scenarios flow correctly end-to-end.

## Phase 4: Final Cleanup & Polish
**Цел:** Финални корекции на текстове и таймери.

- [ ] **4.1. Refine Log Messages:**
    - [ ] "Resume Strategy: Skipped Active Window..."
    - [ ] "Resume Strategy: Resumed Flow..."
- [ ] **4.2. Verify "Skip Logic":**
    - [ ] Ensure `skipped` windows don't re-trigger immediately.
