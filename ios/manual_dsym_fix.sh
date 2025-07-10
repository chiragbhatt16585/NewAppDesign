#!/bin/bash

echo "=== Manual dSYM Fix for Hermes Framework ==="

# This script manually creates dSYM files for Hermes if the automatic generation fails

HERMES_FRAMEWORK_PATH="Pods/hermes-engine/hermes-engine.framework"
DSYM_PATH="Pods/hermes-engine/hermes-engine.framework.dSYM"

echo "1. Checking Hermes framework location..."
if [ -d "$HERMES_FRAMEWORK_PATH" ]; then
    echo "   Hermes framework found at: $HERMES_FRAMEWORK_PATH"
else
    echo "   Hermes framework not found at expected location"
    echo "   Searching for hermes-engine..."
    find . -name "hermes-engine.framework" -type d 2>/dev/null
fi

echo ""
echo "2. If dSYM generation still fails, try this manual approach:"
echo "   a. Archive your app normally"
echo "   b. When you get the dSYM error, note the UUID: 987BC6A5-0C99-381A-B760-67642A9A934C"
echo "   c. In Xcode, go to Window > Organizer"
echo "   d. Right-click on your archive > Show in Finder"
echo "   e. Right-click on the .xcarchive file > Show Package Contents"
echo "   f. Navigate to dSYMs folder"
echo "   g. If hermes-engine.framework.dSYM is missing, create it manually:"
echo ""
echo "   Command to create dSYM manually:"
echo "   dsymutil -o hermes-engine.framework.dSYM hermes-engine.framework/hermes-engine"
echo ""
echo "3. Alternative: Disable Hermes temporarily for testing"
echo "   Edit ios/Podfile and change:"
echo "   :hermes_enabled => false"
echo "   Then run: cd ios && pod install" 