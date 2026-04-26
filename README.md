# Gibko Notes

Gibko Notes is a minimal browser-based writing tool built with React, Vite, and Tailwind CSS. It is private by default, runs fully client-side, and lets you write, autosave locally, and export your note in a few formats.

## Features

- Clean one-page writing interface
- Local autosave with restore on reload
- Copy, clear, and clear local note actions
- Export to TXT, PDF, and DOCX
- Dark and light mode
- Responsive layout for desktop and mobile
- No backend, no login, no cloud sync

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Start the dev server:

```bash
npm run dev
```

3. Build for production:

```bash
npm run build
```

4. Preview the production build:

```bash
npm run preview
```

## Deploy to GitHub Pages

1. Make sure your GitHub repository is named `gibko-notes`, or update the `base` value in `vite.config.js` to match your repo name.
2. Install dependencies:

```bash
npm install
```

3. Deploy:

```bash
npm run deploy
```

This publishes the contents of `dist` using the `gh-pages` package.
