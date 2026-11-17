// Bridge between the page (MAIN world) and the extension.
// Only a fixed set of actions is forwarded, and only to/from this exact origin.

const ORIGIN = window.location.origin;

const PAGE_TO_EXT_ACTIONS = new Set([
    "QUESTS_UPDATE",
    "PROGRESS_UPDATE",
    "SPOOF_STATE_CHANGE",
    "CONNECTION_ERROR"
]);

const EXT_TO_PAGE_ACTIONS = new Set([
    "START_SPOOF",
    "GET_QUESTS",
    "CANCEL_SPOOF"
]);

window.addEventListener("message", function (event) {
    if (event.source !== window || event.origin !== ORIGIN) return;
    const data = event.data;
    if (!data || typeof data !== "object") return;

    if (data.source === "quest-spoofer-page") {
        if (!PAGE_TO_EXT_ACTIONS.has(data.action)) return;
        chrome.runtime.sendMessage(data).catch(() => { });
    } else if (data.source === "quest-spoofer-page-settings-req") {
        chrome.storage.local.get(['autoAccept'], (res) => {
            window.postMessage({
                source: "quest-spoofer-ext-settings",
                autoAccept: !!res.autoAccept
            }, ORIGIN);
        });
    } else if (data.source === "quest-spoofer-page-speed-req") {
        chrome.storage.local.get(['spoofSpeed'], (res) => {
            window.postMessage({
                source: "quest-spoofer-ext-speed",
                spoofSpeed: res.spoofSpeed || "normal"
            }, ORIGIN);
        });
    }
}, false);

chrome.runtime.onMessage.addListener((request, sender) => {
    // Only accept messages from our own extension (background service worker).
    if (sender.id !== chrome.runtime.id) return;
    if (!request || request.source !== "quest-spoofer-ext") return;
    if (!EXT_TO_PAGE_ACTIONS.has(request.action)) return;
    window.postMessage({
        source: "quest-spoofer-ext",
        action: request.action,
        questId: typeof request.questId === "string" ? request.questId : undefined
    }, ORIGIN);
});
