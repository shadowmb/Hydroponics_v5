module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module'
  },
  rules: {
    // Basic rules for the root level
    'no-console': 'off',
    'no-unused-vars': 'warn'
  },
  overrides: [
    {
      // Frontend workspace
      files: ['frontend/**/*'],
      extends: ['./frontend/.eslintrc.js']
    },
    {
      // Backend workspace
      files: ['backend/**/*'],
      extends: ['./backend/.eslintrc.js']
    },
    {
      // Configuration and tooling files
      files: [
        '*.config.js',
        '*.config.ts',
        '.eslintrc.js',
        'quasar.config.js'
      ],
      env: {
        node: true
      },
      rules: {
        'no-magic-numbers': 'off',
        '@typescript-eslint/no-var-requires': 'off'
      }
    },
    {
      // Documentation and markdown files
      files: ['**/*.md'],
      parser: 'eslint-plugin-markdownlint/parser',
      extends: ['plugin:markdownlint/recommended'],
      rules: {
        'markdownlint/md013': 'off' // Line length
      }
    }
  ],
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    'coverage/',
    '.quasar/',
    'backend/flow-templates/',
    'frontend/map/',
    'Docs/',
    'ToDo/'
  ]
}