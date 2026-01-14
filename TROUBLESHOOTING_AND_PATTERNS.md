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
## 12. Backend: Category Enums (500 Error)
### Problem
Adding a new device in a newly created folder (e.g., `soil/`) fails with a `500 Internal Server Error`.
### Cause
The `Device` model (`backend/src/models/Device.ts`) has a strict `enum` for the `group` field. When a new folder is added to `backend/config/devices/`, the system automatically assigns that folder name (Title Case) as the category. If this name is not in the model's enum, the save operation fails.
### Solution
1.  Update the `group` enum in `backend/src/models/Device.ts` to include the new category name.
2.  Update the `IDevice` interface to include the new literal type.
3.  Register the new category in the frontend wizard (`DeviceWizard.tsx`).

## 13. Deployment: Docker Missing Config
### Problem
When deploying to Raspberry Pi (or any Docker environment), the database templates for Controllers and Devices were empty.
### Cause
The `backend/Dockerfile` only copied the source code (`src/`) but failed to copy the configuration directory (`backend/config/`), which contains the JSON templates loaded at runtime.
### Solution
Explicitly `COPY backend/config ./config` in the Dockerfile.
### Lesson
Runtime dependencies that are not in `node_modules` (like config files, templates, or assets) must be explicitly added to the Docker image.

## 14. Backend: System Recovery "Item not found" (Zombie Processes)
### Symptom
The System Recovery panel shows a "Zombie Process" with status `RUNNING`, but clicking "Force Stop" returns "Item not found", even though the ID matches.

### Cause
Mismatch in `_id` types. The document in MongoDB had `_id` stored as a **String** (e.g., `"696659c..."`), but Mongoose's `findById(id)` automatically casts the input to a BSON `ObjectId`. Since `String !== ObjectId`, the query failed. This often happens with legacy data or after migrations.

### Solution
Implemented a Fallback mechanism in the Controller.
1. Try `Model.findById(id)` (Standard Mongoose).
2. If failed, access the raw driver `mongoose.connection.db.collection(...).updateOne({ _id: id })` to try matching the ID as a raw String.

### Lesson
Never assume all IDs in a legacy/migrated database are ObjectIds. Recovery tools must be robust enough to handle data inconsistency.

## 15. Debugging: Direct Database Verification
### Context
When API logic fails inexplicably (e.g., "Item not found" when it clearly exists), UI logs are insufficient. You need to see the *actual* data types in the database.

### Action
Create a temporary verification script in the `backend/` root (where `node_modules` are available):

```javascript
// backend/debug_script.js
const mongoose = require('mongoose');
require('dotenv').config(); // Load ENV for MONGO_URI

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    const items = await db.collection('executionsessions').find({ status: 'running' }).toArray();
    items.forEach(i => {
        console.log(`ID: ${i._id} (Type: ${typeof i._id})`); // CRITICAL: Check the TYPE
    });
    await mongoose.disconnect();
}
run();
```
Run it with `node debug_script.js`.

### Rule
Always verify the **Type** of the data fields (`typeof`) when standard queries fail.
