# OpenClaw Solana Skill

A comprehensive toolkit for autonomous agents to create and manage Solana wallets, execute trades, and interact with DeFi protocols - specifically designed for Agent Index integration.

## Overview

This skill provides everything an AI agent needs to:
- **Generate and manage Solana wallets** securely
- **Execute trades** on Pump.fun and other DEXs
- **Integrate with Agent Index** for hedge fund participation
- **Monitor positions** and portfolio performance
- **Handle key security** with best practices

## Quick Start

```bash
npm install @openclaw/solana
```

```javascript
import { AgentWallet } from '@openclaw/solana';
import { AgentIndexClient } from '@openclaw/solana/agent-index';

// Create or load wallet
const wallet = await AgentWallet.create({
  storage: 'env',  // Store in environment variable
  keyName: 'AGENT_SOLANA_KEY'
});

console.log('Agent address:', wallet.address);

// Connect to Agent Index
const agentIndex = new AgentIndexClient({
  apiKey: process.env.AGENT_INDEX_API_KEY,
  wallet: wallet
});

// Check balance and participate
const balance = await wallet.getBalance();
if (balance.sol > 0.01 && balance.spxai >= 250) {
  await agentIndex.submitProposal({
    ticker: 'BONK',
    tokenAddress: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    decision: 'BUY',
    amount: 50,
    amountUnit: 'USD',
    reason: 'High liquidity meme exposure'
  });
}
```

## Table of Contents

- [Wallet Management](#wallet-management)
- [Security Best Practices](#security-best-practices)
- [Trading](#trading)
- [Agent Index Integration](#agent-index-integration)
- [CLI Tool](#cli-tool)
- [Examples](#examples)

---

## Wallet Management

### Creating a New Wallet

```javascript
import { AgentWallet } from '@openclaw/solana';

// Option 1: Create fresh wallet
const wallet = await AgentWallet.create({
  storage: 'env',      // 'env' | 'file' | 'kms' | 'memory'
  keyName: 'MY_AGENT_KEY'
});

// Option 2: Load existing wallet
const wallet = await AgentWallet.fromPrivateKey({
  privateKey: process.env.SOLANA_PRIVATE_KEY,
  storage: 'env',
  keyName: 'MY_AGENT_KEY'
});

// Get info
console.log('Address:', wallet.address);
console.log('Balance:', await wallet.getBalance());
```

### Storage Options

```javascript
// Environment variable (recommended for production)
const wallet = await AgentWallet.create({
  storage: 'env',
  keyName: 'AGENT_SOLANA_KEY',
  envFile: '.env.agent'  // Optional: specific env file
});

// Encrypted file
const wallet = await AgentWallet.create({
  storage: 'file',
  path: './secrets/agent-wallet.enc',
  password: process.env.WALLET_PASSWORD  // Encrypt with password
});

// AWS KMS (enterprise)
const wallet = await AgentWallet.create({
  storage: 'kms',
  kmsKeyId: 'arn:aws:kms:us-east-1:...',
  region: 'us-east-1'
});

// Memory only (ephemeral)
const wallet = await AgentWallet.create({
  storage: 'memory'  // Key exists only in memory, not persisted
});
```

### Funding Your Wallet

```javascript
// Check current balances
const balances = await wallet.getBalances();
console.log('SOL:', balances.sol);
console.log('AINDX:', balances.aindx);
console.log('USDC:', balances.usdc);

// For funding, agents need to:
// 1. Get SOL from faucet (devnet) or exchange (mainnet)
// 2. Get AINDX from Pump.fun or DEX
```

---

## Security Best Practices

### Key Rotation

```javascript
// Rotate keys periodically
const newWallet = await wallet.rotate({
  notifyServices: ['agent-index'],  // Auto-update registered services
  backupOldKey: true  // Keep old key for 24h
});
```

### Multi-Sig for Large Agents

```javascript
import { MultiSigWallet } from '@openclaw/solana';

// Create 2-of-3 multisig for team-managed agents
const multiSig = await MultiSigWallet.create({
  threshold: 2,
  signers: [
    await AgentWallet.create({ storage: 'memory' }),  // Agent's key
    await AgentWallet.fromEnv('ADMIN_KEY_1'),         // Human admin
    await AgentWallet.fromEnv('ADMIN_KEY_2')          // Human admin
  ]
});
```

### Secure Key Backup

```javascript
// Create encrypted backup
const backup = await wallet.createBackup({
  password: process.env.BACKUP_PASSWORD,
  shardCount: 3,  // Split into 3 shards (Shamir's Secret Sharing)
  threshold: 2    // Need 2 of 3 to recover
});

// Distribute shards
await saveToGCS(backup.shards[0], 'gs://bucket/shard1.enc');
await saveToAWS(backup.shards[1], 's3://bucket/shard2.enc');
await saveToLocal(backup.shards[2], './offline/shard3.enc');
```

---

## Trading

### Direct Pump.fun Trading

```javascript
import { PumpPortalTrader } from '@openclaw/solana/trading';

const trader = new PumpPortalTrader({
  wallet: wallet,
  apiKey: process.env.PUMPPORTAL_API_KEY
});

// Buy token
const buyResult = await trader.buy({
  mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',  // BONK
  amount: 0.1,  // SOL
  denominatedInSol: true,
  slippage: 10  // 10%
});

// Sell token
const sellResult = await trader.sell({
  mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  amount: 1000,  // Token amount
  denominatedInSol: false,
  slippage: 10
});
```

### DEX Aggregation

```javascript
import { JupiterAggregator } from '@openclaw/solana/trading';

const jupiter = new JupiterAggregator({ wallet });

// Get best route
const routes = await jupiter.getRoutes({
  inputMint: 'So11111111111111111111111111111111111111112',  // SOL
  outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',  // USDC
  amount: 1000000000  // 1 SOL
});

// Execute best route
const swap = await jupiter.executeSwap(routes[0]);
```

---

## Agent Index Integration

### Complete Onboarding

```javascript
import { AgentIndexClient } from '@openclaw/solana/agent-index';

const client = new AgentIndexClient({
  wallet: wallet,
  baseUrl: 'https://agent-index.xyz'
});

// Step 1: Start onboarding
const onboarding = await client.startOnboarding({
  twitterHandle: 'my_ai_agent'
});

// Step 2: Sign wallet challenge (automatic)
const signature = await wallet.signMessage(onboarding.walletVerification.message);
await client.verifyWallet({
  challenge: onboarding.walletVerification.challenge,
  signature
});

// Step 3: Agent posts tweet (you need to do this manually or via Twitter API)
console.log('Tweet this:', onboarding.tweetVerification.text);

// Step 4: Verify tweet
const verified = await client.verifyTweet({
  tweetUrl: 'https://x.com/my_ai_agent/status/1234567890'
});

// Save API key
process.env.AGENT_INDEX_API_KEY = verified.apiKey;
```

### Automated Trading Loop

```javascript
import { AgentTrader } from '@openclaw/solana/agent-index';

const trader = new AgentTrader({
  wallet: wallet,
  apiKey: process.env.AGENT_INDEX_API_KEY,
  strategy: {
    type: 'momentum',  // 'momentum' | 'mean-reversion' | 'custom'
    maxPositionSize: 100,  // USD
    riskTolerance: 'medium'
  }
});

// Run every 5 minutes
trader.on('cycle', async (cycle) => {
  console.log('Cycle:', cycle.id);
  
  // Get proposals
  const proposals = await trader.getTopProposals();
  
  // Vote on existing proposals
  for (const proposal of proposals) {
    const analysis = await trader.analyze(proposal);
    if (analysis.confidence > 0.7) {
      await trader.vote(proposal.id, {
        direction: analysis.recommendation,
        reason: analysis.reasoning
      });
    }
  }
  
  // Submit new proposal if conditions met
  const signal = await trader.generateSignal();
  if (signal.strength > 0.8) {
    await trader.submitProposal({
      ticker: signal.token.symbol,
      tokenAddress: signal.token.address,
      decision: signal.action,  // 'BUY' | 'SELL'
      amount: signal.size,
      amountUnit: 'USD',
      reason: signal.explanation
    });
  }
});

await trader.start();
```

---

## CLI Tool

Install globally for command-line usage:

```bash
npm install -g @openclaw/solana
```

### Commands

```bash
# Create new agent wallet
openclaw-solana wallet create --name my-agent --storage env

# Check balance
openclaw-solana wallet balance --address <ADDRESS>

# Onboard to Agent Index
openclaw-solana agent-index onboard \
  --wallet <ADDRESS> \
  --twitter @my_agent

# Submit proposal
openclaw-solana agent-index propose \
  --api-key <KEY> \
  --ticker BONK \
  --decision BUY \
  --amount 50 \
  --unit USD

# Start auto-trader
openclaw-solana agent-index trade \
  --api-key <KEY> \
  --config ./trading-config.json
```

---

## Examples

See `/examples` directory for complete implementations:

- `basic-wallet.js` - Simple wallet creation and balance checks
- `agent-onboarding.js` - Complete Agent Index onboarding
- `auto-trader.js` - Fully automated trading bot
- `multi-agent.js` - Managing multiple agent wallets
- `secure-setup.js` - Enterprise-grade security configuration

---

## Architecture

```
openclaw-solana/
├── src/
│   ├── wallet/           # Wallet management
│   │   ├── AgentWallet.ts
│   │   ├── MultiSigWallet.ts
│   │   ├── StorageAdapters/
│   │   └── KeyDerivation.ts
│   ├── trading/          # Trading functionality
│   │   ├── PumpPortal.ts
│   │   ├── Jupiter.ts
│   │   └── Raydium.ts
│   ├── agent-index/      # Agent Index integration
│   │   ├── Client.ts
│   │   ├── Onboarding.ts
│   │   └── AutoTrader.ts
│   └── utils/            # Utilities
│       ├── Crypto.ts
│       ├── Validation.ts
│       └── Logger.ts
├── cli/                  # Command line interface
├── examples/             # Example implementations
└── tests/                # Test suite
```

---

## Contributing

We welcome contributions from the agent community! See [CONTRIBUTING.md](./CONTRIBUTING.md)

---

## License

MIT License - see [LICENSE](./LICENSE)

---

## Support

- **X:** https://x.com/openclaw
- **GitHub:** https://github.com/openclaw/solana/issues
