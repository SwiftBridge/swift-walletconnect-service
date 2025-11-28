import Redis from 'ioredis'
import { Logger } from '../utils/Logger'
import { WalletSession } from './WalletConnectService'

export class SessionManager {
  private redis: Redis
  private logger: Logger
  private sessionExpiry = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

  constructor() {
    this.logger = new Logger()
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    })

    this.redis.on('connect', () => {
      this.logger.info('Connected to Redis')
    })

    this.redis.on('error', (error) => {
      this.logger.error('Redis connection error', error)
    })
  }

  async createSession(session: WalletSession): Promise<void> {
    try {
      const key = this.getSessionKey(session.id)
      const sessionData = JSON.stringify({
        ...session,
        connectedAt: session.connectedAt.toISOString(),
        lastActivity: session.lastActivity.toISOString(),
      })

      await this.redis.setex(key, this.sessionExpiry / 1000, sessionData)

      // Also store by address for quick lookup
      const addressKey = this.getAddressKey(session.address)
      await this.redis.sadd(addressKey, session.id)
      await this.redis.expire(addressKey, this.sessionExpiry / 1000)

      this.logger.info('Session created', { sessionId: session.id, address: session.address })
    } catch (error) {
      this.logger.error('Failed to create session', error)
      throw error
    }
  }

  async getSession(sessionId: string): Promise<WalletSession | null> {
    try {
      const key = this.getSessionKey(sessionId)
      const sessionData = await this.redis.get(key)

      if (!sessionData) {
        return null
      }

      const parsed = JSON.parse(sessionData)
      return {
        ...parsed,
        connectedAt: new Date(parsed.connectedAt),
        lastActivity: new Date(parsed.lastActivity),
      }
    } catch (error) {
      this.logger.error('Failed to get session', error)
      return null
    }
  }

  async updateSession(session: WalletSession): Promise<void> {
    try {
      const key = this.getSessionKey(session.id)
      const sessionData = JSON.stringify({
        ...session,
        connectedAt: session.connectedAt.toISOString(),
        lastActivity: session.lastActivity.toISOString(),
      })

      await this.redis.setex(key, this.sessionExpiry / 1000, sessionData)
      this.logger.info('Session updated', { sessionId: session.id })
    } catch (error) {
      this.logger.error('Failed to update session', error)
      throw error
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    try {
      const session = await this.getSession(sessionId)
      if (!session) {
        return
      }

      const key = this.getSessionKey(sessionId)
      await this.redis.del(key)

      // Remove from address index
      const addressKey = this.getAddressKey(session.address)
      await this.redis.srem(addressKey, sessionId)

      this.logger.info('Session deleted', { sessionId, address: session.address })
    } catch (error) {
      this.logger.error('Failed to delete session', error)
      throw error
    }
  }

  async getSessionsByAddress(address: string): Promise<WalletSession[]> {
    try {
      const addressKey = this.getAddressKey(address)
      const sessionIds = await this.redis.smembers(addressKey)

      const sessions: WalletSession[] = []
      for (const sessionId of sessionIds) {
        const session = await this.getSession(sessionId)
        if (session) {
          sessions.push(session)
        }
      }

      return sessions
    } catch (error) {
      this.logger.error('Failed to get sessions by address', error)
      return []
    }
  }

  async getAllSessions(): Promise<WalletSession[]> {
    try {
      const pattern = this.getSessionKey('*')
      const keys = await this.redis.keys(pattern)

      const sessions: WalletSession[] = []
      for (const key of keys) {
        const sessionData = await this.redis.get(key)
        if (sessionData) {
          const parsed = JSON.parse(sessionData)
          sessions.push({
            ...parsed,
            connectedAt: new Date(parsed.connectedAt),
            lastActivity: new Date(parsed.lastActivity),
          })
        }
      }

      return sessions
    } catch (error) {
      this.logger.error('Failed to get all sessions', error)
      return []
    }
  }

  async cleanupExpiredSessions(): Promise<number> {
    try {
      const pattern = this.getSessionKey('*')
      const keys = await this.redis.keys(pattern)

      let cleanedCount = 0
      for (const key of keys) {
        const ttl = await this.redis.ttl(key)
        if (ttl === -1) {
          // Key exists but has no expiry, set it
          await this.redis.expire(key, this.sessionExpiry / 1000)
        } else if (ttl === -2) {
          // Key doesn't exist, clean up address index
          const sessionId = key.replace('session:', '')
          const addressKey = this.getAddressKey('*')
          const addressKeys = await this.redis.keys(addressKey)

          for (const addrKey of addressKeys) {
            await this.redis.srem(addrKey, sessionId)
          }
          cleanedCount++
        }
      }

      return cleanedCount
    } catch (error) {
      this.logger.error('Failed to cleanup expired sessions', error)
      return 0
    }
  }

  async extendSession(sessionId: string): Promise<boolean> {
    try {
      const session = await this.getSession(sessionId)
      if (!session) {
        return false
      }

      session.lastActivity = new Date()
      await this.updateSession(session)
      return true
    } catch (error) {
      this.logger.error('Failed to extend session', error)
      return false
    }
  }

  private getSessionKey(sessionId: string): string {
    return `session:${sessionId}`
  }

  private getAddressKey(address: string): string {
    return `address:${address.toLowerCase()}`
  }

  async close(): Promise<void> {
    await this.redis.quit()
  }
}
