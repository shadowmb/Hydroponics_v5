# Templates Directory

This directory contains code templates that follow the established patterns and conventions of the Hydroponics v4 project.

## Available Templates

### Frontend Templates

#### `vue-component.template.vue`
Complete Vue 3 component template with:
- Composition API with TypeScript
- Proper props/emits definitions
- Standard component structure
- Error handling patterns
- Loading states
- Quasar UI integration

**Usage:**
1. Copy the template
2. Rename to your component name (PascalCase)
3. Replace placeholder content
4. Update imports and interfaces

#### `pinia-store.template.ts`
Comprehensive Pinia store template with:
- Complete CRUD operations
- Pagination support
- Search functionality
- Error handling
- Loading states
- Computed properties
- Type safety

**Usage:**
1. Copy and rename to your store name (camelCase)
2. Replace `Example` with your entity name
3. Update service imports
4. Customize state and actions

#### `typescript-service.template.ts`
Frontend service template with:
- Static method pattern
- Consistent error handling
- Type-safe API calls
- Input validation
- Complete CRUD operations

**Usage:**
1. Copy and rename to your service name
2. Replace `Example` with your entity name
3. Update API endpoints
4. Define your interfaces

### Backend Templates

#### `mongoose-model.template.ts`
Complete Mongoose model template with:
- Interface and schema synchronization
- Proper validation rules
- Indexes for performance
- Virtual properties
- Pre/post middleware
- Static and instance methods
- Type safety

**Usage:**
1. Copy and rename to your model name
2. Replace `Example` with your entity name
3. Define your schema fields
4. Update validation rules

#### `express-route.template.ts`
Express router template with:
- Complete CRUD endpoints
- Input validation
- Error handling
- Pagination support
- Search functionality
- Proper HTTP status codes
- Consistent response format

**Usage:**
1. Copy and rename to your route name
2. Replace `Example` with your entity name
3. Update service imports
4. Customize endpoints

## Template Usage Guidelines

### Naming Conventions
- **Vue Components**: PascalCase (e.g., `UserProfileCard.vue`)
- **Services**: camelCase (e.g., `userProfileService.ts`)
- **Stores**: camelCase (e.g., `userProfile.ts`)
- **Models**: PascalCase (e.g., `UserProfile.ts`)
- **Routes**: camelCase (e.g., `userProfileRoutes.ts`)

### Customization Steps

1. **Copy Template**: Copy the appropriate template file
2. **Rename File**: Follow naming conventions
3. **Replace Placeholders**: 
   - Replace `Example` with your entity name
   - Replace `example` with your entity name (lowercase)
   - Update interfaces and types
4. **Update Imports**: Adjust import paths as needed
5. **Customize Logic**: Add your specific business logic
6. **Test**: Ensure the code follows project standards

### Integration Checklist

- [ ] File named according to conventions
- [ ] Interfaces use I-prefix (backend)
- [ ] Imports organized correctly
- [ ] Error handling in place
- [ ] TypeScript types defined
- [ ] ESLint rules followed
- [ ] Consistent with existing patterns

## Examples

### Creating a New Vue Component

```bash
# Copy template
cp templates/vue-component.template.vue src/components/users/UserProfileCard.vue

# Edit the file and replace:
# - Template content with your UI
# - Interfaces with your props/emits
# - Methods with your logic
```

### Creating a New Backend Model

```bash
# Copy template
cp templates/mongoose-model.template.ts backend/src/models/UserProfile.ts

# Edit the file and replace:
# - IExample with IUserProfile
# - Example with UserProfile
# - Schema fields with your data structure
```

### Creating a New Service

```bash
# Frontend service
cp templates/typescript-service.template.ts frontend/src/services/userProfileService.ts

# Backend service (create manually based on patterns)
# Follow the ActiveProgramService.ts pattern
```

## Best Practices

1. **Always start with templates** instead of creating from scratch
2. **Follow existing patterns** in the codebase
3. **Maintain interface/schema synchronization** for backend models
4. **Use proper error handling** as shown in templates
5. **Keep imports organized** according to the style guide
6. **Add proper TypeScript types** for all functions and variables
7. **Include JSDoc comments** for complex functions
8. **Test your implementation** before committing

## Template Maintenance

Templates should be updated when:
- New patterns are established in the codebase
- ESLint/TypeScript rules change
- New framework features are adopted
- Better practices are discovered

Always keep templates in sync with the actual codebase patterns.