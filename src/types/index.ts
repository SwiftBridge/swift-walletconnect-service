// Centralized type definitions for WalletConnect service

export interface WalletSession {
    id: string
    address: string
    chainId: number
    connectedAt: Date
    lastActivity: Date
    metadata?: Record<string, any>
}

export interface ChainInfo {
    id: number
    name: string
    nativeCurrency: {
        name: string
        symbol: string
        decimals: number
    }
    rpcUrls: {
        default: { http: readonly string[] }
        public: { http: readonly string[] }
    }
    blockExplorers?: {
        default: { name: string; url: string }
    }
}

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

export interface SessionMetrics {
    totalSessions: number
    activeSessions: number
    uniqueAddresses: number
    averageSessionDuration: number
}

export interface RateLimitInfo {
    limit: number
    remaining: number
    reset: number
}

export enum LogLevel {
    ERROR = 'error',
    WARN = 'warn',
    INFO = 'info',
    HTTP = 'http',
    DEBUG = 'debug',
}

export enum ChainId {
    MAINNET = 1,
    BASE = 8453,
}

export type SessionStatus = 'active' | 'expired' | 'disconnected'

export type WalletProvider = 'metamask' | 'walletconnect' | 'coinbase' | 'other'
