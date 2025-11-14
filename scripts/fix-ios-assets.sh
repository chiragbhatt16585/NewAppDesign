#!/bin/bash

# Script to fix iOS image assets
# This ensures images are properly linked in the Xcode project

echo "🔧 Fixing iOS Image Assets..."

# Navigate to project root
cd "$(dirname "$0")/.."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found. Please run this script from the project root."
  exit 1
fi

echo "📦 Linking assets using react-native-asset..."
npx react-native-asset

echo "✅ Assets linked successfully!"
echo ""
echo "📱 Next steps:"
echo "1. Open ios/ISPApp.xcworkspace in Xcode"
echo "2. In Xcode, select the ISPApp project in the navigator"
echo "3. Go to Build Phases > Copy Bundle Resources"
echo "4. Make sure all images from src/assets/ are listed"
echo "5. If not, click '+' and add them manually"
echo "6. Clean build folder: Product > Clean Build Folder (Shift+Cmd+K)"
echo "7. Rebuild the app"
echo ""
echo "Alternatively, you can run:"
echo "  cd ios && pod install && cd .."
echo "  npx react-native run-ios"
