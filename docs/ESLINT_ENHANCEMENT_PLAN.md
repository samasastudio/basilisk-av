# ESLint Enhancement Plan: Code Quality & Functional Programming

**Status:** 📋 Proposal for Review
**Estimated Impact:** ~2,330 lines of code, 24 TypeScript files
**Philosophy:** Enforce functional programming, reduce complexity, improve DX

---

## Executive Summary

This plan proposes **40+ new ESLint rules** across 6 categories to enforce:
- ✅ **Functional programming** (immutability, pure functions)
- ✅ **Low cognitive complexity** (no deep nesting, small functions)
- ✅ **Consistent patterns** (naming, imports, exports)
- ✅ **Type safety** (already enforced, expand further)
- ✅ **React best practices** (hooks, components)
- ✅ **Maintainability** (no code smells, clear intent)

**Current State Analysis:**
- ✅ Already using `const` heavily (only 14 `let` statements)
- ✅ Zero array mutations found (`.push`, `.splice`, etc.)
- ⚠️  9 default exports (should standardize)
- ⚠️  Mix of function styles (should standardize)
- ⚠️  Some deeply nested code in components

---

## Category 1: Functional Programming & Immutability

### 1.1 Prefer `const` Over `let`
```javascript
'prefer-const': 'error'
```

**Rationale:** Immutability by default. Signals intent - this value won't change.

**Example:**
```typescript
// ❌ BAD
let count = 0;
count = count + 1;

// ✅ GOOD
const count = 0;
const nextCount = count + 1;
```

**Impact:** ~14 violations (estimated)

---

### 1.2 No Parameter Reassignment
```javascript
'no-param-reassign': ['error', { props: true }]
```

**Rationale:** Functions shouldn't mutate inputs. Prevents bugs and makes code predictable.

**Example:**
```typescript
// ❌ BAD
function addItem(arr: string[], item: string) {
  arr.push(item); // Mutates parameter!
  return arr;
}

// ✅ GOOD
function addItem(arr: string[], item: string): string[] {
  return [...arr, item]; // Returns new array
}
```

**Impact:** Unknown (need to audit)

---

### 1.3 Require Functional Array Methods
```javascript
'@typescript-eslint/prefer-for-of': 'error',
'unicorn/no-for-loop': 'error',  // Requires eslint-plugin-unicorn
'unicorn/prefer-array-some': 'error',
'unicorn/prefer-array-find': 'error'
```

**Rationale:** `map`, `filter`, `reduce` are clearer than loops. No mutations, better intent.

**Example:**
```typescript
// ❌ BAD
const doubled = [];
for (let i = 0; i < items.length; i++) {
  doubled.push(items[i] * 2);
}

// ✅ GOOD
const doubled = items.map(item => item * 2);
```

---

### 1.4 No Array Mutations
```javascript
'unicorn/no-array-push-push': 'error',
'unicorn/prefer-spread': 'error'
```

**Rationale:** Prefer spreading over `.push()`. Immutable by default.

**Example:**
```typescript
// ❌ BAD
arr.push(item1);
arr.push(item2);

// ✅ GOOD
const newArr = [...arr, item1, item2];
```

**Impact:** 0 current violations (already clean!)

---

## Category 2: Complexity & Cognitive Load

### 2.1 Maximum Complexity
```javascript
'complexity': ['error', { max: 10 }]
```

**Rationale:** Functions with >10 decision points are hard to test and understand.

**Example:**
```typescript
// ❌ BAD - Complexity 15
function processUser(user: User) {
  if (user.isActive) {
    if (user.hasPermission) {
      if (user.verified) {
        if (user.age > 18) {
          // ... 6 more nested conditions
        }
      }
    }
  }
}

// ✅ GOOD - Extract, early returns
function processUser(user: User) {
  if (!canProcess(user)) return;
  // Simple linear logic
}

function canProcess(user: User): boolean {
  return user.isActive
    && user.hasPermission
    && user.verified
    && user.age > 18;
}
```

**Threshold:** Start at 15, tighten to 10 over time

---

### 2.2 Maximum Nesting Depth
```javascript
'max-depth': ['error', { max: 3 }]
```

**Rationale:** Deep nesting = cognitive overload. Use early returns, extraction.

**Example:**
```typescript
// ❌ BAD - Depth 5
if (a) {
  if (b) {
    if (c) {
      if (d) {
        if (e) {
          // What context am I in?!
        }
      }
    }
  }
}

// ✅ GOOD - Early returns, flat structure
if (!a) return;
if (!b) return;
if (!c) return;
if (!d) return;
if (!e) return;
// Clear, linear flow
```

**Threshold:** 3 levels max

---

### 2.3 Maximum Function Length
```javascript
'max-lines-per-function': ['warn', {
  max: 50,
  skipBlankLines: true,
  skipComments: true
}]
```

**Rationale:** Long functions do too much. Extract helpers.

**Threshold:** 50 lines (warning, not error - some components legitimately long)

---

### 2.4 Maximum File Length
```javascript
'max-lines': ['warn', {
  max: 300,
  skipBlankLines: true,
  skipComments: true
}]
```

**Rationale:** Giant files are hard to navigate. Split into modules.

**Threshold:** 300 lines per file

---

### 2.5 No Else After Return
```javascript
'no-else-return': ['error', { allowElseIf: false }]
```

**Rationale:** `else` after `return` is redundant. Reduces nesting.

**Example:**
```typescript
// ❌ BAD
function getStatus(active: boolean) {
  if (active) {
    return 'active';
  } else {
    return 'inactive'; // Unnecessary else
  }
}

// ✅ GOOD
function getStatus(active: boolean) {
  if (active) return 'active';
  return 'inactive'; // Clearer
}
```

---

## Category 3: Code Consistency & Patterns

### 3.1 Prefer Named Exports
```javascript
'import/no-default-export': 'error',  // Requires eslint-plugin-import
'import/prefer-default-export': 'off'
```

**Rationale:** Named exports = better refactoring, autocomplete, tree-shaking.

**Example:**
```typescript
// ❌ BAD
export default function Button() { }

// Import is arbitrary:
import Btn from './Button';
import MyButton from './Button';

// ✅ GOOD
export function Button() { }

// Import is consistent:
import { Button } from './Button';
```

**Impact:** ~9 violations (App.tsx, components, utils)
**Migration:** Can auto-fix with codemod

---

### 3.2 Ordered Imports
```javascript
'import/order': ['error', {
  groups: [
    'builtin',  // node built-ins
    'external', // npm packages
    'internal', // @/ aliases
    'parent',   // ../
    'sibling',  // ./
    'type'      // import type
  ],
  'newlines-between': 'always',
  alphabetize: { order: 'asc' }
}]
```

**Rationale:** Consistent import order = easier to scan files.

**Example:**
```typescript
// ✅ GOOD
import { useState } from 'react';
import { initStrudel } from '@strudel/web';

import { Button } from '@/components/ui/Button';

import { useStrudelEngine } from '../hooks/useStrudelEngine';
import type { StrudelRepl } from '../types/hydra';
```

---

### 3.3 Arrow Functions for Callbacks
```javascript
'prefer-arrow-callback': 'error'
```

**Rationale:** Arrow functions = lexical `this`, more concise.

**Example:**
```typescript
// ❌ BAD
array.map(function(item) { return item * 2; })

// ✅ GOOD
array.map(item => item * 2)
```

---

### 3.4 Consistent Function Style
```javascript
'func-style': ['error', 'declaration', {
  allowArrowFunctions: true
}]
```

**Rationale:** Top-level exports = `function`, inline = arrows.

**Example:**
```typescript
// ✅ GOOD - Exported function
export function MyComponent() {
  // ✅ GOOD - Inline arrow
  const handleClick = () => { };

  return <button onClick={handleClick} />;
}
```

---

### 3.5 Naming Conventions
```javascript
'@typescript-eslint/naming-convention': ['error',
  {
    selector: 'variable',
    format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
    leadingUnderscore: 'allow'
  },
  {
    selector: 'function',
    format: ['camelCase', 'PascalCase']
  },
  {
    selector: 'typeLike',
    format: ['PascalCase']
  }
]
```

**Rationale:** Consistent naming improves readability.

---

## Category 4: TypeScript Strictness (Expand Current)

### 4.1 Explicit Function Return Types
```javascript
'@typescript-eslint/explicit-function-return-type': ['error', {
  allowExpressions: true,
  allowTypedFunctionExpressions: true
}]
```

**Rationale:** Return types document intent, catch errors early.

**Example:**
```typescript
// ❌ BAD
export function getUser(id: string) {
  return database.find(id); // What does this return?
}

// ✅ GOOD
export function getUser(id: string): User | null {
  return database.find(id); // Clear contract
}
```

**Impact:** Medium (many functions lack return types)

---

### 4.2 No Non-Null Assertions
```javascript
'@typescript-eslint/no-non-null-assertion': 'error'
```

**Rationale:** `!` bypasses type safety. Use proper null checks.

**Example:**
```typescript
// ❌ BAD
const value = user!.name; // What if user is null?

// ✅ GOOD
const value = user?.name ?? 'Unknown';
```

---

### 4.3 Prefer Optional Chaining
```javascript
'@typescript-eslint/prefer-optional-chain': 'error'
```

**Rationale:** `?.` is clearer than nested conditionals.

**Example:**
```typescript
// ❌ BAD
const fft = window.a && window.a.fft && window.a.fft[0];

// ✅ GOOD
const fft = window.a?.fft?.[0];
```

---

### 4.4 Prefer Nullish Coalescing
```javascript
'@typescript-eslint/prefer-nullish-coalescing': 'error'
```

**Rationale:** `??` only catches `null`/`undefined`, not `0`, `''`, `false`.

**Example:**
```typescript
// ❌ BAD
const value = count || 10; // count=0 returns 10! Bug!

// ✅ GOOD
const value = count ?? 10; // count=0 returns 0
```

---

### 4.5 No Unused Variables
```javascript
'@typescript-eslint/no-unused-vars': ['error', {
  argsIgnorePattern: '^_',
  varsIgnorePattern: '^_'
}]
```

**Rationale:** Dead code clutters. Prefix `_` for intentionally unused.

---

## Category 5: React Best Practices

### 5.1 No Array Index as Key
```javascript
'react/no-array-index-key': 'error'  // Requires eslint-plugin-react
```

**Rationale:** Index keys break reconciliation on reorder.

**Example:**
```typescript
// ❌ BAD
items.map((item, i) => <Item key={i} {...item} />)

// ✅ GOOD
items.map(item => <Item key={item.id} {...item} />)
```

---

### 5.2 Hooks Rules (Already Enforced, Verify)
```javascript
'react-hooks/rules-of-hooks': 'error',
'react-hooks/exhaustive-deps': 'warn'
```

**Current:** Already have these via `eslint-plugin-react-hooks`

---

### 5.3 No Unused State Setters
```javascript
'@typescript-eslint/no-unused-vars': 'error' // Catches unused setState
```

**Example:**
```typescript
// ❌ BAD
const [value, setValue] = useState(0); // setValue never used

// ✅ GOOD
const [value] = useState(0); // Only destructure what you need
```

---

## Category 6: Code Smells & Maintenance

### 6.1 No Magic Numbers
```javascript
'@typescript-eslint/no-magic-numbers': ['error', {
  ignore: [-1, 0, 1, 2],
  ignoreEnums: true,
  ignoreNumericLiteralTypes: true,
  ignoreReadonlyClassProperties: true
}]
```

**Rationale:** Named constants document intent.

**Example:**
```typescript
// ❌ BAD
if (user.age > 18) { }
setTimeout(callback, 300);

// ✅ GOOD
const MINIMUM_AGE = 18;
const DEBOUNCE_MS = 300;

if (user.age > MINIMUM_AGE) { }
setTimeout(callback, DEBOUNCE_MS);
```

---

### 6.2 No Console in Production
```javascript
'no-console': ['error', { allow: ['warn', 'error'] }]
```

**Rationale:** `console.log` left in = debugging artifact. Use proper logging.

**Example:**
```typescript
// ❌ BAD
console.log('User data:', user); // Forgot to remove

// ✅ GOOD
console.error('Failed to load user:', error); // Intentional
```

---

### 6.3 Require Curly Braces
```javascript
'curly': ['error', 'all']
```

**Rationale:** Prevent subtle bugs from missing braces.

**Example:**
```typescript
// ❌ BAD
if (active) return true;

// ✅ GOOD
if (active) {
  return true;
}
```

---

### 6.4 No Nested Ternaries
```javascript
'no-nested-ternary': 'error'
```

**Rationale:** Nested ternaries are unreadable. Use if/else or extract.

**Example:**
```typescript
// ❌ BAD
const status = active ? verified ? 'active' : 'pending' : 'inactive';

// ✅ GOOD
const getStatus = () => {
  if (!active) return 'inactive';
  if (verified) return 'active';
  return 'pending';
};
```

---

### 6.5 No Duplicate Imports
```javascript
'import/no-duplicates': 'error'
```

**Rationale:** Combine imports from same module.

**Example:**
```typescript
// ❌ BAD
import { useState } from 'react';
import { useEffect } from 'react';

// ✅ GOOD
import { useState, useEffect } from 'react';
```

---

## Required Plugins

```bash
npm install -D \
  eslint-plugin-import \
  eslint-plugin-react \
  eslint-plugin-unicorn
```

**Why each:**
- `eslint-plugin-import`: Import/export validation, ordering
- `eslint-plugin-react`: React-specific rules beyond hooks
- `eslint-plugin-unicorn`: Modern JS/TS patterns, functional style

---

## Proposed Configuration Structure

```javascript
// eslint.config.js
export default defineConfig([
  // ... existing config
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      import: importPlugin,
      react: reactPlugin,
      unicorn: unicornPlugin
    },
    rules: {
      // === CATEGORY 1: Functional Programming ===
      'prefer-const': 'error',
      'no-param-reassign': ['error', { props: true }],
      'unicorn/no-for-loop': 'error',
      'unicorn/prefer-array-some': 'error',
      'unicorn/prefer-spread': 'error',

      // === CATEGORY 2: Complexity ===
      'complexity': ['error', { max: 15 }], // Start loose, tighten later
      'max-depth': ['error', { max: 3 }],
      'max-lines-per-function': ['warn', { max: 50 }],
      'max-lines': ['warn', { max: 300 }],
      'no-else-return': ['error', { allowElseIf: false }],

      // === CATEGORY 3: Consistency ===
      'import/no-default-export': 'error',
      'import/order': ['error', { /* ... */ }],
      'prefer-arrow-callback': 'error',
      '@typescript-eslint/naming-convention': ['error', /* ... */],

      // === CATEGORY 4: TypeScript ===
      '@typescript-eslint/explicit-function-return-type': ['error', {
        allowExpressions: true
      }],
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',

      // === CATEGORY 5: React ===
      'react/no-array-index-key': 'error',

      // === CATEGORY 6: Code Smells ===
      '@typescript-eslint/no-magic-numbers': ['error', {
        ignore: [-1, 0, 1, 2]
      }],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'curly': ['error', 'all'],
      'no-nested-ternary': 'error',
      'import/no-duplicates': 'error'
    }
  },

  // Overrides for specific cases
  {
    files: ['**/*.test.{ts,tsx}', '**/__tests__/**'],
    rules: {
      '@typescript-eslint/no-magic-numbers': 'off', // Allow in tests
      'max-lines-per-function': 'off' // Tests can be long
    }
  },

  {
    files: ['*.config.{js,ts}', 'vite.config.ts'],
    rules: {
      'import/no-default-export': 'off' // Config files need defaults
    }
  }
])
```

---

## Migration Strategy

### Phase 1: Low-Hanging Fruit (Week 1)
**Effort:** Low | **Impact:** High

1. ✅ Install new plugins
2. ✅ Enable auto-fixable rules:
   - `prefer-const`
   - `import/order`
   - `import/no-duplicates`
   - `prefer-arrow-callback`
   - `@typescript-eslint/prefer-optional-chain`
   - `@typescript-eslint/prefer-nullish-coalescing`

3. ✅ Run `npm run lint -- --fix`
4. ✅ Commit auto-fixes

**Estimated violations:** ~50-100 (mostly auto-fixable)

---

### Phase 2: Named Exports (Week 2)
**Effort:** Medium | **Impact:** High

1. ✅ Enable `import/no-default-export` (error)
2. ✅ Convert default exports to named:
   ```typescript
   // Before
   export default Button;

   // After
   export { Button };
   ```
3. ✅ Update all imports
4. ✅ Can use codemod for automation

**Estimated violations:** 9 files (components, App.tsx, utils)

---

### Phase 3: Complexity Limits (Week 3)
**Effort:** Medium | **Impact:** Medium

1. ✅ Enable complexity rules (warning first):
   - `complexity: 'warn'`
   - `max-depth: 'warn'`
   - `max-lines-per-function: 'warn'`

2. ✅ Identify violations
3. ✅ Refactor one file at a time:
   - Extract functions
   - Use early returns
   - Create helpers

4. ✅ Tighten to `error` when clean

**Estimated violations:** 5-10 functions (mostly in components)

---

### Phase 4: Return Types (Week 4)
**Effort:** High | **Impact:** Medium

1. ✅ Enable `@typescript-eslint/explicit-function-return-type` (warn)
2. ✅ Add return types to exported functions
3. ✅ Add to hook functions
4. ✅ Add to component functions
5. ✅ Tighten to `error`

**Estimated violations:** ~30 functions

---

### Phase 5: Code Smells (Week 5)
**Effort:** Low | **Impact:** Low

1. ✅ Enable remaining rules:
   - `no-magic-numbers`
   - `no-console`
   - `curly`
   - `no-nested-ternary`

2. ✅ Fix violations
3. ✅ Extract constants
4. ✅ Remove debug logs

**Estimated violations:** ~10-20

---

## Risk Assessment

### High Risk (Need Discussion)

**1. `import/no-default-export`**
- **Risk:** Breaks all imports in project
- **Mitigation:** Use codemod, do in dedicated PR
- **Question:** Vite/React sometimes expect default exports?

**2. `@typescript-eslint/explicit-function-return-type`**
- **Risk:** Verbose, especially for React components
- **Mitigation:** Allow `allowExpressions: true` for JSX
- **Question:** Components return `JSX.Element` or leave implicit?

**3. `complexity: 10`**
- **Risk:** Some components legitimately complex
- **Mitigation:** Start at 15, tighten gradually
- **Question:** Where to draw the line?

---

### Medium Risk (Probably OK)

**1. `no-param-reassign`**
- **Risk:** May break some utility functions
- **Mitigation:** Review violations, refactor to immutable

**2. `no-magic-numbers`**
- **Risk:** Can be noisy (lots of 0, 1, 2)
- **Mitigation:** Generous ignore list, disable in tests

---

### Low Risk (Safe)

- `prefer-const` - Already mostly using const
- `import/order` - Auto-fixable, cosmetic
- `prefer-optional-chain` - Auto-fixable, clear improvement
- `no-console` - Should catch accidentally committed logs

---

## Alternatives Considered

### Option A: All Rules at Once
**Pros:** Done quickly
**Cons:** Hundreds of violations, risky, hard to review
**Verdict:** ❌ Too risky

### Option B: Phased Rollout (RECOMMENDED)
**Pros:** Manageable, reviewable, incremental
**Cons:** Takes 5 weeks
**Verdict:** ✅ Recommended

### Option C: Enable as Warnings First
**Pros:** Non-blocking, gradual
**Cons:** Warnings get ignored, never fixed
**Verdict:** ⚠️ Only for complex rules (complexity, return types)

---

## Success Metrics

After full implementation:

1. **Code Quality**
   - ✅ Cyclomatic complexity < 10 per function
   - ✅ Max nesting depth < 3
   - ✅ 100% explicit return types on exports
   - ✅ Zero `any` types
   - ✅ Zero default exports

2. **Developer Experience**
   - ✅ Faster code reviews (less bikeshedding)
   - ✅ Better autocomplete (named exports)
   - ✅ Fewer bugs (immutability, type safety)
   - ✅ Easier refactoring (consistent patterns)

3. **Maintainability**
   - ✅ New contributors follow patterns automatically
   - ✅ ESLint catches issues before PR
   - ✅ Less cognitive load reading code

---

## Questions for Review

1. **Named Exports:** Mandate for all, or allow default for components?
2. **Complexity Threshold:** Start at 15 or 10?
3. **Return Types:** Required on all functions or just exports?
4. **Console Logs:** Error or warn in production code?
5. **Migration Timeline:** 5 weeks too slow? Faster approach?
6. **Plugin Budget:** OK to add 3 more ESLint plugins?
7. **Auto-fix Strategy:** Run `--fix` in bulk or file-by-file?

---

## Next Steps

1. **Review this plan** - Discuss trade-offs, adjust rules
2. **Install plugins** - Add to package.json
3. **Create test config** - Enable 1-2 rules in separate branch
4. **Measure impact** - See actual violation counts
5. **Decide on phasing** - Agree on timeline
6. **Execute Phase 1** - Start with auto-fixable rules

---

## Appendix: Full Rule List

```javascript
{
  // Functional Programming
  'prefer-const': 'error',
  'no-param-reassign': ['error', { props: true }],
  'no-var': 'error',
  'unicorn/no-for-loop': 'error',
  'unicorn/no-array-push-push': 'error',
  'unicorn/prefer-array-some': 'error',
  'unicorn/prefer-array-find': 'error',
  'unicorn/prefer-spread': 'error',

  // Complexity
  'complexity': ['error', { max: 10 }],
  'max-depth': ['error', { max: 3 }],
  'max-lines-per-function': ['warn', { max: 50 }],
  'max-lines': ['warn', { max: 300 }],
  'max-nested-callbacks': ['error', { max: 3 }],
  'no-else-return': ['error', { allowElseIf: false }],

  // Consistency
  'import/no-default-export': 'error',
  'import/order': ['error', { /* config */ }],
  'import/no-duplicates': 'error',
  'import/newline-after-import': 'error',
  'prefer-arrow-callback': 'error',
  'func-style': ['error', 'declaration', { allowArrowFunctions: true }],
  'arrow-body-style': ['error', 'as-needed'],
  '@typescript-eslint/naming-convention': ['error', /* config */],

  // TypeScript
  '@typescript-eslint/explicit-function-return-type': ['error', {
    allowExpressions: true,
    allowTypedFunctionExpressions: true
  }],
  '@typescript-eslint/explicit-module-boundary-types': 'error',
  '@typescript-eslint/no-explicit-any': 'error',
  '@typescript-eslint/no-non-null-assertion': 'error',
  '@typescript-eslint/no-unused-vars': ['error', {
    argsIgnorePattern: '^_'
  }],
  '@typescript-eslint/prefer-optional-chain': 'error',
  '@typescript-eslint/prefer-nullish-coalescing': 'error',
  '@typescript-eslint/strict-boolean-expressions': 'warn',

  // React
  'react/no-array-index-key': 'error',
  'react/jsx-no-useless-fragment': 'error',
  'react/self-closing-comp': 'error',
  'react-hooks/rules-of-hooks': 'error',
  'react-hooks/exhaustive-deps': 'warn',

  // Code Smells
  '@typescript-eslint/no-magic-numbers': ['error', {
    ignore: [-1, 0, 1, 2],
    ignoreEnums: true
  }],
  'no-console': ['error', { allow: ['warn', 'error'] }],
  'no-alert': 'error',
  'curly': ['error', 'all'],
  'no-nested-ternary': 'error',
  'eqeqeq': ['error', 'always'],
  'no-implicit-coercion': 'error'
}
```

**Total:** 42 rules across 6 categories

---

**Ready for Review!** 🎯

Let's discuss trade-offs and decide which rules to adopt.
