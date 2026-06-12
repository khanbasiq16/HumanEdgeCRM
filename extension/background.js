// HumanEdge Monitor — background service worker

const SCREENSHOT_ALARM = "humanedge_screenshot";
const HEARTBEAT_ALARM  = "humanedge_heartbeat";
const SCREENSHOT_MINS  = 1;
const HEARTBEAT_MINS   = 0.5;

// ── Debounce: prevent multiple captures within 10 seconds ────────────────────
let lastCaptureTime = 0;
const CAPTURE_COOLDOWN_MS = 10000;

// ── Setup alarms ──────────────────────────────────────────────────────────────
function setupAlarms() {
  chrome.alarms.getAll((alarms) => {
    const names = alarms.map((a) => a.name);
    if (!names.includes(SCREENSHOT_ALARM))
      chrome.alarms.create(SCREENSHOT_ALARM, { periodInMinutes: SCREENSHOT_MINS });
    if (!names.includes(HEARTBEAT_ALARM))
      chrome.alarms.create(HEARTBEAT_ALARM,  { periodInMinutes: HEARTBEAT_MINS  });
  });
}

chrome.runtime.onInstalled.addListener(setupAlarms);
chrome.runtime.onStartup.addListener(setupAlarms);

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === SCREENSHOT_ALARM) takeScreenshot();
  if (alarm.name === HEARTBEAT_ALARM)  sendHeartbeat();
});

// ── Get stored credentials ────────────────────────────────────────────────────
function getCreds() {
  return new Promise((resolve) =>
    chrome.storage.local.get(["employeeId", "employeeName", "baseUrl"], resolve)
  );
}

// ── Heartbeat ─────────────────────────────────────────────────────────────────
async function sendHeartbeat() {
  const { employeeId, employeeName, baseUrl } = await getCreds();
  if (!employeeId || !baseUrl) return;

  let currentPage = "/";
  try {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (tab?.url) currentPage = new URL(tab.url).pathname;
  } catch {}

  try {
    await fetch(`${baseUrl}/api/tracking/activity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId, employeeName, currentPage }),
    });
  } catch {}
}

// ── Take screenshot ───────────────────────────────────────────────────────────
async function takeScreenshot() {
  // Debounce — ignore if called within 10s of last capture
  const now = Date.now();
  if (now - lastCaptureTime < CAPTURE_COOLDOWN_MS) return;
  lastCaptureTime = now;
  const { employeeId, employeeName, baseUrl } = await getCreds();
  if (!employeeId || !baseUrl) {
    logError("No credentials stored");
    return;
  }

  try {
    const isRestricted = (url) =>
      !url ||
      url.startsWith("chrome://") ||
      url.startsWith("chrome-extension://") ||
      url.startsWith("devtools://") ||
      url.startsWith("about:");

    // Step 1: Find a capturable window
    let windowId = null;
    try {
      const [activeTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      if (activeTab && !isRestricted(activeTab.url)) {
        windowId = activeTab.windowId;
      } else {
        const allWindows = await chrome.windows.getAll({ windowTypes: ["normal"] });
        for (const win of allWindows) {
          const [tab] = await chrome.tabs.query({ active: true, windowId: win.id });
          if (tab && !isRestricted(tab.url)) { windowId = win.id; break; }
        }
      }
    } catch (e) { logError("Window search failed: " + e.message); return; }

    if (windowId === null) { logError("No capturable window found"); return; }

    // Step 2: Capture
    let dataUrl;
    try {
      dataUrl = await chrome.tabs.captureVisibleTab(windowId, { format: "jpeg", quality: 60 });
    } catch (e) { logError("captureVisibleTab: " + e.message); return; }
    if (!dataUrl) { logError("captureVisibleTab returned empty"); return; }

    // Step 3: Get Cloudinary signature
    let signData;
    try {
      const signRes = await fetch(`${baseUrl}/api/tracking/cloudinary-sign?employeeId=${employeeId}`);
      signData = await signRes.json();
    } catch (e) { logError("Sign request failed: " + e.message); return; }
    if (!signData?.success) { logError("Cloudinary sign failed: " + JSON.stringify(signData)); return; }

    // Step 4: dataUrl → Blob
    const fetchRes = await fetch(dataUrl);
    const blob     = await fetchRes.blob();
    if (!blob || blob.size < 5000) { logError("Blob too small: " + blob?.size); return; }

    // Step 5: Upload to Cloudinary
    const formData = new FormData();
    formData.append("file",      blob, "screenshot.jpg");
    formData.append("api_key",   signData.apiKey);
    formData.append("timestamp", signData.timestamp);
    formData.append("signature", signData.signature);
    formData.append("folder",    signData.folder);

    let upData;
    try {
      const upRes = await fetch(`https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`, { method: "POST", body: formData });
      upData = await upRes.json();
    } catch (e) { logError("Cloudinary upload error: " + e.message); return; }
    if (!upData?.secure_url) { logError("Upload failed: " + JSON.stringify(upData?.error)); return; }

    // Step 6: Save to Firestore via API
    try {
      await fetch(`${baseUrl}/api/tracking/screenshot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, employeeName, screenshotUrl: upData.secure_url, publicId: upData.public_id }),
      });
    } catch (e) { logError("Save to DB failed: " + e.message); return; }

    chrome.storage.local.set({ lastScreenshot: new Date().toISOString(), lastError: null });
    console.log("[HumanEdge] Screenshot saved at", new Date().toLocaleTimeString());

  } catch (err) {
    logError(err?.message || String(err));
  }
}

function logError(msg) {
  console.error("[HumanEdge] Error:", msg);
  chrome.storage.local.set({ lastError: msg + " @ " + new Date().toLocaleTimeString() });
}

// ── Message handler ───────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SET_CREDENTIALS") {
    // Only schedule first screenshot if employeeId is new (avoid duplicate calls)
    chrome.storage.local.get(["employeeId"], (existing) => {
      const isNew = existing.employeeId !== message.employeeId;
      chrome.storage.local.set({
        employeeId:   message.employeeId,
        employeeName: message.employeeName,
        baseUrl:      message.baseUrl,
      }, () => {
        setupAlarms();
        if (isNew) setTimeout(takeScreenshot, 3000);
        sendResponse({ success: true });
      });
    });
    return true;
  }

  if (message.type === "CLEAR_CREDENTIALS") {
    getCreds().then(({ employeeId, employeeName, baseUrl }) => {
      if (employeeId && baseUrl) {
        fetch(`${baseUrl}/api/tracking/offline`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ employeeId, employeeName }),
        }).catch(() => {});
      }
    });
    chrome.storage.local.remove(["employeeId", "employeeName", "lastScreenshot", "lastError"]);
    sendResponse({ success: true });
  }

  if (message.type === "GET_STATUS") {
    chrome.storage.local.get(["employeeId", "employeeName", "lastScreenshot", "lastError"], (data) => {
      sendResponse({
        connected:      !!data.employeeId,
        employeeId:     data.employeeId    || null,
        employeeName:   data.employeeName  || null,
        lastScreenshot: data.lastScreenshot || null,
        lastError:      data.lastError     || null,
      });
    });
    return true;
  }

  // Manual test trigger
  if (message.type === "TAKE_NOW") {
    takeScreenshot().then(() => sendResponse({ done: true }));
    return true;
  }
});
