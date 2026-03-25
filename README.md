# GitHub PR Notifier

A Chrome extension that sends desktop notifications when CI checks complete or fail on GitHub PR pages.

## Features

- Notifies when CI checks **pass** or **fail** on a GitHub PR
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

A content script ([content.ts](content.ts)) runs on GitHub PR pages and monitors the DOM via `MutationObserver`. When the CI status transitions from pending/unknown to success or failure, it sends a message to the background service worker ([background.ts](background.ts)), which displays a desktop notification.

### CI Status Detection

| Status    | Detected when DOM contains                                      |
| --------- | --------------------------------------------------------------- |
| `success` | "all checks have passed" / "checks have passed"                 |
| `failure` | "check failed" / "checks failed" / "check has failed"           |
| `pending` | "haven't completed" / "hasn't completed" / "waiting for status" |
| `unknown` | None of the above                                               |

Notifications fire only on transitions: `pending` / `unknown` / `null` → `success` / `failure`.

## Permissions

| Permission             | Purpose                                |
| ---------------------- | -------------------------------------- |
| `notifications`        | Display desktop notifications          |
| `tabs`                 | Focus the PR tab on notification click |
| `https://github.com/*` | Access GitHub PR pages                 |
