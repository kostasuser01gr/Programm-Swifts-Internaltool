# Security & Code Scanning

## Code Scanning (CodeQL)

This repository uses **GitHub Code Scanning** powered by **CodeQL** on every pull request targeting `main` and on a weekly schedule (Monday 03:00 UTC). Alerts appear under the **Security** tab and as inline PR annotations.

### How It Works

1. **On every PR**: CodeQL analyses JavaScript/TypeScript source for vulnerabilities (XSS, injection, prototype pollution, etc.).
2. **Weekly schedule**: A full scan runs against `main` to catch issues introduced by dependency updates or newly discovered patterns.
3. **Results**: Findings appear as code scanning alerts in the Security tab, and as PR check annotations directly on the changed lines.

### Copilot Autofix

**GitHub Copilot Autofix** automatically proposes patches for certain code scanning alerts. When an alert is raised:

- Copilot generates a suggested fix directly on the alert.
- The developer **must review, test, and validate** the suggestion before merging.
- **Do not rely solely on automated fixes** for high-risk or security-critical changes.

### Scope

- **Languages**: JavaScript / TypeScript (primary), Dart (ShiftForge sub-project).
- **Folders**: All source under `src/` and `shiftforge/lib/`.
- **Queries**: `security-extended` suite (covers OWASP Top 10 and more).

## Reporting Vulnerabilities

If you discover a security vulnerability, please **do not** open a public issue. Instead:

1. Use GitHub's **Private Vulnerability Reporting** (Security tab → "Report a vulnerability").
2. Or email the maintainers directly (see repository contacts).

We aim to acknowledge reports within 48 hours and provide a fix within 7 days for critical issues.

## Dependencies

- Dependabot is recommended for automated dependency update PRs.
- Review the `package.json` and `pubspec.yaml` for current dependency versions.
- All production dependencies should be pinned to exact versions.
