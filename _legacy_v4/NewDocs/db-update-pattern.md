# DB Update Pattern - Dot Notation

## Проблем
Когато обновяваме вложени полета в Mongoose subdocuments с spread operator, губим останалите полета:

```typescript
// ❌ ГРЕШНО - замества целия udp обект
const udpUpdates = {
  udp: {
    ...currentConfig.udp,  // Mongoose subdocument не се spread-ва правилно
    enabled: false
  }
}
await HealthConfig.updateSingleton(udpUpdates, 'api-user')
```

## Решение
Използвай MongoDB dot notation с `$set`:

```typescript
// ✅ ПРАВИЛНО - променя само конкретното поле
const config = await HealthConfig.getSingleton()
await HealthConfig.findByIdAndUpdate(config._id, {
  $set: {
    'udp.enabled': false,
    lastUpdated: new Date(),
    updatedBy: 'api-user'
  }
}, { new: true })
```

## Кога да използваш

**Използвай винаги когато:**
- Променяш конкретно поле във вложен обект
- Работиш с Mongoose subdocuments
- Искаш да запазиш останалите полета непроменени

**Pattern за всички модели:**
```typescript
const doc = await Model.findById(id)
await Model.findByIdAndUpdate(doc._id, {
  $set: {
    'nested.field': value,
    'another.nested.field': value2
  }
})
```

## Къде да приложиш
Търси в кода за:
- `Object.assign()` с nested objects
- `...spread` на Mongoose subdocuments
- `updateSingleton()` с partial updates

Замени с dot notation pattern.

## Примери от проекта
- `deviceRoutes.ts:177` - discovery mode update
- `deviceRoutes.ts:224` - broadcast address update
