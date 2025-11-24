# Hydroponics v5 - Gemini Context & Knowledge Base

## Project Overview
Hydroponics v5 is a comprehensive rewrite of the previous v4 system, designed for scalability, robustness, and modern web standards. It manages hardware controllers, relays, and sensors to automate hydroponic environments.

## Architecture

### Backend
- **Framework:** Fastify (Node.js)
- **Database:** MongoDB (Mongoose ODM)
- **Key Features:**
    - **Soft Deletion:** Records are marked with `deletedAt` instead of being removed.
    - **Template System:** Controllers and Devices are created from pre-defined JSON templates.
    - **Service Layer:** Business logic is encapsulated in services (`HardwareService`, `ConversionService`).

### Frontend
- **Framework:** React (Vite)
- **UI Library:** Shadcn UI (Radix Primitives + Tailwind CSS)
- **State Management:** Local state + API hooks (Service pattern)
- **Key Features:**
    - **Wizard Interface:** For complex creations (Controllers, Devices).
    - **Dialogs:** Custom confirmation dialogs for critical actions (Delete).
    - **Real-time:** Socket.io integration for live updates.

## Development Standards & Patterns

### 1. Hardware Management
- **Templates First:** All hardware must be based on a `ControllerTemplate` or `DeviceTemplate`.
- **Port Management:** Controllers manage their own ports. Devices "occupy" these ports.
- **Robustness:** Operations involving external hardware references (like freeing ports) must be wrapped in `try-catch` blocks to prevent data corruption from blocking UI actions.

### 2. UI/UX
- **Confirmations:** NEVER use `window.confirm()`. Always use the `<Dialog>` component.
- **Feedback:** Use `sonner` (`toast.success`, `toast.error`) for user feedback.
- **Icons:** Use `lucide-react` for consistent iconography.

### 3. API Design
- **Response Format:** `{ success: boolean, data?: any, error?: string, details?: any }`
- **Error Handling:** Return 500 for server errors but include `details` and `stack` in development mode for easier debugging.

## Lessons Learned & Troubleshooting
We have compiled a detailed log of specific issues encountered (e.g., Relay Validation, Deletion Bugs, Schema Conflicts) and their solutions.

👉 **[See TROUBLESHOOTING_AND_PATTERNS.md](./TROUBLESHOOTING_AND_PATTERNS.md)**

## Future Development Guidelines
1.  **Verify Inputs:** Always validate enum values on both frontend and backend.
2.  **Handle Legacy Data:** Be prepared for "dirty" data from previous versions or failed tests (e.g., invalid IDs).
3.  **Clean Up:** Remove legacy files immediately to avoid import confusion.
4.  **Test End-to-End:** Use the "Browser Subagent" to verify UI flows that scripts cannot catch (like Dialog interactions).

## Agent Workflow & Git Protocols

### Context
- **Environment**: Multi-machine, multi-account setup working on the same repository.
- **Goal**: Prevent merge conflicts and data loss when switching contexts/machines.

### Session Start Protocol
1. **Identify Task**: Ask user for the specific **Task Name** / **Feature** for this session.
2. **Git Branching**:
   - **NEVER** work directly on `main` or `master`.
   - Ensure a specific branch exists: `git checkout -b feature/<task_name>` (or switch to it if exists).
   - Pull latest changes from `origin main` into the feature branch before starting.
   - **CRITICAL**: Ensure `.gitattributes` exists in root to handle CRLF/LF line endings automatically (already configured for cross-platform).

### Emergency: Forgot to Create Branch?
If work started on `main` and changes are not yet committed:
1. **DO NOT COMMIT ON MAIN**.
2. **Create Branch Retroactively**:
   - `git checkout -b feature/<task_name>`
   - This automatically moves all uncommitted changes to the new branch.
   - `main` remains clean.

### During Execution
- Keep all changes isolated to the current feature branch.
- Update `docs/tasks/task_<task_name>.md` with progress.

### Session End Protocol
1. **Status Check**: Ensure `docs/tasks/task_<task_name>.md` is up to date.
2. **Push Safety Check**:
   - **Check Branch**: Run `git branch --show-current`.
   - **If Main**: STOP. Ask user: "You are on MAIN. Do you want to push to a new feature branch?" (See Emergency section).
   - **If Feature Branch**: Proceed.
3. **Git Push**: `git push origin feature/<task_name>`.
4. **Merge Strategy**: Remind user that merging happens via Pull Request (PR) on GitHub.

### Conflict Resolution Protocol
If a conflict is reported during PR or Push:
1. **Sync with Main**:
   - `git checkout feature/<task_name>`
   - `git pull origin main` (This brings conflicts to local machine).
2. **Resolve**:
   - Agent identifies files with `<<<<<<<` markers.
   - Agent proposes resolution to keep both features working.
   - `git add .` -> `git commit` -> `git push`.

### Resuming Work / Switching Accounts
If the session ends (limit reached) or user switches accounts:
1. **No Panic**: All progress is saved in `docs/tasks/task_<name>.md` and local files.
2. **New Session Start**:
   - User: "I am continuing task <name>. Read `GEMINI.md` and `docs/tasks/task_<name>.md`."
   - Agent: Reads files, identifies the last "In Progress" or next "Todo" item, and resumes immediately.

### Handling Interrupted Sessions (Dirty State)
If the session ends while code is broken or incomplete:
1. **Same Machine**:
   - **Do nothing**. Files are safe on disk.
   - **Next Session**: Tell Agent: "Resume work. Check `git status` and `git diff` for uncommitted changes."
2. **Different Machine**:
   - **MUST** commit and push: `git commit -am "WIP: saving state before switch" && git push`.
   - **Next Session**: `git pull` -> Reset "WIP" commit if needed -> Resume.
