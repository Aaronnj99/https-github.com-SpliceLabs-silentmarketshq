'use client'
import useSWR from 'swr'
import { Wallet, ArrowUpRight, ArrowDownLeft, RefreshCw, ExternalLink, Link2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useJarvisStore } from '@/store/jarvis'

interface WalletResponse {
  configured: boolean
  address: string | null
  sol: number
  solUsd: number
  tokens: Array<{
    mint: string
    symbol: string
    name: string
    uiAmount: number
    logoUri?: string
  }>
  transactions: Array<{
    signature: string
    blockTime: number | null
    fee: number
    status: 'success' | 'error'
    type: 'send' | 'receive' | 'other'
    amount: number | null
    from: string | null
    to: string | null
  }>
}

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return r.json() as Promise<WalletResponse>
  })

function shortenAddress(addr: string, chars = 4): string {
  if (!addr || addr.length < chars * 2 + 3) return addr
  return `${addr.slice(0, chars)}...${addr.slice(-chars)}`
}

function formatSol(amount: number): string {
  return amount.toFixed(4)
}

export function SolanaWallet() {
  const prices = useJarvisStore((s) => s.prices)
  const solPrice = prices['SOL']?.price ?? 0

  const { data, isLoading, error, mutate, isValidating } = useSWR<WalletResponse>(
    '/api/solana/wallet',
    fetcher,
    { refreshInterval: 60000 }
  )

  const solUsd = ((data?.sol ?? 0) * solPrice) || (data?.solUsd ?? 0)

  return (
    <div className="card" style={{ padding: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Wallet size={16} color="#9945FF" />
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: '14px', color: '#E5E7EB' }}>
            Solana Wallet
          </span>
          {data?.address && (
            <span style={{ fontSize: '10px', color: '#4B5563', fontFamily: 'JetBrains Mono, monospace', background: 'rgba(153,69,255,0.08)', padding: '2px 8px', borderRadius: '4px' }}>
              {shortenAddress(data.address)}
            </span>
          )}
        </div>
        <button
          onClick={() => mutate()}
          disabled={isValidating}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace' }}
        >
          <RefreshCw size={13} style={{ animation: isValidating ? 'spin 1s linear infinite' : 'none' }} />
          {isValidating ? 'Refreshing' : 'Refresh'}
        </button>
      </div>

      {/* Not configured */}
      {!data?.configured && !isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '24px 16px', textAlign: 'center' }}>
          <Link2 size={32} color="rgba(153,69,255,0.3)" />
          <div>
            <div style={{ color: '#E5E7EB', fontSize: '13px', fontFamily: 'Syne, sans-serif', fontWeight: 600, marginBottom: '4px' }}>
              Configure Solana Wallet
            </div>
            <div style={{ color: '#4B5563', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace' }}>
              Set SOLANA_WALLET_ADDRESS in .env.local
            </div>
          </div>
          <a href="/settings" style={{ background: 'rgba(153,69,255,0.15)', border: '1px solid rgba(153,69,255,0.4)', borderRadius: '6px', color: '#9945FF', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', padding: '8px 16px', textDecoration: 'none' }}>
            Settings
          </a>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="skeleton" style={{ height: '80px', borderRadius: '6px' }} />
          <div className="skeleton" style={{ height: '80px', borderRadius: '6px' }} />
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div style={{ color: '#FF4444', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', padding: '16px 0' }}>
          Failed to load wallet: {error.message}
        </div>
      )}

      {/* Content */}
      {data?.configured && !isLoading && !error && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Left: Balance + tokens */}
          <div>
            {/* SOL balance */}
            <div style={{ background: 'linear-gradient(135deg, rgba(153,69,255,0.1), rgba(0,212,255,0.05))', border: '1px solid rgba(153,69,255,0.2)', borderRadius: '8px', padding: '16px', marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: '#4B5563', fontFamily: 'JetBrains Mono, monospace', marginBottom: '8px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                SOL Balance
              </div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#9945FF', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '-0.02em' }}>
                {formatSol(data.sol ?? 0)}
              </div>
              <div style={{ fontSize: '14px', color: '#E5E7EB', fontFamily: 'JetBrains Mono, monospace', marginTop: '4px' }}>
                ${solUsd.toLocaleString('en-US', { maximumFractionDigits: 2 })}
              </div>
              {data.address && (
                <a
                  href={`https://solscan.io/account/${data.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '8px', fontSize: '10px', color: '#9945FF', fontFamily: 'JetBrains Mono, monospace', textDecoration: 'none', opacity: 0.8 }}
                >
                  <ExternalLink size={10} />
                  View on Solscan
                </a>
              )}
            </div>

            {/* SPL Tokens */}
            {data.tokens && data.tokens.length > 0 && (
              <div>
                <div style={{ fontSize: '10px', color: '#4B5563', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>
                  SPL Tokens
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {data.tokens.slice(0, 6).map((token) => (
                    <div key={token.mint} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '5px' }}>
                      {token.logoUri ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={token.logoUri} alt={token.symbol} width={18} height={18} style={{ borderRadius: '50%' }} />
                      ) : (
                        <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(153,69,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', color: '#9945FF', fontFamily: 'JetBrains Mono, monospace' }}>
                          {token.symbol.slice(0, 2)}
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '11px', color: '#E5E7EB', fontFamily: 'JetBrains Mono, monospace' }}>{token.symbol}</div>
                      </div>
                      <div style={{ fontSize: '11px', color: '#9CA3AF', fontFamily: 'JetBrains Mono, monospace' }}>
                        {token.uiAmount.toLocaleString('en-US', { maximumFractionDigits: 4 })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Transactions */}
          <div>
            <div style={{ fontSize: '10px', color: '#4B5563', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
              Recent Transactions
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '280px', overflowY: 'auto' }}>
              {!data.transactions || data.transactions.length === 0 ? (
                <div style={{ color: '#4B5563', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', padding: '16px 0' }}>
                  No recent transactions
                </div>
              ) : (
                data.transactions.map((tx) => {
                  const isReceive = tx.type === 'receive'
                  const isSend = tx.type === 'send'
                  const typeColor = isReceive ? '#00FF94' : isSend ? '#FF4444' : '#4B5563'

                  return (
                    <div
                      key={tx.signature}
                      style={{
                        display: 'flex',
                        gap: '8px',
                        padding: '8px 10px',
                        background: tx.status === 'error' ? 'rgba(255,68,68,0.04)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${tx.status === 'error' ? 'rgba(255,68,68,0.15)' : 'rgba(255,255,255,0.05)'}`,
                        borderRadius: '5px',
                        alignItems: 'center',
                      }}
                    >
                      {isReceive ? (
                        <ArrowDownLeft size={14} color="#00FF94" style={{ flexShrink: 0 }} />
                      ) : isSend ? (
                        <ArrowUpRight size={14} color="#FF4444" style={{ flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: 'rgba(75,85,99,0.5)', flexShrink: 0 }} />
                      )}
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', color: typeColor, fontFamily: 'JetBrains Mono, monospace', textTransform: 'capitalize' }}>
                            {tx.type}
                          </span>
                          {tx.amount !== null && (
                            <span style={{ fontSize: '11px', color: '#E5E7EB', fontFamily: 'JetBrains Mono, monospace' }}>
                              {formatSol(tx.amount)} SOL
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '10px', color: '#4B5563', fontFamily: 'JetBrains Mono, monospace', marginTop: '2px' }}>
                          {tx.blockTime
                            ? formatDistanceToNow(new Date(tx.blockTime * 1000), { addSuffix: true })
                            : 'Pending'
                          } · fee: {(tx.fee / 1e9).toFixed(6)} SOL
                        </div>
                      </div>
                      <a
                        href={`https://solscan.io/tx/${tx.signature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#4B5563', flexShrink: 0 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink size={11} />
                      </a>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
