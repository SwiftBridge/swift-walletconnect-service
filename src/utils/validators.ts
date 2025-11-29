import { ChainId } from '../types'

/**
 * Validate Ethereum address
 */
export function validateAddress(address: string): { valid: boolean; error?: string } {
    if (!address) {
        return { valid: false, error: 'Address is required' }
    }

    if (typeof address !== 'string') {
        return { valid: false, error: 'Address must be a string' }
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        return { valid: false, error: 'Invalid Ethereum address format' }
    }

    return { valid: true }
}

/**
 * Validate chain ID
 */
export function validateChainId(chainId: number): { valid: boolean; error?: string } {
    if (typeof chainId !== 'number') {
        return { valid: false, error: 'Chain ID must be a number' }
    }

    const supportedChains = [ChainId.MAINNET, ChainId.BASE]

    if (!supportedChains.includes(chainId)) {
        return {
            valid: false,
            error: `Unsupported chain ID. Supported chains: ${supportedChains.join(', ')}`,
        }
    }

    return { valid: true }
}

/**
 * Validate signature format
 */
export function validateSignature(signature: string): { valid: boolean; error?: string } {
    if (!signature) {
        return { valid: false, error: 'Signature is required' }
    }

    if (typeof signature !== 'string') {
        return { valid: false, error: 'Signature must be a string' }
    }

    // Ethereum signatures are 65 bytes = 130 hex characters + 0x prefix
    if (!/^0x[a-fA-F0-9]{130}$/.test(signature)) {
        return { valid: false, error: 'Invalid signature format' }
    }

    return { valid: true }
}

/**
 * Validate session ID format
 */
export function validateSessionId(sessionId: string): { valid: boolean; error?: string } {
    if (!sessionId) {
        return { valid: false, error: 'Session ID is required' }
    }

    if (typeof sessionId !== 'string') {
        return { valid: false, error: 'Session ID must be a string' }
    }

    if (!sessionId.startsWith('session_')) {
        return { valid: false, error: 'Invalid session ID format' }
    }

    return { valid: true }
}

/**
 * Validate metadata object
 */
export function validateMetadata(metadata: any): { valid: boolean; error?: string } {
    if (!metadata) {
        return { valid: true } // Metadata is optional
    }

    if (typeof metadata !== 'object' || Array.isArray(metadata)) {
        return { valid: false, error: 'Metadata must be an object' }
    }

    // Check metadata size (prevent abuse)
    const jsonString = JSON.stringify(metadata)
    const sizeInBytes = Buffer.byteLength(jsonString, 'utf8')
    const maxSize = 10 * 1024 // 10KB

    if (sizeInBytes > maxSize) {
        return { valid: false, error: `Metadata too large. Max size: ${maxSize} bytes` }
    }

    return { valid: true }
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input: string): string {
    if (typeof input !== 'string') {
        return ''
    }

    // Remove control characters and trim
    return input.replace(/[\x00-\x1F\x7F]/g, '').trim()
}

/**
 * Validate environment variables
 */
export function validateEnvironment(): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    const required = [
        'WALLETCONNECT_PROJECT_ID',
        'REDIS_HOST',
        'REDIS_PORT',
    ]

    for (const key of required) {
        if (!process.env[key]) {
            errors.push(`Missing required environment variable: ${key}`)
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    }
}

/**
 * Validate pagination parameters
 */
export function validatePagination(
    page?: number,
    limit?: number
): { valid: boolean; page: number; limit: number; error?: string } {
    const defaultPage = 1
    const defaultLimit = 20
    const maxLimit = 100

    const validatedPage = page && page > 0 ? page : defaultPage
    const validatedLimit = limit && limit > 0 ? Math.min(limit, maxLimit) : defaultLimit

    return {
        valid: true,
        page: validatedPage,
        limit: validatedLimit,
    }
}
