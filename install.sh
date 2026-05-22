#!/usr/bin/env bash

# Installer for AetherScan Firefox Extension and Native Messaging Host
# This script configures the native messaging host and packages the extension.

set -e

# Get absolute path to the directory containing this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
HOST_NAME="com.nirusaki.nmap"
MOZILLA_DIR="$HOME/.mozilla/native-messaging-hosts"
MANIFEST_PATH="$MOZILLA_DIR/$HOST_NAME.json"

echo "======================================"
echo "    AetherScan Installer Started"
echo "======================================"
echo

# 1. Install Python dependencies
echo "[1/4] Checking Python dependencies..."
if ! python3 -c "import xmltodict" &> /dev/null; then
    echo "  Installing required Python package 'xmltodict'..."
    python3 -m pip install --break-system-packages xmltodict --user || python3 -m pip install xmltodict --user
else
    echo "  'xmltodict' is already installed."
fi

if ! command -v nmap &> /dev/null; then
    echo "  Warning: 'nmap' is not installed. The extension requires nmap to function."
    echo "  Attempting to install 'nmap' automatically (this may require your sudo password)..."
    if command -v apt-get &> /dev/null; then
        sudo apt-get update && sudo apt-get install -y nmap
    elif command -v dnf &> /dev/null; then
        sudo dnf install -y nmap
    elif command -v yum &> /dev/null; then
        sudo yum install -y nmap
    elif command -v pacman &> /dev/null; then
        sudo pacman -S --noconfirm nmap
    else
        echo "  Could not detect your package manager. Please install nmap manually."
    fi
else
    echo "  'nmap' is already installed."
fi

# 2. Make host.py executable
echo "[2/4] Setting permissions for host script..."
HOST_PATH="$DIR/host.py"
chmod +x "$HOST_PATH"
echo "  Made $HOST_PATH executable."

# 3. Create and install native messaging manifest
echo "[3/4] Creating Native Messaging Manifest..."
mkdir -p "$MOZILLA_DIR"

cat << EOF > "$MANIFEST_PATH"
{
  "name": "$HOST_NAME",
  "description": "Nmap Native Messaging Host for AetherScan",
  "path": "$HOST_PATH",
  "type": "stdio",
  "allowed_extensions": ["nmap@niru"]
}
EOF

echo "  Manifest installed securely at: $MANIFEST_PATH"

# 4. Package the extension
echo "[4/4] Packaging Firefox Extension (.xpi)..."
if command -v zip &> /dev/null; then
    rm -f "$DIR/aetherscan.xpi"
    cd "$DIR"
    zip -r aetherscan.xpi manifest.json src/ assets/ > /dev/null
    echo "  Extension packaged successfully: $DIR/aetherscan.xpi"
else
    echo "  'zip' command not found. Skipping creating aetherscan.xpi."
    echo "  (You can still load the extension directly from the manifest.json)"
fi

echo
echo "======================================"
echo "      Installation Complete!"
echo "======================================"
echo "To test the extension temporarily:"
echo "1. Open Firefox, go to: about:debugging#/runtime/this-firefox"
echo "2. Click 'Load Temporary Add-on...'"
echo "3. Select 'aetherscan.xpi' or 'manifest.json' from this folder."
echo ""
echo "To install PERMANENTLY in standard Firefox:"
echo "1. Go to https://addons.mozilla.org/en-US/developers/"
echo "2. Submit 'aetherscan.xpi' for 'Self-Distribution' (On my own)."
echo "3. Download the signed extension they provide."
echo "4. Go to about:addons in Firefox, click the ⚙️ icon, and choose 'Install Add-on From File'."
echo "======================================"
