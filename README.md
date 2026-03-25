# GitHub PR Notifier

A Chrome extension that sends desktop notifications when CI checks complete or fail on GitHub PR pages.

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

| Status    | Detected when                                                            |
| --------- | ------------------------------------------------------------------------ |
| `success` | Checks section text includes "passed"                                    |
| `failure` | `[aria-label*="failing"]`, `.bgColor-danger-emphasis`, or danger circle  |
| `warning` | Text includes "awaiting" or "conflict"                                   |
| `pending` | Checks section exists but no final state detected                        |
| `unknown` | No checks section and no known status phrases in body text               |

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
