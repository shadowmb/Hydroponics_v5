# Troubleshooting & Development Patterns

This document serves as a repository of issues encountered during the development of Hydroponics v5, their solutions, and best practices to avoid recurrence.

## 1. Frontend: Deletion Confirmation
### Problem
The native browser `window.confirm()` method failed to block execution or return a result in some contexts, leading to unresponsive delete buttons.
### Solution
**Do not use `window.confirm()` or `prompt()`.**
Instead, use the custom `Dialog` component from Shadcn UI.
### Pattern
```tsx
// BAD
const handleDelete = () => {
    if (confirm('Are you sure?')) { deleteItem(); }
}

// GOOD
<Dialog open={isOpen} onOpenChange={setIsOpen}>
    <DialogContent>
        <DialogHeader><DialogTitle>Confirm Deletion</DialogTitle></DialogHeader>
        <DialogFooter>
            <Button onClick={confirmDelete}>Delete</Button>
        </DialogFooter>
    </DialogContent>
</Dialog>
```

## 2. Backend: Robust Resource Management
### Problem
Deleting a device failed with a `CastError` because the `hardware.parentId` field contained invalid data ("some_controller_id") from early testing. This crashed the request before the device could be deleted.
### Solution
Wrap resource-freeing logic (which depends on external references) in a `try-catch` block. Ensure that the primary operation (deletion) proceeds even if side-effects (freeing ports) fail.
### Pattern
```typescript
try {
    // Attempt to free resources (e.g., mark port as free)
    await freeResources(device);
} catch (err) {
    // Log warning but DO NOT throw. Allow deletion to proceed.
    logger.warn({ err }, 'Failed to free resources');
}
await device.softDelete();
```

## 3. Data Integrity: Mongoose Enums
### Problem
Validation errors occurred when creating `1-channel` relays because the Mongoose schema `enum` did not include these values, even though the frontend allowed them.
### Solution
Always keep Mongoose Schema enums in sync with frontend constants and TypeScript interfaces.
### Checklist
- [ ] Update TypeScript Interface (`IRelay`)
- [ ] Update Mongoose Schema (`RelaySchema`)
- [ ] Update Frontend Options

## 4. Architecture: Soft Deletion
### Observation
The database contained more records than the UI displayed (8 vs 2).
### Explanation
The system uses **Soft Deletion**. Records are not removed but marked with a `deletedAt` timestamp.
### Best Practice
- **Queries:** Always filter by `{ deletedAt: null }` for active items (handled by `softDeletePlugin` automatically for most queries).
- **Debugging:** When inspecting the DB directly, remember to check `deletedAt`.

## 5. Environment: Port Conflicts
### Problem
`EADDRINUSE: address already in use` errors when restarting the backend.
### Solution
Ensure previous Node.js processes are killed before starting a new one.
### Command
`taskkill /F /IM node.exe` (Windows) or `pkill node` (Linux/Mac).

## 6. Schema Conflicts
### Problem
A legacy file `Device.schema.ts` was conflicting with the new `Device.ts` model.
### Solution
Ensure a single source of truth for data models. Delete or archive legacy schema files immediately after migration.

## 7. Linting
### Known Issue
`Cannot find type definition file for 'node'`.
### Status
Persistent but non-blocking. Ignored for now to focus on functionality.
