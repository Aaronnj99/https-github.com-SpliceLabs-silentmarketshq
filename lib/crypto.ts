import axios from 'axios'

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3'
const COINGECKO_PRO_BASE = 'https://pro-api.coingecko.com/api/v3'

// Map common ticker symbols to CoinGecko IDs
const COIN_ID_MAP: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  BNB: 'binancecoin',
  XRP: 'ripple',
  ADA: 'cardano',
  AVAX: 'avalanche-2',
  DOGE: 'dogecoin',
  DOT: 'polkadot',
  MATIC: 'matic-network',
  LINK: 'chainlink',
  UNI: 'uniswap',
  ATOM: 'cosmos',
  LTC: 'litecoin',
  NEAR: 'near',
  ALGO: 'algorand',
  APT: 'aptos',
  SUI: 'sui',
  INJ: 'injective-protocol',
  ARB: 'arbitrum',
  OP: 'optimism',
}

export function getCoinGeckoId(symbol: string): string {
  return COIN_ID_MAP[symbol.toUpperCase()] ?? symbol.toLowerCase()
}

function getApiBase() {
  return process.env.COINGECKO_API_KEY ? COINGECKO_PRO_BASE : COINGECKO_BASE
}

function getHeaders() {
  const headers: Record<string, string> = {}
  if (process.env.COINGECKO_API_KEY) {
    headers['x-cg-pro-api-key'] = process.env.COINGECKO_API_KEY
  }
  return headers
}

export interface CoinPrice {
  id: string
  symbol: string
  current_price: number
  price_change_percentage_24h: number
  price_change_24h: number
  market_cap: number
  total_volume: number
  high_24h: number
  low_24h: number
  last_updated: string
}

export async function fetchPrices(symbols: string[]): Promise<CoinPrice[]> {
  const ids = symbols.map(getCoinGeckoId).join(',')
  const base = getApiBase()
  const response = await axios.get(`${base}/coins/markets`, {
    headers: getHeaders(),
    params: {
      vs_currency: 'usd',
      ids,
      order: 'market_cap_desc',
      per_page: 100,
      page: 1,
      sparkline: false,
      price_change_percentage: '24h',
    },
    timeout: 10000,
  })

  return response.data.map((coin: Record<string, unknown>) => ({
    id: coin.id as string,
    symbol: (coin.symbol as string).toUpperCase(),
    current_price: coin.current_price as number,
    price_change_percentage_24h: coin.price_change_percentage_24h as number,
    price_change_24h: coin.price_change_24h as number,
    market_cap: coin.market_cap as number,
    total_volume: coin.total_volume as number,
    high_24h: coin.high_24h as number,
    low_24h: coin.low_24h as number,
    last_updated: coin.last_updated as string,
  }))
}

export interface OHLCVData {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
}

export async function fetchOHLCV(
  symbol: string,
  days: number = 7
): Promise<OHLCVData[]> {
  const id = getCoinGeckoId(symbol)
  const base = getApiBase()
  const response = await axios.get(`${base}/coins/${id}/ohlc`, {
    headers: getHeaders(),
    params: {
      vs_currency: 'usd',
      days,
    },
    timeout: 10000,
  })

  return response.data.map((item: number[]) => ({
    timestamp: item[0],
    open: item[1],
    high: item[2],
    low: item[3],
    close: item[4],
  }))
}

export interface MarketData {
  total_market_cap: number
  btc_dominance: number
  fear_greed_index: number
  fear_greed_label: string
}

export async function fetchMarketOverview(): Promise<MarketData> {
  const base = getApiBase()

  // Fetch global market data
  const [globalResponse, fgResponse] = await Promise.allSettled([
    axios.get(`${base}/global`, { headers: getHeaders(), timeout: 10000 }),
    axios.get('https://api.alternative.me/fng/?limit=1', { timeout: 10000 }),
  ])

  let totalMarketCap = 0
  let btcDominance = 0
  let fearGreedIndex = 50
  let fearGreedLabel = 'Neutral'

  if (globalResponse.status === 'fulfilled') {
    const data = globalResponse.value.data.data
    totalMarketCap = data.total_market_cap?.usd ?? 0
    btcDominance = data.market_cap_percentage?.btc ?? 0
  }

  if (fgResponse.status === 'fulfilled') {
    const fgData = fgResponse.value.data.data?.[0]
    if (fgData) {
      fearGreedIndex = parseInt(fgData.value, 10)
      fearGreedLabel = fgData.value_classification
    }
  }

  return {
    total_market_cap: totalMarketCap,
    btc_dominance: btcDominance,
    fear_greed_index: fearGreedIndex,
    fear_greed_label: fearGreedLabel,
  }
}

// Binance WebSocket stream helpers
export type BinanceTicker = {
  symbol: string
  price: string
  priceChangePercent: string
}

export function getBinanceStreamUrl(symbols: string[]): string {
  const streams = symbols
    .map((s) => `${s.toLowerCase()}usdt@miniTicker`)
    .join('/')
  return `wss://stream.binance.com:9443/stream?streams=${streams}`
}

export interface BinanceStreamMessage {
  stream: string
  data: {
    e: string // event type
    E: number // event time
    s: string // symbol
    c: string // close price
    o: string // open price
    h: string // high price
    l: string // low price
    v: string // total traded base asset volume
    q: string // total traded quote asset volume
  }
}

export function parseBinanceMessage(raw: string): BinanceTicker | null {
  try {
    const msg = JSON.parse(raw) as BinanceStreamMessage
    if (!msg?.data?.s) return null
    const symbol = msg.data.s.replace('USDT', '')
    const openPrice = parseFloat(msg.data.o)
    const closePrice = parseFloat(msg.data.c)
    const priceChangePercent =
      openPrice !== 0 ? (((closePrice - openPrice) / openPrice) * 100).toFixed(2) : '0.00'

    return {
      symbol,
      price: msg.data.c,
      priceChangePercent,
    }
  } catch {
    return null
  }
}

export function formatPrice(price: number): string {
  if (price >= 10000) return price.toLocaleString('en-US', { maximumFractionDigits: 0 })
  if (price >= 1000) return price.toLocaleString('en-US', { maximumFractionDigits: 2 })
  if (price >= 1) return price.toLocaleString('en-US', { maximumFractionDigits: 4 })
  return price.toLocaleString('en-US', { maximumFractionDigits: 6 })
}

export function formatMarketCap(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`
  return `$${value.toLocaleString()}`
}
