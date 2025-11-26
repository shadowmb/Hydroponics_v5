module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    project: './tsconfig.json'
  },
  env: {
    node: true,
    es2021: true,
    mongo: true
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking',
    'prettier'
  ],
  plugins: [
    '@typescript-eslint',
    'import'
  ],
  rules: {
    // TypeScript specific rules
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/prefer-readonly': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'error',
    '@typescript-eslint/strict-boolean-expressions': 'off',
    '@typescript-eslint/prefer-nullish-coalescing': 'warn',
    '@typescript-eslint/prefer-optional-chain': 'warn',

    // Import organization rules
    'import/order': [
      'warn',
      {
        'groups': [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index'
        ],
        'newlines-between': 'always',
        'alphabetize': {
          'order': 'asc',
          'caseInsensitive': true
        }
      }
    ],
    'import/newline-after-import': 'warn',
    'import/no-duplicates': 'error',

    // Node.js/Express specific rules
    'no-console': 'off', // Allow console for server logging
    'no-process-exit': 'error',
    'no-process-env': 'off', // Allow process.env for configuration

    // Async/await and Promise rules
    'require-await': 'error',
    'no-return-await': 'off', // Conflicts with @typescript-eslint/return-await
    '@typescript-eslint/return-await': 'error',
    '@typescript-eslint/promise-function-async': 'error',

    // Mongoose specific rules
    'no-new': 'off', // Allow 'new' for Mongoose models
    'prefer-const': 'error',
    'no-var': 'error',

    // Error handling rules
    'no-throw-literal': 'error',
    '@typescript-eslint/no-throw-literal': 'error',

    // Code quality rules
    'no-duplicate-imports': 'off', // Handled by import/no-duplicates
    'no-empty-function': 'off',
    '@typescript-eslint/no-empty-function': ['error', { 
      'allow': ['arrowFunctions', 'methods'] 
    }],
    'no-magic-numbers': 'off', // Too strict for API development
    'complexity': ['warn', 10],
    'max-lines-per-function': ['warn', 50],

    // Naming conventions
    '@typescript-eslint/naming-convention': [
      'error',
      {
        'selector': 'interface',
        'format': ['PascalCase'],
        'prefix': ['I']
      },
      {
        'selector': 'typeAlias',
        'format': ['PascalCase']
      },
      {
        'selector': 'class',
        'format': ['PascalCase']
      },
      {
        'selector': 'method',
        'format': ['camelCase']
      },
      {
        'selector': 'function',
        'format': ['camelCase']
      },
      {
        'selector': 'variable',
        'format': ['camelCase', 'UPPER_CASE'],
        'leadingUnderscore': 'allow'
      }
    ],

    // Style rules (handled by Prettier, but some logical ones)
    'quotes': ['warn', 'single', { 'avoidEscape': true }],
    'prefer-template': 'warn',
    'object-shorthand': 'warn',

    // Security rules
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',

    // Disable rules that conflict with Prettier
    '@typescript-eslint/indent': 'off',
    'max-len': 'off',
    'object-curly-spacing': 'off',
    'space-before-function-paren': 'off'
  },
  overrides: [
    {
      // Test files
      files: ['**/*.test.ts', '**/*.spec.ts'],
      env: {
        jest: true
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'no-magic-numbers': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off'
      }
    },
    {
      // Configuration files
      files: ['*.config.js', '*.config.ts'],
      rules: {
        'no-magic-numbers': 'off',
        '@typescript-eslint/no-var-requires': 'off'
      }
    }
  ],
  ignorePatterns: [
    'dist/',
    'node_modules/',
    '*.js',
    'coverage/',
    'flow-templates/'
  ]
}