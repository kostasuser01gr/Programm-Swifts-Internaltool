# Changelog

All notable changes to this project will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Production-ready Docker deployment (multi-stage build, Nginx, healthcheck)
- Docker Compose for single-command deployment
- GitHub Actions CI/CD pipeline (lint, typecheck, test, build, deploy, audit)
- CodeQL code scanning with Copilot Autofix
- 103 unit/integration tests across 11 test files
- Prettier formatting configuration
- `.editorconfig`, `.gitattributes` for consistent tooling
- `.env.example` with documented configuration variables
- MIT License
- CONTRIBUTING.md with PR guidelines
- CHANGELOG.md (this file)
- Build chunk splitting (vendor-react, vendor-ui, vendor-charts, vendor-mui)
- Security headers in nginx (Permissions-Policy, X-Content-Type-Options)
- Dependency security audit in CI pipeline

### Changed
- Improved `.gitignore` (macOS artifacts, IDE files, coverage, Wrangler)
- Standardized package.json scripts (dev, build, test, lint, typecheck, format)
- Reduced main JS bundle from 980KB to 375KB via code splitting
- Upgraded nginx security: replaced deprecated X-XSS-Protection with modern headers
- README rewritten with deployment steps, troubleshooting, and CI badges

### Fixed
- Removed .DS_Store from repository tracking

### Security
- Zero known vulnerabilities in production dependencies (pnpm audit --prod)
- PBKDF2 PIN hashing with Web Crypto API (no hardcoded secrets)
- Secret scanning and push protection recommended in org checklist

## [0.0.1] - 2025-01-01

### Added
- Initial project scaffold
- React 18 + TypeScript + Vite foundation
- Grid, Kanban, Calendar views
- AI Assistant (demo mode)
- Mock data layer
- Basic routing with React Router
