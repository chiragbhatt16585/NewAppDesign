# Netfix client configuration

**Client:** Netfix  
**Company:** NETFIX NETWORKS (OPC) PVT LTD  
**API:** nnpl.l2s.biz  

## Logo and app icons

- Copy your logo image as **`assets/isp_logo.png`** (used on login and in-app).
- Copy app icons into **`app-icons/`** (see `config/dna-goa/app-icons/` for the expected structure):
  - **Android:** `app-icons/android/` (mipmap-* folders, etc.)
  - **iOS:** `app-icons/ios/AppIcon.appiconset/` (all required sizes)

You can copy the folder structure from `config/dna-goa/app-icons/` and then replace the images with Netfix branding.

## Release keystore (Android)

- For release builds, place **`Netfix.jks`** in `android/app/` (or ensure the path in `keystore-config.gradle` is correct).
- Default keystore config: alias `netfix`, passwords `netfix`. Change in `keystore-config.gradle` and `build-config.json` if you use different values.

## Build commands

```bash
npm run prepare:netfix    # Switch to Netfix config
npm run android          # Run Android
npm run ios              # Run iOS
```
