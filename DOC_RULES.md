**Стандарт за изготвяне на техническа документация за системата за хидропоника**  
*(Вътрешен документ – само за AI разработчици)*

## 1. Цел на този документ
Този файл определя точните правила и стандарти за създаване на документации в проекта за хидропонна система.  
Документациите се изготвят единствено за нуждите на AI-разработчика и трябва да позволяват **ясно, точно и безспорно изпълнение на задачи**.

## 2. Основни принципи
1. Документациите са **кратки**, **структурирани** и **строго по темата**.  
2. Съдържат **само информация, необходима за изпълнение на задачата**.  
3. Нямат излишни обяснения, исторически бележки, алтернативи или мнения.  
4. Всяка задача следва **хронологични, точни и недвусмислени стъпки**.  
5. Всеки документ е независим и съдържа пълната информация за неговата задача.

## 3. Задължителни секции на всяка документация

### 3.1. Цел
Кратко описание (1–3 изречения) на задачата и крайния резултат.

### 3.2. Обхват
- Какво е включено.  
- Какво НЕ е включено.  

### 3.3. Дефиниции и зависимости
- Списък на модели, типове, услуги, контролери, UI компоненти и логика, които задачата засяга.  
- Без несвързана информация.

### 3.4. Стъпки (Алгоритъм)
Стъпките трябва да са хронологични, детайлни и еднозначни.  
Една стъпка = едно действие.  
Формат: **Какво → Къде → Защо**

### 3.5. Файлова структура
Дърво на директории, които участват в задачата.

### 3.6. Валидации и ограничения
Всички технически правила, които трябва да се спазят.

### 3.7. Очакван резултат
Какво трябва да работи след завършване на задачата.

### 3.8. Тестови сценарии
Формални проверки за правилно изпълнение.

## 4. Забранено съдържание
- Излишни детайли  
- Алтернативни варианти  
- Предположения  
- Непълен или примерен код  

## 5. Standards & Style Guide
- **Language:** English (for technical terms, headers, and code), Bulgarian (for descriptions/context if preferred by User).
- **Paths:** Always use **relative paths from project root** (e.g., `backend/src/models/Device.ts`).
- **Code Blocks:** ALWAYS specify the language (e.g., \`\`\`typescript).
- **Steps:** Numbered lists for sequential actions.
- **Formatting:** Standard Markdown.

## 6. Rules for "Add New Component" Tasks
Must include:
- Schema Definition
- Validator Definition
- Service Logic
- API Endpoints
- UI Components
- Integrations
- Tests
- Expected Output

## 7. Rules for "Analysis / Refactoring" Tasks
1. What is being analyzed
2. Identified Issues
3. Proposed Changes
4. Implementation Strategy
5. Risks
6. Verification Plan

## 8. Absolute Precision & Self-Containment
Documentation must be **unambiguous**, **algorithmically precise**, and **self-contained**.
*   **No "Go look at file X":** If a task requires implementing an interface, **include the interface signature** in the document.
*   **No Guesswork:** The AI should be able to complete the task using *only* this document and the specific files mentioned in the steps.
*   **Completeness over Brevity:** While fluff is banned, necessary technical context (signatures, critical constants, configuration keys) is MANDATORY.

## 9. Integration Mapping Verification (CRITICAL)
If the task involves communication between two systems (e.g., Firmware <-> Backend, Backend <-> Frontend), the documentation **MUST** include an **Explicit Mapping Table**.
*   **Format:** "System A Parameter [X] maps to System B Parameter [Y]".
*   **Purpose:** To prevent "silent failures" where keys or formats mismatch (e.g., `value` vs `val`, `mm` vs `cm`).
*   **Cross-Reference:** If a step relies on another procedure, provide a **Deep Link** to the specific section AND a summary of what is expected from that external step.

## 10. Template
```markdown
# [Document Name]

## 1. Goal
...

## 2. Scope
...

## 3. Definitions & Dependencies
...

## 4. Steps (Algorithm)
1.
2.
3.
...

## 5. File Structure
...

## 6. Validations & Constraints
...

## 7. Expected Outcome
...

## 8. Test Scenarios
...
```

## 11. Maintenance
Any architectural change MUST be reflected in the documentation immediately. This file is a "Live Mirror" of the codebase.
