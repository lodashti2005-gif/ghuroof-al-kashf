# iOS build (Expo EAS)

This folder wraps the existing web game in a native iOS shell. The game code,
design, Supabase backend and gameplay logic are untouched — the app loads the
published site (`https://ghuroof-al-kashf.lovable.app`) inside a full-screen
WebView.

## Building from GitHub

1. Push the repo to GitHub.
2. In `expo.dev` → your project → **GitHub**, connect the repository and set the
   **base directory** to `mobile` (EAS must run from this folder, not the repo root).
3. Trigger a build with platform `ios` and profile `production`.

Locally the same build is:

```bash
cd mobile
npm install
npx eas-cli@latest build --platform ios --profile production
```

Then submit with:

```bash
npx eas-cli@latest submit --platform ios --profile production
```

## Notes

- Change the loaded URL in `App.js` (`GAME_URL`) if you use a custom domain.
- `ios.bundleIdentifier` in `app.json` must match the App Store identifier you own.
- The first `eas build` run adds an `extra.eas.projectId` to `app.json` automatically.
