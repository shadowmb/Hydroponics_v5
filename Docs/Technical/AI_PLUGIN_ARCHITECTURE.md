# AI Plugin Architecture & Development Guidelines

This document serves as the **Standard Operating Procedure (SOP)** for developing, extending, and maintaining the AI functionality in Hydroponics v5.
The AI system is designed as an **Optional, Modular Plugin**. All future development must adhere to this architecture to prevent coupling with the core system.

---

## 1. Core Philosophy: "The Plugin Rule"

> **The system must function 100% correctly if the `plugins/ai` folder is deleted.**

*   **Zero Hard Dependencies:** Core modules (Hardware, Auth, Server) must NEVER import files from `plugins/ai`.
*   **Soft Integration:** The Core triggers AI features via:
    *   **Events** (EventBus) - e.g., "Sensor data received" -> AI listens.
    *   **Dynamic Discovery** (Settings) - e.g., "Is plugin active?" -> UI renders button.
*   **Self-Contained Data:** The Plugin owns its own persistence schemas (`ai_sessions`, `ai_actions`).

---

## 2. Directory Structure

### Backend (`backend/src/plugins/ai`)
Everything related to AI lives here.
*   `index.ts`: Entry point. Registers routes and starts background services.
*   `controllers/`: API Endpoints. MUST be prefixed with `/api/ai`.
*   `services/`: Business logic (LLM adapters, Actions, History).
*   `models/`: Mongoose Schemas. MUST use `ai_` prefix for collections.
*   `utils/`: Helper functions specific to AI.

### Frontend (`frontend/src/components/ai`, `pages/AIAssistantPage.tsx`)
*   **Components:** All UI widgets (Chat, Popup) live in `components/ai`.
*   **Context:** `AIContext.tsx` manages state (Open/Close, Active Session).
*   **Services:** `ai.service.ts` works as the bridge API client.
*   **Conditional Rendering:** All UI entry points (Buttons, Menu Items) must check `isPluginActive` before rendering.

---

## 3. Development Rules

### Data Persistence
*   **DO NOT** reuse Core collections for Plugin data.
*   **Correct:** Create `AIChatSession.schema.ts` -> `ai_sessions`.
*   **Incorrect:** Importing `ChatSession.schema.ts` from Core.
*   **Why?** Modifying Core schemas to fit AI needs creates a dependency mess.

### API Routes
*   All routes must be registered in `index.ts` under the common prefix.
    ```typescript
    fastify.register(AIController, { prefix: '/api/ai' });
    ```

### Adding New Features
If you want to add a new AI capability (e.g., "Vision Analysis"):
1.  **Backend:**
    *   Create `VisionController.ts`.
    *   Create `VisionService.ts`.
    *   Register in `index.ts`.
2.  **Frontend:**
    *   Create `VisionComponent.tsx` in `components/ai`.
    *   Add condition `if (!isPluginActive) return null;` in parent.

---

## 4. Troubleshooting
*   **"Plugin Not Found" (404):** Check if `index.ts` in persistence is correct or if the folder `plugins/ai` exists.
*   **"Session Not Saving":** Ensure `sessionId` is passed in the REQUEST BODY/QUERY. The middleware/hook logic relies on explicit ID passing.
