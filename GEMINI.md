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
