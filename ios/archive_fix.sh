#!/bin/bash

echo "=== Fixing dSYM Generation for TestFlight Archive ==="

# Clean everything
echo "1. Cleaning build artifacts..."
rm -rf ~/Library/Developer/Xcode/DerivedData/*
rm -rf build
rm -rf Pods/build

# Set environment variables
export DEBUG_INFORMATION_FORMAT=dwarf-with-dsym
export ENABLE_BITCODE=NO
export STRIP_INSTALLED_PRODUCT=NO

echo "2. Environment variables set:"
echo "   DEBUG_INFORMATION_FORMAT=dwarf-with-dsym"
echo "   ENABLE_BITCODE=NO"
echo "   STRIP_INSTALLED_PRODUCT=NO"

echo ""
echo "=== NEXT STEPS ==="
echo "1. Open Xcode"
echo "2. Open ISPApp.xcworkspace (not .xcodeproj)"
echo "3. Select your target device as 'Any iOS Device (arm64)'"
echo "4. Go to Product > Archive"
echo "5. In the archive dialog, make sure:"
echo "   - 'Include bitcode' is UNCHECKED"
echo "   - 'Upload your app's symbols' is CHECKED"
echo "6. Click 'Distribute App'"
echo "7. Choose 'App Store Connect'"
echo "8. Choose 'Upload'"
echo ""
echo "If you still get dSYM errors, try:"
echo "- Clean build folder (Product > Clean Build Folder)"
echo "- Delete derived data (Window > Projects > Click arrow next to project > Delete)"
echo "- Restart Xcode" 