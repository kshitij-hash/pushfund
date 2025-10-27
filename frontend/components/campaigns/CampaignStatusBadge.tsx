/**
 * Campaign Status Badge Component
 * Displays visual indicators for campaign state (active, successful, ended, funded)
 */

import { Badge } from '@/components/ui/badge';
import { Circle } from 'lucide-react';

type CampaignStatus = 'active' | 'successful' | 'ended' | 'funded';

interface CampaignStatusBadgeProps {
  isActive: boolean;
  goalReached: boolean;
  fundsWithdrawn?: boolean;
  deadline: bigint;
  className?: string;
}

interface StatusConfig {
  label: string;
  dotColor: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  className: string;
}

const STATUS_CONFIG: Record<CampaignStatus, StatusConfig> = {
  active: {
    label: 'Active',
    dotColor: 'fill-primary text-primary',
    variant: 'default',
    className: 'bg-primary/20 text-primary border-primary',
  },
  successful: {
    label: 'Goal Reached',
    dotColor: 'fill-primary text-primary',
    variant: 'default',
    className: 'bg-primary/20 text-primary border-primary',
  },
  ended: {
    label: 'Ended',
    dotColor: 'fill-muted-foreground text-muted-foreground',
    variant: 'secondary',
    className: 'bg-muted text-muted-foreground border-border',
  },
  funded: {
    label: 'Funded',
    dotColor: 'fill-primary text-primary',
    variant: 'default',
    className: 'bg-primary/20 text-primary border-primary',
  },
};

/**
 * Determines the campaign status based on current state
 */
function determineStatus(props: CampaignStatusBadgeProps): CampaignStatus {
  const now = BigInt(Math.floor(Date.now() / 1000));
  const isPastDeadline = now > props.deadline;

  // Funded = goal reached AND funds withdrawn
  if (props.goalReached && props.fundsWithdrawn) {
    return 'funded';
  }

  // Successful = goal reached but not yet withdrawn
  if (props.goalReached && !isPastDeadline) {
    return 'successful';
  }

  // Ended = past deadline, goal not reached
  if (isPastDeadline && !props.goalReached) {
    return 'ended';
  }

  // Active = still running, goal not yet reached
  return 'active';
}

/**
 * Campaign Status Badge Component
 */
export function CampaignStatusBadge(props: CampaignStatusBadgeProps) {
  const { className } = props;
  const status = determineStatus(props);
  const config = STATUS_CONFIG[status];

  return (
    <Badge
      variant={config.variant}
      className={`${config.className} ${className || ''} font-medium border flex items-center gap-1`}
    >
      <Circle className={`h-2 w-2 ${config.dotColor}`} aria-hidden="true" />
      <span>{config.label}</span>
    </Badge>
  );
}
