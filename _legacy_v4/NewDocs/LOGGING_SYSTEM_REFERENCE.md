# Logging System Technical Reference
*For AI Assistant - Internal Documentation*
*Last Updated: 2025-01-23*

## Quick Architecture Overview

```
Application Code → UnifiedLoggingService → LogStorageManager → [Memory Buffer + MongoDB] → WebSocket → Frontend Dashboard
```

**Core Concept**: Tag-based hybrid storage system with module organization and real-time streaming.

---

## File Locations Map

### Backend Core
- **Main API**: `backend/src/services/UnifiedLoggingService.ts`
- **Storage Manager**: `backend/src/services/LogStorageManager.ts`
- **MongoDB Model**: `backend/src/models/LogEntry.ts`
- **REST Routes**: Search for logging routes in `/backend/src/routes/`
- **WebSocket**: `backend/src/routes/websocketRoutes.ts`

### Frontend
- **Service**: `frontend/src/services/loggingService.ts`
- **Dashboard**: `frontend/src/pages/SystemLogsPage.vue`

### Documentation
- **User Guide**: `Docs/LoggingSystem/LOGGING_SYSTEM_GUIDE.md`

---

## How to Add Logging (Code Integration)

### Backend Services (Standard Pattern)
```typescript
// 1. Import and create module logger
import { UnifiedLoggingService } from '../services/UnifiedLoggingService'

export class YourService {
  private logger = UnifiedLoggingService.createModuleLogger('YourService.ts')

  // 2. Use in methods
  someMethod() {
    this.logger.info('operation-started', { operationId: 'abc123' })
    this.logger.error('operation-failed', { error: error.message, stack: error.stack })
    this.logger.analytics('performance-metric', { duration: 1500, success: true })
  }
}
```

### Direct Static Calls (Alternative)
```typescript
UnifiedLoggingService.debug('sensor-reading', { sensor: 'pH_01', value: 7.2 })
UnifiedLoggingService.info('program-started', { programId: 'prog_123' })
```

### Frontend Services
```typescript
await loggingService.createTestLog('info', 'user-action', 'device-form', {
  action: 'create_device',
  userId: 'user_123'
})
```

---

## Log Levels & Storage Strategy

| Level | Storage Type | Memory Buffer | MongoDB | TTL | Usage |
|-------|-------------|---------------|---------|-----|-------|
| `debug` | memory | ✅ | ❌ | N/A | Development debugging only |
| `info` | session | ✅ | ✅ | 24h | Normal operations |
| `warn` | persistent | ✅ | ✅ | 7 days | Recoverable issues |
| `error` | persistent | ✅ | ✅ | 30 days | Failures needing attention |
| `analytics` | persistent | ✅ | ✅ | 90 days | Performance/usage metrics |

**Key**: Memory buffer = real-time access, MongoDB = persistence with automatic TTL cleanup

---

## Context System

### Standard Context Fields
```typescript
interface LogContext {
  programId?: string    // Flow/program execution
  cycleId?: string     // Specific cycle
  blockId?: string     // Individual block
  sessionId?: string   // Execution session
  deviceId?: string    // Hardware device
  module?: string      // Auto-added by module logger
}
```

### Usage Pattern for Flow Execution
```typescript
const context = {
  programId: activeProgram._id,
  cycleId: currentCycle._id,
  sessionId: executionSession.id
}

this.logger.info('block-executed', { blockType: 'sensor', success: true }, context)
```

---

## Real Examples from Codebase

### SchedulerService Pattern
```typescript
// From backend/src/services/SchedulerService.ts lines 30, 90, 159
private logger = UnifiedLoggingService.createModuleLogger('SchedulerService.ts')

this.logger.info('SchedulerService.ts', { status: 'starting' })
this.logger.analytics('monitoring-programs-found', { count: programs.length })
this.logger.error('scheduler-processing-error', { error: error.message })
```

### Naming Convention in Production
- **Tags**: Use descriptive kebab-case (`sensor-reading`, `device-connection-failed`)
- **Modules**: Use filename (`SchedulerService.ts`, `StartupService.ts`)
- **Data**: Structured objects with relevant context

---

## Storage Implementation Details

### Memory Buffer (LogStorageManager)
- **Capacity**: 1000 entries max (circular buffer)
- **Access**: Real-time, instant retrieval
- **Cleanup**: Automatic when capacity exceeded

### MongoDB Storage
- **TTL**: Automatic cleanup via MongoDB TTL indexes
- **Indexes**: Composite indexes for `timestamp + level`, `module + tag + timestamp`
- **Schema**: Full schema in `backend/src/models/LogEntry.ts`

### Hybrid Retrieval
- `getMemoryLogs()` - Memory buffer only (fast)
- `getPersistedLogs()` - Database only (persistent)
- `getAllLogs()` - Combined with deduplication

---

## Frontend Integration

### loggingService API
```typescript
// Get logs with filtering
const response = await loggingService.getLogs({
  level: ['error', 'warn'],
  module: 'SchedulerService.ts',
  limit: 100
})

// Real-time subscription
loggingService.subscribeToLiveLogs((entry) => {
  console.log('New log:', entry)
})

// Export for analysis
const blob = await loggingService.exportLogs(filter, 'json')
```

### WebSocket Live Updates
- **Connection**: `ws://localhost:5000/ws/flow`
- **Message Types**: `log_entry`, `recent_logs`, `logs_subscribed`
- **Auto-reconnect**: 5 attempts with exponential backoff

---

## Debugging/Analysis Patterns

### Finding Issues by Context
```typescript
// Filter by program execution
filter = {
  level: ['error', 'warn'],
  startTime: programStartTime,
  endTime: programEndTime
}

// Search for device issues
filter = {
  tag: '*device*',  // Use contains search
  level: ['error']
}
```

### Performance Analysis
```typescript
// Analytics logs contain timing data
filter = {
  level: ['analytics'],
  tag: '*execution*'
}
// Look for: duration, success rates, performance metrics
```

### Module-Specific Debugging
```typescript
// Focus on specific service
filter = {
  module: 'SchedulerService.ts',
  level: ['debug', 'info', 'error']
}
```

---

## Configuration Control

### Runtime Control
```typescript
// Enable/disable logging
UnifiedLoggingService.setEnabled(true/false)

// Debug mode (console output)
UnifiedLoggingService.setDebugMode(true/false)

// Frontend config update
await loggingService.updateConfig(enabled, debugMode)
```

### Environment Behavior
- **Development**: `debugMode = true` (console output enabled)
- **Production**: `debugMode = false` (minimal console output)

---

## Important Implementation Notes

### Current Reality vs Documentation
- ✅ Core architecture matches documentation
- ⚠️ `info` logs use `session` storage, not `persistent` as documented
- ⚠️ Console output is simplified (emoji only, no timestamps)
- ❌ Advanced decorators from documentation not implemented

### Memory Management
- Memory buffer: automatic cleanup at 1000 entries
- MongoDB: TTL-based automatic cleanup
- WebSocket: 500 entry limit for live logs

### Error Handling
- Fallback to console logging if storage fails
- Graceful degradation for WebSocket failures
- Circular import protection via dynamic imports

---

## Quick Troubleshooting

### Common Issues
1. **No logs appearing**: Check `UnifiedLoggingService.setEnabled(true)`
2. **Debug logs missing**: Ensure `debugMode = true` or development environment
3. **WebSocket not connecting**: Verify `ws://localhost:5000/ws/flow` is accessible
4. **Old logs accumulating**: MongoDB TTL should handle cleanup automatically

### Verification Commands
```typescript
// Check current status
const stats = await loggingService.getStats()

// Clear memory for fresh start
await loggingService.clearMemoryLogs()

// Test logging pipeline
await loggingService.createTestLog('info', 'test-tag', 'test-module', { test: true })
```

---

*This reference contains all essential information for integrating with and troubleshooting the Hydroponics v4 logging system.*