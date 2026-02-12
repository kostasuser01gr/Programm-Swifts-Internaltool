<!-- cSpell:disable -->
# Organisation-Wide Security & Quality Checklist

Use this checklist when onboarding a new repository into the org's quality gates.

---

## 1. GitHub Advanced Security

- [ ] Verify the org has **GitHub Advanced Security** licenses (required for private repos).
- [ ] Enable **Code Scanning** via Settings → Security → Code security → CodeQL.
  - Prefer **Default Setup** if the repo uses supported languages (JS/TS, Python, Java, Go, Ruby, C#, C/C++).
  - Use **Advanced Setup** (manual workflow) for custom configurations or multi-language repos.
- [ ] Enable **Secret Scanning** and **Push Protection** under the same settings page.
- [ ] Enable **Dependabot alerts** and **Dependabot security updates**.

## 2. CodeQL Workflow

- [ ] Add the reusable workflow caller to the repo's `.github/workflows/ci.yml`:

```yaml
name: org-ci
on: [pull_request, push]
jobs:
  security:
    uses: <OWNER>/.github/.github/workflows/reusable-codeql.yml@main
    secrets: inherit
    with:
      languages: '["javascript-typescript"]'  # adjust per repo
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22' }
      - run: npm ci
      - run: npm test --if-present
```

- [ ] Verify the workflow runs successfully on the first PR.

## 3. Copilot Autofix

- [ ] Confirm **Copilot Autofix** is enabled (org Settings → Copilot → Code scanning autofix → Enable).
- [ ] Educate the team: autofix suggestions appear on code scanning alerts in PRs. Always review before accepting.

## 4. Sentry for GitHub Copilot

- [ ] Install [Sentry Copilot Extension](https://github.com/marketplace/sentry-for-github-copilot) from the VS Code / Codespaces marketplace.
- [ ] Connect to the org's Sentry project (DSN, auth token).
- [ ] Team members can now ask Copilot Chat: `@sentry What errors occurred in the last 24h?`
- [ ] Use Sentry suggestions in PRs: fix proposals + generated unit tests.

## 5. Docker for GitHub Copilot

- [ ] Install [Docker Extension for GitHub Copilot](https://github.com/marketplace/docker-for-github-copilot) (VS Code marketplace).
- [ ] For repos with Dockerfiles: ask `@docker How can I optimize this Dockerfile?`
- [ ] Review multi-stage build suggestions, health checks, and vulnerability scan guidance.

## 6. Branch Protection Rules

- [ ] Go to Settings → Branches → Branch protection rules → Add rule for `main`.
- [ ] Enable:
  - [x] **Require a pull request before merging** (at least 1 approval).
  - [x] **Require status checks to pass before merging**:
    - `code-scanning` (CodeQL results)
    - `build-and-test` (CI job)
  - [x] **Require branches to be up to date before merging**.
  - [x] **Do not allow bypassing the above settings** (enforce for admins).

Quick CLI setup:

```bash
gh api \
  -X PUT \
  -H "Accept: application/vnd.github+json" \
  /repos/<OWNER>/<REPO>/branches/main/protection \
  -f required_status_checks[strict]=true \
  -f 'required_status_checks[contexts][]=code-scanning' \
  -f 'required_status_checks[contexts][]=build-and-test' \
  -f enforce_admins=true \
  -f restrictions=
```

## 7. SECURITY.md

- [ ] Add a `SECURITY.md` to the repo root (use the template from this org).
- [ ] Verify it describes: code scanning scope, Copilot Autofix policy, vulnerability reporting process.

## 8. README Quality Gates Section

- [ ] Add a "Quality Gates & Autofix" section to the README explaining the CI/security flow.
- [ ] Include installation/usage instructions for Sentry & Docker Copilot extensions.

---

## Repeat for Each Repo

```bash
# List all org repos
gh repo list <OWNER> --limit 200 --json name,visibility

# For each repo, apply the branch protection:
for repo in repo1 repo2 repo3; do
  gh api -X PUT -H "Accept: application/vnd.github+json" \
    /repos/<OWNER>/$repo/branches/main/protection \
    -f required_status_checks[strict]=true \
    -f 'required_status_checks[contexts][]=code-scanning' \
    -f 'required_status_checks[contexts][]=build-and-test' \
    -f enforce_admins=true \
    -f restrictions=
done
```
