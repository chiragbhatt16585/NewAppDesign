#!/bin/bash

# Fix dSYM generation for Hermes framework
echo "Fixing dSYM generation for Hermes framework..."

# Clean build folder
rm -rf ~/Library/Developer/Xcode/DerivedData/*
rm -rf ios/build

# Update build settings for dSYM generation
xcodebuild -project ISPApp.xcodeproj -target ISPApp -configuration Release clean

# Set environment variables for dSYM generation
export DEBUG_INFORMATION_FORMAT=dwarf-with-dsym
export ENABLE_BITCODE=NO
export STRIP_INSTALLED_PRODUCT=NO

echo "Build settings updated for dSYM generation"
echo "Now try archiving again with:"
echo "1. Open Xcode"
echo "2. Select Product > Archive"
echo "3. Make sure 'Include bitcode' is unchecked"
echo "4. Make sure 'Upload your app's symbols' is checked" 