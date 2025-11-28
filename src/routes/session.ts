import { Router, Request, Response } from 'express'
import { asyncHandler, AppError } from '../middleware/ErrorHandler'
import { ValidationMiddleware, schemas } from '../middleware/ValidationMiddleware'
import { WalletConnectService } from '../services/WalletConnectService'
import { Logger } from '../utils/Logger'

const router = Router()
const logger = new Logger()
const walletConnectService = new WalletConnectService()

/**
 * POST /api/session/create
 * Create a new wallet session
 */
router.post(
    '/create',
    ValidationMiddleware(schemas.createSession),
    asyncHandler(async (req: Request, res: Response) => {
        const { address, chainId, metadata } = req.body

        // Validate address
        if (!walletConnectService.isValidAddress(address)) {
            throw new AppError('Invalid wallet address', 400)
        }

        // Validate chain ID
        if (!walletConnectService.isValidChainId(chainId)) {
            throw new AppError('Unsupported chain ID', 400)
        }

        const session = await walletConnectService.createSession(address, chainId)

        if (metadata) {
            await walletConnectService.updateSession(session.id, { metadata })
        }

        logger.info('Session created', { sessionId: session.id, address, chainId })

        res.status(201).json({
            success: true,
            session: {
                id: session.id,
                address: session.address,
                chainId: session.chainId,
                connectedAt: session.connectedAt,
            },
        })
    })
)

/**
 * GET /api/session/:sessionId
 * Get session details
 */
router.get(
    '/:sessionId',
    asyncHandler(async (req: Request, res: Response) => {
        const { sessionId } = req.params

        const session = await walletConnectService.getSession(sessionId)

        if (!session) {
            throw new AppError('Session not found', 404)
        }

        res.json({
            success: true,
            session: {
                id: session.id,
                address: session.address,
                chainId: session.chainId,
                connectedAt: session.connectedAt,
                lastActivity: session.lastActivity,
                metadata: session.metadata,
            },
        })
    })
)

/**
 * PUT /api/session/:sessionId
 * Update session
 */
router.put(
    '/:sessionId',
    ValidationMiddleware(schemas.updateSession),
    asyncHandler(async (req: Request, res: Response) => {
        const { sessionId } = req.params
        const updates = req.body

        const success = await walletConnectService.updateSession(sessionId, updates)

        if (!success) {
            throw new AppError('Session not found or update failed', 404)
        }

        logger.info('Session updated', { sessionId, updates })

        res.json({
            success: true,
            message: 'Session updated successfully',
        })
    })
)

/**
 * DELETE /api/session/:sessionId
 * Disconnect session
 */
router.delete(
    '/:sessionId',
    asyncHandler(async (req: Request, res: Response) => {
        const { sessionId } = req.params

        const success = await walletConnectService.disconnectSession(sessionId)

        if (!success) {
            throw new AppError('Session not found or disconnect failed', 404)
        }

        logger.info('Session disconnected', { sessionId })

        res.json({
            success: true,
            message: 'Session disconnected successfully',
        })
    })
)

/**
 * GET /api/session/active/all
 * Get all active sessions
 */
router.get(
    '/active/all',
    asyncHandler(async (req: Request, res: Response) => {
        const sessions = await walletConnectService.getActiveSessions()

        res.json({
            success: true,
            count: sessions.length,
            sessions: sessions.map(s => ({
                id: s.id,
                address: s.address,
                chainId: s.chainId,
                connectedAt: s.connectedAt,
                lastActivity: s.lastActivity,
            })),
        })
    })
)

/**
 * POST /api/session/cleanup
 * Cleanup expired sessions
 */
router.post(
    '/cleanup',
    asyncHandler(async (req: Request, res: Response) => {
        const cleanedCount = await walletConnectService.cleanupExpiredSessions()

        logger.info('Expired sessions cleaned up', { count: cleanedCount })

        res.json({
            success: true,
            cleanedCount,
            message: `Cleaned up ${cleanedCount} expired session(s)`,
        })
    })
)

export const sessionRoutes = router
