let port = null;

function connectHost() {
    port = browser.runtime.connectNative("com.nirusaki.nmap");
    port.onMessage.addListener((msg) => {
        saveScanToHistory(msg.output);
        browser.storage.local.set({ lastResult: msg.output, isScanning: false });
        browser.runtime.sendMessage({ output: msg.output }).catch(() => {});
    });
    port.onDisconnect.addListener(() => {
        port = null;
        browser.storage.local.set({ isScanning: false });
        browser.runtime.sendMessage({ output: "" }).catch(() => {});
    });
}

connectHost();

function saveScanToHistory(output) {
    browser.storage.local.get("aetherscan_history").then((data) => {
        let history = data.aetherscan_history || [];
        history = history.filter(item => item.hostname !== output.hostname);
        history.unshift({
            hostname: output.hostname,
            ipv4: output.ipv4,
            timestamp: new Date().toLocaleString(),
            ports: output.ports
        });
        if (history.length > 5) history.pop();
        browser.storage.local.set({ aetherscan_history: history });
    });
}

browser.runtime.onMessage.addListener(async (message) => {
    if (message.target) {
        if (!port) connectHost();
        browser.storage.local.set({ isScanning: true, currentTarget: message.target });
        port.postMessage({ target: message.target });
    }
});