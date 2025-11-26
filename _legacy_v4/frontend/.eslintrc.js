module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    parser: '@typescript-eslint/parser'
  },
  env: {
    browser: true,
    es2021: true,
    node: true,
    'vue/setup-compiler-macros': true
  },
  extends: [
    'eslint:recommended',
    '@vue/typescript/recommended',
    'plugin:vue/vue3-essential',
    'plugin:vue/vue3-recommended',
    'prettier'
  ],
  plugins: [
    'vue',
    '@typescript-eslint',
    'import'
  ],
  globals: {
    ga: 'readonly',
    cordova: 'readonly',
    __statics: 'readonly',
    __QUASAR_SSR__: 'readonly',
    __QUASAR_SSR_SERVER__: 'readonly',
    __QUASAR_SSR_CLIENT__: 'readonly',
    __QUASAR_SSR_PWA__: 'readonly',
    process: 'readonly',
    Capacitor: 'readonly',
    chrome: 'readonly'
  },
  rules: {
    'prefer-promise-reject-errors': 'off',
    'no-unused-vars': 'off',
    // Enhanced diagnostic rules - Phase 1
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    // Vue-specific diagnostic rules
    'vue/multi-word-component-names': 'off',
    'vue/no-reserved-component-names': 'off',
    'vue/require-prop-types': 'error',
    'vue/no-unused-refs': 'error',
    'vue/require-explicit-emits': 'error',
    'vue/no-unused-components': 'error',
    'vue/no-unused-vars': 'error',
    // Code quality rules
    quotes: ['warn', 'single', { avoidEscape: true }],
    '@typescript-eslint/indent': 'off',
    'generator-star-spacing': 'off',
    'arrow-parens': 'off',
    'one-var': 'off',
    'no-void': 'off',
    'multiline-ternary': 'off',
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
        'pathGroups': [
          {
            'pattern': 'vue',
            'group': 'external',
            'position': 'before'
          },
          {
            'pattern': 'quasar',
            'group': 'external',
            'position': 'before'
          },
          {
            'pattern': 'src/**',
            'group': 'internal'
          },
          {
            'pattern': 'components/**',
            'group': 'internal'
          }
        ],
        'pathGroupsExcludedImportTypes': ['builtin'],
        'alphabetize': {
          'order': 'asc',
          'caseInsensitive': true
        }
      }
    ],
    'import/newline-after-import': 'warn',
    'import/no-duplicates': 'error',
    'import/first': 'warn',
    'import/extensions': 'off',
    'import/no-unresolved': 'off',
    'import/no-extraneous-dependencies': 'off',

    // Enhanced TypeScript rules
    '@typescript-eslint/prefer-optional-chain': 'warn',
    '@typescript-eslint/prefer-nullish-coalescing': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'error',

    // Enhanced Vue rules
    'vue/component-name-in-template-casing': ['warn', 'PascalCase'],
    'vue/prop-name-casing': ['error', 'camelCase'],
    'vue/attribute-hyphenation': ['error', 'always'],
    'vue/v-on-event-hyphenation': ['error', 'always'],

    // Code quality improvements
    'prefer-const': 'error',
    'no-var': 'error',
    'prefer-template': 'warn',
    'object-shorthand': 'warn'
  }
}