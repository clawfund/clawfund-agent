// Main exports
export { AgentWallet } from './wallet/AgentWallet';
export { AgentIndexClient } from './agent-index/Client';

// Re-export types
export type { 
  WalletConfig, 
  WalletBalance 
} from './wallet/AgentWallet';

export type { 
  AgentIndexConfig, 
  OnboardingStart, 
  OnboardingComplete, 
  Proposal, 
  Vote 
} from './agent-index/Client';
