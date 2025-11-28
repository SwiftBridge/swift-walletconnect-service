import { Router, Request, Response } from 'express'
import { asyncHandler, AppError } from '../middleware/ErrorHandler'
import { ValidationMiddleware, schemas } from '../middleware/ValidationMiddleware'
import { WalletConnectService } from '../services/WalletConnectService'
import { SessionManager } from '../services/SessionManager'
import { Logger } from '../utils/Logger'

const router = Router()
const logger = new Logger()
const walletConnectService = new WalletConnectService()
const sessionManager = new SessionManager()

/**
 * GET /api/wallet/info/:address
 * Get wallet information and sessions
 */
router.get(
    '/info/:address',
    asyncHandler(async (req: Request, res: Response) => {
        const { address } = req.params

        if (!walletConnectService.isValidAddress(address)) {
            throw new AppError('Invalid wallet address', 400)
        }

        const sessions = await sessionManager.getSessionsByAddress(address.toLowerCase())

        res.json({
            success: true,
            address: address.toLowerCase(),
            sessionsCount: sessions.length,
            sessions: sessions.map(s => ({
                id: s.id,
                chainId: s.chainId,
                connectedAt: s.connectedAt,
                lastActivity: s.lastActivity,
            })),
        })
    })
)

/**
 * GET /api/wallet/chains
 * Get supported blockchain networks
 */
router.get(
    '/chains',
    asyncHandler(async (req: Request, res: Response) => {
        const chains = walletConnectService.getSupportedChains()

        res.json({
            success: true,
            chains: chains.map(chain => ({
                id: chain.id,
                name: chain.name,
                network: chain.network,
                nativeCurrency: chain.nativeCurrency,
                rpcUrls: chain.rpcUrls,
                blockExplorers: chain.blockExplorers,
            })),
        })
    })
)

/**
 * GET /api/wallet/chain/:chainId
 * Get specific chain information
 */
router.get(
    '/chain/:chainId',
    asyncHandler(async (req: Request, res: Response) => {
        const chainId = parseInt(req.params.chainId)

        if (isNaN(chainId)) {
            throw new AppError('Invalid chain ID', 400)
        }

        const chainInfo = walletConnectService.getChainInfo(chainId)

        if (!chainInfo) {
            throw new AppError('Chain not supported', 404)
        }

        res.json({
            success: true,
            chain: {
                id: chainInfo.id,
                name: chainInfo.name,
                network: chainInfo.network,
                nativeCurrency: chainInfo.nativeCurrency,
                rpcUrls: chainInfo.rpcUrls,
                blockExplorers: chainInfo.blockExplorers,
            },
        })
    })
)

/**
 * POST /api/wallet/validate
 * Validate wallet address
 */
router.post(
    '/validate',
    ValidationMiddleware(schemas.walletAddress),
    asyncHandler(async (req: Request, res: Response) => {
        const { address } = req.body

        const isValid = walletConnectService.isValidAddress(address)

        res.json({
            success: true,
            address,
            valid: isValid,
        })
    })
)

/**
 * GET /api/wallet/config
 * Get WalletConnect configuration
 */
router.get(
    '/config',
    asyncHandler(async (req: Request, res: Response) => {
        const wagmiConfig = walletConnectService.getWagmiConfig()
        const supportedChains = walletConnectService.getSupportedChains()

        res.json({
            success: true,
            config: {
                projectId: process.env.WALLETCONNECT_PROJECT_ID || '',
                supportedChains: supportedChains.map(c => c.id),
                defaultChain: 8453, // Base
                metadata: {
                    name: 'Swift v2',
                    description: 'Decentralized Social Messaging Platform',
                    url: process.env.APP_URL || 'https://swift-v2.vercel.app',
                },
            },
        })
    })
)

/**
 * POST /api/wallet/disconnect/:address
 * Disconnect all sessions for an address
 */
router.post(
    '/disconnect/:address',
    asyncHandler(async (req: Request, res: Response) => {
        const { address } = req.params

        if (!walletConnectService.isValidAddress(address)) {
            throw new AppError('Invalid wallet address', 400)
        }

        const sessions = await sessionManager.getSessionsByAddress(address.toLowerCase())

        let disconnectedCount = 0
        for (const session of sessions) {
            const success = await walletConnectService.disconnectSession(session.id)
            if (success) disconnectedCount++
        }

        logger.info('Wallet disconnected', { address, sessionsDisconnected: disconnectedCount })

        res.json({
            success: true,
            address: address.toLowerCase(),
            sessionsDisconnected: disconnectedCount,
            message: `Disconnected ${disconnectedCount} session(s)`,
        })
    })
)

export const walletRoutes = router
