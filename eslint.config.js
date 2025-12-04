import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import react from 'eslint-plugin-react'
import importPlugin from 'eslint-plugin-import'
import unicorn from 'eslint-plugin-unicorn'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    plugins: {
      react,
      import: importPlugin,
      unicorn,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // ===================================================================
      // CATEGORY 1: Functional Programming & Immutability
      // ===================================================================
      'prefer-const': 'error',
      'no-var': 'error',
      'no-param-reassign': ['error', { props: true }],
      'prefer-arrow-callback': 'error',
      'unicorn/no-for-loop': 'error',
      'unicorn/no-array-push-push': 'error',
      'unicorn/prefer-array-some': 'error',
      'unicorn/prefer-array-find': 'error',
      'unicorn/prefer-spread': 'error',

      // ===================================================================
      // CATEGORY 2: Complexity & Cognitive Load
      // ===================================================================
      'complexity': ['warn', { max: 15 }], // Start warn, tighten to 10 later
      'max-depth': ['error', { max: 3 }],
      'max-lines-per-function': ['warn', {
        max: 120,
        skipBlankLines: true,
        skipComments: true,
      }],
      'max-lines': ['warn', {
        max: 300,
        skipBlankLines: true,
        skipComments: true,
      }],
      'max-nested-callbacks': ['error', { max: 3 }],
      'no-else-return': ['error', { allowElseIf: false }],

      // ===================================================================
      // CATEGORY 3: Code Consistency & Patterns
      // ===================================================================
      'import/no-default-export': 'error',
      'import/order': ['error', {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'type',
        ],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      }],
      'import/no-duplicates': 'error',
      'import/newline-after-import': 'error',
      'arrow-body-style': ['error', 'as-needed'],
      // Prefer arrow functions for consistency (functional style)
      'func-style': ['error', 'expression'],
      '@typescript-eslint/naming-convention': ['error',
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'function',
          format: ['camelCase', 'PascalCase'],
        },
        {
          selector: 'typeLike',
          format: ['PascalCase'],
        },
      ],

      // ===================================================================
      // CATEGORY 4: TypeScript Strictness
      // ===================================================================
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': ['warn', { // Warn first
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
        allowHigherOrderFunctions: true,
      }],
      '@typescript-eslint/explicit-module-boundary-types': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-for-of': 'error',

      // ===================================================================
      // CATEGORY 5: React Best Practices
      // ===================================================================
      'react/no-array-index-key': 'error',
      'react/jsx-no-useless-fragment': 'error',
      'react/self-closing-comp': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // ===================================================================
      // CATEGORY 6: Code Smells & Maintenance
      // ===================================================================
      '@typescript-eslint/no-magic-numbers': ['warn', { // Warn first
        ignore: [-1, 0, 1, 2],
        ignoreEnums: true,
        ignoreNumericLiteralTypes: true,
        ignoreReadonlyClassProperties: true,
        ignoreArrayIndexes: true,
      }],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'curly': ['error', 'multi-line'],
      'no-nested-ternary': 'error',
      'eqeqeq': ['error', 'always'],
      'no-implicit-coercion': 'error',
    },
  },

  // ===================================================================
  // Test Files: Relaxed Rules
  // ===================================================================
  {
    files: ['**/__tests__/**/*.{ts,tsx}', '**/*.test.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: false, // Disable type-aware linting for tests
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-magic-numbers': 'off',
      'max-lines-per-function': 'off',
      'max-lines': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      'no-console': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/prefer-optional-chain': 'off',
    },
  },

  // ===================================================================
  // Config Files: Allow Default Exports
  // ===================================================================
  {
    files: ['*.config.{js,ts}', 'vite.config.ts', 'vitest.config.ts'],
    rules: {
      'import/no-default-export': 'off',
    },
  },
])
