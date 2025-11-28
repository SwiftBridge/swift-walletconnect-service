import winston from 'winston'

export class Logger {
  private logger: winston.Logger

  constructor() {
    const logFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json()
    )

    const consoleFormat = winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`
        if (Object.keys(meta).length > 0) {
          msg += ` ${JSON.stringify(meta)}`
        }
        return msg
      })
    )

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: logFormat,
      defaultMeta: { service: 'swift-walletconnect' },
      transports: [
        new winston.transports.Console({
          format: consoleFormat,
        }),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
      ],
    })

    // Don't log to files in test environment
    if (process.env.NODE_ENV === 'test') {
      this.logger.clear()
      this.logger.add(new winston.transports.Console({ format: consoleFormat }))
    }
  }

  info(message: string, meta?: any) {
    this.logger.info(message, meta)
  }

  error(message: string, error?: any) {
    if (error instanceof Error) {
      this.logger.error(message, {
        error: error.message,
        stack: error.stack,
      })
    } else {
      this.logger.error(message, error)
    }
  }

  warn(message: string, meta?: any) {
    this.logger.warn(message, meta)
  }

  debug(message: string, meta?: any) {
    this.logger.debug(message, meta)
  }

  http(message: string, meta?: any) {
    this.logger.http(message, meta)
  }
}
