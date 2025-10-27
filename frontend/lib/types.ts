/**
 * Type definitions for PushFund platform
 */

export interface Campaign {
  campaignAddress: string;
  creator: string;
  title: string;
  description?: string;
  imageUrl?: string;
  goalAmount: bigint;
  deadline: bigint;
  totalRaised: bigint;
  isActive: boolean;
  goalReached: boolean;
  fundsWithdrawn?: boolean;
  contributorCount?: number;
  contributionsFromEthereum: bigint;
  contributionsFromSolana: bigint;
  contributionsFromPushChain: bigint;
}

export interface CampaignDetails extends Campaign {
  description: string;
  imageUrl: string;
  contributorCount: number;
  timeRemaining: bigint;
  progress: bigint;
}

export interface Contribution {
  contributor: string;
  amount: bigint;
  originChain: string;
  timestamp: number;
  txHash: string;
}

export interface ChainContributions {
  eip155: bigint;  // Ethereum and EVM chains
  solana: bigint;   // Solana
  push: bigint;     // Native Push Chain
}

export interface CreateCampaignParams {
  title: string;
  description: string;
  goalAmount: string; // in ETH/SOL/PC
  durationInDays: number;
  imageUrl: string;
}

export interface ContributeParams {
  campaignAddress: string;
  amount: string; // in ETH/SOL/PC
  useNativeToken?: boolean;
}

// Chain namespaces from Push Chain UEA
export type ChainNamespace = 'eip155' | 'solana' | 'push';

export interface UniversalAccount {
  address: string;
  chainNamespace: ChainNamespace;
  chainId: string;
}
