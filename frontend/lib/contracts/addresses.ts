/**
 * Contract addresses for PushFund platform
 * Update these after deployment to Push Chain Donut Testnet
 */

export const CONTRACTS = {
  // Push Chain Donut Testnet
  DONUT_TESTNET: {
    UEA_FACTORY: '0x00000000000000000000000000000000000000eA',
    CAMPAIGN_FACTORY: process.env.NEXT_PUBLIC_CAMPAIGN_FACTORY_ADDRESS || '',
    // Platform fee recipient (update with actual address)
    PLATFORM_FEE_RECIPIENT: process.env.NEXT_PUBLIC_PLATFORM_FEE_RECIPIENT || '',
  },
} as const;

export const PUSH_CHAIN_RPC = {
  DONUT_TESTNET: 'https://evm.rpc-testnet-donut-node1.push.org/',
} as const;

export const BLOCK_EXPLORER = {
  DONUT_TESTNET: 'https://donut.push.network',
} as const;

// Chain IDs
export const CHAIN_IDS = {
  DONUT_TESTNET: 42101, // Push Chain Donut Testnet
} as const;

// Get contract addresses based on environment
export function getContractAddresses() {
  // Default to Donut Testnet for now
  return CONTRACTS.DONUT_TESTNET;
}

export function getRpcUrl() {
  return PUSH_CHAIN_RPC.DONUT_TESTNET;
}

export function getBlockExplorer() {
  return BLOCK_EXPLORER.DONUT_TESTNET;
}
