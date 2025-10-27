/**
 * Application constants for PushFund
 */

export const APP_CONFIG = {
  name: 'PushFund',
  title: 'PushFund - Universal Crowdfunding Platform',
  description: 'Push your campaign. Fund from anywhere. Built on Push Chain.',
  logoUrl: '/logo.png',
} as const;

export const PLATFORM_FEE = {
  PERCENTAGE: 2.5, // 2.5%
  BASIS_POINTS: 250, // 250 basis points
  MAX_PERCENTAGE: 5, // 5% maximum
} as const;

export const CAMPAIGN_LIMITS = {
  // Updated: Oct 24, 2025 - Anti-fraud mechanisms
  MIN_DURATION_DAYS: 7,        // Increased from 1 to prevent pump-and-dump
  MAX_DURATION_DAYS: 90,
  MIN_TITLE_LENGTH: 10,
  MAX_TITLE_LENGTH: 100,
  MIN_DESCRIPTION_LENGTH: 50,
  MAX_DESCRIPTION_LENGTH: 2000,
  MIN_GOAL_AMOUNT: 0.01,
  MAX_GOAL_AMOUNT: 1000000,
  // Anti-fraud limits
  MAX_CAMPAIGNS_PER_CREATOR: 10,
  CREATION_COOLDOWN_HOURS: 24,
} as const;

// Supported chains for contributions
export const SUPPORTED_CHAINS = {
  ETHEREUM_SEPOLIA: {
    name: 'Ethereum Sepolia',
    namespace: 'eip155',
    chainId: '11155111',
    icon: '/chains/ethereum.svg',
  },
  ARBITRUM_SEPOLIA: {
    name: 'Arbitrum Sepolia',
    namespace: 'eip155',
    chainId: '421614',
    icon: '/chains/arbitrum.svg',
  },
  BASE_SEPOLIA: {
    name: 'Base Sepolia',
    namespace: 'eip155',
    chainId: '84532',
    icon: '/chains/base.svg',
  },
  SOLANA_DEVNET: {
    name: 'Solana Devnet',
    namespace: 'solana',
    chainId: 'devnet',
    icon: '/chains/solana.svg',
  },
  PUSH_CHAIN: {
    name: 'Push Chain',
    namespace: 'push',
    chainId: 'donut',
    icon: '/chains/push.svg',
  },
} as const;

export const ROUTES = {
  HOME: '/',
  CAMPAIGNS: '/campaigns',
  CAMPAIGN_DETAIL: (id: string) => `/campaigns/${id}`,
  CREATE_CAMPAIGN: '/campaigns/create',
  DASHBOARD: '/dashboard',
} as const;
