# Device Template Schema Reference

## 1. Overview
The **Device Template** is the single source of truth for a hardware device in Hydroponics v5. It defines:
1.  **Identity:** Name, Category, Icon.
2.  **Hardware:** Which firmware command to use (`hardwareCmd`) and which pins are required.
3.  **Data:** How to parse the firmware response (`valuePath`) and what units to use (`sourceUnit`).
4.  **UI:** How to display it in the frontend (`uiConfig`).

## 2. File Location
*   **Path:** `backend/config/devices/<environment>/<type>/<device_id>.json`
    *   Example: `backend/config/devices/water/sensors/ph_meter.json`
*   **Naming:** `<device_id>` must match the `id` field inside the JSON. Use lowercase snake_case.

## 3. Extending the Schema
If you add a new field to the JSON template (e.g., `supportedStrategies`), you **MUST** update the backend validation logic to allow it. Otherwise, it will be stripped or cause validation errors during the database sync.

**Files to Update:**
1.  **Zod Validation:** `backend/src/modules/hardware/DeviceTemplateManager.ts`
    *   Update `DeviceTemplateSchema` to include the new field.
2.  **Database Model:** `backend/src/models/DeviceTemplate.ts`
    *   Update `IDeviceTemplate` interface.
    *   Update `DeviceTemplateSchema` (Mongoose).
