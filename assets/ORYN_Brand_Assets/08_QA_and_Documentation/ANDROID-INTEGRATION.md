# ORYN - Android integration (Expo / React Native)

All paths are relative to `05_Android_App_Icons/`. Approved by the owner on 2026-11-01. These resources have not been test-built in your project; verify on a device before release.

## Adaptive icon spec used
- Canvas 108 dp per layer (xxxhdpi 432 px). Launcher masks show about 72 dp; **66 dp circle = safe zone**.
- Foreground: symbol only on transparent canvas, its minimum enclosing circle = 64 dp diameter (measured max radius 32.17 dp, limit 33 dp). No launcher background baked in.
- Background: full-bleed opaque navy gradient (approximation of the approved app icon).
- Monochrome (Android 13+ themed icons): white silhouette, only its alpha matters; same safe zone.
- Legacy `ic_launcher.png` / `ic_launcher_round.png` (48 dp: 48/72/96/144/192 px) are composites for API < 26.

## Option A - Expo config (recommended; keeps `android/` generated)
1. Copy `expo/*.png` to `assets/brand/` in your project.
2. In `app.json` / `app.config.js`:
```json
{
  "expo": {
    "icon": "./assets/brand/icon.png",
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/brand/adaptive-icon-foreground.png",
        "backgroundImage": "./assets/brand/adaptive-icon-background.png",
        "monochromeImage": "./assets/brand/adaptive-icon-monochrome.png",
        "backgroundColor": "#011553"
      }
    }
  }
}
```
3. Regenerate native projects (`npx expo prebuild --clean`) or build with EAS. `monochromeImage` needs a reasonably recent Expo SDK; I could not check your SDK version, so confirm it in the Expo docs for your version. If it is unsupported, drop that line and use Option B for the themed icon.
4. Do not hand-edit `android/` if you regenerate it with prebuild; changes will be overwritten.

## Option B - drop-in native resources (bare workflow / config plugin)
1. Delete existing `android/app/src/main/res/mipmap-*/ic_launcher*.webp` (and `ic_launcher_round.webp`); duplicate resource names (.webp + .png) fail the build.
2. Copy `res/mipmap-*`, `res/mipmap-anydpi-v26` and `res/values` into `android/app/src/main/res/` (merge).
3. Confirm `AndroidManifest.xml` has `android:icon="@mipmap/ic_launcher"` and `android:roundIcon="@mipmap/ic_launcher_round"`.
4. `res/mipmap-anydpi-v26/*.xml` references `@mipmap/ic_launcher_background`, `_foreground`, `_monochrome` (all PNGs supplied per density).

## Notification (status-bar) icon
White silhouette, alpha only: `res/drawable-*/ic_stat_oryn.png` (24 dp) and `expo/notification-icon.png` (96 px). Expo: `"notification": { "icon": "./assets/brand/notification-icon.png", "color": "#2563FF" }` (via expo-notifications config; check your SDK docs).

## Play Store
Upload `play-store/ic_launcher-512.png` (full-bleed square; Google applies the mask).

## Verify before release
- Run on a device/emulator with circle, squircle and rounded-square masks; check nothing clips.
- Enable Themed icons (Android 13+) and check the monochrome silhouette.
- Look at the app on light and dark wallpapers.
