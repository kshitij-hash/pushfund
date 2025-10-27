/**
 * Transaction History Component
 * Displays real blockchain events (contributions, withdrawals, refunds)
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getPublicClient } from '@/lib/contracts';
import { formatEther, type AbiEvent } from 'viem';
import { ExternalLink, Download, ArrowDownRight, ArrowUpRight, RotateCcw } from 'lucide-react';

interface Transaction {
  type: 'contribution' | 'withdrawal' | 'refund';
  address: string;
  amount: bigint;
  timestamp: number;
  txHash: string;
  originChain?: string;
  platformFee?: bigint;
}

interface TransactionHistoryProps {
  campaignAddress: string;
  className?: string;
}

export function TransactionHistory({ campaignAddress, className = '' }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const publicClient = getPublicClient();
        const CampaignABI = (await import('@/lib/contracts/abi/Campaign.json')).default;

        console.log('Fetching transaction history for campaign:', campaignAddress);

        // Get current block number
        const latestBlock = await publicClient.getBlockNumber();
        console.log('Latest block:', latestBlock);

        // Push Chain RPC has a 10,000 block limit for getLogs
        // Query last 9,000 blocks to be safe
        const fromBlock = latestBlock > 9000n ? latestBlock - 9000n : 0n;
        console.log('Querying from block:', fromBlock, 'to latest');
        console.log('Block range:', Number(latestBlock - fromBlock), 'blocks');

        // Find event definitions from ABI
        const contributionEvent = CampaignABI.find(
          (item: { type?: string; name?: string }) => item.type === 'event' && item.name === 'ContributionReceived'
        ) as AbiEvent | undefined;
        const withdrawalEvent = CampaignABI.find(
          (item: { type?: string; name?: string }) => item.type === 'event' && item.name === 'FundsWithdrawn'
        ) as AbiEvent | undefined;
        const refundEvent = CampaignABI.find(
          (item: { type?: string; name?: string }) => item.type === 'event' && item.name === 'RefundClaimed'
        ) as AbiEvent | undefined;

        console.log('Event definitions:', { contributionEvent, withdrawalEvent, refundEvent });

        // Get all events from the campaign contract
        const [contributionLogs, withdrawalLogs, refundLogs] = await Promise.all([
          // ContributionReceived events
          publicClient.getLogs({
            address: campaignAddress as `0x${string}`,
            event: contributionEvent,
            fromBlock,
            toBlock: 'latest',
          }),
          // FundsWithdrawn events
          publicClient.getLogs({
            address: campaignAddress as `0x${string}`,
            event: withdrawalEvent,
            fromBlock,
            toBlock: 'latest',
          }),
          // RefundClaimed events
          publicClient.getLogs({
            address: campaignAddress as `0x${string}`,
            event: refundEvent,
            fromBlock,
            toBlock: 'latest',
          }),
        ]);

        console.log('Logs received:', {
          contributions: contributionLogs.length,
          withdrawals: withdrawalLogs.length,
          refunds: refundLogs.length,
        });

        // Note: Push Chain RPC has a 10,000 block limit, so we can't query from genesis
        // If events are older than the query window, we'll fall back to contract state below

        // Parse and combine all transactions
        const allTxs: Transaction[] = [];

        // Parse contributions
        console.log('Parsing contribution logs...');
        for (const log of contributionLogs) {
          console.log('Contribution log:', log);
          const block = await publicClient.getBlock({ blockHash: log.blockHash! });
          const args = (log as unknown as { args: { contributor?: string; amount?: bigint; originChain?: string } }).args;
          allTxs.push({
            type: 'contribution',
            address: args.contributor as string,
            amount: args.amount as bigint,
            originChain: args.originChain as string,
            timestamp: Number(block.timestamp),
            txHash: log.transactionHash!,
          });
        }
        console.log('Parsed contributions:', allTxs.filter((tx) => tx.type === 'contribution'));

        // Parse withdrawals
        for (const log of withdrawalLogs) {
          const block = await publicClient.getBlock({ blockHash: log.blockHash! });
          const args = (log as unknown as { args: { creator?: string; amount?: bigint; platformFee?: bigint } }).args;
          allTxs.push({
            type: 'withdrawal',
            address: args.creator as string,
            amount: args.amount as bigint,
            platformFee: args.platformFee as bigint,
            timestamp: Number(block.timestamp),
            txHash: log.transactionHash!,
          });
        }

        // Parse refunds
        for (const log of refundLogs) {
          const block = await publicClient.getBlock({ blockHash: log.blockHash! });
          const args = (log as unknown as { args: { contributor?: string; amount?: bigint } }).args;
          allTxs.push({
            type: 'refund',
            address: args.contributor as string,
            amount: args.amount as bigint,
            timestamp: Number(block.timestamp),
            txHash: log.transactionHash!,
          });
        }

        // FALLBACK: If no events found, read directly from contract state
        if (allTxs.length === 0) {
          console.log('No events found, falling back to contract state...');

          try {
            // Get contributors list
            const contributors = (await publicClient.readContract({
              address: campaignAddress as `0x${string}`,
              abi: CampaignABI,
              functionName: 'getContributors',
            })) as `0x${string}`[];

            console.log('Contributors from contract:', contributors);

            // For each contributor, get their contribution details
            for (const contributor of contributors) {
              const [amount, originChain] = await Promise.all([
                publicClient.readContract({
                  address: campaignAddress as `0x${string}`,
                  abi: CampaignABI,
                  functionName: 'contributions',
                  args: [contributor],
                }) as Promise<bigint>,
                publicClient.readContract({
                  address: campaignAddress as `0x${string}`,
                  abi: CampaignABI,
                  functionName: 'contributorOriginChain',
                  args: [contributor],
                }) as Promise<string>,
              ]);

              if (amount > 0n) {
                allTxs.push({
                  type: 'contribution',
                  address: contributor,
                  amount: amount,
                  originChain: originChain || 'push',
                  timestamp: 0, // Not available from contract state
                  txHash: '', // Not available from contract state
                });
              }
            }

            console.log('Transactions from contract state:', allTxs);
          } catch (contractErr) {
            console.error('Failed to read from contract state:', contractErr);
          }
        }

        // Sort by timestamp (newest first)
        allTxs.sort((a, b) => b.timestamp - a.timestamp);

        console.log('Final transactions array:', allTxs);
        setTransactions(allTxs);
      } catch (err) {
        console.error('Failed to fetch transaction history:', err);
        setError('Failed to load transaction history');
      } finally {
        setIsLoading(false);
      }
    };

    if (campaignAddress) {
      fetchTransactions();
    }
  }, [campaignAddress]);

  const exportToCSV = () => {
    const headers = ['Type', 'Address', 'Amount (PC)', 'Origin Chain', 'Timestamp', 'Tx Hash'];
    const rows = transactions.map((tx) => [
      tx.type,
      tx.address,
      formatEther(tx.amount),
      tx.originChain || '-',
      new Date(tx.timestamp * 1000).toISOString(),
      tx.txHash,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campaign-${campaignAddress}-transactions.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const getIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'contribution':
        return <ArrowDownRight className="h-5 w-5 text-primary" />;
      case 'withdrawal':
        return <ArrowUpRight className="h-5 w-5 text-accent" />;
      case 'refund':
        return <RotateCcw className="h-5 w-5 text-destructive" />;
    }
  };

  const getLabel = (type: Transaction['type']) => {
    switch (type) {
      case 'contribution':
        return 'Contribution';
      case 'withdrawal':
        return 'Withdrawal';
      case 'refund':
        return 'Refund';
    }
  };

  const getBadgeColor = (type: Transaction['type']) => {
    switch (type) {
      case 'contribution':
        return 'bg-primary/20 text-primary border-primary';
      case 'withdrawal':
        return 'bg-accent/20 text-accent border-accent';
      case 'refund':
        return 'bg-destructive/20 text-destructive border-destructive';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Transaction History</CardTitle>
          {transactions.length > 0 && (
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No transactions yet. Be the first to contribute!
          </p>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx, index) => (
              <div
                key={`${tx.txHash}-${index}`}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex-shrink-0 mt-0.5">{getIcon(tx.type)}</div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className={`${getBadgeColor(tx.type)} text-xs`}>
                      {getLabel(tx.type)}
                    </Badge>
                    {tx.originChain && (
                      <Badge variant="outline" className="text-xs">
                        {tx.originChain}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-semibold">{formatEther(tx.amount)} PC</span>
                    {tx.platformFee && (
                      <span className="text-xs text-muted-foreground">
                        (fee: {formatEther(tx.platformFee)} PC)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <code className="font-mono">
                      {tx.address.slice(0, 6)}...{tx.address.slice(-4)}
                    </code>
                    {tx.timestamp > 0 && (
                      <>
                        <span>•</span>
                        <span>{new Date(tx.timestamp * 1000).toLocaleString()}</span>
                      </>
                    )}
                  </div>
                </div>

                {tx.txHash && (
                  <a
                    href={`https://donut.push.network/tx/${tx.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 p-2 rounded-md hover:bg-accent"
                    title="View on Block Explorer"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
