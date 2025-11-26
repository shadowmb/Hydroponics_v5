# Targeted Validation Implementation TODO

## Current Problem
- Global validation triggers for ALL blocks on any change
- FlowEditor.vue watch([blocks, connections]) validates everything
- Performance issue + wrong behavior (new blocks show connection errors)

## Solution: Targeted Validation
Validate only affected blocks per action type

## Files to Modify

### 1. FlowEditor.vue (Lines 383-400)
**REMOVE global watch:**
```javascript
// DELETE THIS:
watch([blocks, connections], ([newBlocks, newConnections]) => {
  if (newBlocks.length > 0 || newConnections.length > 0) {
    performDebouncedValidation();
  }
}, { deep: false });
```

**ADD targeted validation method:**
```javascript
function validateSpecificBlocks(blockIds: string[]) {
  // Validate only specified block IDs
  // Update validationResults map only for these blocks
}
```

### 2. useBlockEditor.ts (Lines 200-290)
**MODIFY addConnection() ~line 200:**
- After successful connection add
- Call: `emit('validateBlocks', [sourceBlockId, targetBlockId])`

**MODIFY removeConnection() ~line 258:**
- After successful connection removal
- Call: `emit('validateBlocks', [sourceBlockId, targetBlockId])`

**MODIFY updateBlockParameters() ~line 176:**
- After parameter update
- Call: `emit('validateBlocks', [blockId])`

### 3. FlowEditor.vue Event Handlers ✅ COMPLETED
**ADDED event listeners:**
- ✅ Listen for 'validateBlocks' events from useBlockEditor
- ✅ Call validateSpecificBlocks() with provided block IDs

### 4. New Block Behavior
**MODIFY handleBlockAdded():**
- Don't trigger validation for new blocks
- Set initial status to neutral/pending

## Implementation Order
1. ✅ Add validateSpecificBlocks() method to FlowEditor
2. ✅ Remove global watch in FlowEditor
3. ✅ Add emit calls in useBlockEditor methods
4. ✅ Add event listeners in FlowEditor
5. Test connection validation
6. Test parameter validation
7. Test new block behavior

## Test Cases
- Connect two blocks → only those 2 blocks validate
- Change parameters → only that block validates
- Add new block → no validation, neutral status
- Remove connection → only affected blocks validate

## Key Files
- `/mnt/d/Hydroponics/Hydroponics v4/frontend/src/modules/flowEditorV2/FlowEditor.vue`
- `/mnt/d/Hydroponics/Hydroponics v4/frontend/src/modules/flowEditorV2/composables/useBlockEditor.ts`