#!/bin/bash

# Fix "Command PhaseScriptExecution failed with a nonzero exit code" error
# This script helps identify and fix common build script failures

echo "=== Fixing Build Script Errors ==="
echo ""

# 1. Check for .xcode.env file (required for React Native)
echo "1. Checking React Native environment files..."
if [ ! -f ".xcode.env" ]; then
    echo "   ⚠️  .xcode.env file missing, creating it..."
    echo 'export NODE_BINARY=$(command -v node)' > .xcode.env
    echo "   ✅ Created .xcode.env"
else
    echo "   ✅ .xcode.env exists"
fi

if [ ! -f ".xcode.env.local" ]; then
    echo "   ℹ️  .xcode.env.local not found (optional, but recommended)"
    echo "   Creating .xcode.env.local with node path..."
    echo 'export NODE_BINARY=$(command -v node)' > .xcode.env.local
    echo "   ✅ Created .xcode.env.local"
fi

# 2. Check Node.js installation
echo ""
echo "2. Checking Node.js installation..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "   ✅ Node.js found: $NODE_VERSION"
    NODE_PATH=$(command -v node)
    echo "   📍 Node path: $NODE_PATH"
else
    echo "   ❌ Node.js not found! This will cause build failures."
    echo "   Please install Node.js or set NODE_BINARY in .xcode.env"
    exit 1
fi

# 3. Check Podfile.lock sync
echo ""
echo "3. Checking CocoaPods sync..."
if [ -f "Podfile.lock" ] && [ -f "Pods/Manifest.lock" ]; then
    if diff Podfile.lock Pods/Manifest.lock > /dev/null 2>&1; then
        echo "   ✅ Podfile.lock is in sync"
    else
        echo "   ⚠️  Podfile.lock is out of sync!"
        echo "   Running 'pod install' to fix..."
        pod install
    fi
else
    echo "   ⚠️  Podfile.lock or Manifest.lock missing"
    echo "   Running 'pod install'..."
    pod install
fi

# 4. Check Ruby/Python for Firebase script
echo ""
echo "4. Checking dependencies for Firebase script..."
if command -v ruby &> /dev/null; then
    RUBY_VERSION=$(ruby --version)
    echo "   ✅ Ruby found: $RUBY_VERSION"
else
    echo "   ⚠️  Ruby not found (needed for Firebase config script)"
fi

if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo "   ✅ Python3 found: $PYTHON_VERSION"
else
    echo "   ❌ Python3 not found! Firebase script will fail."
    echo "   Install Python3: brew install python3"
fi

# 5. Check script permissions
echo ""
echo "5. Checking script permissions..."
SCRIPTS=(
    "scripts/copy-razorpay-dsyms.sh"
    "scripts/fix-razorpay-code-sign.sh"
)

for script in "${SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        if [ -x "$script" ]; then
            echo "   ✅ $script is executable"
        else
            echo "   ⚠️  Making $script executable..."
            chmod +x "$script"
        fi
    fi
done

# 6. Clean build artifacts
echo ""
echo "6. Cleaning build artifacts..."
rm -rf ~/Library/Developer/Xcode/DerivedData/*
echo "   ✅ Cleaned DerivedData"

# 7. Check for firebase.json (optional but recommended)
echo ""
echo "7. Checking for firebase.json..."
if [ -f "../firebase.json" ]; then
    echo "   ✅ firebase.json found"
    # Validate JSON syntax
    if python3 -m json.tool ../firebase.json > /dev/null 2>&1; then
        echo "   ✅ firebase.json is valid JSON"
    else
        echo "   ⚠️  firebase.json has syntax errors!"
        echo "   This will cause Firebase config script to fail"
    fi
else
    echo "   ℹ️  firebase.json not found (optional, but recommended)"
fi

echo ""
echo "=== Fix Complete ==="
echo ""
echo "Next steps:"
echo "1. Open Xcode"
echo "2. Clean Build Folder (Product > Clean Build Folder or Cmd+Shift+K)"
echo "3. Try archiving again"
echo ""
echo "If error persists, check the build log in Xcode to see which specific script failed:"
echo "- Look for the script name in the error message"
echo "- Common failing scripts:"
echo "  • 'Bundle React Native code and images' - Check Node.js path"
echo "  • '[CP-User] [RNFB] Core Configuration' - Check firebase.json syntax"
echo "  • '[CP] Embed Pods Frameworks' - Check CocoaPods installation"
echo "  • 'Copy Razorpay dSYMs' - Check script permissions"

