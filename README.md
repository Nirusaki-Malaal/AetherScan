# AetherScan Nmap Diagnostics Extension

AetherScan is a professional-grade Firefox extension designed to run tactical network diagnostics and port scans directly from your browser. It uses Native Messaging to connect to a local Python daemon, executing Nmap scans securely and rendering high-fidelity reports.

---

## Key Features

- Tactical HUD Design: Fully styled dark theme with visual grid overlays and double-stitched technical layouts.
- Animated Sonar Scanning: A revolving radar scanner sweep that displays concentric sonar waves and live diagnostic command feeds.
- Host Telemetry Matrix: Grid panel summarizing host IP addresses, resolved names, and active scan timestamps.
- Active Ports Telemetry: Searchable, high-contrast ports table displaying port numbers, protocols, services, versions, and active state badges.
- Raw JSON reports: Clean, scrollable preformatted telemetry report with a click-to-copy utility.
- Diagnostic History Logs: Automatically stores previous diagnostic runs locally, with options to reload cached scans or wipe the log databases.

---

## Technical Architecture

The extension is structured into three main layers:

1. Frontend Interface (src/popup):
   - popup.html: Contains the tabbed UI structure.
   - popup.css: Futuristic cyber security styles.
   - popup.js: Handles active tab switching, triggers search filters, manages local storage, and handles background worker events.

2. Background Script (src/background/background.js):
   - Bridges communication between the extension UI and the native operating system messaging host using Firefox API queries.

3. Native Messaging Host (host.py):
   - A lightweight Python daemon that reads input targets from stdin, triggers the local Nmap executable, parses XML output into a clean JSON payload, and writes the response back to stdout.

---

## Prerequisites

To run AetherScan on your system, you need:

1. Nmap Security Scanner (installed and available on your system path).
2. Python 3 (installed on your system).
3. The Python 'xmltodict' module.
4. Firefox Browser.

---

## Quick Installation

### 1. Linux Setup

Run the included shell installer script:

```bash
chmod +x install.sh
./install.sh
```

The script will automatically check Python dependencies, ensure Nmap is installed, make the host.py daemon executable, register the native messaging manifest, and package the extension into an .xpi archive.

### 2. Windows Setup

Run the included batch installer script:

```cmd
install.bat
```

---

## Loading the Extension in Firefox

### Loading Temporarily (For Developers)

1. Open Firefox and type `about:debugging` in the URL bar.
2. Click "This Firefox" in the left sidebar.
3. Click "Load Temporary Add-on...".
4. Select the `aetherscan.xpi` package or `manifest.json` file in this directory.

The AetherScan brand icon will appear in your extension menu.

### Loading Permanently

1. Pack the extension by zipping the core assets (see section below).
2. Submit your packaged `.xpi` file for self-distribution at the Firefox Developer Hub (addons.mozilla.org).
3. Download the signed extension package once Mozilla completes validation.
4. Go to `about:addons` in Firefox, click the gear icon, select "Install Add-on From File", and select the signed package.

---

## Manual Packaging (Rebuilding .xpi)

To manually package the extension into a single redistributable package, run the following zip command in this directory:

```bash
zip -r aetherscan.xpi manifest.json src/ assets/
```

This creates the final `aetherscan.xpi` file containing only the core files needed by the browser.

**Note : AI Has Been Used only For UI generation .css file And some bug fixes**
