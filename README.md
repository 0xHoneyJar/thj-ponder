# THJ Ponder - Minimal HoneyJar Indexer

Dead simple Ponder indexer for HoneyJar NFT.

## Quick Start

```bash
pnpm install
pnpm codegen
pnpm dev
```

## API

- `GET /` - Status
- `GET /transfers` - All transfers  
- `GET /mints` - Only mints

## Deploy to Railway

1. Push to GitHub
2. Connect to Railway
3. Deploy (Railway auto-provisions database)

## Config

- **Contract**: `0xa20CF9B0874c3E46b344DEAEEa9c2e0C3E1db37d`
- **Start Block**: 17090027
- **RPC**: HyperSync (default)