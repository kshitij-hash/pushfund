'use client';

import { usePushWalletContext, usePushChainClient, PushUI } from '@pushchain/ui-kit';

/**
 * Custom hook to access Push Wallet functionality
 */
export function useWallet() {
  const { connectionStatus } = usePushWalletContext('pushfund');
  const { pushChainClient } = usePushChainClient('pushfund');

  const isConnected = connectionStatus === PushUI.CONSTANTS.CONNECTION.STATUS.CONNECTED;
  const universalAccount = pushChainClient?.universal?.account;

  return {
    account: universalAccount,
    address: universalAccount,
    isConnected,
    pushChainClient,
  };
}
