import { Logger } from '../utils/Logger'
import { CacheService } from './CacheService'
import { SessionManager } from './SessionManager'
import { SessionMetrics } from '../types'

export class AnalyticsService {
    private logger: Logger
    private cache: CacheService
    private sessionManager: SessionManager

    constructor() {
        this.logger = new Logger()
        this.cache = new CacheService()
        this.sessionManager = new SessionManager()
    }

    /**
     * Track session creation
     */
    async trackSessionCreated(address: string, chainId: number): Promise<void> {
        try {
            const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD

            // Increment daily counters
            await this.cache.increment(`analytics:sessions:created:${date}`)
            await this.cache.increment(`analytics:addresses:unique:${date}:${address}`)
            await this.cache.increment(`analytics:chains:${chainId}:${date}`)

            this.logger.info('Session creation tracked', { address, chainId, date })
        } catch (error) {
            this.logger.error('Failed to track session creation', error)
        }
    }

    /**
     * Track session disconnection
     */
    async trackSessionDisconnected(sessionId: string, duration: number): Promise<void> {
        try {
            const date = new Date().toISOString().split('T')[0]

            // Increment disconnection counter
            await this.cache.increment(`analytics:sessions:disconnected:${date}`)

            // Track session duration
            const durationKey = `analytics:durations:${date}`
            await this.cache.increment(durationKey, duration)

            this.logger.info('Session disconnection tracked', { sessionId, duration, date })
        } catch (error) {
            this.logger.error('Failed to track session disconnection', error)
        }
    }

    /**
     * Track API request
     */
    async trackRequest(endpoint: string, method: string, statusCode: number): Promise<void> {
        try {
            const date = new Date().toISOString().split('T')[0]

            // Track total requests
            await this.cache.increment(`analytics:requests:total:${date}`)

            // Track by endpoint
            await this.cache.increment(`analytics:requests:endpoint:${endpoint}:${date}`)

            // Track by status code
            await this.cache.increment(`analytics:requests:status:${statusCode}:${date}`)

            // Track errors (4xx, 5xx)
            if (statusCode >= 400) {
                await this.cache.increment(`analytics:requests:errors:${date}`)
            }

            this.logger.debug('Request tracked', { endpoint, method, statusCode })
        } catch (error) {
            this.logger.error('Failed to track request', error)
        }
    }

    /**
     * Get session metrics
     */
    async getSessionMetrics(): Promise<SessionMetrics> {
        try {
            const allSessions = await this.sessionManager.getAllSessions()
            const now = Date.now()

            const activeSessions = allSessions.filter(session => {
                const lastActivity = session.lastActivity.getTime()
                const hoursSinceActivity = (now - lastActivity) / (1000 * 60 * 60)
                return hoursSinceActivity < 24 // Active in last 24 hours
            })

            const uniqueAddresses = new Set(allSessions.map(s => s.address)).size

            // Calculate average session duration
            let totalDuration = 0
            allSessions.forEach(session => {
                const duration = session.lastActivity.getTime() - session.connectedAt.getTime()
                totalDuration += duration
            })
            const averageSessionDuration = allSessions.length > 0
                ? totalDuration / allSessions.length / 1000 // in seconds
                : 0

            return {
                totalSessions: allSessions.length,
                activeSessions: activeSessions.length,
                uniqueAddresses,
                averageSessionDuration: Math.round(averageSessionDuration),
            }
        } catch (error) {
            this.logger.error('Failed to get session metrics', error)
            return {
                totalSessions: 0,
                activeSessions: 0,
                uniqueAddresses: 0,
                averageSessionDuration: 0,
            }
        }
    }

    /**
     * Get daily request statistics
     */
    async getDailyRequestStats(date?: string): Promise<{
        total: number
        errors: number
        errorRate: number
    }> {
        try {
            const targetDate = date || new Date().toISOString().split('T')[0]

            const total = await this.cache.get<number>(`analytics:requests:total:${targetDate}`) || 0
            const errors = await this.cache.get<number>(`analytics:requests:errors:${targetDate}`) || 0
            const errorRate = total > 0 ? (errors / total) * 100 : 0

            return {
                total,
                errors,
                errorRate: Math.round(errorRate * 100) / 100, // 2 decimal places
            }
        } catch (error) {
            this.logger.error('Failed to get daily request stats', error)
            return { total: 0, errors: 0, errorRate: 0 }
        }
    }

    /**
     * Get most active chains
     */
    async getMostActiveChains(date?: string): Promise<Array<{ chainId: number; count: number }>> {
        try {
            const targetDate = date || new Date().toISOString().split('T')[0]
            const pattern = `analytics:chains:*:${targetDate}`

            // This is a simplified version - in production you'd track this differently
            const chains = [1, 8453] // Mainnet, Base
            const results: Array<{ chainId: number; count: number }> = []

            for (const chainId of chains) {
                const count = await this.cache.get<number>(`analytics:chains:${chainId}:${targetDate}`) || 0
                results.push({ chainId, count })
            }

            return results.sort((a, b) => b.count - a.count)
        } catch (error) {
            this.logger.error('Failed to get most active chains', error)
            return []
        }
    }

    /**
     * Track user action
     */
    async trackAction(action: string, metadata?: Record<string, any>): Promise<void> {
        try {
            const date = new Date().toISOString().split('T')[0]
            await this.cache.increment(`analytics:actions:${action}:${date}`)

            this.logger.info('Action tracked', { action, metadata })
        } catch (error) {
            this.logger.error('Failed to track action', error)
        }
    }

    /**
     * Get analytics summary
     */
    async getSummary(): Promise<{
        sessions: SessionMetrics
        requests: { total: number; errors: number; errorRate: number }
        chains: Array<{ chainId: number; count: number }>
    }> {
        const [sessions, requests, chains] = await Promise.all([
            this.getSessionMetrics(),
            this.getDailyRequestStats(),
            this.getMostActiveChains(),
        ])

        return { sessions, requests, chains }
    }
}
