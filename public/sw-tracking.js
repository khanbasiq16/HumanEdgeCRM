// Service Worker for employee offline detection via Background Sync
const OFFLINE_SYNC_TAG = "employee-offline-sync";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

// Store pending offline payload in memory
let pendingOfflinePayload = null;

self.addEventListener("message", (event) => {
    if (event.data?.type === "QUEUE_OFFLINE") {
        pendingOfflinePayload = event.data.payload;
    }
});

self.addEventListener("sync", (event) => {
    if (event.tag === OFFLINE_SYNC_TAG && pendingOfflinePayload) {
        event.waitUntil(
            fetch("/api/tracking/offline", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(pendingOfflinePayload),
                keepalive: true,
            }).then(() => {
                pendingOfflinePayload = null;
            }).catch(() => {})
        );
    }
});
