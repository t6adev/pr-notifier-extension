# GitHub PR Notifier

A Chrome extension that sends desktop notifications when CI checks complete or fail on GitHub PR pages.

## Why this extension?

Waiting for CI on a pull request? You probably find yourself switching back to the PR tab over and over just to check if checks have passed. This extension lets you stay focused on your work — you'll get a browser notification the moment CI finishes. No tab-checking, no context switching.

**Just install it. No tokens, no external services, no configuration.**

### How it compares

| Approach                       | Examples                                    | What you need                                              |
| ------------------------------ | ------------------------------------------- | ---------------------------------------------------------- |
| GitHub notification extensions | Notifier for GitHub, GitHub Status Notifier | Personal Access Token (private repos require `repo` scope) |
| Slack / chat integrations      | slack-github-action, PullNotifier           | Slack workspace + GitHub Actions workflow changes          |
| Desktop apps                   | CatLight, Gitify                            | Separate app install + API authentication                  |
| GitHub built-in                | Email / web notifications                   | Nothing extra (but not real-time, not CI-specific)         |
| **GitHub PR Notifier**         | **This extension**                          | **Install and go**                                         |

### Key advantages

- **Zero setup** — No `GITHUB_TOKEN`, no OAuth, no settings page. Install the extension and it works.
- **No external services** — No Slack, email, or webhook configuration. Everything runs in your browser.
- **Notifies you while you work** — Browser notifications reach you exactly when you need them: while you're at your desk coding. No noisy alerts when you're away.
- **Instant detection** — Watches the page DOM in real time via `MutationObserver`, not API polling on a 1–5 minute delay.
- **Privacy-friendly** — Reads the page you're already viewing. No tokens or credentials are sent anywhere. Safe for private repos without granting broad scopes.

## Features

- Notifies when CI checks **pass**, **fail**, or require **conflict resolution** on a GitHub PR
- Toolbar icon changes color to reflect the current CI status per tab
- Clicking the notification focuses the relevant PR tab
- Supports GitHub's SPA navigation (Turbo + popstate)

## Installation

1. Download the latest `pr-notifier-v*.zip` from the [Releases page](https://github.com/t6adev/pr-notifier-extension/releases)
2. Unzip the archive
3. Open `chrome://extensions`
4. Enable **Developer mode**
5. Click **Load unpacked** and select the unzipped folder

## Development

```bash
pnpm install

# Lint, type check, and format check
pnpm run check

# Auto-fix lint and format issues
pnpm run fix

# Build (output to dist/)
pnpm run build
```

After modifying TypeScript files, run `pnpm run build` and click the reload button on `chrome://extensions`.

## How It Works

A content script ([content.ts](content.ts)) runs on GitHub PR pages and monitors the DOM via `MutationObserver`. It first inspects the `<section aria-label="Checks">` element for semantic/accessibility attributes, falling back to body text scanning. When the CI status transitions from pending to a final state, it sends a message to the background service worker ([background.ts](background.ts)), which updates the toolbar icon and displays a desktop notification.

### CI Status Detection

| Status    | Detected when                                                           |
| --------- | ----------------------------------------------------------------------- |
| `success` | Checks section text includes "passed"                                   |
| `failure` | `[aria-label*="failing"]`, `.bgColor-danger-emphasis`, or danger circle |
| `warning` | Text includes "awaiting" or "conflict"                                  |
| `pending` | Checks section exists but no final state detected                       |
| `unknown` | No checks section and no known status phrases in body text              |

Notifications fire only on transitions: `pending` → `success` / `failure` / `warning`.

### Toolbar Icon

The extension icon changes color per tab to reflect the current CI status:

- Green: checks passed
- Red: checks failed
- Orange: conflict resolution required
- Yellow: checks running

## Permissions

| Permission             | Purpose                                |
| ---------------------- | -------------------------------------- |
| `notifications`        | Display desktop notifications          |
| `tabs`                 | Focus the PR tab on notification click |
| `https://github.com/*` | Access GitHub PR pages                 |

## Release

Releases are automated via GitHub Actions:

1. Push to `main` triggers a patch version bump and creates a release PR (main → release)
2. Merging the release PR triggers a build, git tag, and GitHub Release with a zip artifact
