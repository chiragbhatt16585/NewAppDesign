# Microscan Refer Friend deep link — website setup

SMS links like `https://www.microscaninternet.com/download-app` open the **website**, not the app, until these files are hosted and App/Universal Links are verified.

## Why SMS opens the web page

Phones treat `https://...` as a normal web URL. The only way to open the app from that link is:

1. **Android App Links** (verified with `assetlinks.json`)
2. **iOS Universal Links** (verified with `apple-app-site-association`)
3. Or a **smart web page** that redirects to `microscan://refer-friend` / Android Intent URL

The app alone cannot intercept HTTPS SMS links without website cooperation.

## Files to publish on `www.microscaninternet.com`

### 1) Android App Links

Upload:

`https://www.microscaninternet.com/.well-known/assetlinks.json`

Content is in: `config/microscan/deeplink/.well-known/assetlinks.json`

- Content-Type: `application/json`
- Must be HTTPS, no auth, no redirect

Package: `in.spacecom.log2space.client.microscan`

Fingerprints included:
- Release JKS (`Log2SpaceEndUserMicroscan.jks`)
- Debug keystore (for local testing)

### 2) iOS Universal Links

Upload **both**:

- `https://www.microscaninternet.com/.well-known/apple-app-site-association`
- `https://www.microscaninternet.com/apple-app-site-association`

Content is in: `config/microscan/deeplink/.well-known/apple-app-site-association`

`appID` is set to: `NADT67WN3N.com.l2sClient.microscan`  
(Apple Team ID `NADT67WN3N` + bundle ID `com.l2sClient.microscan`)

- Content-Type: `application/json`
- No `.json` extension on the URL
- HTTPS, no auth, no redirect

Also enable Associated Domains in Apple Developer for App ID `com.l2sClient.microscan`:
- `applinks:www.microscaninternet.com`
- `applinks:microscaninternet.com`

### 3) Quick fix even before verification (recommended for SMS now)

Replace / enhance `/download-app` page with:

`config/microscan/deeplink/pages/download-app.html`

This page:
1. Tries to open `microscan://refer-friend` (or Android Intent)
2. Falls back to Play Store / App Store if app is not installed

iOS App Store URL:
`https://apps.apple.com/us/app/microscan-recharge-support/id1526127574`

## App-side URLs supported

| URL | Result |
|-----|--------|
| `microscan://refer-friend` | Refer Friend (works now for testing) |
| `https://www.microscaninternet.com/refer-friend` | Refer Friend (after website verification) |
| `https://www.microscaninternet.com/download-app` | Refer Friend (after website verification / smart page) |

## Verify after hosting

### Android

```bash
adb shell pm get-app-links in.spacecom.log2space.client.microscan
```

Look for `www.microscaninternet.com` → `verified`

### iOS

- Delete & reinstall app after AASA is live
- Long-press the link in Notes/Messages; it should offer Open in Microscan

### Manual app open test (works without website)

```bash
# Android
adb shell am start -a android.intent.action.VIEW -d "microscan://refer-friend" in.spacecom.log2space.client.microscan

# iOS Simulator
xcrun simctl openurl booted "microscan://refer-friend"
```
