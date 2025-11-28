import { Request, Response, NextFunction } from 'express'
import { Logger } from '../utils/Logger'

const logger = new Logger()

interface RateLimitStore {
    [key: string]: {
        count: number
        resetTime: number
    }
}

const store: RateLimitStore = {}

// Cleanup old entries every 5 minutes
setInterval(() => {
    const now = Date.now()
    Object.keys(store).forEach((key) => {
        if (store[key].resetTime < now) {
            delete store[key]
        }
    })
}, 5 * 60 * 1000)

export const RateLimitMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000') // 1 minute
    const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')

    const identifier = req.ip || 'unknown'
    const now = Date.now()

    if (!store[identifier] || store[identifier].resetTime < now) {
        store[identifier] = {
            count: 1,
            resetTime: now + windowMs,
        }
        return next()
    }

    store[identifier].count++

    const remaining = maxRequests - store[identifier].count
    const resetTime = Math.ceil((store[identifier].resetTime - now) / 1000)

    res.setHeader('X-RateLimit-Limit', maxRequests)
    res.setHeader('X-RateLimit-Remaining', Math.max(0, remaining))
    res.setHeader('X-RateLimit-Reset', resetTime)

    if (store[identifier].count > maxRequests) {
        logger.warn('Rate limit exceeded', {
            ip: req.ip,
            path: req.path,
            count: store[identifier].count,
        })

        return res.status(429).json({
            error: 'Too Many Requests',
            message: `Rate limit exceeded. Try again in ${resetTime} seconds.`,
            retryAfter: resetTime,
        })
    }

    next()
}
