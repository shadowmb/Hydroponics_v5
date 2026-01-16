# Task: Controller Protocol Upgrade & Enhanced Discovery

**Goal:** Unify controller identification by adding MAC/IP to the standard `INFO` command and enhance the Network Scanner to support UDP port range scanning for discovering controllers on non-standard ports.

## 1. Documentation Update
- [x] Edit `Docs/Reference/firmware-commands.md`:
    - Add new section `## System Commands`.
    -  Define `INFO` response structure to include `mac` and `ip`.
    -  Define `PING` and `REBOOT` for completeness.

## 2. Backend Implementation (Discovery)
- [x] Modify `backend/src/services/discovery-service.ts`:
    - Update `scan` method to accept `startPort` and `endPort` (or handle logic internally).
    - Implement loop to broadcast discovery packet to all ports in range.
    - Ensure socket resource management (one socket per scan or reused).

## 3. Frontend Implementation (Scanner UI)
- [x] Modify `frontend/src/components/hardware/NetworkScanner.tsx`:
    - Add Input/Range controls for "Port Range" (e.g., "8880-8890").
    - Pass these parameters to the backend API.

## 4. Hardware Service Logic
- [x] Verify `HardwareService.ts` handles the new `ip` and `mac` fields from `refreshControllerStatus`. (MAC logic was added, IP update strategy to be decided - if IP changes during refresh, should we update it? Yes, if MAC matches).

## 5. Simulator Update
- [x] Find and update the Simulator logic (mock firmware) to return `mac` and `ip` in the `INFO` JSON response.

## 6. Connection Management (Soft Restart)
- [x] Modify `backend/src/api/controllers/HardwareController.ts` (or Service):
    - Implement logic to detect changes in critical connection fields (`ip`, `port`, `type`) during an update.
    - If changed: Trigger `hardwareService.disconnect(id)` followed by `hardwareService.connect(id)` (or `initializeController`).
    - This ensures the meaningful connection state matches the DB state immediately.


## 7. UX Improvements (Network Scan & Wizard)
- [ ] Modify `backend/src/services/discovery-service.ts`:
    - Ensure `scan` returns the `port` (from `rinfo.port`) in the `DiscoveredDevice` object.
- [ ] Modify `frontend/src/components/hardware/NetworkScanner.tsx`:
    - Add "Port" column to the results table.
    - Pass `port` and `model` in the `onAddController` callback.
- [ ] Modify `frontend/src/components/hardware/ControllerWizard.tsx`:
    - If `initialData` contains a `model`: Check if it matches a valid template ID. If yes, auto-select it and skip Step 1 (Template Selection).
    - If `initialData` contains a `port`: Pre-fill the UDP Port field in Step 2 (instead of default 80/8888).

## Future Considerations
- [ ] **Active Program Protection:** Prevent controller edits if it is currently used by a running program (Safety Lock).
