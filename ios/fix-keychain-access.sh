#!/bin/bash

# Fix keychain access for code signing
# This script helps resolve "Codesign wants to access key" errors

echo "=== Fixing Keychain Access for Code Signing ==="

# 1. Unlock the login keychain
echo "1. Unlocking login keychain..."
security unlock-keychain ~/Library/Keychains/login.keychain-db

# 2. Set keychain to not lock on sleep (for build process)
echo "2. Setting keychain timeout..."
security set-keychain-settings -t 3600 ~/Library/Keychains/login.keychain-db

# 3. Add codesign to keychain access list (if needed)
echo "3. Checking codesign keychain access..."

# Get the certificate name from the error message
CERT_NAME="Apple Development: Nirmal Patel (Spacecom Software LLP)"

# Find the certificate
CERT_ID=$(security find-certificate -c "$CERT_NAME" -p 2>/dev/null | grep -A 1 "keychain:" | head -1)

if [ -z "$CERT_ID" ]; then
    echo "   Certificate not found in keychain. Please:"
    echo "   1. Open Keychain Access app"
    echo "   2. Go to 'login' keychain"
    echo "   3. Find your certificate: '$CERT_NAME'"
    echo "   4. Double-click it and set 'Access Control' to 'Allow all applications to access this item'"
else
    echo "   Certificate found in keychain"
fi

# 4. Allow codesign to access keychain
echo "4. Granting codesign access to keychain..."
security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "" ~/Library/Keychains/login.keychain-db 2>/dev/null || true

echo ""
echo "=== Fix Complete ==="
echo ""
echo "If you still get the prompt:"
echo "1. When the prompt appears, click 'Always Allow' (not just 'Allow')"
echo "2. You may need to enter your Mac password"
echo "3. If 'Always Allow' is grayed out:"
echo "   - Open Keychain Access app"
echo "   - Find your certificate: '$CERT_NAME'"
echo "   - Double-click it"
echo "   - Go to 'Access Control' tab"
echo "   - Select 'Allow all applications to access this item'"
echo "   - Save changes"
echo ""
echo "Alternative: Run this command to allow all access:"
echo "security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k \"\" ~/Library/Keychains/login.keychain-db"






