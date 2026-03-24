// content.ts - Runs on GitHub PR pages (https://github.com/*/*/pull/*)
// Monitors CI check status via MutationObserver and notifies on state changes.

let previousStatus: CiStatus | null = null;
let observer: MutationObserver | null = null;

// Detects CI check status from the PR page DOM.
// Returns: 'success' | 'failure' | 'warning' | 'pending' | 'unknown'
function detectStatus(): CiStatus {
  // GitHub's new React UI uses <section aria-label="Checks"> for the CI status area.
  const checksSection = document.querySelector('section[aria-label="Checks"]');

  if (checksSection) {
    // DOM-based failure signals — more stable than text matching.
    // aria-label on the failing group and the danger background class are both
    // accessibility/semantic attributes that GitHub maintains independently of UI text.
    const hasDangerCircle = Array.from(checksSection.querySelectorAll("circle")).some((c) =>
      c.getAttribute("style")?.includes("fgColor-danger"),
    );
    if (
      checksSection.querySelector('[aria-label*="failing"]') ||
      checksSection.querySelector(".bgColor-danger-emphasis") ||
      hasDangerCircle
    ) {
      return "failure";
    }

    const heading = checksSection.querySelector("h3");
    const text = (heading || checksSection).textContent?.toLowerCase() ?? "";

    if (text.includes("passed")) return "success";
    if (text.includes("failed") || text.includes("failing") || text.includes("error"))
      return "failure";
    // Conflict resolution required — user action needed.
    if (text.includes("awaiting") || text.includes("conflict")) return "warning";

    // Section exists but not a final state → still running
    return "pending";
  }

  // Fallback: scan body text for known GitHub status phrases
  const bodyText = document.body.textContent?.toLowerCase() ?? "";
  if (bodyText.includes("all checks have passed") || bodyText.includes("checks have passed")) {
    return "success";
  }
  if (
    bodyText.includes("haven't completed") ||
    bodyText.includes("hasn't completed") ||
    bodyText.includes("waiting for status")
  ) {
    return "pending";
  }
  if (bodyText.includes("check failed") || bodyText.includes("checks failed")) {
    return "failure";
  }

  return "unknown";
}

function isPRPage(): boolean {
  return /\/pull\/\d+/.test(location.pathname);
}

// Sends a notification only when transitioning from pending/unknown to a final state.
function handleStatusChange(newStatus: CiStatus): void {
  if (newStatus === previousStatus) return;

  // Only notify when CI was confirmed running (pending).
  // 'unknown'/null means the merge box hadn't loaded yet — not a reliable baseline.
  const wasUndetermined = previousStatus === "pending";
  const isNotifiable =
    newStatus === "success" || newStatus === "failure" || newStatus === "warning";

  const shouldNotify = wasUndetermined && isNotifiable;

  // Send all known status changes so the toolbar icon stays up to date.
  // shouldNotify tells background whether to also show a system notification.
  if (newStatus !== "unknown") {
    try {
      const message: CiStatusMessage = {
        type: "ci_status_changed",
        status: newStatus,
        prTitle: document.title,
        shouldNotify,
      };
      chrome.runtime.sendMessage(message);
    } catch {
      // Extension was reloaded while this tab was open — stop observing.
      observer?.disconnect();
      observer = null;
    }
  }

  previousStatus = newStatus;
}

function setupObserver(): void {
  if (observer) {
    observer.disconnect();
    observer = null;
  }

  // Capture initial state without triggering a notification
  previousStatus = detectStatus();

  // Observe document.body to reliably catch all DOM changes,
  // including lazily-loaded merge box content.
  observer = new MutationObserver(() => {
    handleStatusChange(detectStatus());
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function handleNavigation(): void {
  if (!isPRPage()) {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    previousStatus = null;
    return;
  }
  previousStatus = null;
  setupObserver();
}

// turbo:load fires on both initial page load and SPA navigation — use it as the sole entry point.
// popstate handles browser back/forward when Turbo is not involved.
document.addEventListener("turbo:load", handleNavigation);
window.addEventListener("popstate", handleNavigation);

// Fallback: if turbo:load never fires (e.g. direct navigation without Turbo), set up manually.
setTimeout(() => {
  if (observer === null && isPRPage()) {
    setupObserver();
  }
}, 0);
