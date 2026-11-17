# A Little World Made For You ♡

An interactive, personalized romantic scrapbook birthday website created for **Wulan**, combining handmade journal aesthetics, a recurring Mini Oktaf illustrated guide, an interactive 17-page Memory Book, a geographically accurate 3D globe with 20 destinations and an animated great-circle airplane, personal folded birthday letters, a dedicated birthday video player, a **Voices of Love ♡** botanical friend audio garden, a hidden 7-flower botanical quest, a persistent **Our Little Vinyl Player ♡** powered by the official YouTube IFrame Player API, a private collaborative **Our Future Wishlist ♡**, and **My Little Control Room ♡** (`/admin`) backed by Firebase.

---

## Tech Stack

- **Framework**: React 19 + TypeScript + Vite
- **App Server**: Express (`server.ts`) with Vite dev middleware & production SPA serving
- **Cloud Backend**: Firebase Authentication (Google Sign-In), Cloud Firestore (named database), and Firebase Storage
- **Security**: Strict Firestore Security Rules (`firestore.rules`) & Storage Rules (`storage.rules`) enforcing verified email access for Admin (`oktafmbul0@gmail.com`) and Couple Wishlist (`Oktaf` + `Wulan`)
- **Music Playback**: Official YouTube IFrame Player API (`src/utils/youtubePlayer.ts` & `src/components/vinyl/VinylPlayer.tsx`)
- **Styling**: Tailwind CSS v4 (`Playfair Display`, `DM Sans`, `Caveat`)
- **Animations**: Framer Motion (`motion/react`)
- **3D Globe**: Three.js + Natural Earth 110m boundaries (`world-atlas` + `topojson-client`)
- **State**: Zustand + `localStorage` (invitation/quest progress) + Cloud Firestore live sync

---

## Installation & Development

```bash
# 1. Install dependencies
npm install

# 2. Start the development server (Express + Vite middleware on http://localhost:3000)
npm run dev

# 3. Type-check
npm run lint

# 4. Run unit & Firestore security rules tests
npx --yes tsx --test src/utils/*.test.ts firestore.rules.test.ts
npx eslint firestore.rules

# 5. Build for production (outputs to dist/)
npm run build

# 6. Run production server
npm start
```

---

## Firebase Setup & Rules

Firebase configuration is stored in `firebase-applet-config.json` (project `hazel-star-k6gf7`).

1. **Authentication**: Enable **Google** sign-in provider in Firebase Console → *Authentication → Sign-in method*.
2. **Firestore Security Rules**: `firestore.rules` is deployed for the named Firestore database (`ai-studio-alittleworldmade-6e487d0e-75d1-415f-bae0-c4143ab96438`).
3. **Firebase Storage & Rules**: Ensure **Firebase Storage** is enabled in Firebase Console (`hazel-star-k6gf7.firebasestorage.app`), then copy the rules from `storage.rules` into *Storage → Rules* and publish them so admin uploads and couple wishlist photos work securely.
4. **Authorize Wulan's Google Account**: Sign in as `oktafmbul0@gmail.com` at `/admin` → **Wishlist** tab and save Wulan's verified Gmail address so she can collaborate on **Our Future Wishlist ♡**.

---

## Features Overview

### 1. Password Gate & Secret Quest
- Default invitation code for Wulan: `02042026` (2 April 2026), defined in `src/utils/storage.ts`.
- 7 hidden botanical flowers (`src/data/flowers.ts`) unlock a special reward screen when all are found.

### 2. Our Story (The Memory Book — 17 Pages / 9 Spreads)
- Manage titles, subtitles, handwritten notes, body stories, captions, dates, and Polaroid images in `/admin` → **Our Story**, or customize defaults in `src/data/memories.ts`.

### 3. Our World (20 Destinations)
- Manage destination titles, cities, countries, descriptions, travel notes, stamp labels, and images in `/admin` → **Our World**, or edit `src/data/destinations.ts`.

### 4. Birthday Letters & Birthday Video
- Manage folded birthday letters and upload/configure `.mp4`/`.webm` birthday videos and poster thumbnails via `/admin`.

### 5. Voices of Love ♡
- Upload friend birthday `.mp3`/`.ogg` recordings, flower styles, and optional portraits from Android or desktop in `/admin` → **Voices of Love** (persisted to Firebase Storage + Firestore).

### 6. Our Little Vinyl Player ♡
- Persistent floating vintage turntable in the bottom-left corner across sections using the official **YouTube IFrame Player API**.
- Manage tracks via YouTube URL / Video ID, reorder playlist items, toggle visibility, and preview/test playback inside `/admin` → **Vinyl Player**.

### 7. Our Future Wishlist ♡ (Scrapbook & Flexible Visibility)
- Natural handmade scrapbook experience directly integrated into the site without a mandatory full-page login gate.
- Supports three visibility modes: **Public** (viewable by visitors), **Private** (visible only to authorized **Oktaf** and **Wulan** accounts), and **Shared** (collaborative editing by both), with Google Sign-In prompted only when creating or editing entries.
- Supports categories (`Your Wishes`, `Her Wishes`, `Our Wishes`), progress statuses (`Dreaming`, `Planned`, `In Progress`, `Completed`), multi-photo memories uploaded to Firebase Storage, and completion stories.

### 8. Postcards From The Future ♡ (Time-Locked Letters)
- Send handwritten digital postcards to **Wulan**, **Oktaf**, or **Both** with a future unlock date/time, custom stationery paper theme, vintage postage stamp motif, and optional Polaroid photo.
- Enforces server-authoritative time locks (`request.time >= unlockAt` in Firestore Rules + `/api/time` verification) with split secret subcollections so locked messages and photos cannot be read early or bypassed via device clock changes.
- Managed in `/admin` → **Postcards** alongside **Wishlist** visibility and access controls.
