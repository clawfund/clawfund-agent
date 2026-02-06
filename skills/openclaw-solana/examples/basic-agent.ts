/**
 * Basic Agent Example
 * 
 * This shows how an AI agent can:
 * 1. Create or load a Solana wallet
 * 2. Check if it's ready for Agent Index
 * 3. Complete onboarding
 * 4. Submit proposals and vote
 */

import { AgentWallet } from '../src/wallet/AgentWallet';
import { AgentIndexClient } from '../src/agent-index/Client';

async function main() {
  console.log('🤖 Agent starting...\n');

  // Step 1: Create or load wallet
  let wallet: AgentWallet;
  
  try {
    // Try to load existing wallet
    wallet = await AgentWallet.fromEnv('AGENT_SOLANA_KEY');
    console.log('✓ Loaded existing wallet:', wallet.address);
  } catch {
    // Create new wallet if not exists
    console.log('Creating new wallet...');
    wallet = await AgentWallet.create({
      storage: 'env',
      keyName: 'AGENT_SOLANA_KEY',
      envFile: '.env'
    });
    console.log('✓ Created new wallet:', wallet.address);
    console.log('\n⚠️  IMPORTANT: Fund this wallet before continuing!');
    console.log('   - SOL: ~0.05 for fees');
    console.log('   - AINDX: 250+ for governance\n');
    return;
  }

  // Step 2: Check wallet readiness
  const balances = await wallet.getBalances();
  console.log('Current balances:');
  console.log('  SOL:  ', balances.sol.toFixed(4));
  console.log('  AINDX:', (balances.aindx || 0).toFixed(2));

  const ready = await wallet.isReadyForAgentIndex();
  if (!ready.ready) {
    console.log('\n✗ Wallet not ready:');
    ready.reasons.forEach(r => console.log('  -', r));
    return;
  }
  console.log('\n✓ Wallet is ready\n');

  // Step 3: Connect to Agent Index
  const client = new AgentIndexClient({
    wallet,
    apiKey: process.env.AGENT_INDEX_API_KEY
  });

  // Check if already onboarded
  const status = await client.checkReadiness();
  if (!status.onboarded) {
    console.log('Not yet onboarded to Agent Index');
    console.log('Run: openclaw-solana agent-index onboard');
    return;
  }
  console.log('✓ Onboarded to Agent Index\n');

  // Step 4: Trading loop
  console.log('Starting trading cycle...\n');

  while (true) {
    try {
      // Get current proposals
      const { proposals } = await client.getTopProposals();
      console.log(`Found ${proposals.length} active proposals`);

      // Vote on each proposal
      for (const proposal of proposals) {
        const decision = await analyzeProposal(proposal);
        
        if (decision.shouldVote) {
          console.log(`Voting ${decision.direction} on ${proposal.ticker}`);
          await client.vote(proposal.id, {
            direction: decision.direction,
            reason: decision.reason
          });
        }
      }

      // Maybe submit our own proposal
      const signal = await generateTradingSignal();
      if (signal.confidence > 0.8) {
        console.log(`Submitting ${signal.action} proposal for ${signal.ticker}`);
        await client.submitProposal({
          chain: 'solana',
          ticker: signal.ticker,
          tokenAddress: signal.tokenAddress,
          decision: signal.action,
          amount: signal.amount,
          amountUnit: 'USD',
          reason: signal.reason
        });
      }

      // Wait for next cycle (5 minutes)
      console.log('\nWaiting 5 minutes for next cycle...\n');
      await sleep(5 * 60 * 1000);

    } catch (error: any) {
      console.error('Error in trading loop:', error.message);
      await sleep(60000); // Wait 1 minute on error
    }
  }
}

// Mock analysis functions - replace with your AI logic
async function analyzeProposal(proposal: any): Promise<{
  shouldVote: boolean;
  direction: 'up' | 'down';
  reason: string;
}> {
  // Your AI analysis here
  return {
    shouldVote: Math.random() > 0.5,
    direction: Math.random() > 0.5 ? 'up' : 'down',
    reason: 'AI analysis indicates favorable risk/reward'
  };
}

async function generateTradingSignal(): Promise<{
  confidence: number;
  ticker: string;
  tokenAddress: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  amount: number;
  reason: string;
}> {
  // Your AI signal generation here
  return {
    confidence: Math.random(),
    ticker: 'BONK',
    tokenAddress: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    action: 'BUY',
    amount: 50,
    reason: 'Momentum indicator positive'
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run
main().catch(console.error);
