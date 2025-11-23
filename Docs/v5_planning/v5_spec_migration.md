# Hydroponics v5 - Migration Strategy

**Status**: Draft
**Goal**: Transition from v4 to v5 with minimal downtime and zero data loss.
**Approach**: Parallel Run (Side-by-Side) where possible, followed by Hard Switch.

## 1. Pre-Migration Checklist
- [ ] **Hardware Audit**: Ensure all Arduino/ESP devices have unique IDs (UUIDs) or stable Serial ports.
- [ ] **Network**: Ensure the server (RPi/PC) has reserved IP.
- [ ] **Backup**: Full dump of v4 MongoDB (`mongodump`).
- [ ] **Environment**: Install Node.js 20+ (LTS) and pnpm/npm.

---

## 2. Phase 1: The Foundation (Weeks 1-2)
*Goal: Establish the v5 Core and Hardware connectivity without affecting v4.*

### 2.1. Setup
1.  **Repo**: Initialize new Monorepo structure.
2.  **Core**: Implement `ConfigService`, `Logger` (Pino), and `Bootstrap`.
3.  **Database**: Setup new v5 MongoDB database (`hydroponics_v5`). *Do not touch v4 DB yet.*

### 2.2. Hardware "Spy" Mode
1.  **Objective**: Validate v5 hardware communication without taking control.
2.  **Action**:
    *   Stop v4.
    *   Run v5 `HardwareService` to connect to Arduinos.
    *   Verify it can READ sensors correctly.
    *   **Critical**: Do NOT write to relays/actuators yet.
    *   Stop v5, Restart v4.
3.  **Outcome**: Confirmed `ArduinoAdapter` works.

---

## 3. Phase 2: The Brain (Weeks 3-4)
*Goal: Build the Automation Engine and replicate v4 logic.*

### 3.1. Logic Porting
1.  **Analysis**: Export all v4 Flows to JSON.
2.  **Conversion**: Manually recreate key flows in v5 `ActionTemplate` format (or write a script if too many).
3.  **Testing**:
    *   Use `MockAdapter` to simulate sensor inputs.
    *   Run v5 Automation Engine.
    *   Verify it triggers the correct "Virtual" outputs.

### 3.2. Data Migration (Partial)
1.  **Script**: Write `migrate_devices.ts` to read v4 `devices` collection and insert into v5 `devices`.
2.  **Mapping**: Map old `pin` numbers to new `DeviceTemplate` structure.

---

## 4. Phase 3: The Face (Weeks 5-6)
*Goal: Build the UI and connect to the v5 Brain.*

### 4.1. Frontend
1.  **Scaffold**: Vite + React + Tailwind.
2.  **Flow Editor**: Implement React Flow.
3.  **Dashboard**: Create basic widgets for Sensor Data.

### 4.2. Integration
1.  **API**: Connect Frontend to Fastify API.
2.  **Real-time**: Verify Socket.io updates for sensor data.

---

## 5. Phase 4: The Switch (Week 7)
*Goal: Cutover from v4 to v5.*

### 5.1. The Cutover Day
1.  **Shutdown**: Stop Hydroponics v4 Service.
2.  **Backup**: Final backup of v4 DB.
3.  **Firmware**: Flash new v5-compatible firmware to Arduinos (if protocol changed). *Note: Try to keep protocol compatible if possible to avoid this step.*
4.  **Startup**: Start Hydroponics v5 Service.
5.  **Verification**:
    *   Check Logs.
    *   Verify Sensor Readings in Dashboard.
    *   Test Manual Control (Toggle a light).
    *   Test Automation (Run a short test program).

### 5.2. Rollback Plan
*If v5 fails critical checks:*
1.  Stop v5.
2.  (If firmware changed) Flash back v4 firmware.
3.  Start v4.
4.  Analyze logs.

---

## 6. Post-Migration
1.  **Data Import**: Run background script to import historical `SensorData` from v4 to v5 (for analytics).
2.  **Cleanup**: Archive v4 code and DB.
