#!/bin/bash

echo "🍎 iOS Multi-Client Target Setup Script"
echo "========================================"
echo ""

# Check if Xcode is installed
if ! command -v xcodebuild &> /dev/null; then
    echo "❌ Xcode command line tools not found. Please install Xcode first."
    exit 1
fi

echo "✅ Xcode command line tools found"
echo ""

# Client configurations
declare -A clients
clients[microscan]="com.microscan.app:Microscan:MicroscanApp"
clients[dnainfotel]="com.h8.dnasubscriber:DNA Infotel:DNAInfotelApp"
clients[onesevenstar]="com.spacecom.log2space.onesevenstar:One Sevenstar:OneSevenstarApp"

echo "📋 Available clients:"
for client in "${!clients[@]}"; do
    IFS=':' read -r bundle_id display_name target_name <<< "${clients[$client]}"
    echo "  - $client: $display_name ($bundle_id)"
done
echo ""

echo "🔧 Setup Instructions:"
echo "======================"
echo ""
echo "1. Open Xcode and your project:"
echo "   open ios/ISPApp.xcworkspace"
echo ""
echo "2. For each client, create a new target:"
echo "   - File > New > Target"
echo "   - Choose 'App' under iOS"
echo "   - Configure as follows:"
echo ""

for client in "${!clients[@]}"; do
    IFS=':' read -r bundle_id display_name target_name <<< "${clients[$client]}"
    echo "   $display_name:"
    echo "     - Product Name: $target_name"
    echo "     - Bundle Identifier: $bundle_id"
    echo "     - Language: Swift"
    echo "     - Interface: Storyboard"
    echo "     - Use Core Data: No"
    echo "     - Include Tests: No"
    echo ""
done

echo "3. Configure each target:"
echo "   - Select the target in project navigator"
echo "   - General tab: Set Display Name and Bundle Identifier"
echo "   - Build Settings: Set Product Name"
echo "   - Info tab: Set Bundle display name"
echo ""

echo "4. Set up app icons:"
echo "   - Copy icons from config/[client]/app-icons/ios/ to the target's asset catalog"
echo "   - Configure App Icons Source in General tab"
echo ""

echo "5. Create schemes:"
echo "   - Product > Scheme > Manage Schemes"
echo "   - Add new scheme for each target"
echo ""

echo "6. Test the setup:"
echo "   - Select different schemes"
echo "   - Build and run each target"
echo ""

echo "🎯 Build Commands (after setup):"
echo "================================"
for client in "${!clients[@]}"; do
    IFS=':' read -r bundle_id display_name target_name <<< "${clients[$client]}"
    echo "   $display_name:"
    echo "     xcodebuild -workspace ios/ISPApp.xcworkspace -scheme $target_name -configuration Debug -destination 'platform=iOS Simulator,name=iPhone 15'"
    echo ""
done

echo "📱 Benefits:"
echo "============"
echo "   ✅ No more manual file copying"
echo "   ✅ Each client has its own bundle ID"
echo "   ✅ Easy switching between clients"
echo "   ✅ Proper code signing per client"
echo "   ✅ Clean separation of concerns"
echo ""

echo "🚀 Ready to set up iOS targets!"
echo "   Follow the instructions above in Xcode." 