# Indophone Android launcher icon

On Android 8+, the home-screen icon uses an **adaptive icon** with two layers:

1. **Background** — solid color in `values/ic_launcher_background.xml` (also set in `build-config.json` → `launcherIconBackgroundColor`)
2. **Foreground** — `mipmap-*/ic_launcher_foreground.png` (logo only, transparent outside the logo)

Replacing only `ic_launcher.png` is not enough; the launcher still uses the background **color** above.

## Fix wrong / white icon background

1. Set the exact hex from your design in `config/indophone/build-config.json`:
   ```json
   "launcherIconBackgroundColor": "#YOUR_HEX"
   ```
2. Export **foreground** PNGs (transparent background) into each `mipmap-*` folder as `ic_launcher_foreground.png`.
3. Run `npm run prepare:indophone`, then rebuild the app (`npm run android:indophone`).

Current background color: `#1976D2` (app primary blue). Change it if your icon uses a different color.
