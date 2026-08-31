# 📖 PaperEcho

**Turn any physical book into an audiobook using AI.**

Record a video of yourself slowly turning through book pages, and PaperEcho will extract all the text using Gemini's multimodal vision AI, clean it up for narration, and generate natural audiobook-quality speech using Gemini's Text-to-Speech engine.

## Features

- 📹 **Video Capture** — Record book pages directly in-app or select from your gallery
- 🔍 **AI Text Extraction** — Gemini's video understanding extracts all text from visible pages
- 🧹 **Smart Cleaning & Styling** — Autodetects genre (Fiction, Academic, Non-Fiction, Poetry, Children's) and adapts speech pacing and emotional tags
- 🗣️ **Natural TTS** — 30 high-quality voices via Gemini TTS
- 🎧 **Full Audiobook Player** — Play/pause, seek, speed control (0.75x–2x), chapter navigation
- 📚 **Personal Library** — Browse and manage all your converted books
- 🔐 **Secure Auth & IP Protection** — Private user storage, signed stream URLs, and automated 7-day storage retention

## Tech Stack

- **Frontend**: React Native + Expo SDK 54, TypeScript, expo-router
- **Backend**: Firebase Cloud Functions (Node.js)
- **AI**: Google Gemini API (Video Understanding + TTS)
- **Storage**: Firebase Cloud Storage + Firestore
- **Auth**: Firebase Authentication

## Architecture

```
Mobile App ──▶ Upload Video ──▶ Firebase Storage
                                     │
                              Cloud Function
                                     │
                     ┌───────────────┼───────────────┐
                     ▼               ▼               ▼
              Gemini Vision    Gemini Flash    Gemini TTS
              (Extract Text)   (Clean Text)   (Generate Audio)
                     │               │               │
                     └───────────────┼───────────────┘
                                     │
                              Firebase Storage
                                     │
                              Audio Playback ◀── Mobile App
```

## Available Voices

PaperEcho includes all 30 Gemini TTS voices. Highlights:

| Voice | Description |
|---|---|
| Kore | Warm, clear female narrator (default) |
| Puck | Friendly, engaging male narrator |
| Aoede | Soft, soothing female voice |
| Charon | Deep, authoritative male voice |
| Zephyr | Light, youthful neutral voice |
| Fenrir | Strong, dramatic male voice |

## License

MIT
