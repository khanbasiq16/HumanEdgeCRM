const dot        = document.getElementById("dot");
const statusText = document.getElementById("status-text");
const statusSub  = document.getElementById("status-sub");
const metaBox    = document.getElementById("meta-box");
const notConn    = document.getElementById("not-connected");
const empName    = document.getElementById("emp-name");
const lastSsEl   = document.getElementById("last-ss");
const testRow    = document.getElementById("test-row");
const testBtn    = document.getElementById("test-btn");
const testResult = document.getElementById("test-result");
const lastErrEl  = document.getElementById("last-error");

chrome.runtime.sendMessage({ type: "GET_STATUS" }, (status) => {
  if (status?.connected) {
    dot.className          = "dot green";
    statusText.textContent = "Monitoring Active";
    statusSub.textContent  = "Screenshots running silently";
    metaBox.style.display  = "block";
    notConn.style.display  = "none";
    testRow.style.display  = "block";
    empName.textContent    = status.employeeName || "—";

    if (status.lastScreenshot) {
      const diff = Math.floor((Date.now() - new Date(status.lastScreenshot)) / 60000);
      lastSsEl.textContent = diff < 1 ? "Just now" : `${diff}m ago`;
    } else {
      lastSsEl.textContent = "Pending…";
    }

    if (status.lastError) {
      lastErrEl.textContent = "Last error: " + status.lastError;
    }
  } else {
    dot.className          = "dot gray";
    statusText.textContent = "Not Connected";
    statusSub.textContent  = "Log in to HR app first";
    metaBox.style.display  = "none";
    notConn.style.display  = "block";
    testRow.style.display  = "none";
  }
});

testBtn?.addEventListener("click", () => {
  testBtn.textContent    = "Capturing…";
  testBtn.disabled       = true;
  testResult.textContent = "";
  lastErrEl.textContent  = "";

  chrome.runtime.sendMessage({ type: "TAKE_NOW" }, (res) => {
    testBtn.textContent = "Take Screenshot Now";
    testBtn.disabled    = false;

    // Re-fetch status to see if it worked or errored
    chrome.storage.local.get(["lastScreenshot", "lastError"], (data) => {
      if (data.lastError) {
        lastErrEl.textContent  = "Error: " + data.lastError;
        testResult.textContent = "";
      } else {
        testResult.textContent = "Done! Check admin panel.";
        lastErrEl.textContent  = "";
      }
    });
  });
});
