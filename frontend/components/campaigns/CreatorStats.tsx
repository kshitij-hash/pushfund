/**
 * Creator Stats Component
 * Displays statistics about a campaign creator
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCampaignFactory } from '@/lib/contracts/hooks/useCampaignFactory';
import { User, TrendingUp, CheckCircle2 } from 'lucide-react';

interface CreatorStatsProps {
  creatorAddress: string;
  className?: string;
}

export function CreatorStats({ creatorAddress, className = '' }: CreatorStatsProps) {
  const { getCreatorCampaignCount, getCampaignsByCreator } = useCampaignFactory();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    successfulCampaigns: 0,
    successRate: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);

      try {
        // Get total campaign count
        const totalCount = await getCreatorCampaignCount(creatorAddress);

        // Get all campaigns by creator to calculate success rate
        const campaigns = await getCampaignsByCreator(creatorAddress);
        const successfulCount = campaigns.filter((c) => c.goalReached).length;
        const successRate =
          totalCount > 0 ? Math.round((successfulCount / totalCount) * 100) : 0;

        setStats({
          totalCampaigns: totalCount,
          successfulCampaigns: successfulCount,
          successRate,
        });
      } catch (error) {
        console.error('Failed to fetch creator stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (creatorAddress) {
      fetchStats();
    }
  }, [creatorAddress, getCreatorCampaignCount, getCampaignsByCreator]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5" />
            Creator Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="h-5 w-5" />
          Creator Stats
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Total Campaigns */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span>Total Campaigns:</span>
          </div>
          <span className="font-semibold">{stats.totalCampaigns}</span>
        </div>

        {/* Successful Campaigns */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4" />
            <span>Successful:</span>
          </div>
          <span className="font-semibold">{stats.successfulCampaigns}</span>
        </div>

        {/* Success Rate */}
        {stats.totalCampaigns > 0 && (
          <div className="pt-3 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Success Rate:</span>
              <span
                className={`font-bold text-lg ${
                  stats.successRate >= 50
                    ? 'text-primary'
                    : stats.successRate >= 25
                    ? 'text-accent'
                    : 'text-destructive'
                }`}
              >
                {stats.successRate}%
              </span>
            </div>
          </div>
        )}

        {/* New Creator Badge */}
        {stats.totalCampaigns < 3 && (
          <div className="pt-3 border-t">
            <div className="rounded-lg bg-primary/20 p-3 border border-primary">
              <p className="text-xs text-primary">
                <strong>New Creator:</strong> This creator has launched fewer than 3 campaigns.
                Please do your own research before contributing.
              </p>
            </div>
          </div>
        )}

        {/* High Success Rate Badge */}
        {stats.totalCampaigns >= 3 && stats.successRate >= 75 && (
          <div className="pt-3 border-t">
            <div className="rounded-lg bg-primary/20 p-3 border border-primary">
              <p className="text-xs text-primary">
                <strong>Trusted Creator:</strong> This creator has a strong track record of
                successful campaigns.
              </p>
            </div>
          </div>
        )}

        {/* Creator Address */}
        <div className="pt-3 border-t">
          <p className="text-xs text-muted-foreground mb-1">Creator Address:</p>
          <code className="text-xs font-mono bg-muted px-2 py-1 rounded block truncate">
            {creatorAddress}
          </code>
        </div>
      </CardContent>
    </Card>
  );
}
