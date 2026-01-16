# Task: Controller Discovery Protocol Upgrade & Connection Management

## Status
- **Progress:** 98%
- **Current Phase:** 9. Network Diagnostics & Documentation
- **Last Updated:** 2026-01-16

## Objectives
1. Implement a robust discovery mechanism using UDP broadcast.
2. Standardize request/response messages for discovery.
3. Automatically detect and handle connection parameters (IP, Port, MAC).
4. Implement "Soft Restart" logic to handle connection changes smoothly.
5. Provide intelligent feedback in Network Scanner (Synced, Update IP, Link, Replace).
6. Enforce unique IP addresses and implement "Offline Mode" for pre-configuration.
7. **(NEW)** Provide network diagnostic info to help users troubleshoot Docker/Network isolation issues.

## Implementation Plan

### 1-7. Previous Phases (✅ Completed)
- [x] Documentation & Standards
- [x] Backend Discovery Service
- [x] Frontend Network Scanner
- [x] Hardware Service Self-Healing
- [x] Simulator Upgrade
- [x] Verification
- [x] UX Improvements
- [x] IP Conflict Resolution & Offline Mode

### 9. Network Diagnostics & Documentation (✅ Completed)
**Rationale:** Users running in Docker (especially on RPi) often face network isolation issues where Broadcast packets don't route correctly. We need to visualize the current network context effectively.

- [x] **Backend (SystemController.ts / HardwareController.ts):**
    - [x] Create endpoint `GET /api/system/network-interfaces`.
    - [x] Use `os.networkInterfaces()` to list active interfaces.
    - [x] Filter out loopback (`127.0.0.1`) and inactive ones.
    - [x] Return list of `{ name, ip, netmask, mac, family }`.
    - [x] Helper: Calculate Broadcast Address from IP + Netmask (e.g. `10.1.10.15` + `/24` -> `10.1.10.255`).

- [x] **Frontend (NetworkScanner.tsx):**
    - [x] Fetch network interfaces on mount.
    - [x] Display "Server Context" section/alert.
        - [x] Show Server IP(s).
        - [x] If multiple interfaces, allow user to pick one to auto-fill "Broadcast IP".
    - [x] Add visual hint if IP is `172.17.x.x` or `172.18.x.x` (Docker Bridge range) -> "Running in Docker Bridge? Use Host Mode for discovery."

- [x] **Documentation Updates:**
    - [x] **RASPBERRY_PI_DEPLOYMENT.md:**
        - [x] Add explicit instruction to use `--network host` for Docker run command.
        - [x] Explain why (UDP Broadcast limitations in Bridge mode).
    - [x] **WINDOWS_DEPLOYMENT.md:** 
        - [x] Add note about network discovery and firewall rules.

### 10. Final Polish (Pending)
- [ ] Verify everything works end-to-end.
