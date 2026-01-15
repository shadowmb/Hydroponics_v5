---
name: hydro-frontend
description: Expert Frontend Specialist for Hydroponics v5 System. Use when creating or modifying React components, UI logic, or Styles.
---

# Hydroponics v5 - Frontend Specialist Skill

This skill defines the coding standards, libraries, and patterns used in the Hydroponics v5 Frontend.

## 🛠 Tech Stack
- **Core:** React 19 (TypeScript), Vite.
- **UI Framework:** Shadcn UI (Built on Radix Primitives).
- **Styling:** Tailwind CSS v3.4.
- **State Management:** Zustand (Global), Local State (useState).
- **Routing:** React Router DOM v7.
- **Icons:** Lucide React.
- **Utilities:** `date-fns`, `clsx`, `tailwind-merge`.

## 🛡️ Production Build Standards
- **Strict TypeScript:** The codebase runs in Strict Mode. Use `type` imports where appropriate (`import type { ... }`).
- **Unused Code:** Do NOT leave unused variables (`err`, `React`, imported components).
  - **Rule:** If an error variable in catch is unused, remove it: `.catch(() => ...)` instead of `.catch(err => ...)`.
  - **Reason:** These cause build failures in CI/Docker environments (TS6133).
- **Global State Sync:**
  - **Pattern:** Use `useEffect` buffers to sync Backend State -> Client State.
  - **Example:** `SimulationContext` syncing server time. Don't rely on local inference alone.

## 🎨 UI & Styling Rules
1.  **Shadcn Components:** Always prefer existing components in `@/components/ui/` (Button, Input, Select, Dialog) over standard HTML tags.
2.  **Tailwind CSS:**
    - Use utility classes for layout and spacing.
    - Use `cn()` utility for conditional class merging.
    - Example: `className={cn("flex gap-2", isActive && "bg-blue-500")}`.
3.  **Colors & Theme:**
    - **NO Hex Codes:** Avoid hardcoded hex colors (e.g. `#ef4444`) inside components.
    - **Use Tailwind:** Use classes like `text-red-500`, `bg-muted`.
    - **Charts Exception:** For Recharts, use defined constants from `src/config/MetricConfig.ts` or consistent palette arrays.
4.  **Icons:** Use `lucide-react`. Standard sizes: `h-4 w-4` (sm), `h-5 w-5` (md).

## 🧩 Component Patterns

### 1. Forms (Input Data)
- **Strict Rule:** We use **Controlled Components** with manual `useState`.
- **Dependencies:** Do NOT use `react-hook-form` or `zod` inside the component (unless creating a new standard).
- **Validation:** Perform manual validation in `handleSave()`.

### 6. File Structure & Imports
- **Component Existence:** Before importing from `@/components/ui/`, **ALWAYS check if the file exists**.
  - Shadcn components are not installed by default. Do not assume `AlertDialog`, `Tabs`, or `Select` exist unless you see them in the file list.
  - If missing, use a generic alternative (e.g., `Dialog` instead of `AlertDialog`) or ask the USER to install it.
- **Service Pattern:** API calls must be in `frontend/src/services/`. Components should only call these services.
- **Dependencies:** Do NOT use `react-hook-form` or `zod` inside the component (unless creating a new standard).
- **Validation:** Perform manual validation in `handleSave()`.

### 2. Data Tables (Analytics/Lists)
- **Standard:** Use `@tanstack/react-table` for logic + Shadcn `<Table>` for UI.
- **Deprecated:** Do NOT use raw HTML `<table>` tags. Refactor legacy tables to Shadcn components.
- **Features:** Implement Sorting and Pagination where data sets are large.

### 3. Charts & Visualization
- **Library:** `recharts`.
- **Responsive:** Always wrap charts in `<ResponsiveContainer width="100%" height={300}>`.

### 4. Diagrams / Flows
- **Library:** `@xyflow/react`.
- **Usage:** Used for Automation Flows and logic builders.

### 5. UI/UX Standards
- **Confirmations:**
  - **NEVER** use `window.confirm()`.
  - **NEVER** use `window.alert()`.
  - Use the standardized Shadcn `Dialog` pattern for critical actions (Delete, Reset):
    ```tsx
    import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
    
    // State
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Render
    <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Сигурни ли сте?</DialogTitle>
          <DialogDescription>Това действие е необратимо.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteId(null)}>Отказ</Button>
          <Button variant="destructive" onClick={confirmDelete}>Изтрий</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    ```
- **Feedback:** Use `sonner` (`toast.success`, `toast.error`) for all operations.
- **Dismissal:** Ensure Dialogs have `onInteractOutside={(e) => e.preventDefault()}` if they contain critical unsaved data.

## 🌐 API & Config
- **Central Config:** NEVER hardcode URLs (e.g. `localhost:3000`).
- **Rule:** Always import `API_BASE_URL` from `@/core/config`.

### Data Fetching (Service Pattern)
- **Strict Rule:** Components should **NOT** contain direct `fetch` or `axios` calls.
- **Pattern:** Create/Use a service file in `src/services/` (e.g., `ai.service.ts`).
- **Reason:** Centralizes error handling, types, and API URLs. Components just call `await myService.getData()`.

## 📂 File Structure
- **Components:** `src/components/<category>/<Name>.tsx`
- **Pages:** `src/pages/<Name>.tsx`
- **Hooks:** `src/hooks/use<Name>.ts`
- **Services:** `src/services/<domain>.service.ts`

## ✅ Quality Checklist
1. Are imports absolute? (e.g. `import { Button } from '@/components/ui/button'`)
2. Is the component responsive (Mobile First)?
3. Are proper TypeScript types defined (No `any`)?
4. Are "Magic Numbers" extracted to constants?
