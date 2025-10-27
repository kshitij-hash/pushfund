/**
 * Warning Badge Component
 * Displays warnings and info badges for campaigns (New Creator, High Velocity, etc.)
 */

import { Badge } from '@/components/ui/badge';
import { AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type WarningLevel = 'info' | 'warning' | 'danger';
export type WarningType = 'new-creator' | 'recently-created' | 'high-velocity' | 'low-activity';

interface WarningBadgeProps {
  type: WarningType;
  level?: WarningLevel;
  className?: string;
}

interface WarningConfig {
  label: string;
  icon: React.ReactNode;
  level: WarningLevel;
  className: string;
  description: string;
}

const WARNING_CONFIGS: Record<WarningType, WarningConfig> = {
  'new-creator': {
    label: 'New Creator',
    icon: <Info className="h-3 w-3" />,
    level: 'info',
    className: 'bg-primary/20 text-primary border-primary',
    description: 'This creator has launched fewer than 3 campaigns',
  },
  'recently-created': {
    label: 'Recently Created',
    icon: <Info className="h-3 w-3" />,
    level: 'info',
    className: 'bg-primary/20 text-primary border-primary',
    description: 'This campaign was created less than 7 days ago',
  },
  'high-velocity': {
    label: 'High Activity',
    icon: <AlertTriangle className="h-3 w-3" />,
    level: 'warning',
    className: 'bg-destructive/20 text-destructive border-destructive',
    description: 'This creator has launched multiple campaigns recently',
  },
  'low-activity': {
    label: 'Low Activity',
    icon: <AlertCircle className="h-3 w-3" />,
    level: 'warning',
    className: 'bg-muted text-muted-foreground border-border',
    description: 'This campaign has received little activity',
  },
};

export function WarningBadge({ type, level, className = '' }: WarningBadgeProps) {
  const config = WARNING_CONFIGS[type];
  const finalLevel = level || config.level;

  return (
    <Badge
      variant="outline"
      className={`${config.className} ${className} text-xs font-medium border flex items-center gap-1`}
      title={config.description}
    >
      {config.icon}
      <span>{config.label}</span>
    </Badge>
  );
}

/**
 * Helper function to determine which warning badges to show for a campaign
 */
export function getCampaignWarnings(params: {
  creatorCampaignCount?: number;
  campaignCreatedAt?: bigint | number;
  contributorCount?: number;
  totalRaised?: bigint;
  deadline?: bigint;
}): WarningType[] {
  const warnings: WarningType[] = [];
  const now = Math.floor(Date.now() / 1000);

  // New Creator: Less than 3 campaigns
  if (params.creatorCampaignCount !== undefined && params.creatorCampaignCount < 3) {
    warnings.push('new-creator');
  }

  // Recently Created: Less than 7 days old
  if (params.campaignCreatedAt) {
    const createdAtSeconds = typeof params.campaignCreatedAt === 'bigint'
      ? Number(params.campaignCreatedAt)
      : params.campaignCreatedAt;
    const ageInDays = (now - createdAtSeconds) / (60 * 60 * 24);

    if (ageInDays < 7) {
      warnings.push('recently-created');
    }
  }

  // High Velocity: More than 5 campaigns from this creator
  // Note: This would require tracking campaign creation timestamps
  // For now, we'll use campaign count as a proxy
  if (params.creatorCampaignCount !== undefined && params.creatorCampaignCount > 5) {
    warnings.push('high-velocity');
  }

  // Low Activity: Few contributors and low funds, but campaign is more than 7 days old
  if (
    params.contributorCount !== undefined &&
    params.totalRaised !== undefined &&
    params.campaignCreatedAt &&
    params.deadline
  ) {
    const createdAtSeconds = typeof params.campaignCreatedAt === 'bigint'
      ? Number(params.campaignCreatedAt)
      : params.campaignCreatedAt;
    const ageInDays = (now - createdAtSeconds) / (60 * 60 * 24);
    const deadlineSeconds = typeof params.deadline === 'bigint'
      ? Number(params.deadline)
      : params.deadline;
    const isActive = now < deadlineSeconds;

    if (
      isActive &&
      ageInDays >= 7 &&
      params.contributorCount < 3 &&
      params.totalRaised < BigInt(1e18) // Less than 1 PC
    ) {
      warnings.push('low-activity');
    }
  }

  return warnings;
}
