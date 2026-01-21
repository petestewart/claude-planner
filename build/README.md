# Build Resources

This directory contains resources needed for building and packaging the Spec Planner application.

## Icon Generation

The application requires icons in multiple formats for different platforms:

### Required Files

| File | Platform | Notes |
|------|----------|-------|
| `icon.icns` | macOS | Multi-resolution icon bundle |
| `icon.ico` | Windows | Multi-resolution icon file |
| `icons/` | Linux | Directory with PNG files at various sizes |

### Icon Sizes

Linux icons should include the following sizes in the `icons/` directory:
- `16x16.png`
- `24x24.png`
- `32x32.png`
- `48x48.png`
- `64x64.png`
- `128x128.png`
- `256x256.png`
- `512x512.png`
- `1024x1024.png` (optional, for high-DPI)

### Generating Icons from SVG

1. **Using ImageMagick (cross-platform):**

   ```bash
   # Generate PNG files for Linux
   for size in 16 24 32 48 64 128 256 512 1024; do
     convert -background none -resize ${size}x${size} icon.svg icons/${size}x${size}.png
   done

   # Generate ICO for Windows (requires multiple sizes)
   convert icon.svg -define icon:auto-resize=256,128,64,48,32,16 icon.ico
   ```

2. **Using iconutil on macOS (for .icns):**

   ```bash
   # Create iconset directory
   mkdir icon.iconset

   # Generate all required sizes
   for size in 16 32 64 128 256 512; do
     sips -z $size $size icon.png --out icon.iconset/icon_${size}x${size}.png
     sips -z $((size*2)) $((size*2)) icon.png --out icon.iconset/icon_${size}x${size}@2x.png
   done

   # Convert to icns
   iconutil -c icns icon.iconset
   ```

3. **Using electron-icon-builder (recommended):**

   ```bash
   npx electron-icon-builder --input=icon.svg --output=./
   ```

## Code Signing

### macOS

Set the following environment variables:
- `CSC_LINK`: Path to your .p12 certificate file
- `CSC_KEY_PASSWORD`: Password for the certificate

For notarization:
- `APPLE_ID`: Your Apple ID email
- `APPLE_APP_SPECIFIC_PASSWORD`: App-specific password from Apple
- `APPLE_TEAM_ID`: Your Apple Developer Team ID

### Windows

Set the following environment variables:
- `CSC_LINK`: Path to your .pfx certificate file
- `CSC_KEY_PASSWORD`: Password for the certificate

For EV certificates, Windows SmartScreen recognition requires:
1. Extended Validation (EV) code signing certificate
2. Consistent signing over time to build reputation

## Files in This Directory

- `icon.svg` - Source SVG icon (edit this to change the app icon)
- `icon.icns` - macOS icon bundle (generate from SVG)
- `icon.ico` - Windows icon (generate from SVG)
- `icons/` - Linux icons at various sizes (generate from SVG)
- `entitlements.mac.plist` - macOS entitlements for hardened runtime
- `linux/` - Linux-specific scripts
  - `after-install.sh` - Post-installation script
  - `after-remove.sh` - Post-removal script
