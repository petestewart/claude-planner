#!/bin/bash
# Generate application icons from SVG source
# Requires: ImageMagick (convert), optionally iconutil (macOS)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="$SCRIPT_DIR/../build"
SVG_SOURCE="$BUILD_DIR/icon.svg"

echo "Generating icons from $SVG_SOURCE"

# Check if source SVG exists
if [ ! -f "$SVG_SOURCE" ]; then
    echo "Error: Source SVG not found at $SVG_SOURCE"
    exit 1
fi

# Check if ImageMagick is installed and use the appropriate command
MAGICK_CMD=""
if command -v magick &> /dev/null; then
    MAGICK_CMD="magick"
elif command -v convert &> /dev/null; then
    MAGICK_CMD="convert"
else
    echo "Error: ImageMagick is not installed."
    echo "Install with: brew install imagemagick (macOS) or apt-get install imagemagick (Linux)"
    exit 1
fi
echo "Using ImageMagick command: $MAGICK_CMD"

# Create icons directory for Linux
mkdir -p "$BUILD_DIR/icons"

# Generate PNG files at various sizes (for Linux and as base for other formats)
echo "Generating PNG icons..."
SIZES=(16 24 32 48 64 128 256 512 1024)
for size in "${SIZES[@]}"; do
    echo "  ${size}x${size}..."
    $MAGICK_CMD -background none -resize "${size}x${size}" "$SVG_SOURCE" "$BUILD_DIR/icons/${size}x${size}.png"
done

# Generate Windows ICO
echo "Generating Windows ICO..."
$MAGICK_CMD -background none "$SVG_SOURCE" \
    -define icon:auto-resize=256,128,64,48,32,16 \
    "$BUILD_DIR/icon.ico"

# Generate macOS ICNS (if on macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Generating macOS ICNS..."

    # Create iconset directory
    ICONSET_DIR="$BUILD_DIR/icon.iconset"
    mkdir -p "$ICONSET_DIR"

    # Required sizes for iconset
    # icon_16x16.png, icon_16x16@2x.png, icon_32x32.png, icon_32x32@2x.png
    # icon_128x128.png, icon_128x128@2x.png, icon_256x256.png, icon_256x256@2x.png
    # icon_512x512.png, icon_512x512@2x.png

    cp "$BUILD_DIR/icons/16x16.png" "$ICONSET_DIR/icon_16x16.png"
    cp "$BUILD_DIR/icons/32x32.png" "$ICONSET_DIR/icon_16x16@2x.png"
    cp "$BUILD_DIR/icons/32x32.png" "$ICONSET_DIR/icon_32x32.png"
    cp "$BUILD_DIR/icons/64x64.png" "$ICONSET_DIR/icon_32x32@2x.png"
    cp "$BUILD_DIR/icons/128x128.png" "$ICONSET_DIR/icon_128x128.png"
    cp "$BUILD_DIR/icons/256x256.png" "$ICONSET_DIR/icon_128x128@2x.png"
    cp "$BUILD_DIR/icons/256x256.png" "$ICONSET_DIR/icon_256x256.png"
    cp "$BUILD_DIR/icons/512x512.png" "$ICONSET_DIR/icon_256x256@2x.png"
    cp "$BUILD_DIR/icons/512x512.png" "$ICONSET_DIR/icon_512x512.png"
    cp "$BUILD_DIR/icons/1024x1024.png" "$ICONSET_DIR/icon_512x512@2x.png"

    # Convert to icns
    iconutil -c icns "$ICONSET_DIR" -o "$BUILD_DIR/icon.icns"

    # Clean up iconset
    rm -rf "$ICONSET_DIR"

    echo "macOS ICNS generated successfully"
else
    echo "Note: Run this script on macOS to generate the .icns file"
    echo "      Or use a tool like png2icns"
fi

echo ""
echo "Icon generation complete!"
echo "Generated files:"
ls -la "$BUILD_DIR"/icon.* 2>/dev/null || true
ls -la "$BUILD_DIR"/icons/ 2>/dev/null || true
