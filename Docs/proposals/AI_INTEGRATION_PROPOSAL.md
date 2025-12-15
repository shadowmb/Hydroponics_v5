# Proposal: Local AI Assistant Integration (Shadow Mode)

## 1. Overview
This document outlines the architecture and logic for integrating a **Local AI Assistant** into the Hydroponics v5 system.
The primary goal is to add an "intelligent layer" that analyzes system data and provides agronomic advice, diagnostics, and strategic recommendations, **without satisfying direct hardware control**.

**Key Philosophy:** "Human-in-the-Loop" / "Shadow Mode". The AI advises; the System (and Operator) decides.

## 2. Core Concepts

### 2.1. Local & Private
*   **Engine:** Usage of Open Source Large Language Models (LLMs) like **Llama 3** or **Mistral**.
*   **Host:** Running locally via **Ollama** on the backend server.
*   **Privacy:** No data leaves the local network. No subscription costs.

### 2.2. Role: The "Agronomist Advisor"
The AI does not replace the `AutomationEngine`.
*   **AutomationEngine** handles hard logic: "If water < 10%, fill."
*   **AI Assistant** handles fuzzy logic: "Humidity is rising, and temperature is dropping. Risk of mold. Suggest skipping the next watering cycle."

### 2.3. Safety First
*   **Read-Only Authority:** The AI cannot execute commands. It produces a **Log/Suggestion**.
*   **Hard Limits:** Even if the AI hypothetically suggested a dangerous action, the low-level firmware safety limits remain the ultimate authority.

## 3. Architecture

### 3.1. The Loop (RAG Workflow)
The system follows a specific cycle significantly different from a standard chatbot:

1.  **Trigger:** Time-based (e.g., every 15 mins) or Event-based (e.g., "Alarm Triggered").
2.  **Context Building (The Input):** The system aggregates three layers of data:
    *   **Layer 1: The Snapshot (Physics)**
        *   Current sensor values.
        *   Trends (Rising/Falling fast/slow).
        *   Noise/Stability check (Burst reads).
    *   **Layer 2: The Memory (History)**
        *   Last 5-10 significant actions (e.g., "pH Up added 15 mins ago").
        *   *Why:* To prevent "Oscillation" (adding more acid before the first dose has mixed).
    *   **Layer 3: The Knowledge (Rules/RAG)**
        *   Static Markdown files specifying the crop profile.
        *   Example: `crops/tomatoes_blooming.md` ("Target EC 2.8, reduce by 10% if Temp > 28°C").
3.  **Inference:** The LLM processes the context.
4.  **Output:** A structured JSON response containing:
    *   `diagnosis`: Assessment of the current state.
    *   `recommendation`: Proposed action (or inaction).
    *   `reasoning`: Why this recommendation was made.

### 3.2. Technical Components

*   **`AIService` (Backend):** Interface communicating with the local Ollama instance.
*   **`ContextBuilder`:** Module responsible for gathering sensor data, querying logs, and reading Markdown rule files.
*   **`ShadowLogger`:** Database collection (`ai_logs`) storing the AI's input and output for human review.

## 4. Data Logic & Knowledge Base

Instead of retraining the model, we use **Context Injection (RAG)**.

### 4.1. The "Rulebooks" (Markdown Files)
We define the logic in simple text files that the AI reads:
*   `rules/system_principles.md`: Global physics (e.g., "High temp lowers oxygen").
*   `rules/crops/current_profile.md`: Specific targets for the current crop.

### 4.2. Prompt Structure (Template)
```text
[ROLE]
You are a Hydroponic Expert.
[KNOWLEDGE]
{{ CONTENT_OF_MARKDOWN_FILES }}
[CONTEXT]
Crop: Tomatoes (Week 5)
Sensors: pH 5.2 (Falling), EC 2.8 (Stable), Temp 29°C (High).
History: "pH Up" dosed 10 mins ago.
[TASK]
Analyze and Recommend. Output JSON.
```

## 5. Implementation Plan

### Phase 1: Infrastructure (The "Shadow")
*   Install Ollama + Llama 3 on the server.
*   Implement `AIService` to send simplistic prompts.
*   Create the `ai_logs` collection.
*   **Outcome:** AI starts "talking" to the database, invisible to the user.

### Phase 2: Context Awareness
*   Develop `ContextBuilder`.
*   Implement "Trend Analysis" for sensors.
*   Create basic `rules.md` files.
*   **Outcome:** AI advice becomes relevant and context-aware.

### Phase 3: UI Integration
*   Add an "AI Insights" dashboard.
*   Visualize AI recommendations vs. Actual system actions.

## 6. Conclusion
This integration transforms Hydroponics v5 from an **Automated System** to an **Intelligent System**. By keeping the AI in "Shadow Mode", we gain advanced analytical capabilities with **zero operational risk**.
