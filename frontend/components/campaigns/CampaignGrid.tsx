'use client';

import { Campaign } from '@/lib/types';
import { CampaignCard } from './CampaignCard';

interface CampaignGridProps {
  campaigns: Campaign[];
  emptyMessage?: string;
}

export function CampaignGrid({ campaigns, emptyMessage = 'No campaigns found' }: CampaignGridProps) {
  if (campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {campaigns.map((campaign) => (
        <CampaignCard key={campaign.campaignAddress} campaign={campaign} />
      ))}
    </div>
  );
}
