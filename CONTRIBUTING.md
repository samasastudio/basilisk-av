# Contributing to Basilisk

Thank you for your interest in contributing to Basilisk! This guide will help you get started.

---

## Getting Started

### Prerequisites

- **Node.js**: v18+ (v20+ recommended)
- **npm**: v9+
- **Git**: Latest version
- **Modern browser**: Chrome 89+, Firefox 88+, Safari 14.1+, or Edge 89+

### Development Setup

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub, then clone your fork:
   git clone https://github.com/YOUR_USERNAME/basilisk-av.git
   cd basilisk-av
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:5173`

5. **Verify everything works**
   - Click "Start Audio"
   - Type `s("bd*4")` in REPL
   - Press Execute (or Shift+Enter)
   - Verify you hear audio

---

## Project Structure

```
basilisk-av/
├── src/
│   ├── App.tsx                    # Main application component
│   ├── components/
│   │   ├── StrudelRepl.tsx        # CodeMirror REPL editor
│   │   └── ui/Button.tsx          # Reusable UI components
│   ├── utils/
│   │   ├── patchSuperdough.ts     # Audio routing interceptor
│   │   ├── strudelHydraBridge.ts  # FFT analysis bridge
│   │   └── patternPresets.ts      # Example patterns
│   ├── main.tsx                   # React entry point
│   └── index.css                  # Global styles (Tailwind)
├── public/                        # Static assets
├── docs/                          # Documentation (use root-level docs)
└── archive/                       # Historical documentation
```

---

## Code Style

### TypeScript

- **Strict mode**: Always enabled (`strict: true`)
- **Functional components**: Use hooks, no class components
- **Type everything**: Avoid `any` types where possible
- **Explicit return types**: For exported functions

```typescript
// ✅ GOOD
export function initBridge(ctx: AudioContext): HydraBridge | null {
  // ...
}

// ❌ BAD
export function initBridge(ctx: any) {
  // ...
}
```

### React

- **Functional components with hooks**
  ```typescript
  function MyComponent({ prop }: Props) {
    const [state, setState] = useState(initial)
    return <div>{state}</div>
  }
  ```

- **Named exports for components**
  ```typescript
  export function Button({ children }: Props) { ... }
  ```

- **Props interface above component**
  ```typescript
  type ButtonProps = {
    onClick: () => void
    disabled?: boolean
  }

  export function Button({ onClick, disabled }: ButtonProps) { ... }
  ```

### ESLint

Run linter before committing:
```bash
npm run lint
```

Fix auto-fixable issues:
```bash
npm run lint -- --fix
```

### Formatting

- **Indentation**: 2 spaces (not tabs)
- **Quotes**: Single quotes for strings
- **Semicolons**: Required
- **Line length**: 120 characters max

---

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm test -- --watch

# Run specific test file
npm test src/utils/__tests__/strudelHydraBridge.test.ts

# Coverage report
npm test:coverage
```

### Writing Tests

#### Unit Tests (Pure Functions)

```typescript
// src/utils/__tests__/myFunction.test.ts
import { describe, it, expect } from 'vitest'
import { myFunction } from '../myFunction'

describe('myFunction', () => {
  it('returns correct value', () => {
    expect(myFunction(5)).toBe(10)
  })

  it('handles edge cases', () => {
    expect(myFunction(0)).toBe(0)
  })
})
```

#### Component Tests

```typescript
// src/components/__tests__/Button.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from '../Button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Click</Button>)
    await userEvent.click(screen.getByText('Click'))
    expect(onClick).toHaveBeenCalledOnce()
  })
})
```

#### Hook Tests

```typescript
// src/hooks/__tests__/useStrudelEngine.test.ts
import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useStrudelEngine } from '../useStrudelEngine'

describe('useStrudelEngine', () => {
  it('initializes engine', async () => {
    const { result } = renderHook(() => useStrudelEngine())

    await result.current.startEngine()

    await waitFor(() => {
      expect(result.current.engineInitialized).toBe(true)
    })
  })
})
```

### Test Coverage Goals

- **Overall**: 80%+ coverage
- **Critical paths**: 100% coverage (audio bridge, engine initialization)
- **UI components**: 70%+ coverage

---

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation only
- **style**: Code style (formatting, semicolons)
- **refactor**: Code restructuring (no behavior change)
- **test**: Adding or fixing tests
- **chore**: Build process, dependencies

### Examples

```bash
feat(repl): add Shift+Enter keyboard shortcut

fix(bridge): handle AudioContext suspension in Safari

docs(api): document window.a.setBins() method

refactor(app): extract useStrudelEngine hook

test(bridge): add unit tests for FFT calculation

chore(deps): update @strudel/web to v1.3.0
```

### Scope Guidelines

- `app` - App.tsx changes
- `repl` - StrudelRepl component
- `bridge` - Audio bridge (patchSuperdough, strudelHydraBridge)
- `ui` - UI components
- `docs` - Documentation files
- `deps` - Dependency updates
- `build` - Build configuration

---

## Pull Request Process

### Before Submitting

1. **Create feature branch**
   ```bash
   git checkout -b feat/my-feature
   ```

2. **Write tests**
   - Add tests for new features
   - Update tests for bug fixes
   - Ensure all tests pass

3. **Run linter**
   ```bash
   npm run lint
   ```

4. **Build successfully**
   ```bash
   npm run build
   ```

5. **Update documentation**
   - Update README.md if user-facing
   - Update API.md if API changed
   - Update ARCHITECTURE.md if implementation changed

### Submitting PR

1. **Push to your fork**
   ```bash
   git push origin feat/my-feature
   ```

2. **Open Pull Request**
   - Go to GitHub
   - Click "New Pull Request"
   - Select your branch
   - Fill out PR template

3. **PR Title Format**
   ```
   feat(scope): brief description
   ```

4. **PR Description Should Include**
   - What changed
   - Why it changed
   - How to test
   - Screenshots (if UI changes)
   - Breaking changes (if any)

### PR Template

```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## How to Test
1. Step 1
2. Step 2
3. Expected result

## Screenshots
(if applicable)

## Checklist
- [ ] Tests pass
- [ ] Linter passes
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

### Review Process

- At least 1 approval required
- All tests must pass
- No merge conflicts
- Code follows style guidelines

---

## Development Workflow

### Feature Development

1. **Create issue** (optional but recommended)
   - Describe the feature
   - Discuss implementation approach
   - Get feedback before coding

2. **Create branch**
   ```bash
   git checkout -b feat/feature-name
   ```

3. **Develop with tests**
   - Write test first (TDD)
   - Implement feature
   - Verify test passes

4. **Commit atomically**
   ```bash
   git add src/file.ts
   git commit -m "feat(scope): add feature"
   ```

5. **Push and create PR**

### Bug Fixes

1. **Reproduce bug**
   - Write failing test
   - Verify bug exists

2. **Fix bug**
   - Implement fix
   - Verify test passes

3. **Commit**
   ```bash
   git commit -m "fix(scope): describe bug fix"
   ```

---

## Debugging

### Browser DevTools

1. **Console**: Check for errors
   ```javascript
   console.log(window.a.fft)
   console.log(window.repl)
   ```

2. **Network**: Check for failed requests

3. **Performance**: Monitor FPS and CPU usage

4. **Sources**: Set breakpoints in TypeScript

### React DevTools

Install [React DevTools](https://react.dev/learn/react-developer-tools)

- Inspect component props
- Track state changes
- Profile performance

### Common Issues

#### AudioContext suspended
**Cause**: User didn't interact with page yet (browser security)
**Solution**: Must click button to start AudioContext

#### `a is not defined`
**Cause**: Bridge not initialized
**Solution**: Run code in REPL to trigger bridge creation

#### Tests failing
**Cause**: AudioContext or requestAnimationFrame not mocked
**Solution**: Check `src/test/setup.ts` has mocks

---

## Documentation

### When to Update Docs

- **README.md**: User-facing features, quick start
- **API.md**: New APIs, changed function signatures
- **ARCHITECTURE.md**: Implementation details, architecture changes
- **roadmap.md**: New phases, completed features

### Writing Good Documentation

- **Be concise**: Get to the point quickly
- **Use examples**: Show, don't just tell
- **Update existing**: Don't duplicate information
- **Link related docs**: Help users find more info

---

## Community Guidelines

### Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Give constructive feedback
- Focus on ideas, not people

### Getting Help

- **GitHub Issues**: Bug reports, feature requests
- **Discussions**: Questions, ideas, show & tell
- **Discord** (coming soon): Real-time chat

### Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md (coming soon)
- Credited in release notes
- Thanked in documentation

---

## Release Process

(For maintainers)

1. **Update version**
   ```bash
   npm version patch|minor|major
   ```

2. **Update CHANGELOG.md**
   - List all changes since last release
   - Group by type (feat, fix, docs)

3. **Build**
   ```bash
   npm run build
   ```

4. **Tag release**
   ```bash
   git tag v1.0.0
   git push --tags
   ```

5. **Create GitHub Release**
   - Go to Releases
   - Create new release
   - Copy CHANGELOG entry
   - Publish

---

## Additional Resources

- [Strudel Documentation](https://strudel.cc)
- [Hydra Documentation](https://hydra.ojack.xyz/docs)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Vitest Documentation](https://vitest.dev)

---

## Questions?

Open an issue with the "question" label, and we'll help you out!

---

Thank you for contributing to Basilisk! 🎵🎨
