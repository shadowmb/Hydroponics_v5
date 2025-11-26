# WebSocket Architecture Documentation

*For Claude - Complete WebSocket system understanding*

## System Overview

The WebSocket system provides real-time execution monitoring with persistent connections across frontend navigation. Built to solve disconnection issues when users navigate between Dashboard pages.

## Core Architecture

### Backend Components

#### 1. WebSocket Server Setup
**File:** `/backend/src/routes/websocketRoutes.ts`
- **Port:** `/ws/flow` on port 5000
- **Protocol:** WebSocket over HTTP server
- **Manager:** Uses singleton `WebSocketManager` instance

#### 2. WebSocket Manager (Singleton)
**File:** `/backend/src/modules/flowExecutor/core/WebSocketManager.ts`
- **Pattern:** Singleton for global client management
- **Responsibilities:**
  - Client connection management
  - Broadcasting to all/specific clients
  - Initial state delivery to new clients
  - Event distribution (block_started, block_executed)

#### 3. Message Handler
**Function:** `handleClientMessage()` in websocketRoutes.ts
- **Input:** JSON messages from clients
- **Async:** Uses async/await for API calls
- **Key Messages:**
  - `ping/pong` - keepalive
  - `request_initial_state` - triggers manual fetch to execution API
  - `subscribe_logs` - log filtering
  - `hardware_health_update` - system status

### Frontend Components

#### 1. Global WebSocket Store (Pinia)
**File:** `/frontend/src/stores/websocket.js`
- **Pattern:** Pinia store with Composition API
- **Lifecycle:** Auto-connects on store creation
- **Persistence:** Maintains connection across page navigation
- **State Management:**
  ```javascript
  const ws = ref(null)
  const wsConnected = ref(false)
  const wsReconnecting = ref(false)
  const actionHistory = ref([]) // Last 4 blocks
  ```

#### 2. Dashboard Integration
**File:** `/frontend/src/pages/dashboard/components/sections/ProgramDashboard.vue`
- **Pattern:** Uses global store instead of component-local WebSocket
- **Real-time Display:** Shows actionHistory from store
- **No Lifecycle Hooks:** Removed onMounted/onUnmounted WebSocket management

## Data Flow Architecture

### 1. Connection Establishment
```
Frontend Navigation → Global Store Auto-Connect → Backend WebSocket Server
                                                ↓
                                        Send request_initial_state
                                                ↓
                                        Manual fetch to execution API
                                                ↓
                                        Return initial_execution_state
```

### 2. Real-time Block Execution
```
FlowInterpreter → WebSocketManager.broadcast() → All Connected Clients
                        ↓
                block_started_enhanced/block_executed_enhanced
                        ↓
                Frontend Store handleWebSocketMessage()
                        ↓
                Update actionHistory (max 4 items)
                        ↓
                ProgramDashboard reactive update
```

### 3. Client Management
```
New Client Connect → Add to WebSocketManager clients array
                  → Send initial_execution_state immediately
                  → Continue receiving real-time updates

Client Disconnect → Auto-remove from clients array
                 → Clean up subscriptions
                 → Other clients unaffected
```

## Message Types & Protocols

### Client → Server Messages
```typescript
// REQUIRED: Client identification (first message after connect)
{
  type: 'identify_client',
  clientInfo: {
    name: 'ProgramDashboard',  // or 'SystemLogs', etc.
    page: 'dashboard'          // or 'logs', etc.
  }
}

// Keepalive
{ type: 'ping' }

// Request current execution state
{ type: 'request_initial_state' }

// Subscribe to filtered logs
{
  type: 'subscribe_logs',
  filters: {
    level: ['info', 'error'],
    tag: 'FlowExecutor',
    module: 'sensor'
  }
}
```

### Server → Client Messages
```typescript
// Confirmation of client identification
{
  type: 'client_identified',
  data: {
    clientId: 'frontend_1758259703116',
    name: 'ProgramDashboard',
    page: 'dashboard'
  }
}

// Initial state response
{
  type: 'initial_execution_state',
  timestamp: '2025-09-18T19:21:00.007Z',
  data: {
    active: [...], // Currently executing blocks
    recent: [...], // Recently completed blocks
    executionContext: {...}
  }
}

// Real-time block events
{
  type: 'block_started_enhanced',
  data: {
    blockId: 'block_1758090035157_3igzjpzov',
    blockType: 'sensor',
    blockName: 'EC',
    displayText: 'Измерва EC...',
    timing: { startTime: '...' }
  }
}

{
  type: 'block_executed_enhanced',
  data: {
    blockId: 'block_1758090035157_3igzjpzov',
    status: 'completed',
    timing: { endTime: '...' },
    result: {...}
  }
}
```

## Key Technical Decisions

### 1. Global Store vs Component WebSocket
**Decision:** Global Pinia store
**Reason:** Prevents disconnection on navigation
**Implementation:** Store auto-connects on creation, persists across routes

### 2. Manual Fetch for Initial State
**Decision:** Fetch API call to `/current-execution` endpoint
**Reason:** Reuse existing API logic, avoid duplicating execution state logic
**Code Location:** `websocketRoutes.ts:174-190`

### 3. TypeScript Handling
**Decision:** Cast fetch response as `any`
**Reason:** Quick fix for unknown type from API response
**Future:** Consider proper interface for API response types

### 4. Action History Limit
**Decision:** Maximum 4 items in actionHistory
**Reason:** UI space constraints, performance
**Implementation:** `slice(0, 4)` after each update

## Critical Code Sections

### Backend WebSocket Message Processing
```typescript
// websocketRoutes.ts:166-191
case 'request_initial_state':
  const wsManager = WebSocketManager.getInstance()
  try {
    const response = await fetch('http://localhost:5000/api/v1/execution-sessions/current-execution')
    const data = await response.json() as any
    wsManager.sendToSpecificClient(ws, {
      type: 'initial_execution_state',
      timestamp: new Date().toISOString(),
      data: data.success ? data.data : null
    })
  } catch (error) {
    // Fallback to null state
  }
```

### Frontend Store Message Handling
```javascript
// websocket.js:106-125
const handleWebSocketMessage = (message) => {
  switch (message.type) {
    case 'initial_execution_state':
      handleInitialExecutionState(message.data)
      break
    case 'block_started_enhanced':
      handleBlockStarted(message.data)
      break
    case 'block_executed_enhanced':
      handleBlockExecuted(message.data)
      break
  }
}
```

### Action History Transformation
```javascript
// websocket.js:177-187
const newAction = {
  type: data.blockType,
  text: data.displayText || formatBlockText(data),
  timestamp: new Date(data.timing?.startTime || Date.now()),
  blockId: data.blockId,
  success: null, // null = in progress
  isStarted: true
}
actionHistory.value = [newAction, ...actionHistory.value].slice(0, 4)
```

## Testing & Validation

### Log Patterns to Watch
```
✅ Good: "WebSocket client connected from ::1"
✅ Good: "Frontend connected: frontend_XXXXX (Total: N)"
✅ Good: "Broadcasting event: block_started_enhanced to N clients"
✅ Good: "Event sent: N success, 0 failed"

❌ Bad: "Failed to send log entry to WebSocket client"
❌ Bad: "WebSocket error for client"
❌ Bad: Any "failed" counts > 0 in broadcast messages
```

### Frontend Store Validation
```javascript
// Check in browser console
const wsStore = useWebSocketStore()
console.log('Connected:', wsStore.wsConnected)
console.log('History:', wsStore.actionHistory)
console.log('Status:', wsStore.connectionStatus)
```

## Future Enhancement Areas

### 1. TypeScript Improvements
- Create proper interfaces for API responses
- Remove `as any` casting
- Add WebSocket message type definitions

### 2. Connection Resilience
- Exponential backoff for reconnection
- Connection quality monitoring
- Offline state handling

### 3. Performance Optimizations
- Message throttling for high-frequency updates
- Selective client updates based on subscription
- Memory management for large client lists

### 4. Monitoring & Analytics
- WebSocket connection metrics
- Message delivery success rates
- Client session duration tracking

## Related Files for Reference

### Backend
- `/src/routes/websocketRoutes.ts` - Main WebSocket server setup
- `/src/modules/flowExecutor/core/WebSocketManager.ts` - Client management
- `/src/modules/flowExecutor/core/FlowInterpreter.ts` - Event broadcasting source
- `/src/routes/executionSessionRoutes.ts` - API endpoint for current execution

### Frontend
- `/src/stores/websocket.js` - Global WebSocket store
- `/src/pages/dashboard/components/sections/ProgramDashboard.vue` - Main consumer
- `/src/composables/useExecutionMonitor.js` - Legacy component-based approach (deprecated)

### Configuration
- WebSocket URL: `ws://localhost:5000/ws/flow`
- Auto-reconnect: 3 second delay
- Message format: JSON
- Keepalive: ping/pong every few seconds (handled by store)

---

*Last Updated: 2025-09-18*
*Status: Production Ready - Successfully tested with program execution*