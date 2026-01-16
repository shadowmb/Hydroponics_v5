# Task: Controller Discovery Protocol Upgrade & Connection Management

## Status
- **Progress:** 95%
- **Current Phase:** 8. IP Conflict Resolution & Offline Mode
- **Last Updated:** 2026-01-16

## Objectives
1. Implement a robust discovery mechanism using UDP broadcast.
2. Standardize request/response messages for discovery.
3. Automatically detect and handle connection parameters (IP, Port, MAC).
4. Implement "Soft Restart" logic to handle connection changes smoothly.
5. Provide intelligent feedback in Network Scanner (Synced, Update IP, Link, Replace).
6. **(NEW)** Enforce unique IP addresses and implement "Offline Mode" for pre-configuration.

## Implementation Plan

### 1. Documentation & Standards (✅ Completed)
- [x] Create `firmware-commands.md` defining the new JSON protocol.
- [x] Define `DISCOVERY` and `IDENTIFY` command structures.

### 2. Backend Discovery Service (✅ Completed)
- [x] Create `DiscoveryService` class in backend.
- [x] Implement UDP socket listener (default port 8888).
- [x] Handle broadcast messages and parse JSON responses.
- [x] Store discovered devices in memory cache (TTL based).
- [x] Create API endpoint `GET /api/discovery/scan` to trigger scan and return results.
- [x] **Add `port` to discovered device data.**

### 3. Frontend Network Scanner (✅ Completed)
- [x] Create `NetworkScanner` component (Dialog).
- [x] Add "Scan" button to Hardware page.
- [x] Display results in a table (IP, MAC, Model, Version).
- [x] Add "Add to System" action for discovered devices.
- [x] **Show 'Port' column in results.**
- [x] **Pass discovered port to `onAddController`.**

### 4. Hardware Service Self-Healing (✅ Completed)
- [x] Update `HardwareService` to handle dynamic IP changes.
- [x] Implement logic to match devices by MAC address if IP fails.
- [x] Auto-update IP in DB if MAC matches but IP differs.

### 5. Simulator Upgrade (✅ Completed)
- [x] Update `HydroponicsSimulator` to listen on UDP.
- [x] Implement response to discovery broadcasts.
- [x] Ensure simulator responds with correct JSON format.

### 6. Verification (✅ Completed)
- [x] Verify scanner finds local simulator.
- [x] Verify "Add" flow creates valid controller record.
- [x] Test IP change scenario (simulate IP change in simulator, verify backend updates).

### 7. UX Improvements (Network Scan & Wizard) (✅ Completed)
- [x] **Scanner UI:** Add "Port" column to results.
- [x] **Wizard Integration:**
    - [x] Auto-fill "Port" from scan results (fix hardcoded 80).
    - [x] Auto-select "Controller Type" based on discovered model name (e.g. `Arduino_Uno_R4_WiFi` -> Template).
    - [x] Skip Step 1 (Type Selection) if model is recognized.
- [x] **Intelligent Scanner Actions:**
    - [x] `Update IP`: If MAC matches but IP differs.
    - [x] `Link`: If IP matches legacy controller (no MAC).
    - [x] `Synced`: If everything matches.
    - [x] `Replace` (Conflict): If IP matches but MAC differs (visual warning).

### 8. IP Conflict Resolution & Offline Mode (✅ Completed)
**Rationale:** IP addresses must be unique for active controllers. Users often need to pre-configure controllers before they are connected (Offline Mode).

- [x] **Frontend (ControllerWizard.tsx):**
    - [x] Make `IP Address` and `Port` **mandatory** fields by default.
    - [x] Add "Offline / Manual Setup" checkbox (toggle).
        - [x] If Checked: IP/Port fields become optional (or disabled/cleared).
        - [x] If Unchecked: IP/Port are required.
    - [x] Add visual validation or warning if user enters an IP that is already taken (optional, but good UX).

- [x] **Backend (HardwareController.ts / Service):**
    - [x] **Enforce IP Uniqueness:** When saving a controller with an IP:
        - [x] Check if another controller already has this IP.
        - [x] If conflict found: **Evict the old controller**.
            - [x] Set old controller's `connection.ip` to `""` (empty) or `null`.
            - [x] Set old controller's `status` to `'offline'` (or `disabled`).
            - [x] (Optional) Add a log entry or notification about the displacement.
    - [x] Validates that `macAddress` is handled correctly (not used as primary key for connection, but for identity).

- [x] **Refinement of "Replace" Action (NetworkScanner):**
    - [x] Ensure clicking "Replace" (or Add on conflict) triggers the standard "Add Controller" flow, which will automatically trigger the backend eviction logic defined above.
