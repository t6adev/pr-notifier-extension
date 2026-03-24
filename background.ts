// background.ts - Background service worker
// Receives CI status messages from content script, updates toolbar icon,
// shows notifications, and focuses the relevant tab when a notification is clicked.

interface StatusConfigEntry {
  icon: string;
  toolbarIcons: Record<number, string>;
  title: string | null;
}

const NOTIFICATION_PREFIX = "pr-notifier-tab";

const STATUS_CONFIG: Record<CiStatus, StatusConfigEntry | undefined> = {
  success: {
    icon: "icons/icon128-success.png",
    toolbarIcons: {
      16: "icons/icon16-success.png",
      48: "icons/icon48-success.png",
      128: "icons/icon128-success.png",
    },
    title: "CI checks passed ✓",
  },
  failure: {
    icon: "icons/icon128-failure.png",
    toolbarIcons: {
      16: "icons/icon16-failure.png",
      48: "icons/icon48-failure.png",
      128: "icons/icon128-failure.png",
    },
    title: "CI checks failed ✗",
  },
  warning: {
    icon: "icons/icon128-warning.png",
    toolbarIcons: {
      16: "icons/icon16-warning.png",
      48: "icons/icon48-warning.png",
      128: "icons/icon128-warning.png",
    },
    title: "Conflict resolution required ⚠",
  },
  pending: {
    icon: "icons/icon128-pending.png",
    toolbarIcons: {
      16: "icons/icon16-pending.png",
      48: "icons/icon48-pending.png",
      128: "icons/icon128-pending.png",
    },
    title: null, // no notification for pending
  },
  unknown: undefined,
};

// Track per-tab status for toolbar icon restoration on tab switch.
const tabStatus = new Map<number, CiStatus>();

chrome.runtime.onMessage.addListener((message: CiStatusMessage, sender) => {
  if (message.type !== "ci_status_changed") return;

  const tabId = sender.tab?.id;
  if (!tabId) return;

  const config = STATUS_CONFIG[message.status];
  if (!config) return;

  // Update toolbar icon for this tab
  tabStatus.set(tabId, message.status);
  chrome.action.setIcon({ tabId, path: config.toolbarIcons });

  // Show notification only when requested
  if (message.shouldNotify && config.title) {
    const notificationId = `${NOTIFICATION_PREFIX}${tabId}`;
    chrome.notifications.create(notificationId, {
      type: "basic",
      iconUrl: config.icon,
      title: config.title,
      message: message.prTitle || "Pull Request",
    });
  }
});

chrome.notifications.onClicked.addListener((notificationId: string) => {
  if (!notificationId.startsWith(NOTIFICATION_PREFIX)) return;

  const tabId = parseInt(notificationId.slice(NOTIFICATION_PREFIX.length), 10);
  if (!tabId) return;

  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError || !tab) return;
    chrome.tabs.update(tabId, { active: true }, () => {
      chrome.windows.update(tab.windowId, { focused: true });
    });
  });

  chrome.notifications.clear(notificationId);
});

// Clean up tab state when a tab is closed
chrome.tabs.onRemoved.addListener((tabId: number) => {
  tabStatus.delete(tabId);
});
