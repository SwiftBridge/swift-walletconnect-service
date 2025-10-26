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

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express
- **Language**: TypeScript
- **Cache**: Redis
- **Wallet**: Reown WalletConnect v2

## Installation

```bash
npm install
```

## Configuration

Create `.env`:
```env
PORT=3001
REDIS_URL=redis://localhost:6379
WALLETCONNECT_PROJECT_ID=your_project_id
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
npm start
```

## Deploy

Deploy to Railway, Render, or your preferred platform.

## License

MIT
