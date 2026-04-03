# ⚡ Real-Time Clipboard Sync

A lightning-fast, multi-device clipboard application designed to solve the friction of sharing links, text, and code snippets between your phone, tablet, and laptop. Built with Next.js and powered by Supabase Realtime for instant synchronization without manual refreshing.

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
