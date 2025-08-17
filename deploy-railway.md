# 🚂 Deploy THJ Ponder to Railway

## Quick Deploy (2 minutes)

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Initial THJ Ponder indexer setup"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/thj-ponder.git
git push -u origin main
```

### Step 2: Deploy to Railway

1. **Go to [Railway.app](https://railway.app)**
2. Click **"Start New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your `thj-ponder` repository
5. Railway will auto-detect it's a Node.js project

### Step 3: Add PostgreSQL

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway automatically connects it to your app

### Step 4: Set Environment Variables

Click on your service and go to **Variables** tab. Add:

```env
# Required
HJ1_CONTRACT_ADDRESS=0x... # Your actual HJ1 contract
HJ1_START_BLOCK=21000000   # Your actual start block
PONDER_RPC_URL_1=https://eth.llamarpc.com  # Or your RPC

# Railway provides these automatically:
# DATABASE_URL (auto-set by Railway)
# PORT (auto-set by Railway)

# Optional
NODE_ENV=production
PONDER_LOG_LEVEL=info
```

### Step 5: Deploy!

Railway will automatically:
1. Install dependencies
2. Set up PostgreSQL
3. Start the indexer
4. Begin syncing from your start block

## 📊 Monitor Your Deployment

### Check Logs
- Click on your service → **"View Logs"**
- You'll see sync progress like:
  ```
  [ponder] Syncing... 21000000/21500000 (95%)
  [api] Server listening on port 42069
  ```

### Access Your API
Railway gives you a URL like:
```
https://thj-ponder-production.up.railway.app
```

Test it:
```bash
curl https://thj-ponder-production.up.railway.app/api/stats
```

## 💰 Cost Breakdown

Railway's pricing (as of 2024):
- **Hobby Plan**: $5/month (includes $5 credits)
- **Your usage**:
  - Service: ~$3-4/month
  - PostgreSQL: ~$1-2/month
  - **Total: ~$5/month**

## 🔧 Troubleshooting

### If indexing is slow:
1. Upgrade RPC to paid tier (Alchemy/QuickNode)
2. Increase `pollingInterval` in config
3. Use a more recent `startBlock`

### If database errors:
1. Check DATABASE_URL is set
2. Restart the service
3. Check PostgreSQL is running

### If API returns 404:
1. Wait for initial sync to complete
2. Check logs for errors
3. Verify contract address is correct

## 🚀 Advanced Features

### Enable WebSockets (Real-time)
Add to your Railway variables:
```env
ENABLE_WEBSOCKETS=true
```

### Custom Domain
1. Go to Settings → Domains
2. Add your domain (e.g., `indexer.honeyjars.xyz`)
3. Update DNS records

### Auto-scaling
Railway automatically scales based on usage. No config needed!

## 📱 Connect to Frontend

In your hub-interface, update the API calls:

```typescript
// hooks/use-live-activity.ts
const API_URL = process.env.NEXT_PUBLIC_INDEXER_URL || 
  'https://thj-ponder-production.up.railway.app';

export function useLiveActivity() {
  const { data } = useSWR(
    `${API_URL}/api/entries/recent?limit=20`,
    fetcher,
    { refreshInterval: 5000 }
  );
  return data;
}
```

---

## Alternative: Vercel + Supabase (Not Recommended)

If you absolutely must use Vercel:

1. **Set up Supabase** for PostgreSQL
2. **Deploy API only** (no indexing)
3. **Run indexer separately** on:
   - Your local machine
   - GitHub Actions (cron)
   - Cheap VPS

This is complex and not ideal. Railway is much simpler!