'use client';

import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Campaign } from '@/lib/types';
import { formatEther } from 'viem';
import { ROUTES } from '@/config/constants';
import { CampaignStatusBadge } from './CampaignStatusBadge';
import { WarningBadge, getCampaignWarnings } from './WarningBadge';
import { Users, Clock } from 'lucide-react';

interface CampaignCardProps {
  campaign: Campaign;
  creatorCampaignCount?: number;
}

export function CampaignCard({ campaign, creatorCampaignCount }: CampaignCardProps) {
  const progress = Number((campaign.totalRaised * 100n) / campaign.goalAmount);
  const daysLeft = Math.max(
    0,
    Math.floor((Number(campaign.deadline) * 1000 - Date.now()) / (1000 * 60 * 60 * 24))
  );

  const raised = formatEther(campaign.totalRaised);
  const goal = formatEther(campaign.goalAmount);

  // Calculate campaign age (estimate based on deadline - duration)
  const estimatedCreatedAt = Number(campaign.deadline) - (90 * 24 * 60 * 60); // Assume max 90 day duration

  // Get warning badges to display
  const warnings = getCampaignWarnings({
    creatorCampaignCount,
    campaignCreatedAt: estimatedCreatedAt,
    contributorCount: campaign.contributorCount,
    totalRaised: campaign.totalRaised,
    deadline: campaign.deadline,
  });

  return (
    <Card className="group overflow-hidden flex flex-col h-full">
      <CardHeader className="space-y-3 pb-4">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-2 flex-1 text-lg group-hover:text-primary transition-all duration-200">
            {campaign.title}
          </CardTitle>
          <CampaignStatusBadge
            isActive={campaign.isActive}
            goalReached={campaign.goalReached}
            fundsWithdrawn={campaign.fundsWithdrawn}
            deadline={campaign.deadline}
          />
        </div>

        {/* Warning Badges */}
        {warnings.length > 0 && (
          <TooltipProvider>
            <div className="flex flex-wrap gap-2">
              {warnings.map((warning) => (
                <WarningBadge key={warning} type={warning} />
              ))}
            </div>
          </TooltipProvider>
        )}
      </CardHeader>

      <CardContent className="space-y-4 flex-1">
        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-foreground">
              {parseFloat(raised).toFixed(4)} PC
            </span>
            <span className="text-muted-foreground">
              of {parseFloat(goal).toFixed(2)} PC
            </span>
          </div>
          <Progress value={Math.min(progress, 100)} className="h-2 transition-all duration-300" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{progress.toFixed(1)}% funded</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" aria-hidden="true" />
                  <span>{campaign.contributorCount || 0}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{campaign.contributorCount || 0} contributor{campaign.contributorCount !== 1 ? 's' : ''}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  <span>{daysLeft}d</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <Link href={ROUTES.CAMPAIGN_DETAIL(campaign.campaignAddress)} className="w-full">
          <Button className="w-full" variant="default">
            View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
