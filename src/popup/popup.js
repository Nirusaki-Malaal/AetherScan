let curTarget = "";
let lastScan = null;
let portsList = [];
let logTimer = null;

const el = {
    targetInput: document.getElementById("targetInput"),
    btnClearTarget: document.getElementById("btnClearTarget"),
    btnExecuteScan: document.getElementById("btnExecuteScan"),
    activeTabHost: document.getElementById("activeTabHost"),
    portsCountBadge: document.getElementById("ports-count"),

    tabScan: document.getElementById("tab-scan"),
    tabHost: document.getElementById("tab-host"),
    tabPorts: document.getElementById("tab-ports"),
    tabHistory: document.getElementById("tab-history"),
    tabRaw: document.getElementById("tab-raw"),
    scanCard: document.querySelector(".scan-setup"),
    radarContainer: document.getElementById("radarContainer"),
    scanningTarget: document.getElementById("scanningTarget"),
    consoleLogs: document.getElementById("consoleLogs"),

    hostIp: document.getElementById("host-ip"),
    hostName: document.getElementById("host-name"),
    hostStatus: document.getElementById("host-status"),
    hostTimestamp: document.getElementById("host-timestamp"),

    portSearchInput: document.getElementById("portSearchInput"),
    portsTableBody: document.getElementById("portsTableBody"),
    portsEmptyState: document.getElementById("portsEmptyState"),

    historyList: document.getElementById("historyList"),
    historyEmpty: document.getElementById("historyEmpty"),
    btnClearHistory: document.getElementById("btnClearHistory"),

    rawJsonOutput: document.getElementById("rawJsonOutput"),
    btnCopyRaw: document.getElementById("btnCopyRaw"),

    toast: document.getElementById("toast"),
    toastMessage: document.getElementById("toastMessage")
};


document.querySelectorAll(".preset-chip").forEach(chip => {
    chip.addEventListener("click", () => {
        el.targetInput.value = chip.getAttribute("data-target");
        el.targetInput.focus();
    });
});

el.btnClearTarget.addEventListener("click", () => {
    el.targetInput.value = "";
    el.targetInput.focus();
});


const ext = typeof browser !== 'undefined' ? browser : chrome;

async function detectActiveTab() {
    try {
        const tabs = await ext.tabs.query({ active: true, currentWindow: true });
        if (tabs && tabs[0] && tabs[0].url) {
            const url = new URL(tabs[0].url);
            if (url.hostname && !url.protocol.startsWith("chrome") && !url.protocol.startsWith("about") && !url.protocol.startsWith("moz-extension")) {
                el.activeTabHost.textContent = url.hostname;
                el.targetInput.value = url.hostname;
                return;
            }
        }
        el.activeTabHost.textContent = "none (external system)"; // some samples givee to perform scans
        el.targetInput.value = "scanme.nmap.org";
    } catch (e) {
        console.error("Failed to query browser tabs:", e);
        el.activeTabHost.textContent = "sandbox console";
        el.targetInput.value = "scanme.nmap.org";
    }
}

const tabs = document.querySelectorAll(".tab-btn");
const panels = document.querySelectorAll(".tab-panel");

tabs.forEach(btn => {
    btn.addEventListener("click", () => {
        const targetTab = btn.getAttribute("data-tab");

        tabs.forEach(b => b.classList.remove("active"));
        panels.forEach(p => p.classList.remove("active"));

        btn.classList.add("active");
        document.getElementById(targetTab).classList.add("active");
    });
});

function enableTabs() {
    document.getElementById("btn-tab-host").removeAttribute("disabled");
    document.getElementById("btn-tab-ports").removeAttribute("disabled");
    document.getElementById("btn-tab-raw").removeAttribute("disabled");
}

function selectTab(tabId) {
    const btn = document.getElementById(`btn-${tabId}`);
    if (btn) btn.click();
}

const loadingMsgs = [
    "Initializing virtual sockets and packet interfaces...",
    "Sending SYN probe sequences to standard network ports...",
    "Analyzing ACK responses, mapping active hosts...",
    "Querying fingerprint dictionary for service banner matching...",
    "Initiating OS heuristics engines (-sV suite)...",
    "Finalizing structural JSON diagnostics output...",
    "Diagnostic complete. Transmitting payload..."
];

function showLoadingState(target) {
    el.targetInput.disabled = true;
    el.btnExecuteScan.disabled = true;

    el.scanCard.classList.add("hidden");
    el.radarContainer.classList.remove("hidden");
    el.scanningTarget.textContent = `Target: ${target}`;

    el.consoleLogs.textContent = "";

    let idx = 0;
    const addLog = () => {
        if (idx < loadingMsgs.length) {
            const line = document.createElement("p");
            line.className = "log-line";
            const span = document.createElement("span");
            span.className = "text-cyan";
            span.textContent = ">";
            line.appendChild(span);
            line.appendChild(document.createTextNode(` ${loadingMsgs[idx]}`));
            el.consoleLogs.appendChild(line);
            el.consoleLogs.scrollTop = el.consoleLogs.scrollHeight;
            idx++;
        }
    };

    addLog();
    logTimer = setInterval(addLog, 650);
}

function hideLoadingState() {
    clearInterval(logTimer);

    el.targetInput.disabled = false;
    el.btnExecuteScan.disabled = false;

    el.scanCard.classList.remove("hidden");
    el.radarContainer.classList.add("hidden");
}

el.btnExecuteScan.addEventListener("click", () => {
    const target = el.targetInput.value.trim();
    if (!target) {
        showToast("Error: Target field is required");
        return;
    }

    curTarget = target;
    showLoadingState(target);

    ext.runtime.sendMessage({ target: target });
});

ext.runtime.onMessage.addListener((message) => {
    if (message && message.output) {
        renderScanResults(message.output);
        showToast("Scan finished successfully!");
    } else {
        hideLoadingState();
        showToast("Error executing scan. Verify server logs.");
    }
});

ext.storage.local.get(["isScanning", "currentTarget", "lastResult", "savedInput"]).then(data => {
    if (data.savedInput) {
        el.targetInput.value = data.savedInput;
    }
    if (data.isScanning && data.currentTarget) {
        curTarget = data.currentTarget;
        showLoadingState(curTarget);
    } else if (data.lastResult) {
        renderScanResults(data.lastResult);
    }
});

el.targetInput.addEventListener("input", (e) => {
    ext.storage.local.set({ savedInput: e.target.value });
});

function renderScanResults(output) {
    lastScan = output;
    portsList = output.ports || [];

    if (!Array.isArray(portsList)) {
        if (portsList && typeof portsList === 'object') {
            portsList = [portsList];
        } else {
            portsList = [];
        }
    }

    hideLoadingState();
    enableTabs();

    el.portsCountBadge.textContent = portsList.length;

    el.hostIp.textContent = output.ipv4 || "Unknown";
    el.hostName.textContent = output.hostname || curTarget;
    el.hostStatus.textContent = portsList.length > 0 ? "ACTIVE (PORTS DETECTED)" : "INACTIVE / SECURED";
    el.hostStatus.className = portsList.length > 0 ? "grid-value text-green" : "grid-value text-muted";
    el.hostTimestamp.textContent = new Date().toLocaleString();

    renderPortsTable(portsList);
    el.rawJsonOutput.textContent = JSON.stringify(output, null, 2);

    selectTab("ports");
}

function renderPortsTable(ports) {
    el.portsTableBody.textContent = "";

    if (ports.length === 0) {
        el.portsEmptyState.classList.remove("hidden");
        return;
    }

    el.portsEmptyState.classList.add("hidden");

    ports.forEach(p => {
        const tr = document.createElement("tr");

        const tdPort = document.createElement("td");
        const spanPort = document.createElement("span");
        spanPort.className = "port-badge";
        spanPort.textContent = p.port_num || "N/A";
        tdPort.appendChild(spanPort);
        tr.appendChild(tdPort);

        const tdProtocol = document.createElement("td");
        tdProtocol.textContent = (p.protocol || "tcp").toUpperCase();
        tr.appendChild(tdProtocol);

        const tdService = document.createElement("td");
        const spanService = document.createElement("span");
        spanService.className = "service-badge";
        spanService.textContent = p.service_name || "unknown";
        tdService.appendChild(spanService);
        tr.appendChild(tdService);

        const tdVersion = document.createElement("td");
        tdVersion.textContent = p.version || "-";
        tr.appendChild(tdVersion);

        const tdState = document.createElement("td");
        const spanState = document.createElement("span");
        spanState.className = "state-pill";
        spanState.textContent = "open";
        tdState.appendChild(spanState);
        tr.appendChild(tdState);

        el.portsTableBody.appendChild(tr);
    });
}

el.portSearchInput.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (!query) {
        renderPortsTable(portsList);
        return;
    }

    const filtered = portsList.filter(p => {
        const portStr = (p.port_num || "").toString().toLowerCase();
        const protocolStr = (p.protocol || "").toLowerCase();
        const serviceStr = (p.service_name || "").toLowerCase();
        return portStr.includes(query) || protocolStr.includes(query) || serviceStr.includes(query);
    });

    renderPortsTable(filtered);
});

function renderHistoryList() {
    el.historyList.textContent = "";

    ext.storage.local.get("aetherscan_history").then(data => {
        const history = data.aetherscan_history || [];

        if (history.length === 0) {
            el.historyEmpty.classList.remove("hidden");
            return;
        }

        el.historyEmpty.classList.add("hidden");

        history.forEach(item => {
            const container = document.createElement("div");
            container.className = "history-item";

            const details = document.createElement("div");
            details.className = "history-details";

            const hostSpan = document.createElement("span");
            hostSpan.className = "history-host";
            hostSpan.textContent = item.hostname;

            const metaSpan = document.createElement("span");
            metaSpan.className = "history-meta";
            metaSpan.textContent = `${item.ipv4 || "No IP"} \u2022 ${item.timestamp}`;

            details.appendChild(hostSpan);
            details.appendChild(metaSpan);
            container.appendChild(details);

            const button = document.createElement("button");
            button.className = "btn-load-history";
            button.setAttribute("data-host", item.hostname);
            button.textContent = "RELOAD";

            button.addEventListener("click", () => {
                curTarget = item.hostname;
                renderScanResults(item);
                showToast(`Loaded cached scan for ${item.hostname}`);
            });

            container.appendChild(button);
            el.historyList.appendChild(container);
        });
    });
}

el.btnClearHistory.addEventListener("click", () => {
    ext.storage.local.remove("aetherscan_history");
    renderHistoryList();
    showToast("Diagnostic history databases wiped clean.");
});

el.btnCopyRaw.addEventListener("click", () => {
    if (!lastScan) return;

    const text = JSON.stringify(lastScan, null, 2);
    navigator.clipboard.writeText(text).then(() => {
        showToast("Report copied to secure clipboard!");
    }).catch(err => {
        console.error("Failed to copy data:", err);
        showToast("Error copying to clipboard");
    });
});

let toastTimeout = null;

function showToast(message) {
    if (toastTimeout) clearTimeout(toastTimeout);

    el.toastMessage.textContent = message.toUpperCase();
    el.toast.classList.remove("hidden");

    toastTimeout = setTimeout(() => {
        el.toast.classList.add("hidden");
    }, 2800);
}

document.addEventListener("DOMContentLoaded", () => {
    detectActiveTab();
    renderHistoryList();
});


