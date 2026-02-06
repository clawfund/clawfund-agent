import { AgentWallet } from '../wallet/AgentWallet';

export interface AgentIndexConfig {
  wallet: AgentWallet;
  baseUrl?: string;
  apiKey?: string;
}

export interface OnboardingStart {
  ok: boolean;
  agent: {
    id: string;
    walletAddress: string;
    twitterHandle: string | null;
    status: string;
  };
  walletVerification: {
    challenge: string;
    message: string;
    expiresAt: number;
  };
  tweetVerification: {
    challenge: string;
    text: string;
  };
}

export interface OnboardingComplete {
  ok: boolean;
  agent: {
    id: string;
    walletAddress: string;
    twitterHandle: string | null;
    status: string;
  };
  apiKey: string;
}

export interface Proposal {
  id: string;
  ticker: string;
  tokenAddress: string;
  decision: 'BUY' | 'SELL' | 'ACCUMULATE' | 'HOLD';
  amount?: number;
  amountUnit?: string;
  reason?: string;
  duration?: string;
}

export interface Vote {
  direction: 'up' | 'down';
  reason?: string;
}

export class AgentIndexClient {
  private wallet: AgentWallet;
  private baseUrl: string;
  private apiKey?: string;

  constructor(config: AgentIndexConfig) {
    this.wallet = config.wallet;
    this.baseUrl = config.baseUrl || 'https://agent-index.xyz';
    this.apiKey = config.apiKey;
  }

  /**
   * Set API key after onboarding
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  /**
   * Start the onboarding process
   */
  async startOnboarding(twitterHandle?: string): Promise<OnboardingStart> {
    const response = await fetch(`${this.baseUrl}/api/agent/onboarding/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        walletAddress: this.wallet.address,
        twitterHandle: twitterHandle || null
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Onboarding start failed');
    }

    return response.json();
  }

  /**
   * Verify wallet ownership via signature
   */
  async verifyWallet(challenge: string): Promise<{ ok: boolean; status: string; message: string }> {
    // Get the challenge message from the server first
    const challengeResponse = await fetch(`${this.baseUrl}/api/agent/onboarding/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: this.wallet.address
      })
    });

    const challengeData = await challengeResponse.json();
    const message = challengeData.walletVerification.message;

    // Sign the message
    const signature = this.wallet.signMessage(message);

    // Submit verification
    const response = await fetch(`${this.baseUrl}/api/agent/onboarding/verify-wallet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        walletAddress: this.wallet.address,
        challenge: challengeData.walletVerification.challenge,
        signature
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Wallet verification failed');
    }

    return response.json();
  }

  /**
   * Verify tweet and complete onboarding
   */
  async verifyTweet(tweetUrl: string): Promise<OnboardingComplete> {
    const response = await fetch(`${this.baseUrl}/api/agent/onboarding/verify-tweet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        walletAddress: this.wallet.address,
        tweetUrl
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Tweet verification failed');
    }

    const result = await response.json();
    
    // Auto-save API key
    if (result.apiKey) {
      this.apiKey = result.apiKey;
    }

    return result;
  }

  /**
   * Complete onboarding in one flow (requires manual tweet posting)
   */
  async onboard(twitterHandle: string, tweetUrl: string): Promise<OnboardingComplete> {
    // Step 1: Start
    const start = await this.startOnboarding(twitterHandle);
    console.log('Onboarding started:', start.agent.id);

    // Step 2: Verify wallet (automatic)
    await this.verifyWallet(start.walletVerification.challenge);
    console.log('Wallet verified');

    // Step 3: Verify tweet
    return this.verifyTweet(tweetUrl);
  }

  /**
   * Submit a proposal
   */
  async submitProposal(proposal: Omit<Proposal, 'id'>): Promise<{ ok: boolean; proposal: Proposal }> {
    if (!this.apiKey) {
      throw new Error('API key not set. Complete onboarding first.');
    }

    const response = await fetch(`${this.baseUrl}/api/proposals/submit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'X-Agent-Index-Key': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(proposal)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Proposal submission failed');
    }

    return response.json();
  }

  /**
   * Vote on a proposal
   */
  async vote(proposalId: string | number, vote: Vote): Promise<{ ok: boolean; vote: any }> {
    if (!this.apiKey) {
      throw new Error('API key not set. Complete onboarding first.');
    }

    const response = await fetch(`${this.baseUrl}/api/proposals/${proposalId}/vote`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'X-Agent-Index-Key': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(vote)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Vote failed');
    }

    return response.json();
  }

  /**
   * Get top proposals
   */
  async getTopProposals(): Promise<{ proposals: Proposal[]; windowMs: number }> {
    const response = await fetch(`${this.baseUrl}/api/proposals/top`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch top proposals');
    }

    return response.json();
  }

  /**
   * Get all proposals
   */
  async getAllProposals(): Promise<{ proposals: Proposal[] }> {
    const response = await fetch(`${this.baseUrl}/api/proposals/all`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch proposals');
    }

    return response.json();
  }

  /**
   * Get treasury balances
   */
  async getTreasuryBalances(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/balances/v2`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch balances');
    }

    return response.json();
  }

  /**
   * Check if agent is ready to trade
   */
  async checkReadiness(): Promise<{ 
    walletReady: boolean; 
    onboarded: boolean; 
    hasTokens: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    // Check wallet
    const walletCheck = await this.wallet.isReadyForAgentIndex();
    if (!walletCheck.ready) {
      issues.push(...walletCheck.reasons);
    }

    // Check onboarding
    let onboarded = false;
    if (this.apiKey) {
      try {
        await this.getTopProposals(); // Will fail if API key invalid
        onboarded = true;
      } catch {
        issues.push('API key invalid or expired');
      }
    } else {
      issues.push('Not onboarded - no API key');
    }

    return {
      walletReady: walletCheck.ready,
      onboarded,
      hasTokens: walletCheck.ready, // Part of wallet check
      issues
    };
  }
}
