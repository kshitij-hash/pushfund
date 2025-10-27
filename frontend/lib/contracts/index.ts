/**
 * Contract exports and utilities
 */

import CampaignFactoryABI from './abi/CampaignFactory.json';
import CampaignABI from './abi/Campaign.json';
import { createPublicClient, http, defineChain } from 'viem';
import { getRpcUrl, CHAIN_IDS } from './addresses';

export { CampaignFactoryABI, CampaignABI };

export * from './addresses';

/**
 * Push Chain Donut Testnet chain definition
 * Note: Multicall3 not available on Push Chain yet, so we'll use individual calls
 */
export const pushChainDonutTestnet = defineChain({
  id: CHAIN_IDS.DONUT_TESTNET,
  name: 'Push Chain Donut Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Push',
    symbol: 'PUSH',
  },
  rpcUrls: {
    default: {
      http: [getRpcUrl()],
    },
  },
  blockExplorers: {
    default: {
      name: 'Push Explorer',
      url: 'https://donut.push.network',
    },
  },
  testnet: true,
});

/**
 * Get a viem public client for reading from Push Chain contracts
 */
export function getPublicClient() {
  return createPublicClient({
    chain: pushChainDonutTestnet,
    transport: http(getRpcUrl()),
  });
}
