# Changelog

All notable changes to this project will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive ARIA attributes across all major components (FleetTool, WasherApp, GamePage, StationWars, PinLogin, NavBar, QuickActions, ToastProvider)
- Keyboard navigation on vehicle list, detail tabs, game options
- `role`, `aria-label`, `aria-selected`, `aria-hidden`, `aria-checked`, `aria-expanded` throughout
- Semantic HTML: `<header>`, `<nav>`, `<section>`, `<article>`, `<button>`, `<form>`, `<label htmlFor>`
- Global `:focus-visible` ring style (oklch-based)
- CSP header in vercel.json
- Async Google Fonts loading (non–render-blocking)
- Random PIN generation on admin reset (replacing hardcoded default)

### Changed
- **Full Tailwind migration**: eliminated ALL `Record<string, CSSProperties>` style objects (FleetTool, WasherApp, GamePage, StationWars, PinLogin, NavBar, QuickActions, ToastProvider, ChatPage, ErrorBoundary, ConnectivityMonitor)
- Replaced JS hover handlers (`onMouseEnter`/`onMouseLeave`) with CSS `hover:` utilities
- Replaced injected `<style>` tags with Tailwind utilities (e.g. `animate-pulse`)
- Interactive `<div onClick>` elements converted to `<button>` for accessibility
- Package renamed from `@figma/my-make-file` → `dataos-station-manager`
- React/ReactDOM moved from peerDependencies to dependencies
- ESLint CI step no longer uses `continue-on-error` (quality gate enforced)

### Fixed
- WashPortal/WasherApp timer component no longer uses deleted style objects
- Removed unused `useFleetStore` import from WasherApp
- Removed unused `React` and `useMemo` imports across converted components
- Deleted orphaned `SearchCommand.tsx`

### Security
- `DEFAULT_PIN` changed from '1234' to '0000'; admin reset now generates random PINs
- `resetPin()` returns temporary PIN to admin; no longer reveals default in alert
- CSP header blocks inline scripts, restricts allowed origins

## [0.0.1] - 2025-01-01

### Added
- Initial project scaffold
- React 18 + TypeScript + Vite foundation
- Grid, Kanban, Calendar views
- AI Assistant (demo mode)
- Mock data layer
- Basic routing with React Router
