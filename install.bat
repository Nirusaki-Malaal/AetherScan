@echo off
setlocal

echo ======================================
echo     AetherScan Installer (Windows)
echo ======================================
echo.

echo [1/5] Checking Python dependencies...
python -m pip install xmltodict
if %errorlevel% neq 0 (
    echo [Warning] Failed to install xmltodict. Make sure Python is installed and added to PATH.
)

echo.
echo [2/5] Checking Nmap installation...
where nmap >nul 2>nul
if %errorlevel% neq 0 (
    echo   Warning: 'nmap' is not installed. The extension requires nmap to function.
    echo   Attempting to install 'nmap' automatically using winget or chocolatey...
    where winget >nul 2>nul
    if %errorlevel% equ 0 (
        echo   Running winget to install Nmap...
        winget install -e --id Insecure.Nmap --accept-package-agreements --accept-source-agreements
    ) else (
        where choco >nul 2>nul
        if %errorlevel% equ 0 (
            echo   Running choco to install Nmap...
            choco install nmap -y
        ) else (
            echo   [Error] Could not find a Windows package manager ^(winget/choco^).
            echo   Please download and install Nmap manually from https://nmap.org/download.html
        )
    )
) else (
    echo   'nmap' is already installed.
)

echo.
echo [3/5] Creating host wrapper script...
echo @echo off > host_wrapper.bat
echo python "%%~dp0host.py" %%* >> host_wrapper.bat
echo   Created host_wrapper.bat

echo.
echo [4/5] Creating Native Messaging Manifest...
set "MANIFEST_PATH=%~dp0com.nirusaki.nmap.json"
set "WRAPPER_PATH=%~dp0host_wrapper.bat"
:: Escape backslashes for JSON
set "WRAPPER_PATH_ESC=%WRAPPER_PATH:\=\\%"

echo {> "%MANIFEST_PATH%"
echo   "name": "com.nirusaki.nmap",>> "%MANIFEST_PATH%"
echo   "description": "Nmap Native Messaging Host for AetherScan",>> "%MANIFEST_PATH%"
echo   "path": "%WRAPPER_PATH_ESC%",>> "%MANIFEST_PATH%"
echo   "type": "stdio",>> "%MANIFEST_PATH%"
echo   "allowed_extensions": ["nmap@niru"]>> "%MANIFEST_PATH%"
echo }>> "%MANIFEST_PATH%"
echo   Created manifest at: %MANIFEST_PATH%

echo.
echo [5/5] Registering Host in Windows Registry...
REG ADD "HKCU\Software\Mozilla\NativeMessagingHosts\com.nirusaki.nmap" /ve /t REG_SZ /d "%MANIFEST_PATH%" /f

echo.
echo ======================================
echo        Installation Complete!
echo ======================================
echo Note: If Nmap was just installed, you may need to restart your browser
echo or computer for it to appear in your System PATH.
echo.
pause
