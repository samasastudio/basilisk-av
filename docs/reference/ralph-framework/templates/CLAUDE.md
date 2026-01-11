# Project: [PROJECT_NAME]

> Update this file with your project's specific context. Claude reads this on every interaction.

## Overview

[Brief description of the project, its purpose, and target users]

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Runtime | Node.js | 20.x |
| Language | TypeScript | 5.x |
| Framework | [React/Next/Express/etc.] | x.x |
| Testing | [Vitest/Jest/pytest] | x.x |
| Linting | [ESLint/Biome/Ruff] | x.x |
| Package Manager | [npm/pnpm/yarn] | x.x |

## Key Commands

```bash
# Development
npm run dev              # Start dev server (port 3000)
npm run dev:debug        # Start with debugging enabled

# Testing
npm run test             # Run test suite
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage report

# Quality
npm run lint             # Run linter
npm run lint:fix         # Auto-fix linting issues
npm run typecheck        # TypeScript type checking

# Build
npm run build            # Production build
npm run build:analyze    # Bundle analysis
```

## Architecture

### Directory Structure

```
src/
├── components/          # React components
│   ├── ui/             # Base UI components
│   └── features/       # Feature-specific components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
├── services/           # API and external services
├── stores/             # State management
├── types/              # TypeScript types
└── __tests__/          # Test files
```

### Key Patterns

- **State Management:** [Zustand/Redux/Context - describe pattern]
- **Data Fetching:** [TanStack Query/SWR - describe pattern]
- **Styling:** [Tailwind/CSS Modules - describe conventions]
- **Error Handling:** [Describe error boundary strategy]

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `UserProfile.tsx` |
| Hooks | camelCase with `use` prefix | `useUserData.ts` |
| Utilities | camelCase | `formatDate.ts` |
| Types | PascalCase with suffix | `UserProfileProps` |
| Constants | SCREAMING_SNAKE | `API_BASE_URL` |

## Constraints

### Must Have
- All new code must have corresponding tests
- Test coverage must not decrease
- No `any` types without explicit justification
- All public functions must have JSDoc comments

### Must Not
- Do not add new dependencies without justification
- Do not modify `package-lock.json` manually
- Do not commit `.env` files
- Do not disable ESLint rules inline without comment

### Performance Requirements
- Initial bundle < 200KB gzipped
- Lighthouse performance score > 90
- API response handling < 100ms client-side

## Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `API_URL` | Backend API endpoint | Yes |
| `NODE_ENV` | Environment mode | Yes |
| `DEBUG` | Enable debug logging | No |

## Common Tasks

### Adding a New Component

1. Create component file in `src/components/[category]/`
2. Create corresponding test file
3. Export from category index
4. Add Storybook story if UI component

### Adding a New API Endpoint Integration

1. Add types in `src/types/api/`
2. Create service function in `src/services/`
3. Create React Query hook in `src/hooks/`
4. Add tests for service and hook

### Running Specific Tests

```bash
# Single file
npm run test -- src/__tests__/userProfile.test.ts

# Pattern match
npm run test -- --grep "UserProfile"

# Watch single file
npm run test:watch -- src/__tests__/userProfile.test.ts
```

## Known Issues

<!-- Document any known issues or quirks that might confuse Claude -->

- [Issue 1: Description and workaround]
- [Issue 2: Description and workaround]

## External Documentation

- [Link to API docs]
- [Link to design system]
- [Link to architecture decision records]
