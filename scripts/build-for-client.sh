#!/bin/bash

# Build script for different clients
# Usage: ./build-for-client.sh [client-name]

CLIENT_NAME=${1:-"dna-infotel"}

echo "🏗️  Building for client: $CLIENT_NAME"

# Available clients
case $CLIENT_NAME in
  "microscan")
    echo "Building for Microscan..."
    node scripts/build-client.js microscan
    ;;
  "dna-infotel")
    echo "Building for DNA Infotel..."
    node scripts/build-client.js dna-infotel
    ;;
  "one-sevenstar")
    echo "Building for One Seven Star..."
    node scripts/build-client.js one-sevenstar
    ;;
  *)
    echo "❌ Unknown client: $CLIENT_NAME"
    echo "Available clients: microscan, dna-infotel, one-sevenstar"
    exit 1
    ;;
esac

echo "✅ Build configuration updated for $CLIENT_NAME"
echo "Now you can run: npx react-native run-android or npx react-native run-ios" 