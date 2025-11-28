# Swift v2 - WalletConnect Service

[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.18-lightgrey)](https://expressjs.com/)

Backend service for WalletConnect integration and session management for Swift v2 platform.

## Features

- 🔗 WalletConnect v2 integration
- 🔐 Session management with Redis
- 💾 Connection persistence
- 📊 Connection analytics
- 🔄 Multi-wallet support
- 🛡️ Rate limiting & validation
- 📝 Comprehensive logging

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express
- **Language**: TypeScript
- **Cache**: Redis (ioredis)
- **Wallet**: Reown WalletConnect v2
- **Validation**: Joi
- **Logging**: Winston

## Installation

```bash
npm install
```

## Configuration

Create `.env` file from template:
```bash
cp .env.example .env
```

Required environment variables:
```env
PORT=3001
NODE_ENV=development
REDIS_HOST=localhost
REDIS_PORT=6379
WALLETCONNECT_PROJECT_ID=your_project_id
BASE_RPC_URL=https://mainnet.base.org
APP_URL=https://swift-v2.vercel.app
```

## Development

```bash
# Start dev server with hot reload
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint
```

## Build & Production

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

## API Documentation

### Authentication Routes (`/api/auth`)

#### Generate Nonce
```http
GET /api/auth/nonce/:address
```
Generate a nonce for wallet signature authentication.

**Response:**
```json
{
  "nonce": "Sign this message...",
  "address": "0x...",
  "timestamp": 1234567890
}
```

#### Verify Signature
```http
POST /api/auth/verify
```
**Body:**
```json
{
  "address": "0x...",
  "signature": "0x...",
  "message": "Sign this message..."
}
```

#### Check Auth Status
```http
GET /api/auth/status
Headers: x-session-id: session_xxx
```

---

### Session Routes (`/api/session`)

#### Create Session
```http
POST /api/session/create
```
**Body:**
```json
{
  "address": "0x...",
  "chainId": 8453,
  "metadata": {}
}
```

#### Get Session
```http
GET /api/session/:sessionId
```

#### Update Session
```http
PUT /api/session/:sessionId
```
**Body:**
```json
{
  "chainId": 1,
  "metadata": {}
}
```

#### Delete Session
```http
DELETE /api/session/:sessionId
```

#### Get All Active Sessions
```http
GET /api/session/active/all
```

#### Cleanup Expired Sessions
```http
POST /api/session/cleanup
```

---

### Wallet Routes (`/api/wallet`)

#### Get Wallet Info
```http
GET /api/wallet/info/:address
```

#### Get Supported Chains
```http
GET /api/wallet/chains
```

#### Get Chain Info
```http
GET /api/wallet/chain/:chainId
```

#### Validate Address
```http
POST /api/wallet/validate
```
**Body:**
```json
{
  "address": "0x..."
}
```

#### Get WalletConnect Config
```http
GET /api/wallet/config
```

#### Disconnect Wallet
```http
POST /api/wallet/disconnect/:address
```

---

## Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-11-28T05:39:37.000Z",
  "version": "1.0.0"
}
```

## Rate Limiting

Default limits:
- **100 requests** per **60 seconds** per IP
- Configurable via environment variables

Response headers:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Seconds until reset

## Error Handling

All errors follow a consistent format:
```json
{
  "error": "Error message",
  "statusCode": 400
}
```

Common status codes:
- `400`: Bad Request (validation errors)
- `401`: Unauthorized
- `404`: Not Found
- `429`: Too Many Requests (rate limit)
- `500`: Internal Server Error

## Logging

Logs are written to:
- `logs/combined.log`: All logs
- `logs/error.log`: Error logs only
- Console: Formatted output (development)

Log levels: `error`, `warn`, `info`, `http`, `debug`

## Deployment

### Docker (Coming Soon)
```bash
docker build -t swift-walletconnect .
docker run -p 3001:3001 --env-file .env swift-walletconnect
```

### Railway / Render
1. Connect repository
2. Set environment variables
3. Deploy automatically

### Manual Deployment
```bash
npm ci --production
npm run build
npm start
```

## Project Structure

```
src/
├── index.ts              # App entry point
├── middleware/           # Express middleware
│   ├── ErrorHandler.ts
│   ├── RateLimitMiddleware.ts
│   └── ValidationMiddleware.ts
├── routes/              # API routes
│   ├── auth.ts
│   ├── session.ts
│   └── wallet.ts
├── services/            # Business logic
│   ├── SessionManager.ts
│   └── WalletConnectService.ts
└── utils/               # Utilities
    └── Logger.ts
```

## Development Tips

1. **Redis**: Ensure Redis is running locally or configure remote connection
2. **WalletConnect Project ID**: Get free ID from [Reown Cloud](https://cloud.reown.com)
3. **CORS**: Update `ALLOWED_ORIGINS` for your frontend
4. **Logs**: Check `logs/` directory for debugging

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT
