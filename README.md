# THJ Ponder - Scalable NFT Indexer

A high-performance, scalable indexer for The Honey Jar NFT collections using [Ponder](https://ponder.sh).

## 🚀 Features

- **Real-time mint tracking** for HJ1 and future NFT collections
- **Leaderboard system** with rankings and statistics
- **Activity feed** for live updates
- **REST API** for easy frontend integration
- **Scalable architecture** - easily add new NFT collections
- **Cost-effective** - runs on ~$5/month infrastructure

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/thj-ponder
cd thj-ponder

# Install dependencies
pnpm install
# or
npm install

# Copy environment variables
cp .env.example .env
```

## ⚙️ Configuration

1. **Update Contract Details** in `.env`:
```env
HJ1_CONTRACT_ADDRESS=0x... # Add actual HJ1 contract address
HJ1_START_BLOCK=21000000   # Add actual deployment block
```

2. **Get an RPC URL** (free options):
   - [Alchemy](https://alchemy.com) - 300M compute units/month free
   - [Infura](https://infura.io) - 100k requests/day free
   - [QuickNode](https://quicknode.com) - Free tier available

3. **Update the ABI** in `abis/HoneyJar1.ts` with the actual contract ABI

## 🏃 Running Locally

```bash
# Start development server (uses SQLite)
pnpm dev

# The indexer will:
# 1. Sync historical data from the start block
# 2. Start the API server on http://localhost:42069
# 3. Begin real-time indexing
```

## 🌐 API Endpoints

### Get Recent Entries
```http
GET /api/entries/recent?collection=0x...&limit=20
```

### Get Leaderboard
```http
GET /api/leaderboard?collection=0x...&limit=10
```

### Get Statistics
```http
GET /api/stats?collection=0x...
```

### Get Buyer Info
```http
GET /api/buyer/0xAddress?collection=0x...
```

### List All Collections
```http
GET /api/collections
```

## 🎯 Adding New NFT Collections

1. **Add ABI** to `abis/` directory:
```typescript
// abis/HoneyJar2.ts
export const HoneyJar2ABI = [...] as const;
```

2. **Update Configuration** in `ponder.config.ts`:
```typescript
const NFT_COLLECTIONS = {
  // ... existing
  HJ2: {
    address: "0x...",
    startBlock: 21500000,
    name: "Honey Jar 2",
    type: "raffle",
  },
};

// Add contract config
contracts: {
  // ... existing
  HoneyJar2: {
    network: "mainnet",
    abi: HoneyJar2ABI,
    address: NFT_COLLECTIONS.HJ2.address,
    startBlock: NFT_COLLECTIONS.HJ2.startBlock,
  },
}
```

3. **Create Indexer** in `src/`:
```typescript
// src/HoneyJar2.ts
import { ponder } from "@/generated";
// Copy logic from HoneyJar1.ts and adjust as needed
```

## 🚢 Deployment

### Option 1: Railway (Recommended)
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/)

1. Click "Deploy on Railway"
2. Connect your GitHub repo
3. Railway auto-provisions PostgreSQL
4. Add environment variables
5. Deploy!

### Option 2: Vercel + Supabase
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add database URL from Supabase
vercel env add DATABASE_URL
```

### Option 3: Self-Host
```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

## 📊 Database Schema

The indexer uses a scalable schema that supports multiple NFT collections:

- **Collection** - NFT collection registry
- **MintEntry** - Individual mint transactions
- **Buyer** - Buyer profiles across all collections
- **CollectionBuyer** - Collection-specific buyer stats
- **CollectionStats** - Real-time collection metrics
- **ActivityFeed** - Live activity stream
- **LeaderboardSnapshot** - Historical leaderboard data

## 🛠️ Development

```bash
# Run type generation after schema changes
pnpm codegen

# Check types
pnpm typecheck

# Format code
pnpm format
```

## 📈 Monitoring

- View indexing progress in the terminal
- Access GraphQL playground at `http://localhost:42069/graphql`
- Monitor RPC usage in your provider dashboard

## 💰 Cost Estimation

- **Development**: $0 (local SQLite)
- **Production**:
  - Railway: ~$5/month (includes PostgreSQL)
  - RPC: Free tier sufficient for most cases
  - **Total: ~$5/month**

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📝 License

MIT

## 🆘 Support

- [Ponder Documentation](https://ponder.sh/docs)
- [Discord Community](https://discord.gg/ponder)
- [GitHub Issues](https://github.com/YOUR_USERNAME/thj-ponder/issues)

---

Built with ❤️ for The Honey Jar community