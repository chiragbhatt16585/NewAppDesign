# Fix Razorpay Framework Code Signing Error

## The Problem

Xcode is trying to re-sign Razorpay frameworks during archive, but fails with:
```
errSecInternalComponent
Command PhaseScriptExecution failed with a nonzero exit code
```

## Solution: Add Pre-Sign Script

You need to add a build phase script that runs **before** the "Embed Frameworks" phase to remove existing code signatures from Razorpay frameworks.

### Steps:

1. **Open Xcode** and open `ISPApp.xcworkspace` (NOT `.xcodeproj`)

2. **Select your target** "Spacecom End User App" in the project navigator

3. **Go to Build Phases** tab

4. **Click the "+" button** at the top and select **"New Run Script Phase"**

5. **Name it:** "Pre-sign Razorpay Frameworks"

6. **Drag it** to be **BEFORE** the "[CP] Embed Pods Frameworks" phase

7. **Add this script:**
   ```bash
   "${SRCROOT}/scripts/pre-sign-razorpay.sh"
   ```

8. **Uncheck:** "For install builds only" (if checked)

9. **Check:** "Show environment variables in build log" (optional, for debugging)

10. **Save** and try archiving again

## Alternative: Disable Code Signing for Embedded Frameworks

If the above doesn't work, you can configure Xcode to skip code signing for embedded frameworks:

1. In Xcode, go to **Build Settings**
2. Search for **"Code Signing"**
3. Find **"Code Signing Identity"** for **Release** configuration
4. Set it to **"Don't Code Sign"** (this is usually not recommended)

## Manual Fix (One-time)

If you want to manually fix the frameworks before archiving:

```bash
cd ios
./scripts/pre-sign-razorpay.sh
```

Then archive in Xcode.

## Why This Happens

Razorpay frameworks come pre-signed from CocoaPods. When Xcode tries to embed them, it attempts to re-sign them with your development certificate. If the frameworks already have signatures or if there's a keychain access issue, this fails.

The pre-sign script removes existing signatures, allowing Xcode to properly sign them with your certificate.

