# ⚡ ClipSync — Real-Time Clipboard Sync

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

A lightning-fast, multi-device clipboard application designed to solve the friction of sharing links, text, and code snippets between your phone, tablet, and laptop. Built with Next.js and powered by Supabase Realtime for instant synchronization without manual refreshing.

ClipSync is open source — contributions of any size are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) to get started.

### ✨ Features
- **Real-Time Sync:** WebSockets instantly broadcast your clipboard data across all active devices.
- **Private Rooms:** Generate or join isolated rooms using a simple 4-digit code.
- **1-Click Copy:** Seamlessly copy data to your device's native clipboard.
- **Mobile-First Design:** Fully responsive UI tailored for both desktop browsers and mobile screens.
- **Auto-Cleanup Ready:** Database schema designed to support TTL (Time-To-Live) for clearing old data.

### 🛠️ Tech Stack
- **Frontend:** Next.js (App Router), React, Tailwind CSS
- **Backend & Database:** Supabase (PostgreSQL)
- **Real-Time Engine:** Supabase Realtime Channels

### 🚀 Getting Started
```bash
npm install
cp .env.example .env.local   # fill in your Supabase URL + anon key
npm run dev
```
See `supabase_setup.sql` for the database schema and storage bucket setup.

### 🤝 Contributing
Pull requests, bug reports, and ideas are all welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) for setup and guidelines.

### 📄 License
[MIT](LICENSE)
