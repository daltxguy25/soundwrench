# SoundWrench (GitHub Pages MVP)

This repo now contains a zero-cost, static web MVP hosted on GitHub Pages.

## What is included

- Mobile-friendly browser audio recording (`MediaRecorder`)
- Audio file upload fallback
- Optional photo upload preview
- On-device heuristic analysis (no backend)
- Safety-first guidance
- Auto-deploy workflow from `main` branch to GitHub Pages

## Local preview

Open `docs/index.html` directly in a browser, or use any local static server.

## Publish to GitHub Pages

1. Push this repo to GitHub (you already set remote):
   - `git add .`
   - `git commit -m "Scaffold GitHub Pages MVP"`
   - `git push -u origin main`
2. In GitHub repo settings, open `Pages` and set `Build and deployment` to `GitHub Actions`.
3. After push, check the `Actions` tab for the `Deploy GitHub Pages` workflow.
4. Your app will appear at:
   - `https://daltxguy25.github.io/soundwrench/`

## Important limitations (current MVP)

- Heuristic diagnosis only (not medical/mechanical-grade ML)
- No direct OBD2 live connection in this static build
- Browser microphone permission is required for recording

## Next build steps

- Add guided capture flow (idle, light rev, coast)
- Add explainable issue rules per noise class
- Add offline-friendly PWA features
- Add optional API-backed model inference later