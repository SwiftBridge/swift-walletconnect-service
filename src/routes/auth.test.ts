import request from 'supertest'
import { app } from '../index'

describe('Auth Routes', () => {
    describe('GET /api/auth/nonce/:address', () => {
        it('should generate nonce for valid address', async () => {
            const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'

            const response = await request(app)
                .get(`/api/auth/nonce/${address}`)
                .expect(200)

            expect(response.body).toHaveProperty('nonce')
            expect(response.body).toHaveProperty('address', address.toLowerCase())
            expect(response.body).toHaveProperty('timestamp')
            expect(typeof response.body.nonce).toBe('string')
            expect(response.body.nonce).toContain('Sign this message')
        })

        it('should reject invalid address format', async () => {
            const invalidAddress = 'invalid-address'

            const response = await request(app)
                .get(`/api/auth/nonce/${invalidAddress}`)
                .expect(400)

            expect(response.body).toHaveProperty('error')
        })

        it('should normalize address to lowercase', async () => {
            const mixedCaseAddress = '0x742D35Cc6634C0532925a3b844Bc9e7595f0bEb7'

            const response = await request(app)
                .get(`/api/auth/nonce/${mixedCaseAddress}`)
                .expect(200)

            expect(response.body.address).toBe(mixedCaseAddress.toLowerCase())
        })
    })

    describe('POST /api/auth/verify', () => {
        it('should verify valid signature format', async () => {
            const validSignature = '0x' + 'a'.repeat(130)

            const response = await request(app)
                .post('/api/auth/verify')
                .send({
                    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
                    signature: validSignature,
                    message: 'Sign this message to authenticate',
                })
                .expect(200)

            expect(response.body).toHaveProperty('success', true)
            expect(response.body).toHaveProperty('verified', true)
        })

        it('should reject invalid signature format', async () => {
            const response = await request(app)
                .post('/api/auth/verify')
                .send({
                    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
                    signature: 'invalid-signature',
                    message: 'Test message',
                })
                .expect(401)

            expect(response.body).toHaveProperty('error')
        })

        it('should reject missing fields', async () => {
            const response = await request(app)
                .post('/api/auth/verify')
                .send({
                    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
                })
                .expect(400)

            expect(response.body).toHaveProperty('error')
        })
    })

    describe('GET /api/auth/status', () => {
        it('should return authenticated status with session ID', async () => {
            const sessionId = 'session_123_abc'

            const response = await request(app)
                .get('/api/auth/status')
                .set('x-session-id', sessionId)
                .expect(200)

            expect(response.body).toHaveProperty('authenticated', true)
            expect(response.body).toHaveProperty('sessionId', sessionId)
        })

        it('should return unauthenticated without session ID', async () => {
            const response = await request(app)
                .get('/api/auth/status')
                .expect(401)

            expect(response.body).toHaveProperty('authenticated', false)
        })
    })

    describe('Rate Limiting', () => {
        it('should apply rate limits', async () => {
            const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'

            // First request should succeed
            const firstResponse = await request(app)
                .get(`/api/auth/nonce/${address}`)
                .expect(200)

            expect(firstResponse.headers).toHaveProperty('x-ratelimit-limit')
            expect(firstResponse.headers).toHaveProperty('x-ratelimit-remaining')
        })
    })
})
