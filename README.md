# 📖 PageReader

**Turn any physical book into an audiobook using AI.**

Record a video of yourself slowly turning through book pages, and PageReader will extract all the text using Gemini's multimodal vision AI, clean it up for narration, and generate natural audiobook-quality speech using Gemini's Text-to-Speech engine.

## Features

- 📹 **Video Capture** — Record book pages directly in-app or select from your gallery
- 🔍 **AI Text Extraction** — Gemini's video understanding extracts all text from visible pages
- 🧹 **Smart Cleaning** — Automatically removes page numbers, headers, footers, and endnote markers
- 🗣️ **Natural TTS** — 30+ high-quality voices via Gemini TTS with emotional steering
- 🎧 **Full Audiobook Player** — Play/pause, seek, speed control (0.75x–2x), chapter navigation
- 📚 **Book Library** — Browse and manage all your converted books
- 🔐 **Firebase Auth** — Secure user authentication

## Tech Stack

- **Frontend**: React Native + Expo SDK 56, TypeScript, expo-router
- **Backend**: Firebase Cloud Functions (Node.js)
- **AI**: Google Gemini API (Video Understanding + TTS)
- **Storage**: Firebase Cloud Storage + Firestore
- **Auth**: Firebase Authentication

## Getting Started

### Prerequisites

- Node.js 20+
- Expo CLI (`npm install -g expo-cli`)
- Firebase project (Blaze plan for Cloud Functions)
- Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)

### Setup

1. **Clone the repo**
   ```bash
   git clone https://github.com/ThatGuy48317/page-reader.git
   cd page-reader
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd functions && npm install && cd ..
   ```

3. **Configure Firebase**
   - Create a new Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   - Enable Authentication, Firestore, Cloud Storage, and Cloud Functions
   - Copy your Firebase config to `.env`:
     ```
     EXPO_PUBLIC_FIREBASE_API_KEY=your_key
     EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
     EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
     EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
     EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
     EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
     ```

4. **Set Gemini API key** (for Cloud Functions)
   ```bash
   firebase functions:secrets:set GEMINI_API_KEY
   ```

5. **Deploy Cloud Functions**
   ```bash
   cd functions
   npm run build
   firebase deploy --only functions
   ```

6. **Start the app**
   ```bash
   npx expo start
   ```

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

PageReader includes all 30+ Gemini TTS voices. Some highlights:

| Voice | Description |
|-------|------------|
| Kore | Warm, clear female narrator (default) |
| Puck | Friendly, engaging male narrator |
| Aoede | Soft, soothing female voice |
| Charon | Deep, authoritative male voice |
| Zephyr | Light, youthful neutral voice |
| Fenrir | Strong, dramatic male voice |

## License

MIT
