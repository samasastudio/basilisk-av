# ESLint Rules Summary - Quick Reference

**Status:** 📋 Proposal | **Total Rules:** 42 | **New Plugins:** 3

---

## 🎯 At a Glance

| Category | Rules | Severity | Auto-fix | Effort |
|----------|-------|----------|----------|--------|
| **Functional Programming** | 8 | 🔴 Error | ✅ Most | Low |
| **Complexity Limits** | 6 | 🟡 Warn→Error | ❌ Manual | Medium |
| **Code Consistency** | 9 | 🔴 Error | ✅ All | Low |
| **TypeScript Strict** | 9 | 🔴 Error | ⚠️ Some | Medium |
| **React Best Practices** | 5 | 🔴 Error | ⚠️ Some | Low |
| **Code Smells** | 5 | 🔴 Error | ⚠️ Some | Low |

---

## 📊 Current Codebase Health

✅ **Already Strong:**
- Only 14 `let` statements (mostly `const`)
- Zero array mutations (`.push`, `.splice`)
- No nested loops found

⚠️ **Needs Improvement:**
- 9 default exports → should be named
- ~15 ESLint violations with `any` types
- Mixed function declaration styles
- Some deep nesting in components

---

## 🚀 Quick Wins (Auto-fixable)

Run `npm run lint -- --fix` to auto-fix:

```bash
✅ prefer-const              # let → const
✅ import/order              # Organize imports
✅ import/no-duplicates      # Merge duplicate imports
✅ prefer-arrow-callback     # function() → arrow
✅ prefer-optional-chain     # a && a.b → a?.b
✅ prefer-nullish-coalescing # || → ??
✅ curly                     # Add braces
✅ arrow-body-style          # Remove unnecessary {}
```

**Estimated fixes:** 50-100 violations

---

## ⚠️ High-Impact Changes

### 1. Named Exports Only
```diff
- export default Button;
+ export { Button };

- import Button from './Button';
+ import { Button } from './Button';
```
**Impact:** 9 files | **Effort:** 2 hours with codemod

---

### 2. Explicit Return Types
```diff
- export function getUser(id: string) {
+ export function getUser(id: string): User | null {
```
**Impact:** ~30 functions | **Effort:** 4 hours

---

### 3. Complexity Limits
```typescript
// Max complexity: 10
// Max depth: 3
// Max function length: 50 lines
```
**Impact:** 5-10 functions | **Effort:** 8 hours (requires refactoring)

---

## 🔌 Required Plugins

```bash
npm install -D \
  eslint-plugin-import \
  eslint-plugin-react \
  eslint-plugin-unicorn
```

**Size:** ~2.5 MB | **Bundle impact:** None (dev-only)

---

## 📅 5-Week Migration Plan

| Week | Focus | Rules | Effort | Violations |
|------|-------|-------|--------|------------|
| **1** | Auto-fixable | 8 rules | 2h | ~50-100 |
| **2** | Named exports | 1 rule | 4h | 9 files |
| **3** | Complexity | 6 rules | 8h | ~10 funcs |
| **4** | Return types | 2 rules | 8h | ~30 funcs |
| **5** | Code smells | 5 rules | 4h | ~20 |

**Total effort:** ~26 hours over 5 weeks

---

## ❓ Key Questions for Decision

### 1. Default vs Named Exports
**Question:** Ban default exports everywhere?

**Options:**
- A) ✅ **Ban all** (Best for consistency, tree-shaking)
- B) ⚠️ Allow for components only
- C) ❌ Allow everywhere (status quo)

**Recommendation:** A - Forces consistency

---

### 2. Complexity Threshold
**Question:** How strict should we be?

**Options:**
- A) 🟢 Complexity max: 15 (loose, most code passes)
- B) 🟡 **Complexity max: 10** (medium, industry standard)
- C) 🔴 Complexity max: 5 (strict, requires heavy refactoring)

**Recommendation:** B - Start at 15, tighten to 10

---

### 3. Return Types
**Question:** Require on all functions or just exports?

**Options:**
- A) ✅ **All exported functions** (public API only)
- B) ⚠️ All functions (strict, verbose)
- C) ❌ None (rely on inference)

**Recommendation:** A - Balance of safety and ergonomics

---

### 4. Console Logs
**Question:** How to handle `console.log`?

**Options:**
- A) 🔴 **Error** (must remove before merge)
- B) 🟡 Warn (nag but don't block)
- C) ⚠️ Allow in dev, error in prod

**Recommendation:** A - Force intentional logging

---

### 5. Magic Numbers
**Question:** How aggressive?

**Options:**
- A) 🟢 Ignore: [-1, 0, 1, 2, 10, 100]
- B) 🟡 **Ignore: [-1, 0, 1, 2]** (minimal)
- C) 🔴 Ignore: [0, 1] (very strict)

**Recommendation:** B - Catches most issues

---

## 🎨 Before & After Examples

### Example 1: Functional Style
```typescript
// ❌ BEFORE
let results = [];
for (let i = 0; i < items.length; i++) {
  if (items[i].active) {
    results.push(items[i].name);
  }
}

// ✅ AFTER
const results = items
  .filter(item => item.active)
  .map(item => item.name);
```

---

### Example 2: Complexity Reduction
```typescript
// ❌ BEFORE - Complexity 12, Depth 5
function validate(user: any) {
  if (user) {
    if (user.email) {
      if (user.verified) {
        if (user.age > 18) {
          if (user.hasPermission) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

// ✅ AFTER - Complexity 6, Depth 1
function validate(user: User | null): boolean {
  if (!user?.email) return false;
  if (!user.verified) return false;
  if (user.age <= 18) return false;
  if (!user.hasPermission) return false;
  return true;
}

// ✅ EVEN BETTER - Complexity 1
function validate(user: User | null): boolean {
  return Boolean(
    user?.email &&
    user.verified &&
    user.age > 18 &&
    user.hasPermission
  );
}
```

---

### Example 3: Named Exports
```typescript
// ❌ BEFORE
// Button.tsx
export default function Button() { }

// App.tsx
import Btn from './components/ui/Button'; // Arbitrary name!
import MyButton from './components/ui/Button'; // Inconsistent!

// ✅ AFTER
// Button.tsx
export function Button() { }

// App.tsx
import { Button } from './components/ui/Button'; // Consistent!
// Autocomplete works better
// Refactoring is safer
```

---

### Example 4: Type Safety
```typescript
// ❌ BEFORE
export function getStatus(active) {
  return active ? 'active' : 'inactive';
}

const status = getStatus(user.active); // What type is status?

// ✅ AFTER
export function getStatus(active: boolean): 'active' | 'inactive' {
  return active ? 'active' : 'inactive';
}

const status = getStatus(user.active); // TypeScript knows: 'active' | 'inactive'
```

---

## 🎯 Expected Outcomes

### Code Quality
- ✅ 100% type-safe (no `any`, explicit returns)
- ✅ Predictable (immutable, pure functions)
- ✅ Readable (low complexity, flat structure)
- ✅ Consistent (same patterns everywhere)

### Developer Experience
- ✅ Faster onboarding (patterns enforced)
- ✅ Better autocomplete (named exports, types)
- ✅ Fewer bugs (caught at compile time)
- ✅ Easier refactoring (TypeScript validates)
- ✅ Faster code review (no bikeshedding)

### Maintenance
- ✅ Less cognitive load
- ✅ Easier debugging
- ✅ Self-documenting code
- ✅ Confidence in changes

---

## 🚨 Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Break all imports | 🔴 High | Use codemod, dedicated PR |
| Verbose return types | 🟡 Medium | Allow inference for internals |
| Over-refactoring | 🟡 Medium | Review each violation individually |
| Plugin bloat | 🟢 Low | Only 3 plugins, 2.5 MB dev-only |
| Team pushback | 🟡 Medium | Phased rollout, get buy-in early |

---

## 🎬 Next Actions

### Option A: Full Send (Aggressive)
1. Install plugins now
2. Enable all auto-fixable rules
3. Run `--fix` on entire codebase
4. Fix remaining manually
5. Timeline: 1 week

**Pros:** Done quickly
**Cons:** Large blast radius, hard to review

---

### Option B: Phased Rollout (RECOMMENDED)
1. Review this plan with team
2. Get consensus on rules
3. Install plugins
4. Enable 2-3 rules per week
5. Timeline: 5 weeks

**Pros:** Manageable, reviewable, safe
**Cons:** Takes longer

---

### Option C: Cherry Pick (Conservative)
1. Only enable non-controversial rules
2. Skip complexity/return types
3. Focus on consistency
4. Timeline: 2 weeks

**Pros:** Low risk, quick wins
**Cons:** Miss out on biggest improvements

---

## 📖 See Also

- [Full Enhancement Plan](./ESLINT_ENHANCEMENT_PLAN.md) - Detailed rationale
- [Type Safety Guide](./TYPE_SAFETY.md) - Already enforced
- [Contributing Guide](../CONTRIBUTING.md) - Code style

---

**Ready to discuss!** What rules resonate? What feels too strict?
