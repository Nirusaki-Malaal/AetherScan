<p align="center">
  <img src="assets/logo.svg" alt="AetherScan Logo" width="540">
</p>

# AetherScan

Firefox WebExtension and native messaging daemon for executing, parsing, and inspecting Nmap network scans directly from the browser.

## Architecture

* **WebExtension Popup (`src/popup/`)**: Browser interface managing target input, scan profile selection, active port telemetry filtering, and raw JSON export.
* **Background Worker (`src/background/`)**: Manages browser-to-native message lifecycle using the WebExtension `runtime.sendNativeMessage` API.
* **Native Host (`host.py`)**: Python messaging daemon that receives 4-byte little-endian length-prefixed commands over `stdin`, executes `nmap`, parses XML diagnostic trees using `xmltodict`, and streams structured JSON to `stdout`.

## System Flow

```text
[Popup UI] ──> [Background Worker] ──> [Native Messaging Host] ──> [Nmap Binary]
                                                    │
[Port Table] <── [JSON Telemetry] <─────────────────┘
```

## Prerequisites

* Firefox Browser
* Nmap on system `PATH`
* Python 3.8+
* `xmltodict` (`pip install xmltodict`)

## Installation

### Linux

Register the native messaging host manifest:

```bash
chmod +x install.sh host.py
./install.sh
```

Load the extension in Firefox:
1. Navigate to `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on**.
3. Select `manifest.json` from the repository root.

### Windows

Execute the batch configuration script from an elevated command prompt:

```cmd
install.bat
```

## Scan Profiles

| Profile | Nmap Arguments | Scope |
| :--- | :--- | :--- |
| Quick Scan | `-F -T4` | Top 100 common ports |
| Regular Scan | `-T4` | Top 1000 standard ports |
| Service Detection | `-sV -T4` | Service versions and banners |
| Comprehensive | `-sV -sC -O -T4` | Scripts, OS detection, service versions |

## License

GPL-3.0-or-later. See LICENSE for details.
