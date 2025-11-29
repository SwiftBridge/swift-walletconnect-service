import { createAppKit } from '@reown/appkit/react'
import { createConfig, http } from 'wagmi'
import { mainnet, base } from 'wagmi/chains'
import { Logger } from '../utils/Logger'
import { SessionManager } from './SessionManager'

export interface WalletConnectConfig {
  projectId: string
  baseRpcUrl: string
  metadata: {
    name: string
    description: string
    url: string
    icons: string[]
  }
}

export interface WalletSession {
  id: string
  address: string
  chainId: number
  connectedAt: Date
  lastActivity: Date
  metadata?: any
}

export class WalletConnectService {
  private logger: Logger
  private sessionManager: SessionManager
  private config: WalletConnectConfig
  private wagmiConfig: any
  private appKit: any

  constructor() {
    this.logger = new Logger()
    this.sessionManager = new SessionManager()

    this.config = {
      projectId: process.env.WALLETCONNECT_PROJECT_ID || '',
      baseRpcUrl: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
      metadata: {
        name: 'Swift v2',
        description: 'Decentralized Social Messaging Platform',
        url: process.env.APP_URL || 'https://swift-v2.vercel.app',
        icons: [`${process.env.APP_URL || 'https://swift-v2.vercel.app'}/icon.png`]
      }
    }

    this.initializeWagmi()
    this.initializeAppKit()
  }

  private initializeWagmi() {
    this.wagmiConfig = createConfig({
      chains: [base, mainnet],
      transports: {
        [base.id]: http(this.config.baseRpcUrl),
        [mainnet.id]: http(),
      },
    })
  }

  private initializeAppKit() {
    this.appKit = createAppKit({
      adapters: [this.wagmiConfig],
      networks: [base, mainnet],
      projectId: this.config.projectId,
      metadata: this.config.metadata,
      features: {
        analytics: true,
        email: false,
        socials: [],
      },
      themeMode: 'dark',
      themeVariables: {
        '--w3m-color-mix': '#3b82f6',
        '--w3m-color-mix-strength': 40,
      },
    })
  }

  async createSession(address: string, chainId: number): Promise<WalletSession> {
    try {
      const session: WalletSession = {
        id: this.generateSessionId(),
        address: address.toLowerCase(),
        chainId,
        connectedAt: new Date(),
        lastActivity: new Date(),
      }

      await this.sessionManager.createSession(session)
      this.logger.info('Wallet session created', { sessionId: session.id, address })

      return session
    } catch (error) {
      this.logger.error('Failed to create wallet session', error)
      throw new Error('Failed to create wallet session')
    }
  }

  async getSession(sessionId: string): Promise<WalletSession | null> {
    try {
      const session = await this.sessionManager.getSession(sessionId)
      if (session) {
        // Update last activity
        session.lastActivity = new Date()
        await this.sessionManager.updateSession(session)
      }
      return session
    } catch (error) {
      this.logger.error('Failed to get wallet session', error)
      return null
    }
  }

  async updateSession(sessionId: string, updates: Partial<WalletSession>): Promise<boolean> {
    try {
      const session = await this.sessionManager.getSession(sessionId)
      if (!session) {
        return false
      }

      const updatedSession = { ...session, ...updates, lastActivity: new Date() }
      await this.sessionManager.updateSession(updatedSession)

      this.logger.info('Wallet session updated', { sessionId, updates })
      return true
    } catch (error) {
      this.logger.error('Failed to update wallet session', error)
      return false
    }
  }

  async disconnectSession(sessionId: string): Promise<boolean> {
    try {
      await this.sessionManager.deleteSession(sessionId)
      this.logger.info('Wallet session disconnected', { sessionId })
      return true
    } catch (error) {
      this.logger.error('Failed to disconnect wallet session', error)
      return false
    }
  }

  async getActiveSessions(): Promise<WalletSession[]> {
    try {
      return await this.sessionManager.getAllSessions()
    } catch (error) {
      this.logger.error('Failed to get active sessions', error)
      return []
    }
  }

  async cleanupExpiredSessions(): Promise<number> {
    try {
      const expiredSessions = await this.sessionManager.cleanupExpiredSessions()
      this.logger.info('Cleaned up expired sessions', { count: expiredSessions })
      return expiredSessions
    } catch (error) {
      this.logger.error('Failed to cleanup expired sessions', error)
      return 0
    }
  }

  getWagmiConfig() {
    return this.wagmiConfig
  }

  getAppKit() {
    return this.appKit
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Validate wallet address
  isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address)
  }

  // Validate chain ID
  isValidChainId(chainId: number): boolean {
    return chainId === base.id || chainId === mainnet.id
  }

  // Get supported chains
  getSupportedChains() {
    return [base, mainnet]
  }

  // Get chain info by ID
  getChainInfo(chainId: number) {
    const chains = this.getSupportedChains()
    return chains.find(chain => chain.id === chainId)
  }
}
