import Redis from 'ioredis'
import { Logger } from '../utils/Logger'

export class CacheService {
    private redis: Redis
    private logger: Logger
    private defaultTTL = 3600 // 1 hour in seconds

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
            this.logger.info('Cache service connected to Redis')
        })

        this.redis.on('error', (error) => {
            this.logger.error('Cache service Redis error', error)
        })
    }

    /**
     * Get cached value
     */
    async get<T>(key: string): Promise<T | null> {
        try {
            const value = await this.redis.get(key)
            if (!value) return null

            return JSON.parse(value) as T
        } catch (error) {
            this.logger.error(`Failed to get cache key: ${key}`, error)
            return null
        }
    }

    /**
     * Set cached value with TTL
     */
    async set(key: string, value: any, ttl: number = this.defaultTTL): Promise<boolean> {
        try {
            const serialized = JSON.stringify(value)
            await this.redis.setex(key, ttl, serialized)
            this.logger.debug(`Cache set: ${key} (TTL: ${ttl}s)`)
            return true
        } catch (error) {
            this.logger.error(`Failed to set cache key: ${key}`, error)
            return false
        }
    }

    /**
     * Delete cached value
     */
    async delete(key: string): Promise<boolean> {
        try {
            await this.redis.del(key)
            this.logger.debug(`Cache deleted: ${key}`)
            return true
        } catch (error) {
            this.logger.error(`Failed to delete cache key: ${key}`, error)
            return false
        }
    }

    /**
     * Check if key exists
     */
    async exists(key: string): Promise<boolean> {
        try {
            const result = await this.redis.exists(key)
            return result === 1
        } catch (error) {
            this.logger.error(`Failed to check cache key existence: ${key}`, error)
            return false
        }
    }

    /**
     * Get remaining TTL for a key
     */
    async ttl(key: string): Promise<number> {
        try {
            return await this.redis.ttl(key)
        } catch (error) {
            this.logger.error(`Failed to get TTL for key: ${key}`, error)
            return -1
        }
    }

    /**
     * Increment a counter
     */
    async increment(key: string, amount: number = 1): Promise<number> {
        try {
            return await this.redis.incrby(key, amount)
        } catch (error) {
            this.logger.error(`Failed to increment key: ${key}`, error)
            return 0
        }
    }

    /**
     * Decrement a counter
     */
    async decrement(key: string, amount: number = 1): Promise<number> {
        try {
            return await this.redis.decrby(key, amount)
        } catch (error) {
            this.logger.error(`Failed to decrement key: ${key}`, error)
            return 0
        }
    }

    /**
     * Get multiple keys
     */
    async mget<T>(...keys: string[]): Promise<(T | null)[]> {
        try {
            const values = await this.redis.mget(...keys)
            return values.map(value => value ? JSON.parse(value) as T : null)
        } catch (error) {
            this.logger.error('Failed to get multiple cache keys', error)
            return keys.map(() => null)
        }
    }

    /**
     * Set multiple keys
     */
    async mset(entries: Record<string, any>, ttl: number = this.defaultTTL): Promise<boolean> {
        try {
            const pipeline = this.redis.pipeline()

            Object.entries(entries).forEach(([key, value]) => {
                const serialized = JSON.stringify(value)
                pipeline.setex(key, ttl, serialized)
            })

            await pipeline.exec()
            this.logger.debug(`Cache mset: ${Object.keys(entries).length} keys`)
            return true
        } catch (error) {
            this.logger.error('Failed to set multiple cache keys', error)
            return false
        }
    }

    /**
     * Delete keys matching pattern
     */
    async deletePattern(pattern: string): Promise<number> {
        try {
            const keys = await this.redis.keys(pattern)
            if (keys.length === 0) return 0

            await this.redis.del(...keys)
            this.logger.debug(`Cache deleted pattern: ${pattern} (${keys.length} keys)`)
            return keys.length
        } catch (error) {
            this.logger.error(`Failed to delete cache pattern: ${pattern}`, error)
            return 0
        }
    }

    /**
     * Flush all cache
     */
    async flush(): Promise<boolean> {
        try {
            await this.redis.flushdb()
            this.logger.warn('Cache flushed')
            return true
        } catch (error) {
            this.logger.error('Failed to flush cache', error)
            return false
        }
    }

    /**
     * Close Redis connection
     */
    async close(): Promise<void> {
        await this.redis.quit()
    }
}
