// API Request and Response type definitions

// Auth API types
export interface NonceRequest {
    address: string
}

export interface NonceResponse {
    nonce: string
    address: string
    timestamp: number
}

export interface VerifySignatureRequest {
    address: string
    signature: string
    message: string
}

export interface VerifySignatureResponse {
    success: boolean
    address: string
    verified: boolean
}

export interface AuthStatusResponse {
    authenticated: boolean
    sessionId?: string
    message?: string
}

// Session API types
export interface CreateSessionRequest {
    address: string
    chainId: number
    metadata?: Record<string, any>
}

export interface CreateSessionResponse {
    success: boolean
    session: {
        id: string
        address: string
        chainId: number
        connectedAt: Date
    }
}

export interface SessionResponse {
    success: boolean
    session: {
        id: string
        address: string
        chainId: number
        connectedAt: Date
        lastActivity: Date
        metadata?: Record<string, any>
    }
}

export interface UpdateSessionRequest {
    chainId?: number
    metadata?: Record<string, any>
}

export interface SessionListResponse {
    success: boolean
    count: number
    sessions: Array<{
        id: string
        address: string
        chainId: number
        connectedAt: Date
        lastActivity: Date
    }>
}

// Wallet API types
export interface WalletInfoResponse {
    success: boolean
    address: string
    sessionsCount: number
    sessions: Array<{
        id: string
        chainId: number
        connectedAt: Date
        lastActivity: Date
    }>
}

export interface ChainListResponse {
    success: boolean
    chains: Array<{
        id: number
        name: string
        nativeCurrency: {
            name: string
            symbol: string
            decimals: number
        }
        rpcUrls: any
        blockExplorers: any
    }>
}

export interface ValidateAddressRequest {
    address: string
}

export interface ValidateAddressResponse {
    success: boolean
    address: string
    valid: boolean
}

export interface WalletConfigResponse {
    success: boolean
    config: {
        projectId: string
        supportedChains: number[]
        defaultChain: number
        metadata: {
            name: string
            description: string
            url: string
        }
    }
}

// Generic API types
export interface ErrorResponse {
    error: string
    statusCode?: number
    message?: string
}

export interface SuccessResponse {
    success: boolean
    message?: string
}

export interface HealthCheckResponse {
    status: 'healthy' | 'unhealthy'
    timestamp: string
    version: string
}
