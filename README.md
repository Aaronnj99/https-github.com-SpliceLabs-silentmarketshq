# JARVIS — Personal Command Center

A full-stack Next.js 14 dashboard with crypto prices, calendar, reminders, Obsidian notes, Solana wallet, and price alerts.

## Features

- **Today View** — The default landing page: a chronological agenda merging today's calendar events and due reminders, plus overdue items and undated high-priority "Focus" tasks, with quick-add
- **Live Crypto Prices** — Binance WebSocket for real-time BTC, ETH, SOL prices with animated ticks
- **Price Alerts** — Set above/below alerts with desktop + Telegram notifications via background worker
- **Google Calendar** — OAuth integration showing upcoming events for the next 7 days
- **Reminders** — Priority-based reminders with overdue highlighting and due-time push notifications, stored in SQLite
- **Telegram Notifications** — Price alerts, due reminders, and a daily morning briefing pushed straight to your phone
- **Obsidian Notes** — Browse, search, and quick-create notes in your Obsidian vault
- **Solana Wallet** — SOL balance, SPL tokens, and recent transactions via RPC
- **Market Overview** — Fear & Greed index, total market cap, BTC dominance
- **Command Palette** — `⌘K` for quick navigation and search

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** with custom dark terminal theme
- **Zustand** for state management
- **better-sqlite3** for local storage (alerts, reminders)
- **Recharts** for interactive price charts
- **Binance WebSocket** for live price feeds
- **CoinGecko API** for market data
- **@solana/web3.js** for wallet data
- **Google APIs** for calendar integration
- **shadcn/ui-style** components with Radix UI

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.local.example` to `.env.local` and fill in your values:

```bash
cp .env.local.example .env.local
```

### 3. Initialize Database

```bash
npm run db:init
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Configuration

### .env.local Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SOLANA_WALLET_ADDRESS` | Recommended | Your Solana public key (read-only) |
| `OBSIDIAN_VAULT_PATH` | Recommended | Absolute path to your Obsidian vault |
| `GOOGLE_CLIENT_ID` | Optional | For Google Calendar integration |
| `GOOGLE_CLIENT_SECRET` | Optional | For Google Calendar integration |
| `GOOGLE_REFRESH_TOKEN` | Auto-set | Set after running calendar:auth |
| `COINGECKO_API_KEY` | Optional | Pro key for higher rate limits |
| `HELIUS_API_KEY` | Optional | Better Solana token metadata |
| `TELEGRAM_BOT_TOKEN` | Recommended | Bot token from @BotFather, for phone push notifications |
| `TELEGRAM_CHAT_ID` | Recommended | Your Telegram chat ID (see Telegram Setup below) |
| `DAILY_DIGEST_TIME` | Optional | Time (HH:MM, 24h) for the daily Telegram briefing, default `07:00` |
| `NEXT_PUBLIC_DEFAULT_COINS` | Optional | Coins to track, e.g. `BTC,SOL,ETH` |

### Google Calendar Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project and enable the Calendar API
3. Create OAuth 2.0 credentials (Web Application type)
4. Add `http://localhost:3000/api/calendar/callback` as authorized redirect URI
5. Copy client ID and secret to `.env.local`
6. Visit `http://localhost:3000/api/calendar/auth` to connect

Or use the CLI script:

```bash
npm run calendar:auth
```

### Telegram Setup

Get JARVIS notifications pushed straight to your phone:

1. In Telegram, message [@BotFather](https://t.me/BotFather) and run `/newbot`, following the prompts
2. Copy the bot token it gives you into `TELEGRAM_BOT_TOKEN`
3. Send your new bot a message (e.g. "hi") to start a chat
4. Visit `https://api.telegram.org/bot<TOKEN>/getUpdates` and find `"chat":{"id": ...}` — that's your `TELEGRAM_CHAT_ID`
5. Restart the dev server and the worker, then send a test message from Settings → Telegram

### Background Worker

The background worker runs price checks, reminder due-checks, and the daily digest:

```bash
npm run worker
```

Keep this running in a separate terminal (or as a system service). It:

- Checks active price alerts every 60 seconds and fires desktop + Telegram notifications when triggered
- Checks for reminders that have become due and pushes a notification once per reminder
- Sends a daily Telegram briefing (today's calendar events + due/overdue/high-priority tasks) at `DAILY_DIGEST_TIME` (default 07:00)

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── crypto/        # prices, alerts, OHLCV history
│   │   ├── calendar/      # OAuth flow + events
│   │   ├── reminders/     # CRUD endpoints
│   │   ├── obsidian/      # notes list + search
│   │   ├── solana/        # wallet + transactions
│   │   └── telegram/      # Telegram config status + test message
│   ├── settings/          # Settings page
│   ├── dashboard/         # Grid dashboard (crypto, wallet, notes, etc.)
│   ├── layout.tsx         # Root layout with sidebar/topbar
│   ├── page.tsx           # Today view (default landing page)
│   └── globals.css        # Global styles + theme
├── components/
│   ├── layout/            # TopBar, Sidebar, CommandPalette
│   └── widgets/           # All dashboard + Today widgets
├── lib/
│   ├── db.ts              # SQLite helpers
│   ├── crypto.ts          # CoinGecko + Binance helpers
│   ├── solana.ts          # Solana RPC helpers
│   ├── google-calendar.ts # OAuth + Calendar API
│   ├── obsidian.ts        # Vault file reader + search
│   ├── alerts.ts          # Alert evaluation logic
│   ├── notifications.ts   # Desktop + Telegram notification helpers
│   ├── telegram.ts        # Telegram Bot API client
│   └── daily-digest.ts    # Builds & sends the daily Telegram briefing
├── store/jarvis.ts         # Zustand store
├── hooks/                 # SWR + WebSocket hooks
├── scripts/
│   ├── db-init.ts         # Database initialization
│   ├── alert-worker.ts    # Background worker: alerts, reminders, daily digest
│   └── calendar-auth.ts   # CLI auth helper
└── data/                  # SQLite database (gitignored)
```

## Design

- **Background**: `#080A0F` (deep space black)
- **Accent**: `#00D4FF` (electric cyan) — primary UI accent
- **Bitcoin**: `#FFB800` (gold)
- **Solana**: `#9945FF` (Solana purple)
- **Success**: `#00FF94` (electric green)
- **Danger**: `#FF4444` (alert red)
- **Font**: JetBrains Mono for data, Syne for headings
- Subtle scanline overlay, card glow on hover

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘K` / `Ctrl+K` | Open command palette |
| `⌘/` / `Ctrl+/` | Toggle sidebar |
| `Esc` | Close modals/palette |
| `↑↓` | Navigate command palette |
| `↵` | Execute selected command |
