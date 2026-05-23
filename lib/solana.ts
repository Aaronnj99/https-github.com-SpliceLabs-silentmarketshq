import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  ParsedTransactionWithMeta,
} from '@solana/web3.js'

const HELIUS_RPC = process.env.HELIUS_API_KEY
  ? `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`
  : 'https://api.mainnet-beta.solana.com'

// Create a connection (used server-side only)
export function getConnection(): Connection {
  return new Connection(HELIUS_RPC, 'confirmed')
}

export interface SolBalance {
  lamports: number
  sol: number
}

export async function getSolBalance(walletAddress: string): Promise<SolBalance> {
  const connection = getConnection()
  const pubkey = new PublicKey(walletAddress)
  const lamports = await connection.getBalance(pubkey)
  return {
    lamports,
    sol: lamports / LAMPORTS_PER_SOL,
  }
}

export interface SPLToken {
  mint: string
  symbol: string
  name: string
  amount: number
  decimals: number
  uiAmount: number
  logoUri?: string
}

export async function getSPLTokens(walletAddress: string): Promise<SPLToken[]> {
  const connection = getConnection()
  const pubkey = new PublicKey(walletAddress)

  try {
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(pubkey, {
      programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
    })

    const tokens: SPLToken[] = []

    for (const account of tokenAccounts.value) {
      const parsed = account.account.data.parsed
      const info = parsed?.info
      if (!info) continue

      const uiAmount = info.tokenAmount?.uiAmount ?? 0
      if (uiAmount === 0) continue

      tokens.push({
        mint: info.mint as string,
        symbol: 'UNKNOWN',
        name: 'Unknown Token',
        amount: info.tokenAmount?.amount as number,
        decimals: info.tokenAmount?.decimals as number,
        uiAmount,
      })
    }

    // Try to enrich with metadata via Helius if API key available
    if (process.env.HELIUS_API_KEY && tokens.length > 0) {
      try {
        const mints = tokens.map((t) => t.mint)
        const response = await fetch(
          `https://api.helius.xyz/v0/token-metadata?api-key=${process.env.HELIUS_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mintAccounts: mints }),
          }
        )
        if (response.ok) {
          const metadataList = (await response.json()) as Array<{
            account: string
            onChainMetadata?: {
              metadata?: {
                data?: {
                  name?: string
                  symbol?: string
                }
              }
            }
            offChainMetadata?: {
              metadata?: {
                name?: string
                symbol?: string
                image?: string
              }
            }
          }>
          for (const meta of metadataList) {
            const token = tokens.find((t) => t.mint === meta.account)
            if (!token) continue
            const onChain = meta.onChainMetadata?.metadata?.data
            const offChain = meta.offChainMetadata?.metadata
            token.symbol = onChain?.symbol?.trim() || offChain?.symbol || 'UNKNOWN'
            token.name = onChain?.name?.trim() || offChain?.name || 'Unknown Token'
            token.logoUri = offChain?.image
          }
        }
      } catch {
        // Metadata enrichment failed, keep defaults
      }
    }

    return tokens.sort((a, b) => b.uiAmount - a.uiAmount)
  } catch (error) {
    console.error('Failed to fetch SPL tokens:', error)
    return []
  }
}

export interface SolTransaction {
  signature: string
  blockTime: number | null | undefined
  slot: number
  fee: number
  status: 'success' | 'error'
  type: 'send' | 'receive' | 'other'
  amount: number | null
  from: string | null
  to: string | null
}

export async function getRecentTransactions(
  walletAddress: string,
  limit = 20
): Promise<SolTransaction[]> {
  const connection = getConnection()
  const pubkey = new PublicKey(walletAddress)

  try {
    const signatures = await connection.getSignaturesForAddress(pubkey, { limit })
    if (signatures.length === 0) return []

    const txs = await connection.getParsedTransactions(
      signatures.map((s) => s.signature),
      { maxSupportedTransactionVersion: 0 }
    )

    const results: SolTransaction[] = []

    for (let i = 0; i < signatures.length; i++) {
      const sig = signatures[i]
      const tx = txs[i] as ParsedTransactionWithMeta | null

      if (!tx) {
        results.push({
          signature: sig.signature,
          blockTime: sig.blockTime,
          slot: sig.slot,
          fee: 0,
          status: sig.err ? 'error' : 'success',
          type: 'other',
          amount: null,
          from: null,
          to: null,
        })
        continue
      }

      const fee = tx.meta?.fee ?? 0
      const status = tx.meta?.err ? 'error' : 'success'

      // Try to determine if it's a SOL transfer
      let type: 'send' | 'receive' | 'other' = 'other'
      let amount: number | null = null
      let from: string | null = null
      let to: string | null = null

      const instructions = tx.transaction.message.instructions
      for (const ix of instructions) {
        if ('parsed' in ix && ix.program === 'system') {
          const parsed = ix.parsed as {
            type?: string
            info?: { source?: string; destination?: string; lamports?: number }
          }
          if (parsed?.type === 'transfer') {
            const info = parsed.info
            from = info?.source ?? null
            to = info?.destination ?? null
            amount = (info?.lamports ?? 0) / LAMPORTS_PER_SOL
            type = to === walletAddress ? 'receive' : 'send'
            break
          }
        }
      }

      results.push({
        signature: sig.signature,
        blockTime: tx.blockTime,
        slot: sig.slot,
        fee,
        status,
        type,
        amount,
        from,
        to,
      })
    }

    return results
  } catch (error) {
    console.error('Failed to fetch transactions:', error)
    return []
  }
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}

export function lamportsToSol(lamports: number): number {
  return lamports / LAMPORTS_PER_SOL
}
