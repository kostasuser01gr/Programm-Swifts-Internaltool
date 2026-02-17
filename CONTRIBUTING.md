# Contributing to DataOS

Thank you for your interest in contributing! This document explains how to get started.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/<your-user>/Programm-Swifts-Internaltool.git`
3. Install dependencies: `pnpm install`
4. Create a feature branch: `git checkout -b feat/my-feature`

## Development Workflow

```bash
pnpm dev          # Start dev server
pnpm test:watch   # Run tests in watch mode
pnpm typecheck    # Type check
pnpm format       # Format code
```

## Code Style

- **TypeScript**: Strict mode enabled. Avoid `any`.
- **Formatting**: Prettier with project config (`.prettierrc`).
- **Components**: Functional components with hooks. No class components.
- **State**: Zustand stores for global state. React state for local component state.
- **Naming**: PascalCase for components, camelCase for functions/variables, UPPER_SNAKE for constants.
- **Imports**: Use `@/` alias for `src/` imports.

## Pull Request Guidelines

1. **One concern per PR** — don't mix features with refactors.
2. **All checks must pass**: typecheck, tests, build.
3. **Write tests** for new features or bug fixes.
4. **Update documentation** if behaviour changes.
5. **Keep commits atomic** with conventional commit messages:
   - `feat:` new feature
   - `fix:` bug fix
   - `docs:` documentation only
   - `refactor:` code change that neither fixes a bug nor adds a feature
   - `test:` adding or updating tests
   - `chore:` tooling, CI, dependencies
   - `ci:` CI/CD changes

## Commit Message Format

```
type(scope): short description

Optional longer explanation.

Closes #123
```

## Testing

- Place tests in `src/test/`.
- Use Vitest + React Testing Library.
- Test behaviour, not implementation details.
- Minimum: smoke test for new components, unit test for logic.

## Reporting Issues

Use GitHub Issues. Include:
- Steps to reproduce
- Expected vs actual behaviour
- Browser/OS/Node version
- Screenshots if applicable

## Security

See [SECURITY.md](SECURITY.md) for vulnerability reporting.
