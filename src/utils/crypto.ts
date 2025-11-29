import { createHash, randomBytes } from 'crypto'
import { verifyMessage } from 'viem'

/**
 * Generate a cryptographically secure random nonce
 */
export function generateNonce(): string {
    const timestamp = Date.now()
    const random = randomBytes(16).toString('hex')
    return `${timestamp}-${random}`
}

/**
 * Create a standardized message for wallet signature
 */
export function createSignatureMessage(nonce: string, address: string): string {
    return `Sign this message to authenticate with Swift v2.

Address: ${address}
Nonce: ${nonce}
Timestamp: ${Date.now()}

This request will not trigger a blockchain transaction or cost any gas fees.`
}

/**
 * Verify an Ethereum signature
 */
export async function verifyEthereumSignature(
    message: string,
    signature: string,
    expectedAddress: string
): Promise<boolean> {
    try {
        const recoveredAddress = await verifyMessage({
            address: expectedAddress as `0x${string}`,
            message,
            signature: signature as `0x${string}`,
        })

        return recoveredAddress === true
    } catch (error) {
        return false
    }
}

/**
 * Hash a string using SHA256
 */
export function sha256(data: string): string {
    return createHash('sha256').update(data).digest('hex')
}

/**
 * Generate a session ID
 */
export function generateSessionId(): string {
    const prefix = 'session'
    const timestamp = Date.now()
    const random = randomBytes(8).toString('hex')
    return `${prefix}_${timestamp}_${random}`
}

/**
 * Validate Ethereum address format
 */
export function isValidEthereumAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address)
}

/**
 * Normalize Ethereum address to lowercase
 */
export function normalizeAddress(address: string): string {
    return address.toLowerCase()
}

/**
 * Generate a random string of specified length
 */
export function generateRandomString(length: number = 32): string {
    return randomBytes(Math.ceil(length / 2))
        .toString('hex')
        .slice(0, length)
}

/**
 * Create a deterministic hash from session data
 */
export function hashSessionData(address: string, chainId: number, timestamp: number): string {
    const data = `${address}-${chainId}-${timestamp}`
    return sha256(data)
}
