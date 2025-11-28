import { Request, Response, NextFunction } from 'express'
import Joi from 'joi'
import { AppError } from './ErrorHandler'

export const ValidationMiddleware = (schema: Joi.ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const { error } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
        })

        if (error) {
            const errorMessage = error.details
                .map((detail) => detail.message)
                .join(', ')

            throw new AppError(errorMessage, 400)
        }

        next()
    }
}

// Common validation schemas
export const schemas = {
    createSession: Joi.object({
        address: Joi.string()
            .pattern(/^0x[a-fA-F0-9]{40}$/)
            .required()
            .messages({
                'string.pattern.base': 'Invalid Ethereum address format',
            }),
        chainId: Joi.number()
            .valid(1, 8453) // Mainnet and Base
            .required(),
        metadata: Joi.object().optional(),
    }),

    updateSession: Joi.object({
        metadata: Joi.object().optional(),
        chainId: Joi.number()
            .valid(1, 8453)
            .optional(),
    }),

    sessionId: Joi.object({
        sessionId: Joi.string()
            .pattern(/^session_/)
            .required(),
    }),

    walletAddress: Joi.object({
        address: Joi.string()
            .pattern(/^0x[a-fA-F0-9]{40}$/)
            .required()
            .messages({
                'string.pattern.base': 'Invalid Ethereum address format',
            }),
    }),
}
