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
- **@libsql/client** (SQLite/Turso) for storage — a local file in dev, a hosted Turso DB in production
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
| `TURSO_DATABASE_URL` | Cloud only | Hosted libSQL DB URL — leave unset to use a local SQLite file in `./data` |
| `TURSO_AUTH_TOKEN` | Cloud only | Auth token for the Turso database above |
| `CRON_SECRET` | Cloud only | Shared secret that authenticates calls to `/api/cron/*` |

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

## Deploying to Vercel

APEX can run as a hosted web app at a real URL — no Mac required to be on, accessible from any device (including iPad) over the internet. This requires a hosted database, since Vercel's serverless functions have no persistent disk.

### 1. Create a Turso database

[Turso](https://turso.tech) is a hosted SQLite-compatible (libSQL) database with a free tier, and APEX's storage layer (`lib/db.ts`) already speaks libSQL — no schema changes needed.

1. Sign up at [turso.tech](https://turso.tech) and create a database (via their web dashboard or `turso db create apex`)
2. Grab the database URL (`turso db show apex --url`) and create an auth token (`turso db tokens create apex`)

### 2. Import the project into Vercel

1. Push this repo to GitHub (already done if you're reading this from the repo)
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository
3. Vercel auto-detects Next.js — no build settings need to change

### 3. Set environment variables in the Vercel project

Add these in the Vercel dashboard under Project Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `TURSO_DATABASE_URL` | From step 1 |
| `TURSO_AUTH_TOKEN` | From step 1 |
| `CRON_SECRET` | Any long random string — generate with `openssl rand -hex 32` |
| `ANTHROPIC_API_KEY` | Same key as local dev, to enable APEX Brain + Agent Ops |
| `SOLANA_WALLET_ADDRESS`, `COINGECKO_API_KEY`, `HELIUS_API_KEY`, `NEXT_PUBLIC_DEFAULT_COINS` | Same as local dev, if used |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` | Same as local dev, but set `GOOGLE_REDIRECT_URI` to `https://<your-vercel-domain>/api/calendar/callback` and add that URL as an authorized redirect URI in Google Cloud Console |

Do **not** set `OBSIDIAN_VAULT_PATH` — there's no local vault to read on Vercel, so the Obsidian widget is automatically hidden on cloud deployments (`app/page.tsx` checks `process.env.VERCEL`).

### 4. Deploy

Click Deploy. Once live, open the assigned `*.vercel.app` URL from any device, including your iPad, with no Mac required to be running.

### Background jobs in the cloud

`vercel.json` schedules two cron jobs hitting `/api/cron/agents` and `/api/cron/alerts` once daily — **Vercel's Hobby plan only allows cron jobs to run once per day**, so this covers the Daily Ops Briefing well but won't replicate the 5/15-minute local schedules. Options:

- Leave it as-is and use the Agent Ops panel's "RUN" button for on-demand checks
- Use a free external scheduler (e.g. [cron-job.org](https://cron-job.org), or a scheduled GitHub Actions workflow) to hit `/api/cron/agents` and `/api/cron/alerts` as often as you like, sending header `Authorization: Bearer <CRON_SECRET>`
- Upgrade to Vercel Pro, which allows higher-frequency cron schedules, and adjust the schedules in `vercel.json`

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
│   │   ├── jobs/          # Agent Ops job status + run-now trigger
│   │   └── cron/          # Cron-callable agent/alert sweeps (Vercel Cron / external scheduler)
│   ├── settings/          # Settings page
│   ├── layout.tsx         # Root layout with sidebar/topbar
│   ├── page.tsx           # Main dashboard
│   └── globals.css        # Global styles + theme
├── components/
│   ├── layout/            # TopBar, Sidebar, CommandPalette
│   └── widgets/           # All dashboard widgets (incl. ApexBrain, AgentOps)
├── lib/
│   ├── db.ts              # libSQL/Turso storage helpers (local file in dev, Turso in prod)
│   ├── crypto.ts          # CoinGecko + Binance helpers
│   ├── solana.ts          # Solana RPC helpers
│   ├── google-calendar.ts # OAuth + Calendar API
│   ├── obsidian.ts        # Vault file reader + search
│   ├── alerts.ts          # Alert evaluation logic
│   ├── notifications.ts   # Desktop notification helper
│   ├── apex-ai.ts         # Claude chat + market brief helpers
│   ├── agent-jobs.ts      # Autonomous agent job specs + execution
│   └── cron-auth.ts       # Bearer-token auth for /api/cron/* routes
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
