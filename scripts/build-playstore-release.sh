#!/bin/bash

# Play Store Release Build Script
# Builds AAB files for all clients for Play Store upload

set -e  # Exit on any error

echo "🚀 Play Store Release Build Script"
echo "=================================="
echo ""

# Check if we're in the right directory
if [ ! -f "android/app/build.gradle" ]; then
    echo "❌ Error: Please run this script from the ISPApp root directory"
    echo "   Current directory: $(pwd)"
    exit 1
fi

# Client configurations
clients_microscan="Microscan:com.microscan.app:33.0.0"
clients_dnainfotel="DNA Infotel:com.h8.dnasubscriber:291.0.0"
clients_onesevenstar="One Sevenstar:com.spacecom.log2space.onesevenstar:4.0.0"

# Function to build a client
build_client() {
    local client=$1
    local client_info_var="clients_${client}"
    local client_info=${!client_info_var}
    IFS=':' read -r display_name bundle_id version <<< "$client_info"
    
    echo "📱 Building $display_name ($bundle_id) - Version $version"
    
    # Convert client name to proper case for gradle command
    case $client in
        "microscan")
            gradle_task="bundleMicroscanRelease"
            ;;
        "dnainfotel")
            gradle_task="bundleDnainfotelRelease"
            ;;
        "onesevenstar")
            gradle_task="bundleOnesevenstarRelease"
            ;;
    esac
    
    echo "   Command: ./gradlew $gradle_task"
    echo ""
    
    # Build the AAB
    cd android
    if ./gradlew $gradle_task; then
        echo "✅ Successfully built $display_name"
        
        # Find the AAB file
        aab_file="app/build/outputs/bundle/${client}Release/app-${client}-release.aab"
        if [ -f "$aab_file" ]; then
            file_size=$(du -h "$aab_file" | cut -f1)
            echo "📦 AAB file: $aab_file ($file_size)"
        else
            echo "⚠️  AAB file not found at expected location"
        fi
    else
        echo "❌ Failed to build $display_name"
        return 1
    fi
    
    cd ..
    echo ""
}

# Function to show build status
show_status() {
    echo "📊 Build Status:"
    echo "================"
    
    for client in microscan dnainfotel onesevenstar; do
        local client_info_var="clients_${client}"
        local client_info=${!client_info_var}
        IFS=':' read -r display_name bundle_id version <<< "$client_info"
        
        aab_file="android/app/build/outputs/bundle/${client}Release/app-${client}-release.aab"
        if [ -f "$aab_file" ]; then
            file_size=$(du -h "$aab_file" | cut -f1)
            echo "✅ $display_name: $aab_file ($file_size)"
        else
            echo "❌ $display_name: Not built"
        fi
    done
    echo ""
}

# Function to validate keystores
validate_keystores() {
    echo "🔐 Validating Keystore Files:"
    echo "============================="
    
    local missing_keystores=()
    
    for client in microscan dnainfotel onesevenstar; do
        local client_info_var="clients_${client}"
        local client_info=${!client_info_var}
        IFS=':' read -r display_name bundle_id version <<< "$client_info"
        
        case $client in
            "microscan")
                keystore="android/app/Log2SpaceEndUserMicroscan.jks"
                ;;
            "dnainfotel")
                keystore="android/app/Log2spaceDNAInfotelAppKey.jks"
                ;;
            "onesevenstar")
                keystore="android/app/OneSevenStar.jks"
                ;;
        esac
        
        if [ -f "$keystore" ]; then
            echo "✅ $display_name: $keystore"
        else
            echo "❌ $display_name: Missing $keystore"
            missing_keystores+=("$keystore")
        fi
    done
    
    if [ ${#missing_keystores[@]} -gt 0 ]; then
        echo ""
        echo "⚠️  Missing keystore files:"
        for keystore in "${missing_keystores[@]}"; do
            echo "   - $keystore"
        done
        echo ""
        echo "Please ensure all keystore files are present before building."
        return 1
    fi
    
    echo ""
    return 0
}

# Main script
main() {
    echo "🎯 Building Play Store Releases for All Clients"
    echo ""
    
    # Validate keystores first
    if ! validate_keystores; then
        exit 1
    fi
    
    # Check command line arguments
    if [ $# -eq 0 ]; then
        # Build all clients
        echo "🏗️  Building all clients..."
        echo ""
        
        for client in microscan dnainfotel onesevenstar; do
            if ! build_client "$client"; then
                echo "❌ Failed to build all clients"
                exit 1
            fi
        done
        
        echo "🎉 All clients built successfully!"
        
    elif [ $# -eq 1 ]; then
        # Build specific client
        client=$1
        if [[ "$client" == "microscan" || "$client" == "dnainfotel" || "$client" == "onesevenstar" ]]; then
            build_client "$client"
        else
            echo "❌ Unknown client: $client"
            echo "Available clients: microscan dnainfotel onesevenstar"
            exit 1
        fi
    else
        echo "Usage: $0 [client_name]"
        echo "Available clients: ${!clients[*]}"
        echo "If no client specified, builds all clients"
        exit 1
    fi
    
    # Show final status
    show_status
    
    echo "📋 Next Steps:"
    echo "=============="
    echo "1. Upload AAB files to Google Play Console"
    echo "2. Add release notes for each client"
    echo "3. Review and roll out to production"
    echo ""
    echo "📁 AAB files location:"
    echo "   android/app/build/outputs/bundle/*/app-*-release.aab"
    echo ""
}

# Run the script
main "$@" 