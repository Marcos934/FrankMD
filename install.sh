#!/bin/bash
# FrankMD installer - https://github.com/akitaonrails/FrankMD
set -e

REPO="https://raw.githubusercontent.com/akitaonrails/FrankMD/master"
CONFIG_DIR="$HOME/.config/frankmd"

echo "Installing FrankMD..."

# Create config directory
mkdir -p "$CONFIG_DIR"

# Download config files
curl -sL "$REPO/config/fed/fed.sh" -o "$CONFIG_DIR/fed.sh"
curl -sL "$REPO/config/fed/splash.html" -o "$CONFIG_DIR/splash.html"
curl -sL "$REPO/config/fed/env.example" -o "$CONFIG_DIR/env.example"
echo "  Downloaded config files to $CONFIG_DIR"

echo ""
echo "Done! Add this line to your ~/.bashrc or ~/.zshrc:"
echo ""
echo "  source $CONFIG_DIR/fed.sh"
echo ""
echo "Then reload your shell and run:"
echo ""
echo "  fed ~/my-notes"
echo ""
echo "Commands:"
echo "  fed [path]   - Open notes directory"
echo "  fed-update   - Update Docker image"
echo "  fed-stop     - Stop container"
echo ""
echo "To configure API keys, see: $CONFIG_DIR/env.example"
