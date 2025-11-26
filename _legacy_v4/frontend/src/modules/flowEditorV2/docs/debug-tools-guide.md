# Debug Tools Guide - FlowEditorV2

Този документ описва как да използвате debug инструментите за troubleshooting на координатни проблеми в flowEditorV2.

## 🛠️ Активиране на Debug Mode

1. Отидете в FlowEditor страницата
2. Добавете `?debug=true` към URL-то или активирайте showDebug prop
3. В toolbar-а ще се появят допълнителни debug бутони (лилава секция)

## 🎯 Debug Tools Overview

### 1. **Magnetic Zones Overlay** 👁️
- **Бутон:** Eye icon (visibility/visibility_off)
- **Функция:** Показва визуални overlay-и за magnetic zones на портовете
- **Употреба:** 
  - Включете за да видите точно къде са magnetic zones
  - Зелени кръгове = Input ports
  - Оранжеви кръгове = Output ports
  - Размерът на кръга показва magnetic radius

### 2. **Position Tests** 🐛
- **Бутон:** Bug report icon
- **Функция:** Изпълнява comprehensive position validation tests
- **Изход:** Console table с резултати от тестовете
- **Тества:**
  - Coordinate alignment at different zoom levels (25%-200%)
  - Magnetic zone accuracy
  - DOM vs calculated position discrepancies

### 3. **Log Current Positions** 📊
- **Бутон:** Analytics icon
- **Функция:** Записва current state в console
- **Показва:**
  - Canvas zoom/pan state
  - All block positions
  - Active magnetic ports
  - Active drop zones

## 🔍 Troubleshooting Workflow

### Проблем: Connections не се закачат за портовете
```
1. Включете Magnetic Zones Overlay
2. Опитайте да създадете connection
3. Проверете дали magnetic zones са подравнени с визуалните портове
4. Използвайте "Log Current Positions" за да видите координатите
5. Изпълнете Position Tests за comprehensive анализ
```

### Проблем: Connections се "откачат" при zoom
```
1. Започнете на 100% zoom
2. Включете Magnetic Zones Overlay
3. Променете zoom на 50%, 150%, 200%
4. Проверете дали magnetic zones остават подравнени
5. Изпълнете Position Tests за да измерите точността
```

### Проблем: Negative coordinates в console
```
1. Отворете browser DevTools
2. Drag port за да trigger event
3. Потърсете "Position comparison" logs в console
4. Проверете дали има negative values
5. Анализирайте Canvas Rect vs Screen Port Center
```

## 📋 Console Output Reference

### Position Comparison Log Format:
```javascript
🎯 Position comparison: {
  calculated: { x: 90, y: 90 },        // StablePortPositioning result
  domRect: DOMRect { ... },             // Actual DOM element position
  cssTransformed: { x: 90, y: 90 },    // Screen→Canvas transformation result
  blockCSSPosition: { x: 100, y: 100 }, // Block position
  zoomLevel: 1.5,                       // Current zoom
  offset: { x: 0, y: 0 },              // Difference between calculated and actual
  alignment: { 
    xAligned: true,                     // X coordinates match (±5px)
    yAligned: true                      // Y coordinates match (±5px)
  }
}
```

### Test Results Table:
```
Test                               | Total | Passed | Failed | SuccessRate
Zoom Level Coordinate Alignment    |   20  |   20   |   0    |   100.0%
Magnetic Zone Accuracy Test        |   16  |   15   |   1    |   93.8%
```

## 🎯 Expected Results (After Fix)

### ✅ Magnetic Zones Overlay:
- Green/Orange circles perfectly overlap with visual port dots
- Circles follow blocks during zoom/pan operations
- No offset between visual ports and magnetic zones

### ✅ Position Tests:
- 100% success rate for zoom level tests
- 95%+ success rate for magnetic zone tests
- Average offset < 2px, Maximum offset < 5px

### ✅ Console Logs:
- alignment.xAligned: true, alignment.yAligned: true
- offset.x: ≈0, offset.y: ≈0
- No negative coordinates in calculated positions

## 🚨 Known Issues to Watch For

### Red Flags:
- ❌ `offset: { x: -10, y: -4 }` → CSS positioning mismatch
- ❌ `alignment: { xAligned: false, yAligned: false }` → Coordinate calculation error
- ❌ Negative coordinates in canvas calculations
- ❌ Magnetic zones appear shifted from visual ports

### Quick Fixes:
1. **Double transformation:** Check if canvas coordinates are being transformed twice
2. **CSS mismatch:** Verify StablePortPositioning uses same offset as CSS (-10px)
3. **Zoom scaling:** Ensure all coordinates use consistent zoom factor
4. **Canvas rect:** Verify getBoundingClientRect returns correct canvas bounds

## 📞 Testing Scenarios

### Test Case 1: Basic Alignment
1. Add block at (100, 100)
2. Enable magnetic zones overlay
3. Visual ports should perfectly align with overlay circles

### Test Case 2: Zoom Consistency  
1. Create connection at 100% zoom
2. Change zoom to 150%
3. Connection should remain attached to ports
4. Magnetic zones should stay aligned

### Test Case 3: Pan Operation
1. Create blocks and connections
2. Pan canvas extensively
3. All connections should remain stable
4. Magnetic zones should move with blocks

---

🧠 **Summary:** Use debug tools proactively when developing connection features or fixing coordinate bugs. The visual overlay provides immediate feedback, while position tests give quantitative validation of coordinate accuracy.