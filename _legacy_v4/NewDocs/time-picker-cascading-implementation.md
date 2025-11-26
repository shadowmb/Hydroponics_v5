# Time Picker with Cascading Validation - ActiveCyclesCard.vue

## Какво е реализирано
Inline редактиране на cycle startTime в активна програма с автоматична каскадна корекция на следващи цикли.

## Компоненти и файлове

### Frontend
- **ActiveCyclesCard.vue** (1500+ lines) - main implementation
- **activeProgram.ts** (store) - computed `minCycleInterval` getter
- **activeProgramService.ts** - `updateCycleStartTime()`, `updateMinCycleInterval()`

### Backend
- **ActiveProgram.ts** (model) - `minCycleInterval: { min: 60, max: 240, default: 120 }`
- **activeProgramRoutes.ts** - auto-rounding: `Math.ceil(minCycleInterval / 5) * 5`

## Архитектура на диалозите (4-step flow)

1. **showChangeTimeDialog** - Потвърждение за промяна
2. **showTimePickerDialog** - QSelect за час/минути (не q-time!)
3. **showConfirmDialog** - Финално потвърждение
4. **showCascadingDialog** - Ако има конфликти (optional)

## Key State Variables

```typescript
// Time picker state
const tempHour = ref<number | null>(null)
const tempMinute = ref<number | null>(null)
const savedHour = ref<number>(0)
const savedMinute = ref<number>(0)
const newSelectedTime = ref<string>('')

// Dialog state
const selectedCycleForTimeChange = ref<any>(null)
const timePickerCycleIndex = ref<number>(0)
const cascadingChanges = ref<Array<{cycleId: string, oldTime: string, newTime: string}>>([])
```

## Критични функции

### `getMinimumTimeForCycle(index: number): string`
Изчислява минимално позволено време за цикъл based на предишен цикъл + minCycleInterval.
- Връща формат "HH:MM"
- Използва се за филтриране на validHourOptions и validMinuteOptions

### `validHourOptions` computed
```typescript
if (timePickerCycleIndex.value === 0) return [0..23]
const minTime = getMinimumTimeForCycle(index)
const [minHourStr = '0'] = minTime.split(':')  // ⚠️ Default value важен!
```

### `validMinuteOptions` computed
Филтрира минути на базата на избрания час и минимално време.
- Стъпка: 5 минути (0, 5, 10, 15... 55)
- Ако час == minHour, показва само валидни минути >= minMinute

### `calculateCascadingChanges()`
**ВАЖНО:** Сортира циклите по startTime преди проверка!

```typescript
const sortedCycles = [...props.activeCycles].sort((a, b) => a.startTime.localeCompare(b.startTime))
const cycleToUpdate = updatedCycles[changedIndex]
if (!cycleToUpdate) return changes  // ⚠️ Null check!

// Check each subsequent cycle
for (let i = 1; i < updatedCycles.length; i++) {
  const currentCycle = updatedCycles[i]
  const previousCycle = updatedCycles[i - 1]
  if (!currentCycle || !previousCycle) continue  // ⚠️ Null checks!

  const [prevHours = 0, prevMinutes = 0] = previousCycle.startTime.split(':').map(Number)  // ⚠️ Defaults!
}
```

### `confirmCascading()`
Прилага главната промяна + всички cascading промени последователно с await.

## TypeScript Грешки - Как се фиксват

### Array destructuring
```typescript
// ❌ BAD
const [hours, minutes] = time.split(':').map(Number)

// ✅ GOOD
const [hours = 0, minutes = 0] = time.split(':').map(Number)
```

### Optional chaining в v-model
```typescript
// ❌ BAD - build error "optionalChainingAssign"
v-model="obj[key]?.[prop]"

// ✅ GOOD
v-model="obj[key][prop]"
```

### Null checks before spread
```typescript
// ❌ BAD
updatedCycles[index] = { ...updatedCycles[index], startTime: newTime }

// ✅ GOOD
const cycle = updatedCycles[index]
if (!cycle) return
updatedCycles[index] = { ...cycle, startTime: newTime }
```

## Важни детайли

- **5-minute rounding**: Backend закръглява minCycleInterval, frontend показва стъпки по 5 min
- **Сортиране**: ВИНАГИ сортирай циклите преди cascading логика
- **Index tracking**: След сортиране трябва да намериш отново индекса на променения цикъл
- **Dialog flow**: Затваряш един диалог преди да отвориш следващия
- **Error handling**: Catch errors в confirmCascading и показваш notification

## BuildErrors

Ако има грешка `optionalChainingAssign` → търси `?.` в `v-model` директиви.

## Testing checklist
1. Промяна на първи цикъл (няма cascading)
2. Промяна на среден цикъл със/без конфликт
3. Промяна на последен цикъл
4. Cancel на всяка стъпка от flow-a
5. Проверка че validMinuteOptions се филтрира правилно при час == minHour
