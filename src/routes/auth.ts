import { Router, Request, Response } from 'express'
import { asyncHandler } from '../middleware/ErrorHandler'
import { ValidationMiddleware, schemas } from '../middleware/ValidationMiddleware'
import { Logger } from '../utils/Logger'

const router = Router()
const logger = new Logger()

/**
 * GET /api/auth/nonce
 * Generate a nonce for wallet authentication
 */
router.get(
    '/nonce/:address',
    asyncHandler(async (req: Request, res: Response) => {
        const { address } = req.params

        // Validate address format
        if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
            res.status(400).json({
                error: 'Invalid address format',
            })
            return
        }

        const nonce = `Sign this message to authenticate with Swift v2.\n\nNonce: ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        logger.info('Nonce generated', { address })

        res.json({
            nonce,
            address: address.toLowerCase(),
            timestamp: Date.now(),
        })
    })
)

/**
 * POST /api/auth/verify
 * Verify wallet signature
 */
router.post(
    '/verify',
    asyncHandler(async (req: Request, res: Response) => {
        const { address, signature, message } = req.body

        if (!address || !signature || !message) {
            res.status(400).json({
                error: 'Missing required fields: address, signature, message',
            })
            return
        }

        // TODO: Implement actual signature verification with ethers/viem
        // For now, we'll just validate format
        const isValid = /^0x[a-fA-F0-9]{130}$/.test(signature)

        if (!isValid) {
            logger.warn('Invalid signature format', { address })
            res.status(401).json({
                error: 'Invalid signature',
            })
            return
        }

        logger.info('Signature verified', { address })

        res.json({
            success: true,
            address: address.toLowerCase(),
            verified: true,
        })
    })
)

/**
 * GET /api/auth/status
 * Check authentication status
 */
router.get(
    '/status',
    asyncHandler(async (req: Request, res: Response) => {
        const sessionId = req.headers['x-session-id'] as string

        if (!sessionId) {
            res.status(401).json({
                authenticated: false,
                message: 'No session ID provided',
            })
            return
        }

        // TODO: Check session validity with SessionManager
        res.json({
            authenticated: true,
            sessionId,
        })
    })
)

export const authRoutes = router
