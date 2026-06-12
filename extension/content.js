// content.js — bridge between HR web app and extension background

// Announce once immediately, once after React loads
window.postMessage({ type: "HUMANEDGE_EXTENSION_READY", version: "1.0.1" }, "*");
setTimeout(() => {
  window.postMessage({ type: "HUMANEDGE_EXTENSION_READY", version: "1.0.1" }, "*");
}, 2500);

// Listen for messages from the HR web app
window.addEventListener("message", (event) => {
  if (event.source !== window) return;

  if (event.data?.type === "HUMANEDGE_SET_CREDENTIALS") {
    chrome.runtime.sendMessage(
      {
        type:         "SET_CREDENTIALS",
        employeeId:   event.data.employeeId,
        employeeName: event.data.employeeName,
        baseUrl:      event.data.baseUrl,
      },
      (res) => {
        window.postMessage({ type: "HUMANEDGE_CREDENTIALS_ACK", success: !!res?.success }, "*");
      }
    );
  }

  if (event.data?.type === "HUMANEDGE_CLEAR_CREDENTIALS") {
    chrome.runtime.sendMessage({ type: "CLEAR_CREDENTIALS" });
  }

  if (event.data?.type === "HUMANEDGE_GET_STATUS") {
    chrome.runtime.sendMessage({ type: "GET_STATUS" }, (status) => {
      window.postMessage({ type: "HUMANEDGE_STATUS", ...status }, "*");
    });
  }
});
