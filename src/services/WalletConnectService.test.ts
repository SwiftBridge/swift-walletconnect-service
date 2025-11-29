import { WalletConnectService } from './WalletConnectService'

describe('WalletConnectService', () => {
    let service: WalletConnectService

    beforeAll(() => {
        service = new WalletConnectService()
    })

    describe('Address Validation', () => {
        it('should validate valid Ethereum addresses', () => {
            const validAddresses = [
                '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
                '0x0000000000000000000000000000000000000000',
                '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
            ]

            validAddresses.forEach(address => {
                expect(service.isValidAddress(address)).toBe(true)
            })
        })

        it('should reject invalid addresses', () => {
            const invalidAddresses = [
                'not-an-address',
                '0xinvalid',
                '0x123', // too short
                '742d35Cc6634C0532925a3b844Bc9e7595f0bEb7', // missing 0x
                '0xGGGd35Cc6634C0532925a3b844Bc9e7595f0bEb7', // invalid hex
            ]

            invalidAddresses.forEach(address => {
                expect(service.isValidAddress(address)).toBe(false)
            })
        })
    })

    describe('Chain ID Validation', () => {
        it('should validate supported chain IDs', () => {
            expect(service.isValidChainId(1)).toBe(true) // Mainnet
            expect(service.isValidChainId(8453)).toBe(true) // Base
        })

        it('should reject unsupported chain IDs', () => {
            expect(service.isValidChainId(999)).toBe(false)
            expect(service.isValidChainId(0)).toBe(false)
            expect(service.isValidChainId(-1)).toBe(false)
        })
    })

    describe('Session Management', () => {
        it('should create a session', async () => {
            const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'
            const chainId = 8453

            const session = await service.createSession(address, chainId)

            expect(session).toHaveProperty('id')
            expect(session).toHaveProperty('address', address.toLowerCase())
            expect(session).toHaveProperty('chainId', chainId)
            expect(session).toHaveProperty('connectedAt')
            expect(session).toHaveProperty('lastActivity')
            expect(session.id).toMatch(/^session_/)
        })

        it('should get a session by ID', async () => {
            const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'
            const chainId = 8453

            const created = await service.createSession(address, chainId)
            const retrieved = await service.getSession(created.id)

            expect(retrieved).not.toBeNull()
            expect(retrieved?.id).toBe(created.id)
            expect(retrieved?.address).toBe(address.toLowerCase())
        })

        it('should update a session', async () => {
            const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'
            const chainId = 8453

            const session = await service.createSession(address, chainId)
            const metadata = { provider: 'metamask' }

            const updated = await service.updateSession(session.id, { metadata })

            expect(updated).toBe(true)

            const retrieved = await service.getSession(session.id)
            expect(retrieved?.metadata).toEqual(metadata)
        })

        it('should disconnect a session', async () => {
            const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'
            const chainId = 8453

            const session = await service.createSession(address, chainId)
            const disconnected = await service.disconnectSession(session.id)

            expect(disconnected).toBe(true)

            const retrieved = await service.getSession(session.id)
            expect(retrieved).toBeNull()
        })
    })

    describe('Chain Information', () => {
        it('should get supported chains', () => {
            const chains = service.getSupportedChains()

            expect(Array.isArray(chains)).toBe(true)
            expect(chains.length).toBeGreaterThan(0)
            expect(chains[0]).toHaveProperty('id')
            expect(chains[0]).toHaveProperty('name')
            expect(chains[0]).toHaveProperty('nativeCurrency')
        })

        it('should get chain info by ID', () => {
            const baseChain = service.getChainInfo(8453)

            expect(baseChain).toBeDefined()
            expect(baseChain?.id).toBe(8453)
            expect(baseChain?.name).toBe('Base')
        })

        it('should return undefined for unsupported chain', () => {
            const unsupportedChain = service.getChainInfo(999)

            expect(unsupportedChain).toBeUndefined()
        })
    })

    describe('Active Sessions', () => {
        it('should get all active sessions', async () => {
            const sessions = await service.getActiveSessions()

            expect(Array.isArray(sessions)).toBe(true)
        })
    })

    describe('Cleanup', () => {
        it('should cleanup expired sessions', async () => {
            const count = await service.cleanupExpiredSessions()

            expect(typeof count).toBe('number')
            expect(count).toBeGreaterThanOrEqual(0)
        })
    })
})
