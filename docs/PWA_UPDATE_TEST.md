# Repeatable PWA update test

This procedure verifies the prompt-based update path without clearing the browser profile. It uses two builds from the same source whose visible build labels and JavaScript hashes differ.

## Procedure

1. In PowerShell, build version A:

   ```powershell
   $env:VITE_APP_VERSION='update-a'
   pnpm run build
   Remove-Item Env:VITE_APP_VERSION
   pnpm preview --host 127.0.0.1 --port 4180 --strictPort
   ```

2. In a browser profile reserved for testing, open `http://127.0.0.1:4180/#practice`. Wait for “Ready offline,” then reload once. Confirm the footer says `Build update-a`.
3. Submit one Guided Practice attempt and note its case, score, dashboard counts, and rating.
4. Stop the preview process. Without changing the host, port, protocol, or browser profile, build version B:

   ```powershell
   $env:VITE_APP_VERSION='update-b'
   pnpm run build
   Remove-Item Env:VITE_APP_VERSION
   pnpm preview --host 127.0.0.1 --port 4180 --strictPort
   ```

5. Reload the existing tab to make the active app check `sw.js`. Wait for “App update available.” Do not clear site data.
6. Leave the notification waiting, open a case, and start Guided Practice. Confirm the button becomes disabled and reads “Finish this attempt to update.” Confirm no reload occurs and entered answers remain present.
7. Return to the case library (or submit the attempt). Confirm the button becomes “Apply update,” then activate it.
8. After the automatic reload, confirm the footer says `Build update-b`. Confirm the attempt from step 3, rating, and dashboard counts are unchanged.

If the notification does not appear immediately, wait briefly after the reload or move keyboard focus once; service-worker installation is asynchronous. A different port is a different origin and cannot test this update path.

## Step 6 execution record

Run on 2026-10-06 using production builds `step6-a` and `step6-b` at `http://127.0.0.1:4180` in one in-app browser profile:

- update notification appeared: **Pass**;
- active Guided Practice changed the update control to disabled “Finish this attempt to update,” with no reload: **Pass**;
- leaving the attempt re-enabled “Apply update”: **Pass**;
- applying the update loaded footer `Build step6-b`: **Pass**;
- the build-A Case 01 Guided Practice record (0%, rating 600, one guided/practice attempt) remained after update: **Pass**.

This local result covers the generated service worker and browser profile used here. Repeat on the intended HTTPS staging host before a learner study to cover its CDN/cache headers and deployment process.
