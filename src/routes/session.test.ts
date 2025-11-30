import request from 'supertest'
import { app } from '../index'
import { WalletConnectService } from '../services/WalletConnectService'

describe('Session Routes', () => {
    let walletConnectService: WalletConnectService

    beforeAll(() => {
        walletConnectService = new WalletConnectService()
    })

    describe('POST /api/session/create', () => {
        it('should create a new session', async () => {
            const response = await request(app)
                .post('/api/session/create')
                .send({
                    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
                    chainId: 8453,
                    metadata: { provider: 'metamask' },
                })
                .expect(201)

            expect(response.body).toHaveProperty('success', true)
            expect(response.body).toHaveProperty('session')
            expect(response.body.session).toHaveProperty('id')
            expect(response.body.session).toHaveProperty('address')
            expect(response.body.session).toHaveProperty('chainId', 8453)
        })

        it('should reject invalid address', async () => {
            const response = await request(app)
                .post('/api/session/create')
                .send({
                    address: 'invalid',
                    chainId: 8453,
                })
                .expect(400)

            expect(response.body).toHaveProperty('error')
        })

        it('should reject unsupported chain ID', async () => {
            const response = await request(app)
                .post('/api/session/create')
                .send({
                    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
                    chainId: 999,
                })
                .expect(400)

            expect(response.body).toHaveProperty('error')
        })
    })

    describe('GET /api/session/:sessionId', () => {
        it('should get session details', async () => {
            // First create a session
            const createResponse = await request(app)
                .post('/api/session/create')
                .send({
                    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
                    chainId: 8453,
                })

            const sessionId = createResponse.body.session.id

            // Then retrieve it
            const response = await request(app)
                .get(`/api/session/${sessionId}`)
                .expect(200)

            expect(response.body).toHaveProperty('success', true)
            expect(response.body.session).toHaveProperty('id', sessionId)
        })

        it('should return 404 for non-existent session', async () => {
            const response = await request(app)
                .get('/api/session/nonexistent_session')
                .expect(404)

            expect(response.body).toHaveProperty('error')
        })
    })

    describe('PUT /api/session/:sessionId', () => {
        it('should update session metadata', async () => {
            // Create session
            const createResponse = await request(app)
                .post('/api/session/create')
                .send({
                    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
                    chainId: 8453,
                })

            const sessionId = createResponse.body.session.id

            // Update it
            const response = await request(app)
                .put(`/api/session/${sessionId}`)
                .send({
                    metadata: { updated: true },
                })
                .expect(200)

            expect(response.body).toHaveProperty('success', true)
        })
    })

    describe('DELETE /api/session/:sessionId', () => {
        it('should disconnect session', async () => {
            // Create session
            const createResponse = await request(app)
                .post('/api/session/create')
                .send({
                    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
                    chainId: 8453,
                })

            const sessionId = createResponse.body.session.id

            // Delete it
            const response = await request(app)
                .delete(`/api/session/${sessionId}`)
                .expect(200)

            expect(response.body).toHaveProperty('success', true)
        })
    })

    describe('GET /api/session/active/all', () => {
        it('should return all active sessions', async () => {
            const response = await request(app)
                .get('/api/session/active/all')
                .expect(200)

            expect(response.body).toHaveProperty('success', true)
            expect(response.body).toHaveProperty('count')
            expect(response.body).toHaveProperty('sessions')
            expect(Array.isArray(response.body.sessions)).toBe(true)
        })
    })

    describe('POST /api/session/cleanup', () => {
        it('should cleanup expired sessions', async () => {
            const response = await request(app)
                .post('/api/session/cleanup')
                .expect(200)

            expect(response.body).toHaveProperty('success', true)
            expect(response.body).toHaveProperty('cleanedCount')
            expect(typeof response.body.cleanedCount).toBe('number')
        })
    })
})
