## FCM Push Notifications – Android & iOS Setup

This document covers **only Firebase Cloud Messaging (FCM) token + push notification setup** for this project, for both Android and iOS, including per‑client configuration.

---

## 1. Key Files & Entry Points

**Shared JS (used by both platforms)**

- `src/services/notificationService.ts`
  - Main FCM + device registration logic (requests token, registers device with backend).
- `src/services/firebaseInit.ts`
  - Safe initialization/checks for `@react-native-firebase/app` / `messaging`.

**Android**

- Per‑client Firebase config:
  - `config/<client-id>/google-services.json`
- Active Firebase config (auto‑copied by scripts):
  - `android/app/google-services.json`

**iOS**

- Per‑client Firebase config:
  - `config/<client-id>/GoogleService-Info.plist`
- Active Firebase config (auto‑copied by scripts):
  - `ios/ISPApp/GoogleService-Info.plist`
- Native initialization:
  - `ios/ISPApp/AppDelegate.swift`
    - Calls `FirebaseApp.configure()` to create the default Firebase app.

> Always run `npm run prepare:<client-id>` before building for a specific client.  
> This copies the correct `google-services.json` and `GoogleService-Info.plist` into the Android/iOS app folders.

---

## 2. Android – FCM Setup

### 2.1. Firebase Console (per client)

For each Android client:

1. Go to **Firebase Console → Project Settings → General → Your apps → Android**.
2. Add or select an Android app with:
   - **Package name** = client Android `applicationId`
     - Example (Microscan):
       - `in.spacecom.log2space.client.microscan`
3. Download the **`google-services.json`** file for that app.
4. Save it in the repo at:
   - `config/<client-id>/google-services.json`
   - Example: `config/microscan/google-services.json`

### 2.2. Build‑time wiring

The script `scripts/build-client-enhanced.js` (used by `npm run prepare:<client>`) will:

- Copy `config/<client-id>/google-services.json` → `android/app/google-services.json`.
- Update Android package ID, version, and keystore in `android/app/build.gradle`.

`android/app/build.gradle` already has:

```gradle
apply plugin: "com.google.gms.google-services"
```

so the Gradle Google Services plugin will pick up the JSON file automatically.

### 2.3. Running & verifying Android FCM

Typical workflow for a client (example: **Microscan**):

```bash
cd /Users/chiragbhatt/Desktop/isp/ISPApp
npm run prepare:microscan
npm run android:microscan
```

Then, in the Metro or logcat output, filter logs by:

- `[Push][FCM]`

You should see lines similar to:

- `[Push][FCM] getToken xxxxx...`
- `[Push][FCM] FULL FCM TOKEN (init) xxxxx...`
- `[Push][FCM] device registration success`

If no token is printed:

- Confirm:
  - `android/app/google-services.json` exists.
  - Its `package_name` matches `applicationId` in `android/app/build.gradle`.
  - The device has Google Play Services and network connectivity.

---

## 3. iOS – FCM Setup

### 3.1. Firebase Console – iOS app entry (per client)

For each iOS client:

1. In **Firebase Console → Project Settings → General → Your apps → iOS**:
2. Add or select an iOS app with:
   - **Bundle ID** = client iOS bundle identifier.
     - Example (Microscan):
       - `com.l2sClient.microscan`
3. Download the **`GoogleService-Info.plist`** file for that app.
4. Save it in the repo at:
   - `config/<client-id>/GoogleService-Info.plist`
   - Example: `config/microscan/GoogleService-Info.plist`

The prepare script will copy this to:

- `ios/ISPApp/GoogleService-Info.plist`

> This file **must** match the bundle ID you are actually building in Xcode.

### 3.2. Firebase Console – APNs key (required for FCM on iOS)

Tokens will **not** be issued until APNs is configured for the iOS app.

1. In **Apple Developer → Certificates, Identifiers & Profiles**:
   - Ensure there is an **App ID** for your iOS bundle (`com.l2sClient.microscan`) with **Push Notifications** enabled.
2. In **Apple Developer → Keys**:
   - Create a new key with:
     - Name: e.g. `Log2space APNs Key`
     - Enable **Apple Push Notifications service (APNs)**.
   - Download the `.p8` file.
   - Note:
     - **Key ID** (shown after creation)
     - **Team ID** (shown in the top‑right of the Apple Developer portal).
3. Back in **Firebase Console → Project Settings → Cloud Messaging**:
   - Under **Apple app configuration**, find the iOS app with bundle `com.l2sClient.microscan`.
   - Under **APNs authentication key**:
     - Upload the `.p8` file.
     - Enter **Key ID** and **Team ID**.
   - Save.

You should now see that iOS app listed with an APNs key configured.

### 3.3. Xcode – bundle, entitlements, and plist

After running `npm run prepare:<client>`:

1. Open `ios/ISPApp.xcworkspace` in Xcode.
2. Select the **ISPApp** target → **General**:
   - **Bundle Identifier** = client bundle from `build-config.json`.
     - Example: `com.l2sClient.microscan`
3. Select `ios/ISPApp/GoogleService-Info.plist` in the Project Navigator:
   - In the **File Inspector** (⌥⌘1):
     - Ensure **Target Membership** → `ISPApp` is **checked**.
   - In the plist, confirm:
     - `BUNDLE_ID` = the same bundle identifier (e.g. `com.l2sClient.microscan`).
4. **Signing & Capabilities** (ISPApp target):
   - Add **Push Notifications** capability.
   - Add **Background Modes → Remote notifications**.
   - Under **Signing**, ensure:
     - Team and provisioning profile correspond to the App ID that has Push Notifications enabled.
5. **Pods** (once after changes):

   ```bash
   cd ios
   pod install
   cd ..
   ```

6. In Xcode:
   - `Product → Clean Build Folder…`
   - Build and run on a **real iPhone** (not the simulator).
   - When prompted, allow notifications.

### 3.4. Native Firebase initialization (AppDelegate.swift)

`ios/ISPApp/AppDelegate.swift` must import and configure Firebase:

```swift
import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import Foundation
import FirebaseCore

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?
  // ...

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    do {
      // Ensure Firebase default app is configured BEFORE React Native starts.
      if FirebaseApp.app() == nil {
        FirebaseApp.configure()
      }

      // existing React Native setup...
```

This prevents `"No Firebase App '[DEFAULT]'"` errors and ensures the default Firebase app exists before JS tries to use Messaging.

### 3.5. Running & verifying iOS FCM

1. Prepare client:

   ```bash
   npm run prepare:<client>
   ```

2. Open `ios/ISPApp.xcworkspace` in Xcode, select a real device, Clean Build Folder, Run.
3. In Xcode or Metro logs, filter for:

   - `[Push][FCM]`
   - `FCM Token`

You should see logs like:

- `[Push][FCM] permission status 1`
- `[Push][FCM] FULL FCM TOKEN (init) xxxxx...`
- `[Push][FCM] device registration success`

If you instead see errors like:

- `no valid "aps-environment" entitlement string found for application`
  - Fix: ensure Push Notifications capability + correct provisioning profile for that App ID.
- `[messaging/unregistered] You must be registered for remote messages before calling getToken`
  - Fix: usually same as above; `registerDeviceForRemoteMessages()` is already called in JS, but iOS is rejecting it without the entitlement.
- `❌ NO FCM TOKEN AVAILABLE AFTER ALL ATTEMPTS`
  - Fix:
    - APNs key not configured in Firebase for this bundle.
    - Wrong bundle ID in Firebase vs Xcode vs `GoogleService-Info.plist`.
    - Notifications disabled on the device for this app.

Once those are resolved, iOS will issue a valid FCM token and your existing JS code will log it and register the device.

---

## 4. How the Project Uses FCM Tokens

- `initializePushNotifications(realm?: string)`:
  - iOS:
    - Calls `messaging().registerDeviceForRemoteMessages()`.
  - Requests permission (`PushNotificationIOS.requestPermissions`, `messaging().requestPermission()`).
  - Calls `messaging().getToken()` and logs `[Push][FCM] FULL FCM TOKEN (init)`.
  - Registers device with backend via `apiService.addDeviceDetails(...)`.

- `ensureDeviceRegistrationAfterLogin(realm?: string)`:
  - Ensures FCM is initialized.
  - Tries:
    - `registerPendingPushToken(realm)`
    - `registerDeviceManually(realm)` – multiple strategies to obtain token.
    - `updateDeviceWithRealFCMToken(realm)` – update registration if token changes.

If you see a valid token in `[Push][FCM]` logs and `device registration success`, the client‑side FCM integration is healthy; remaining issues will usually be on the backend (e.g., sending notifications to that token). 

