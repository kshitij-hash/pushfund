'use client';

import { useState, useCallback } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { CampaignFactoryABI, getContractAddresses, getPublicClient } from '../index';
import type { Campaign, CreateCampaignParams } from '@/lib/types';
import { parseEther, encodeFunctionData, parseEventLogs } from 'viem';
import { toast } from 'sonner';
import { getErrorMessage } from '../error-messages';

export function useCampaignFactory() {
  const { pushChainClient, isConnected } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const addresses = getContractAddresses();

  /**
   * Create a new campaign
   */
  const createCampaign = useCallback(
    async (params: CreateCampaignParams): Promise<string | null> => {
      if (!isConnected || !pushChainClient) {
        toast.error('Please connect your wallet');
        return null;
      }

      if (!addresses.CAMPAIGN_FACTORY) {
        toast.error('Campaign factory not deployed');
        return null;
      }

      setIsLoading(true);

      try {
        const goalInWei = parseEther(params.goalAmount);

        // Call createCampaign function
        const tx = await pushChainClient.universal.sendTransaction({
          to: addresses.CAMPAIGN_FACTORY as `0x${string}`,
          data: encodeFunctionData({
            abi: CampaignFactoryABI,
            functionName: 'createCampaign',
            args: [
              params.title,
              params.description,
              goalInWei,
              BigInt(params.durationInDays),
              params.imageUrl,
            ],
          }),
        });

        toast.success('Campaign creation submitted!');

        const receipt = await tx.wait();

        console.log('Transaction receipt:', receipt);
        console.log('Receipt logs:', receipt.logs);

        // Parse CampaignCreated event from logs
        const events = parseEventLogs({
          abi: CampaignFactoryABI,
          logs: receipt.logs,
          eventName: 'CampaignCreated',
        });

        console.log('Parsed CampaignCreated events:', events);

        if (events.length === 0) {
          console.error('No CampaignCreated event found in receipt:', receipt);
          throw new Error('Failed to create campaign: no event emitted');
        }

        // Type assertion for the event args
        const event = events[0] as { args?: { campaignAddress?: string } };
        const campaignAddress = event.args?.campaignAddress as string;
        console.log('Extracted campaign address:', campaignAddress);

        if (!campaignAddress) {
          console.error('Event found but no campaign address:', event);
          throw new Error('Failed to extract campaign address from event');
        }

        toast.success('Campaign created successfully!');
        return campaignAddress;
      } catch (error) {
        console.error('Failed to create campaign:', error);
        const errorMsg = getErrorMessage(error);
        toast.error(errorMsg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [pushChainClient, isConnected, addresses.CAMPAIGN_FACTORY]
  );

  /**
   * Get all campaigns
   */
  const getAllCampaigns = useCallback(async (): Promise<Campaign[]> => {
    if (!addresses.CAMPAIGN_FACTORY) {
      return [];
    }

    try {
      const publicClient = getPublicClient();
      const campaigns = await publicClient.readContract({
        address: addresses.CAMPAIGN_FACTORY as `0x${string}`,
        abi: CampaignFactoryABI,
        functionName: 'getAllCampaigns',
      });

      return campaigns as Campaign[];
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
      return [];
    }
  }, [addresses.CAMPAIGN_FACTORY]);

  /**
   * Get campaigns by creator
   */
  const getCampaignsByCreator = useCallback(
    async (creatorAddress: string): Promise<Campaign[]> => {
      if (!addresses.CAMPAIGN_FACTORY) {
        return [];
      }

      try {
        const publicClient = getPublicClient();
        const campaigns = await publicClient.readContract({
          address: addresses.CAMPAIGN_FACTORY as `0x${string}`,
          abi: CampaignFactoryABI,
          functionName: 'getCampaignsByCreator',
          args: [creatorAddress],
        });

        return campaigns as Campaign[];
      } catch (error) {
        console.error('Failed to fetch creator campaigns:', error);
        return [];
      }
    },
    [addresses.CAMPAIGN_FACTORY]
  );

  /**
   * Get active campaigns
   */
  const getActiveCampaigns = useCallback(async (): Promise<Campaign[]> => {
    if (!addresses.CAMPAIGN_FACTORY) {
      return [];
    }

    try {
      const publicClient = getPublicClient();
      const campaigns = await publicClient.readContract({
        address: addresses.CAMPAIGN_FACTORY as `0x${string}`,
        abi: CampaignFactoryABI,
        functionName: 'getActiveCampaigns',
      });

      return campaigns as Campaign[];
    } catch (error) {
      console.error('Failed to fetch active campaigns:', error);
      return [];
    }
  }, [addresses.CAMPAIGN_FACTORY]);

  /**
   * Get detailed campaign info by address
   */
  const getCampaignInfo = useCallback(
    async (campaignAddress: string): Promise<Campaign> => {
      const CampaignABI = (await import('../abi/Campaign.json')).default;

      try {
        const publicClient = getPublicClient();
        const addr = campaignAddress as `0x${string}`;

        // First, check if the address has code (is a contract)
        const code = await publicClient.getCode({ address: addr });
        if (!code || code === '0x') {
          throw new Error('Campaign contract not found at this address');
        }

        // Make individual contract calls (Push Chain doesn't have Multicall3 yet)
        const [
          creator,
          title,
          description,
          goalAmount,
          totalRaised,
          deadline,
          isActive,
          goalReached,
          fundsWithdrawn,
          imageUrl,
          contributorCount,
          contributionsFromEthereum,
          contributionsFromSolana,
          contributionsFromPushChain,
        ] = await Promise.all([
          publicClient.readContract({ address: addr, abi: CampaignABI, functionName: 'creator' }),
          publicClient.readContract({ address: addr, abi: CampaignABI, functionName: 'title' }),
          publicClient.readContract({ address: addr, abi: CampaignABI, functionName: 'description' }),
          publicClient.readContract({ address: addr, abi: CampaignABI, functionName: 'goalAmount' }),
          publicClient.readContract({ address: addr, abi: CampaignABI, functionName: 'totalRaised' }),
          publicClient.readContract({ address: addr, abi: CampaignABI, functionName: 'deadline' }),
          publicClient.readContract({ address: addr, abi: CampaignABI, functionName: 'isActive' }),
          publicClient.readContract({ address: addr, abi: CampaignABI, functionName: 'goalReached' }),
          publicClient.readContract({ address: addr, abi: CampaignABI, functionName: 'fundsWithdrawn' }),
          publicClient.readContract({ address: addr, abi: CampaignABI, functionName: 'imageUrl' }),
          publicClient.readContract({ address: addr, abi: CampaignABI, functionName: 'getContributorCount' }),
          publicClient.readContract({ address: addr, abi: CampaignABI, functionName: 'contributionsByChain', args: ['eip155'] }),
          publicClient.readContract({ address: addr, abi: CampaignABI, functionName: 'contributionsByChain', args: ['solana'] }),
          publicClient.readContract({ address: addr, abi: CampaignABI, functionName: 'contributionsByChain', args: ['push'] }),
        ]);

        return {
          campaignAddress,
          creator: creator as string,
          title: title as string,
          description: description as string,
          goalAmount: goalAmount as bigint,
          totalRaised: totalRaised as bigint,
          deadline: deadline as bigint,
          isActive: isActive as boolean,
          goalReached: goalReached as boolean,
          fundsWithdrawn: fundsWithdrawn as boolean,
          imageUrl: imageUrl as string,
          contributorCount: Number(contributorCount),
          contributionsFromEthereum: contributionsFromEthereum as bigint,
          contributionsFromSolana: contributionsFromSolana as bigint,
          contributionsFromPushChain: contributionsFromPushChain as bigint,
        };
      } catch (error) {
        console.error('Failed to fetch campaign info:', error);
        throw error;
      }
    },
    []
  );

  /**
   * Get creator campaign count
   */
  const getCreatorCampaignCount = useCallback(
    async (creatorAddress: string): Promise<number> => {
      if (!addresses.CAMPAIGN_FACTORY) {
        return 0;
      }

      try {
        const publicClient = getPublicClient();
        const count = await publicClient.readContract({
          address: addresses.CAMPAIGN_FACTORY as `0x${string}`,
          abi: CampaignFactoryABI,
          functionName: 'getCreatorCampaignCount',
          args: [creatorAddress],
        });

        return Number(count);
      } catch (error) {
        console.error('Failed to fetch creator campaign count:', error);
        return 0;
      }
    },
    [addresses.CAMPAIGN_FACTORY]
  );

  return {
    createCampaign,
    getAllCampaigns,
    getCampaignsByCreator,
    getActiveCampaigns,
    getCampaignInfo,
    getCreatorCampaignCount,
    isLoading,
  };
}
