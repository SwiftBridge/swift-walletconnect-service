import { Request, Response, NextFunction } from 'express'
import { Logger } from '../utils/Logger'

const logger = new Logger()

export class AppError extends Error {
    statusCode: number
    isOperational: boolean

    constructor(message: string, statusCode: number = 500) {
        super(message)
        this.statusCode = statusCode
        this.isOperational = true
        Error.captureStackTrace(this, this.constructor)
    }
}

export const ErrorHandler = (
    err: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (err instanceof AppError) {
        logger.error(`${err.message}`, {
            statusCode: err.statusCode,
            path: req.path,
            method: req.method,
            ip: req.ip,
        })

        return res.status(err.statusCode).json({
            error: err.message,
            statusCode: err.statusCode,
        })
    }

    // Handle unknown errors
    logger.error('Unexpected error', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
    })

    return res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    })
}

// Async error wrapper
export const asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next)
    }
}
