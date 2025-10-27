'use client';

import { useState, useCallback } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { CampaignABI } from '../index';
import type { ContributeParams } from '@/lib/types';
import { parseEther, encodeFunctionData } from 'viem';
import { toast } from 'sonner';
import { getErrorMessage } from '../error-messages';

export function useCampaign() {
  const { pushChainClient, isConnected } = useWallet();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Contribute to campaign
   */
  const contribute = useCallback(
    async (params: ContributeParams): Promise<boolean> => {
      if (!isConnected || !pushChainClient) {
        toast.error('Please connect your wallet');
        return false;
      }

      setIsLoading(true);

      try {
        const amountWei = parseEther(params.amount);

        // Send transaction to contribute
        const tx = await pushChainClient.universal.sendTransaction({
          to: params.campaignAddress as `0x${string}`,
          data: encodeFunctionData({
            abi: CampaignABI,
            functionName: 'contribute',
          }),
          value: amountWei,
        });

        toast.success('Contribution submitted!');

        await tx.wait();

        toast.success(`Contributed ${params.amount} PC successfully!`);
        return true;
      } catch (error) {
        console.error('Failed to contribute:', error);
        const errorMsg = getErrorMessage(error);
        toast.error(errorMsg);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [pushChainClient, isConnected]
  );

  /**
   * Withdraw funds (creator only)
   */
  const withdrawFunds = useCallback(
    async (params: { campaignAddress: string }): Promise<boolean> => {
      if (!isConnected || !pushChainClient) {
        toast.error('Please connect your wallet');
        return false;
      }

      setIsLoading(true);

      try {
        const tx = await pushChainClient.universal.sendTransaction({
          to: params.campaignAddress as `0x${string}`,
          data: encodeFunctionData({
            abi: CampaignABI,
            functionName: 'withdrawFunds',
          }),
        });

        toast.success('Withdrawal submitted!');

        await tx.wait();

        toast.success('Funds withdrawn successfully!');
        return true;
      } catch (error) {
        console.error('Failed to withdraw:', error);
        const errorMsg = getErrorMessage(error);
        toast.error(errorMsg);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [pushChainClient, isConnected]
  );

  /**
   * Claim refund (contributor only)
   */
  const claimRefund = useCallback(
    async (params: { campaignAddress: string }): Promise<boolean> => {
      if (!isConnected || !pushChainClient) {
        toast.error('Please connect your wallet');
        return false;
      }

      setIsLoading(true);

      try {
        const tx = await pushChainClient.universal.sendTransaction({
          to: params.campaignAddress as `0x${string}`,
          data: encodeFunctionData({
            abi: CampaignABI,
            functionName: 'claimRefund',
          }),
        });

        toast.success('Refund claim submitted!');

        await tx.wait();

        toast.success('Refund claimed successfully!');
        return true;
      } catch (error) {
        console.error('Failed to claim refund:', error);
        const errorMsg = getErrorMessage(error);
        toast.error(errorMsg);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [pushChainClient, isConnected]
  );

  return {
    contribute,
    withdrawFunds,
    claimRefund,
    isLoading,
  };
}
