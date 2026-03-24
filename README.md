# GitHub PR Notifier

A Chrome extension that sends desktop notifications when CI checks complete or fail on GitHub PR pages.

## Features

- Notifies when CI checks **pass** or **fail** on a GitHub PR
- Clicking the notification focuses the relevant PR tab
- Supports GitHub's SPA navigation (Turbo + popstate)

## Installation

### Prerequisites

- Node.js + [pnpm](https://pnpm.io/)

### Build

```bash
pnpm install
pnpm run generate-icons  # first time only
pnpm run build
```

### Load in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select this directory

## Development

```bash
# Type check
pnpm run typecheck

# Build
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
