# APEX — Personal Command Center

A full-stack Next.js 14 dashboard with crypto prices, calendar, reminders, Obsidian notes, Solana wallet, and price alerts.

## Features

- **Live Crypto Prices** — Binance WebSocket for real-time BTC, ETH, SOL prices with animated ticks
- **Price Alerts** — Set above/below alerts with desktop notifications via background worker
- **Google Calendar** — OAuth integration showing upcoming events for the next 7 days
- **Reminders** — Priority-based reminders with overdue highlighting, stored in SQLite
- **Obsidian Notes** — Browse, search, and quick-create notes in your Obsidian vault
- **Solana Wallet** — SOL balance, SPL tokens, and recent transactions via RPC
- **Market Overview** — Fear & Greed index, total market cap, BTC dominance
- **Command Palette** — `⌘K` for quick navigation and search
- **APEX Brain** — Claude-powered chat and on-demand market briefings with live access to your prices, alerts, reminders, and wallet
- **Agent Ops** — Mission-control panel for four autonomous Claude agents (market scanner, portfolio risk, news digest, daily briefing) that run on a schedule or on demand

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
- **@anthropic-ai/sdk** (Claude) for the AI brain and autonomous agent jobs
- **node-cron** for scheduling background workers

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
| `NEXT_PUBLIC_DEFAULT_COINS` | Optional | Coins to track, e.g. `BTC,SOL,ETH` |
| `ANTHROPIC_API_KEY` | Recommended | Enables APEX Brain chat, market briefs, and Agent Ops |

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

### Price Alert Worker

The background worker checks prices every 60 seconds and fires desktop notifications:

```bash
npm run worker
```

Keep this running in a separate terminal.

### Agent Ops Worker

Runs the four autonomous Claude agents on their own schedules (market scanner every 5 min, portfolio risk and news digest every 15 min, daily briefing at 8am) and logs each run to SQLite:

```bash
npm run agents
```

Requires `ANTHROPIC_API_KEY` in `.env.local`. Keep this running in a separate terminal alongside the price alert worker. Jobs can also be triggered manually from the Agent Ops panel's "RUN" button without this worker running.

## Running as a Native macOS App (Electron)

APEX can run as a standalone `.app` — no browser needed, dock icon, native window.

### Development (live reload)

```bash
npm install
npm run electron:dev
```

This starts Next.js dev server and Electron simultaneously.

### Build a distributable .app

```bash
npm run electron:build
```

Output is in `dist-electron/`. Drag `APEX.app` to your `/Applications` folder and it lives in your dock like any other native app.

> **App icon**: Place a 1024×1024 PNG at `electron/assets/icon.png` and an `.icns` file at `electron/assets/icon.icns` before building. You can generate `.icns` from a PNG using `iconutil` on macOS.

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── crypto/        # prices, alerts, OHLCV history
│   │   ├── calendar/      # OAuth flow + events
│   │   ├── reminders/     # CRUD endpoints
│   │   ├── obsidian/      # notes list + search
│   │   ├── solana/        # wallet + transactions
│   │   ├── ai/            # Claude chat + market brief endpoints
│   │   └── jobs/          # Agent Ops job status + run-now trigger
│   ├── settings/          # Settings page
│   ├── layout.tsx         # Root layout with sidebar/topbar
│   ├── page.tsx           # Main dashboard
│   └── globals.css        # Global styles + theme
├── components/
│   ├── layout/            # TopBar, Sidebar, CommandPalette
│   └── widgets/           # All dashboard widgets (incl. ApexBrain, AgentOps)
├── lib/
│   ├── db.ts              # SQLite helpers
│   ├── crypto.ts          # CoinGecko + Binance helpers
│   ├── solana.ts          # Solana RPC helpers
│   ├── google-calendar.ts # OAuth + Calendar API
│   ├── obsidian.ts        # Vault file reader + search
│   ├── alerts.ts          # Alert evaluation logic
│   ├── notifications.ts   # Desktop notification helper
│   ├── apex-ai.ts         # Claude chat + market brief helpers
│   └── agent-jobs.ts      # Autonomous agent job specs + execution
├── store/apex.ts         # Zustand store
├── hooks/                 # SWR + WebSocket hooks
├── scripts/
│   ├── db-init.ts         # Database initialization
│   ├── alert-worker.ts    # Background price checker
│   ├── agent-worker.ts    # Autonomous agent job scheduler
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
