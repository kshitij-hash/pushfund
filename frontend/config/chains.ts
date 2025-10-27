/**
 * Chain configurations for Push Universal Wallet
 */

// Note: These are the chain constants from @pushchain/ui-kit
// We'll import from the actual package when available
export const PUSH_CHAINS = {
  ETHEREUM_SEPOLIA: 'ethereum-sepolia',
  ARBITRUM_SEPOLIA: 'arbitrum-sepolia',
  BASE_SEPOLIA: 'base-sepolia',
  SOLANA_DEVNET: 'solana-devnet',
} as const;

export const PUSH_NETWORK = {
  TESTNET: 'testnet-donut',
  MAINNET: 'mainnet',
} as const;

export const THEME_MODE = {
  LIGHT: 'light',
  DARK: 'dark',
} as const;

export const LOGIN_LAYOUT = {
  SIMPLE: 'simple',
  ADVANCED: 'advanced',
} as const;

export const CONNECTED_INTERACTION = {
  BLUR: 'blur',
  NONE: 'none',
} as const;

export const CONNECTED_LAYOUT = {
  HOVER: 'hover',
  CLICK: 'click',
} as const;
