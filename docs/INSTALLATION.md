# Spec Planner Installation Guide

This guide explains how to install Spec Planner on different operating systems.

## System Requirements

- **Operating System:** macOS 10.14+, Windows 10/11, or Linux (Ubuntu 20.04+, Fedora 35+, etc.)
- **Memory:** 4 GB RAM minimum, 8 GB recommended
- **Disk Space:** 500 MB for installation
- **Additional:** Claude Code CLI for AI features

## Download

Download the latest release from the [Releases page](https://github.com/your-org/spec-planner/releases).

Choose the appropriate installer for your operating system:
- **macOS:** `Spec Planner-x.x.x-mac-x64.dmg` (Intel) or `Spec Planner-x.x.x-mac-arm64.dmg` (Apple Silicon)
- **Windows:** `Spec Planner-x.x.x-win-x64.exe`
- **Linux:** `Spec Planner-x.x.x-linux-x86_64.AppImage`

---

## macOS Installation

### From DMG

1. Download the `.dmg` file for your Mac (Intel or Apple Silicon)
2. Double-click the downloaded file to mount it
3. Drag "Spec Planner" to the Applications folder
4. Eject the disk image
5. Launch Spec Planner from Applications

### First Launch

On first launch, you may see a security warning:

> "Spec Planner" cannot be opened because it is from an unidentified developer.

To resolve this:
1. Open **System Preferences** > **Security & Privacy** > **General**
2. Click "Open Anyway" next to the Spec Planner message
3. Confirm by clicking "Open"

For notarized releases, this warning won't appear.

### Uninstalling

1. Quit Spec Planner
2. Drag "Spec Planner" from Applications to the Trash
3. Empty the Trash

To remove all settings:
```bash
rm -rf ~/Library/Application\ Support/spec-planner
rm -rf ~/Library/Preferences/com.specplanner.app.plist
```

---

## Windows Installation

### Using the Installer

1. Download the `.exe` installer
2. Double-click to run the installer
3. If prompted by Windows Defender SmartScreen, click "More info" and then "Run anyway"
4. Choose the installation directory (default: `C:\Program Files\Spec Planner`)
5. Select whether to create desktop and Start menu shortcuts
6. Click "Install"
7. Launch Spec Planner from the Start menu or desktop shortcut

### SmartScreen Warning

On unsigned builds, Windows SmartScreen may show a warning:

> Windows protected your PC

This happens because the app is new or unsigned. To proceed:
1. Click "More info"
2. Click "Run anyway"

For signed releases with an EV certificate, this warning is less likely to appear.

### Uninstalling

1. Open **Settings** > **Apps** > **Apps & features**
2. Search for "Spec Planner"
3. Click on it and select "Uninstall"
4. Follow the uninstaller prompts

Or use the uninstaller in the Start menu under "Spec Planner".

---

## Linux Installation

### AppImage

AppImage is a universal format that works on most Linux distributions.

1. Download the `.AppImage` file
2. Make it executable:
   ```bash
   chmod +x Spec\ Planner-x.x.x-linux-x86_64.AppImage
   ```
3. Run the application:
   ```bash
   ./Spec\ Planner-x.x.x-linux-x86_64.AppImage
   ```

#### Desktop Integration

For desktop integration (menu entry, file associations), install [AppImageLauncher](https://github.com/TheAssassin/AppImageLauncher):

```bash
# Ubuntu/Debian
sudo apt install appimagelauncher

# Fedora
sudo dnf install appimagelauncher
```

Then simply double-click the AppImage file to integrate it.

### Debian/Ubuntu (.deb)

If available:
```bash
sudo dpkg -i spec-planner_x.x.x_amd64.deb
sudo apt-get install -f  # Install dependencies if needed
```

### Fedora/RHEL (.rpm)

If available:
```bash
sudo rpm -i spec-planner-x.x.x.x86_64.rpm
```

### Uninstalling

**AppImage:** Simply delete the `.AppImage` file and any desktop entries created.

**Deb/RPM:**
```bash
# Debian/Ubuntu
sudo apt remove spec-planner

# Fedora/RHEL
sudo dnf remove spec-planner
```

---

## Configuration

### Settings Location

Settings are stored in:
- **macOS:** `~/Library/Application Support/spec-planner/`
- **Windows:** `%APPDATA%\spec-planner\`
- **Linux:** `~/.config/spec-planner/`

### Claude Code CLI

Spec Planner requires the Claude Code CLI for AI features. Install it by following the [Claude Code documentation](https://claude.ai/claude-code).

By default, Spec Planner looks for `claude` in your PATH. You can configure a custom path in Settings.

---

## Troubleshooting

### Application won't start

1. **Check system requirements:** Ensure your OS version is supported
2. **Check for conflicting software:** Antivirus may block the app
3. **Run from terminal:** Launch from terminal to see error messages:
   - macOS: `/Applications/Spec\ Planner.app/Contents/MacOS/Spec\ Planner`
   - Linux: `./Spec\ Planner.AppImage`

### Claude features not working

1. Verify Claude Code CLI is installed: `claude --version`
2. Check the CLI path in Settings
3. Ensure your Claude API credentials are configured

### Display issues

1. Update your graphics drivers
2. Try disabling hardware acceleration in Settings
3. On Linux, try running with `--disable-gpu` flag

### Permission errors on Linux

If you see permission errors:
```bash
# Fix AppImage permissions
chmod +x Spec\ Planner-*.AppImage

# For sandbox issues
chmod 4755 /usr/share/chrome-sandbox
```

---

## Auto-Updates

Spec Planner can automatically check for and install updates:

1. Open **Settings** (Cmd+, / Ctrl+,)
2. Go to the **Updates** section
3. Enable "Automatically check for updates"

When an update is available:
1. A notification will appear
2. Click "Download" to download the update
3. Click "Install and Restart" to apply the update

Updates are downloaded from the GitHub Releases page.

---

## Building from Source

### Prerequisites

- Node.js 20+
- npm 10+
- Git

### Build Steps

```bash
# Clone the repository
git clone https://github.com/your-org/spec-planner.git
cd spec-planner

# Install dependencies
npm install

# Build the application
npm run build

# Package for your platform
npm run package:mac    # macOS
npm run package:win    # Windows
npm run package:linux  # Linux
```

The packaged application will be in the `release/` directory.

---

## Getting Help

- **GitHub Issues:** [Report bugs or request features](https://github.com/your-org/spec-planner/issues)
- **Documentation:** See the `specs/` directory for detailed specifications
