# Type Safety Guidelines

This document establishes strict type safety standards for the Basilisk codebase.

---

## Core Principle

**Zero tolerance for `any` types in production code.**

TypeScript's `any` type defeats the purpose of type checking and can hide bugs. We enforce this through ESLint rules that will fail CI builds.

---

## ESLint Enforcement

### Production Code (src/)
```javascript
'@typescript-eslint/no-explicit-any': 'error' // ❌ Fails build
```

### Test Code (__tests__/)
```javascript
'@typescript-eslint/no-explicit-any': 'warn'  // ⚠️  Warns but allows
```

---

## When You're Tempted to Use `any`

### ❌ Scenario 1: "I don't know the type"
**Bad:**
```typescript
function processData(data: any) {
  return data.value;
}
```

**Good - Use `unknown`:**
```typescript
function processData(data: unknown) {
  if (isValidData(data)) {
    return data.value; // TypeScript validates this
  }
  throw new Error('Invalid data');
}

function isValidData(data: unknown): data is { value: string } {
  return typeof data === 'object'
    && data !== null
    && 'value' in data;
}
```

---

### ❌ Scenario 2: "Window object doesn't have my property"
**Bad:**
```typescript
(window as any).repl = repl;
const value = (window as any).repl.evaluate('code');
```

**Good - Extend Window interface:**
```typescript
// In src/types/hydra.ts or similar
declare global {
  interface Window {
    repl?: StrudelRepl;
  }
}

// Then use type-safe access
window.repl = repl;
window.repl?.evaluate('code');
```

---

### ❌ Scenario 3: "Third-party library has no types"
**Bad:**
```typescript
import externalLib from 'some-lib';
const result = (externalLib as any).method();
```

**Good - Create type definitions:**
```typescript
// src/types/some-lib.d.ts
declare module 'some-lib' {
  export interface ExternalLib {
    method(): string;
  }

  const externalLib: ExternalLib;
  export default externalLib;
}

// Now use with types
import externalLib from 'some-lib';
const result = externalLib.method(); // ✅ Type-safe
```

---

### ❌ Scenario 4: "Event handler from external library"
**Bad:**
```typescript
const handleDrag = (e: any, data: any) => {
  setPosition({ x: data.x, y: data.y });
};
```

**Good - Type the parameters:**
```typescript
import type { DraggableData, DraggableEvent } from 'react-rnd';

const handleDrag = (e: DraggableEvent, data: DraggableData) => {
  setPosition({ x: data.x, y: data.y });
};

// Or if you don't use a parameter:
const handleDrag = (_e: DraggableEvent, data: DraggableData) => {
  setPosition({ x: data.x, y: data.y });
};
```

---

### ❌ Scenario 5: "Complex object I'm mocking in tests"
**Acceptable - But minimize:**
```typescript
// ⚠️  Acceptable in tests, but better alternatives exist
const mockRepl = { evaluate: vi.fn() } as any;

// ✅ Better - Use Partial<> for incomplete types
const mockRepl: Partial<StrudelRepl> = {
  evaluate: vi.fn()
};

// ✅ Best - Implement full interface
const mockRepl: StrudelRepl = {
  evaluate: vi.fn(),
  stop: vi.fn(),
};
```

---

## Migration Strategy for Existing Code

We have identified ~30 instances of `any` in the current codebase:

### Phase A: Low-Hanging Fruit (PR-ready)
1. **Window casts** - Extend Window interface in `src/types/hydra.ts`
2. **Test mocks** - Use `Partial<T>` or implement full interfaces
3. **Unused parameters** - Prefix with `_` and type properly

### Phase B: Medium Effort (Dedicated PR)
1. **External library types** - Create `.d.ts` files
2. **Dynamic event handlers** - Import proper types from libraries

### Phase C: Complex Cases (Research needed)
1. **AudioNode.prototype.connect** - Needs Web Audio API types
2. **Hydra initialization** - May need hydra-synth type definitions

---

## Common Patterns & Solutions

### Pattern: Optional Window Properties
```typescript
// ✅ Type-safe optional chaining
window.repl?.evaluate('code');
window.a?.fft?.[0] ?? 0;

// ✅ With nullish coalescing
const samples = window.samples?.('path') ?? Promise.resolve({});
```

### Pattern: Type Guards
```typescript
function isAudioContext(ctx: unknown): ctx is AudioContext {
  return ctx instanceof AudioContext;
}

if (isAudioContext(someValue)) {
  // TypeScript knows someValue is AudioContext here
  someValue.destination;
}
```

### Pattern: Discriminated Unions
```typescript
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function process(): Result<string> {
  // ...
}

const result = process();
if (result.success) {
  console.log(result.data); // TypeScript knows data exists
} else {
  console.log(result.error); // TypeScript knows error exists
}
```

### Pattern: Generic Constraints
```typescript
function getValue<T extends { id: string }>(obj: T): string {
  return obj.id; // TypeScript knows obj has id
}
```

---

## ESLint Override (Emergency Only)

If you absolutely must use `any` (e.g., known TypeScript limitation), add a comment explaining why:

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const workaround = (value as any).propertyNotInTypes;
// TODO: Remove when library X adds proper types (issue #123)
```

**This requires justification in PR review.**

---

## Benefits of Strict Type Safety

1. **Catch bugs at compile time** - Not runtime
2. **Better IDE autocomplete** - IntelliSense works correctly
3. **Safer refactoring** - TypeScript catches breaking changes
4. **Self-documenting code** - Types explain intent
5. **Easier debugging** - Type errors point to exact problem

---

## Questions?

- **"ESLint is failing with any errors"** → Good! Fix the types.
- **"I can't figure out the right type"** → Ask in PR review.
- **"Third-party library has no types"** → Create a `.d.ts` file.
- **"This is taking too long"** → Consider if `unknown` works.

---

## Reference

- [TypeScript Handbook - Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [TypeScript Deep Dive - Type Guard](https://basarat.gitbook.io/typescript/type-system/typeguard)
- [ESLint Rule: no-explicit-any](https://typescript-eslint.io/rules/no-explicit-any/)

---

**Last Updated:** Phase 1.3 (2024)
**Status:** ✅ Enforced via ESLint
