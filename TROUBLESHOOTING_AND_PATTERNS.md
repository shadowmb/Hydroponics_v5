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

## 8. Hardware: GPIO Resolution
### Problem
Devices with multiple pins (like DHT22) were saving `gpio: 0` in the database, causing communication failures.
### Cause
The backend was not resolving the GPIO number from the `ControllerTemplate` when handling multi-pin configurations.
### Solution
Use a helper function (e.g., `resolvePins`) during device creation/update to look up the `ControllerTemplate` and map the `portId` to the actual `pin` number.

## 9. UI/UX: Monitor & Test Display
### Problem
Sensor values were not appearing in the "Monitor & Test" dialog, even though the system console showed valid data.
### Cause
The frontend expected specific output keys (e.g., `ec`) in the raw response, but the firmware returned generic keys (e.g., `value`).
### Solution
**Robust Fallback Logic:**
- **Frontend:** If the specific key is missing, fallback to the converted `liveValue` (if single output).
- **Backend:** If the configured `valuePath` is not found, auto-detect common keys (`value`, `val`, `raw`).

## 10. Firmware: Command ID Mismatch
### Problem
Devices (e.g., DHT22, DS18B20) appeared disabled in the Firmware Builder with the message "Missing Firmware Command", even though the command files existed.
### Cause
The `DeviceTemplate` in the database (seeded from `seedDeviceTemplates.ts`) referenced **legacy command IDs** (e.g., `SINGLE_WIRE_PULSE`) that did not match the **new JSON-based Command Definition IDs** (e.g., `DHT_READ`). The frontend performs a case-insensitive check between `device.requiredCommand` and `command.id`.
### Solution
**Sync Seed Data:** Ensure that `backend/src/utils/seedDeviceTemplates.ts` uses the EXACT command IDs defined in `firmware/definitions/commands/*.json`.
### Example
- **Wrong:** `requiredCommand: 'SINGLE_WIRE_PULSE'`
- **Correct:** `requiredCommand: 'DHT_READ'` (matches `dht_read.json`)

## 11. Backend: Missing Schema Fields (VariantID)
### Problem
A PWM pump was only showing "Volumetric Flow" (Dosing) strategy, missing "Range Mapping" (Linear), even though the user selected the "PWM Speed Control" variant.
### Cause
The Mongoose schema for `Device` (`backend/src/models/Device.ts`) was missing the `variantId` field in the `config` object. Even though the Frontend sent the correct payload (`variantId: 'pwm'`), the Backend silently stripped this field during the save operation.
### Solution
1.  Add the missing field to the Mongoose Schema (`variantId: { type: String }`).
2.  Update the TypeScript Interface (`IDevice`).
3.  **Critical:** Restart the backend server process to apply the schema change.
### Lesson
Always verify that new fields added to the Frontend payload are explicitly defined in the Backend Mongoose Schema. Mongoose is strict by default.
