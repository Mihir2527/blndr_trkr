# Blunder Tracker

A tiny installable web app for tracking two daily counters: **T** and **A**.

## Features
- T and A both begin at 0 for a new calendar day.
- Tap +T / +A whenever you want to log a blunder.
- Minus buttons and "Undo last" help fix accidental taps.
- Counts are saved immediately in your browser.
- Daily history is retained automatically.
- Line graph supports 7 days, 30 days, or all time.
- Export history to CSV.
- Works offline after the first successful load.
- No account, backend, database, analytics, or cloud storage.

## Fastest deployment: GitHub Pages

1. Create a new GitHub repository, e.g. `blunder-tracker`.
2. Upload all files and folders from this package to the repository root.
3. In GitHub, open:
   **Settings → Pages**
4. Under **Build and deployment**, choose:
   **Deploy from a branch**
5. Select:
   - Branch: `main`
   - Folder: `/ (root)`
6. Save.
7. GitHub will show you a public HTTPS URL.

## Install on Android
1. Open the GitHub Pages URL in Chrome.
2. Open Chrome menu (⋮).
3. Tap **Add to Home screen** or **Install app**.
4. Launch it from your home screen like a normal app.

## Important data note
Your data is stored in the browser's `localStorage` on that device/browser.

That means:
- Clearing Chrome site data can erase your history.
- Switching phones/browsers will not automatically sync your data.
- Use **Export CSV** occasionally if you want a backup.

## Local testing
PWAs need HTTP/HTTPS for service workers. From this folder you can run:

```bash
python -m http.server 8000
```

Then visit:

http://localhost:8000

On a phone, the easiest route is just GitHub Pages.
