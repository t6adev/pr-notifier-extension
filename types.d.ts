// Shared type declarations for content script and background service worker.

type CiStatus = "success" | "failure" | "warning" | "pending" | "unknown";

interface CiStatusMessage {
  type: "ci_status_changed";
  status: CiStatus;
  prTitle: string;
  shouldNotify: boolean;
}
