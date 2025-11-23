# Hydroponics v4 Deep Dive: Frontend Architecture

**Status**: Draft
**Domain**: User Interface & Experience
**Stack**: Vue 3, Quasar, Pinia, Socket.io

## 1. Introduction
This document analyzes the client-side application, focusing on the complex **Flow Editor** and the real-time **Dashboard**.

---

## 2. Module Analysis

## 2. Module Analysis

### 2.1. FlowEditor (The Visual Builder)
*The core interface for creating automation logic.*

#### 🔍 Logic & Flow
*   **Implementation**: Custom Vue 3 implementation (Not using a standard library like React Flow).
*   **Structure**:
    *   `FlowEditor.vue`: Main container.
    *   `core/`: Contains the graph logic (nodes, edges, positioning).
    *   `blocks/`: Vue components for each block type (`SensorBlock`, `IfBlock`, etc.).
*   **State**: Local state in `FlowEditor.vue` + Pinia for saving.
*   **Interaction**: SVG-based connections, absolute positioning for nodes.

#### ⚠️ Pain Points
*   **Custom Engine**: Maintaining a custom graph engine is expensive and error-prone.
*   **Scalability**: Performance degrades with >50 blocks.
*   **Mobile**: Not optimized for touch.

#### 🚀 V5 Strategy
*   **Decision**: **REBUILD**.
*   **Stack**: **React Flow**. It's the industry standard, robust, and handles zoom/pan/minimap out of the box.

---

### 2.2. Dashboard (The Control Center)
*Real-time monitoring and control interface.*

#### 🔍 Logic & Flow
*   **State**: `dashboard.ts` (Pinia Store).
*   **Layouts**: Supports `compact`, `stacked`, `priority`, `tiles`.
*   **Data Flow**:
    1.  **Initial Load**: REST API (`/dashboard/sections/...`).
    2.  **Updates**: WebSocket (`dashboard_refresh` event triggers REST reload).
    3.  **Real-time**: Some modules bind directly to `MonitoringData`.

#### 🧬 Data Structures (Blueprint)
```typescript
interface DashboardModule {
  id: string
  sectionId: 'sensors' | 'system' | 'program' | 'alerts'
  visualizationType: 'number' | 'gauge' | 'chart'
  monitoringTagId?: string
  layout: { width: number; height: number }
}
```

#### 🚀 V5 Strategy
*   **KEEP & REFACTOR**.
*   **Improvement**:
    *   **Grid System**: Use `react-grid-layout` for true drag-and-drop customization.
    *   **Direct Socket**: Bind widgets directly to WebSocket streams, avoid "Refresh -> REST Fetch" loop.

---

### 2.3. API Communication (The Bridge)
*Socket.io and REST integration.*

#### 🔍 Logic & Flow
*   **WebSocket**: `websocket.js` (Global Store).
*   **Singleton**: Maintains one connection across route changes.
*   **Events**:
    *   `block_started_enhanced`: Real-time flow execution tracing.
    *   `dashboard_refresh`: Signal to reload data.

#### 🚀 V5 Strategy
*   **KEEP**.
*   **Improvement**:
    *   **Typed Events**: Define shared TypeScript interfaces for all Socket events (shared between BE/FE).
    *   **React Query**: Use TanStack Query for REST fetching to handle caching and background updates automatically.

---

## 3. Summary
The Frontend is modern (Vue 3) but suffers from "Not Invented Here" syndrome in the Flow Editor. The Dashboard logic is solid but relies on a slightly inefficient "Signal-then-Fetch" pattern for updates.

**Key Actions for V5:**
1.  **React Flow**: Replace the custom editor.
2.  **React Grid Layout**: Upgrade the dashboard.
3.  **TanStack Query**: Modernize data fetching.
