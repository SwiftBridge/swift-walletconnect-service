import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import { WalletConnectService } from './services/WalletConnectService'
import { SessionManager } from './services/SessionManager'
import { Logger } from './utils/Logger'
import { ErrorHandler } from './middleware/ErrorHandler'
import { ValidationMiddleware } from './middleware/ValidationMiddleware'
import { RateLimitMiddleware } from './middleware/RateLimitMiddleware'
import { authRoutes } from './routes/auth'
import { sessionRoutes } from './routes/session'
import { walletRoutes } from './routes/wallet'

// Load environment variables
dotenv.config()

const app = express()
const port = process.env.PORT || 3001

// Initialize services
const logger = new Logger()
const walletConnectService = new WalletConnectService()
const sessionManager = new SessionManager()

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Rate limiting
app.use(RateLimitMiddleware)

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  })
  next()
})

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  })
})

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/session', sessionRoutes)
app.use('/api/wallet', walletRoutes)

// Error handling
app.use(ErrorHandler)

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found'
  })
})

// Start server
app.listen(port, () => {
  logger.info(`Swift WalletConnect service running on port ${port}`)
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully')
  process.exit(0)
})

export { app, walletConnectService, sessionManager }
