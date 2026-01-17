# Implementation Plan - Task 22: Optimize Noise Filtering

## 1. Backend Updates (Templates)
- **File:** `backend/config/devices/water/sensors/dfrobot_a02yyuw.json`
- **Change:**
  ```json
  "sampling": {
      "count": 5,   // Increase from 3 to 5 for better outlier rejection
      "delayMs": 50 // Keep 50ms
  }
  ```

## 2. Frontend Updates (UI)
- **File:** `frontend/src/components/devices/test/DeviceValidationSettings.tsx`
- **Changes:**
  - Add Quick Action buttons inside the "Noise Filtering" section.
  - Logic to handle "Disable" (1/0) and "Restore" (defaults).
  - Add simple badge/text indicating strict "Raw" vs "Filtered".

### UI Mockup Idea
```tsx
<div className="flex items-center justify-between">
   <Label>Noise Filtering</Label>
   {isFiltered ? <Badge>Active</Badge> : <Badge variant="outline">Raw</Badge>}
</div>
<div className="buttons">
   <Button variant="ghost" onClick={disable}>Disable (Raw)</Button>
   <Button variant="ghost" onClick={restore}>Restore Defaults</Button>
</div>
```

## 3. Verification Steps
1. Open "Device Test" for an Ultrasonic Sensor.
2. Observe "Sample Count" is 5.
3. Click "Disable Filtering".
   - Expect: Count = 1, Delay = 0.
4. Click "Restore Recommended".
   - Expect: Count = 5, Delay = 50.
5. Save.
