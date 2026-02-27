# Realm → AsyncStorage migration (Microscan)

When users **update** from the old Microscan app (Realm) to this app (AsyncStorage), their login is migrated so they stay logged in.

## When migration works

- **Same app update:** The new app must be installed as an **update** of the old app (same Android package / iOS bundle ID: `com.spacecom.log2space.microscan`). Then both use the same app data directory and the new app can read the old Realm file and copy credentials into AsyncStorage.
- **Different package = different app:** If you install a build with a different package name (e.g. `in.spacecom.log2space.client.microscan`), the system treats it as a different app. The new app **cannot** read the old app’s data, so migration will find no Realm data and the user will need to log in again.

## How to test migration

1. On the emulator/device, install the **old** Microscan app (Realm) with package `com.spacecom.log2space.microscan` and log in.
2. Build this app with the **same** package name:
   ```bash
   npm run prepare:microscan
   npm run android
   ```
3. Install that build **over** the old app (do **not** uninstall the old app first). Use “Update” or “Install” so it replaces the existing app.
4. Open the app. You should stay logged in; migration runs on first launch and copies Realm credentials into AsyncStorage.

## Current setup

- Microscan is configured with package **`com.spacecom.log2space.microscan`** so that when you ship an update to existing users, migration runs and they stay logged in.
- If you need a second app (e.g. new Play Store listing) with a different package, that build will not see the old app’s data; migration only applies to the update path with the same package.
