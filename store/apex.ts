'use client'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export interface PriceData {
  symbol: string
  price: number
  priceChangePercent: number
  high24h?: number
  low24h?: number
  marketCap?: number
  volume?: number
  lastUpdated?: string
}

export interface AlertItem {
  id: number
  coin: string
  condition: 'above' | 'below'
  target_price: number
  is_active: number
  triggered_at: string | null
  created_at: string
  note: string | null
}

export interface ReminderItem {
  id: number
  title: string
  description: string | null
  due_at: string | null
  priority: 'low' | 'normal' | 'high'
  is_done: number
  created_at: string
  completed_at: string | null
}

export interface CalendarEvent {
  id: string
  summary: string
  description: string | null
  start: string
  end: string
  location: string | null
  htmlLink: string | null
  colorId: string | null
  status: string
}

export interface ObsidianNote {
  filename: string
  title: string
  path: string
  preview: string
  modified: string
  created: string
  tags: string[]
  wordCount: number
  content?: string
}

export interface SolanaWalletData {
  address: string
  solBalance: number
  solBalanceUsd: number
  tokens: Array<{
    mint: string
    symbol: string
    name: string
    uiAmount: number
    logoUri?: string
  }>
  lastUpdated: string | null
}

export interface MarketData {
  totalMarketCap: number
  btcDominance: number
  fearGreedIndex: number
  fearGreedLabel: string
}

interface UIState {
  sidebarOpen: boolean
  commandPaletteOpen: boolean
  selectedCoin: string
  selectedNote: ObsidianNote | null
  chartModalOpen: boolean
  noteModalOpen: boolean
}

interface JarvisStore {
  // Price data
  prices: Record<string, PriceData>
  setPrices: (prices: Record<string, PriceData>) => void
  updatePrice: (symbol: string, data: Partial<PriceData>) => void

  // Market overview
  marketData: MarketData | null
  setMarketData: (data: MarketData) => void

  // Alerts
  alerts: AlertItem[]
  setAlerts: (alerts: AlertItem[]) => void
  addAlert: (alert: AlertItem) => void
  removeAlert: (id: number) => void
  updateAlert: (id: number, updates: Partial<AlertItem>) => void

  // Reminders
  reminders: ReminderItem[]
  setReminders: (reminders: ReminderItem[]) => void
  addReminder: (reminder: ReminderItem) => void
  removeReminder: (id: number) => void
  updateReminder: (id: number, updates: Partial<ReminderItem>) => void

  // Calendar
  calendarEvents: CalendarEvent[]
  setCalendarEvents: (events: CalendarEvent[]) => void
  calendarConnected: boolean
  setCalendarConnected: (connected: boolean) => void

  // Obsidian
  obsidianNotes: ObsidianNote[]
  setObsidianNotes: (notes: ObsidianNote[]) => void
  obsidianConfigured: boolean
  setObsidianConfigured: (configured: boolean) => void

  // Solana
  solanaWallet: SolanaWalletData | null
  setSolanaWallet: (wallet: SolanaWalletData | null) => void

  // UI State
  ui: UIState
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setCommandPaletteOpen: (open: boolean) => void
  toggleCommandPalette: () => void
  setSelectedCoin: (coin: string) => void
  setSelectedNote: (note: ObsidianNote | null) => void
  setChartModalOpen: (open: boolean) => void
  setNoteModalOpen: (open: boolean) => void

  // WebSocket connection status
  wsConnected: boolean
  setWsConnected: (connected: boolean) => void
}

export const useJarvisStore = create<JarvisStore>()(
  devtools(
    (set) => ({
      // Prices
      prices: {},
      setPrices: (prices) => set({ prices }),
      updatePrice: (symbol, data) =>
        set((state) => ({
          prices: {
            ...state.prices,
            [symbol]: { ...state.prices[symbol], symbol, ...data },
          },
        })),

      // Market data
      marketData: null,
      setMarketData: (marketData) => set({ marketData }),

      // Alerts
      alerts: [],
      setAlerts: (alerts) => set({ alerts }),
      addAlert: (alert) =>
        set((state) => ({ alerts: [alert, ...state.alerts] })),
      removeAlert: (id) =>
        set((state) => ({ alerts: state.alerts.filter((a) => a.id !== id) })),
      updateAlert: (id, updates) =>
        set((state) => ({
          alerts: state.alerts.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        })),

      // Reminders
      reminders: [],
      setReminders: (reminders) => set({ reminders }),
      addReminder: (reminder) =>
        set((state) => ({ reminders: [reminder, ...state.reminders] })),
      removeReminder: (id) =>
        set((state) => ({
          reminders: state.reminders.filter((r) => r.id !== id),
        })),
      updateReminder: (id, updates) =>
        set((state) => ({
          reminders: state.reminders.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
        })),

      // Calendar
      calendarEvents: [],
      setCalendarEvents: (calendarEvents) => set({ calendarEvents }),
      calendarConnected: false,
      setCalendarConnected: (calendarConnected) => set({ calendarConnected }),

      // Obsidian
      obsidianNotes: [],
      setObsidianNotes: (obsidianNotes) => set({ obsidianNotes }),
      obsidianConfigured: false,
      setObsidianConfigured: (obsidianConfigured) => set({ obsidianConfigured }),

      // Solana
      solanaWallet: null,
      setSolanaWallet: (solanaWallet) => set({ solanaWallet }),

      // UI
      ui: {
        sidebarOpen: true,
        commandPaletteOpen: false,
        selectedCoin: 'BTC',
        selectedNote: null,
        chartModalOpen: false,
        noteModalOpen: false,
      },
      setSidebarOpen: (open) =>
        set((state) => ({ ui: { ...state.ui, sidebarOpen: open } })),
      toggleSidebar: () =>
        set((state) => ({
          ui: { ...state.ui, sidebarOpen: !state.ui.sidebarOpen },
        })),
      setCommandPaletteOpen: (open) =>
        set((state) => ({ ui: { ...state.ui, commandPaletteOpen: open } })),
      toggleCommandPalette: () =>
        set((state) => ({
          ui: {
            ...state.ui,
            commandPaletteOpen: !state.ui.commandPaletteOpen,
          },
        })),
      setSelectedCoin: (coin) =>
        set((state) => ({ ui: { ...state.ui, selectedCoin: coin } })),
      setSelectedNote: (note) =>
        set((state) => ({ ui: { ...state.ui, selectedNote: note } })),
      setChartModalOpen: (open) =>
        set((state) => ({ ui: { ...state.ui, chartModalOpen: open } })),
      setNoteModalOpen: (open) =>
        set((state) => ({ ui: { ...state.ui, noteModalOpen: open } })),

      // WebSocket
      wsConnected: false,
      setWsConnected: (wsConnected) => set({ wsConnected }),
    }),
    { name: 'jarvis-store' }
  )
)
