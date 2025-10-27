/**
 * Report Button Component
 * Allows users to report suspicious or inappropriate campaigns
 */

'use client';

import { useState } from 'react';
import { Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface ReportButtonProps {
  campaignAddress: string;
  campaignTitle: string;
  variant?: 'default' | 'ghost' | 'outline';
  className?: string;
}

type ReportReason = 'scam' | 'inappropriate' | 'copyright' | 'misleading' | 'other';

const REPORT_REASONS: { value: ReportReason; label: string; description: string }[] = [
  {
    value: 'scam',
    label: 'Scam or Fraud',
    description: 'This campaign appears to be fraudulent or a scam',
  },
  {
    value: 'inappropriate',
    label: 'Inappropriate Content',
    description: 'Contains offensive, harmful, or inappropriate content',
  },
  {
    value: 'copyright',
    label: 'Copyright Violation',
    description: 'Uses copyrighted material without permission',
  },
  {
    value: 'misleading',
    label: 'Misleading Information',
    description: 'Contains false or misleading information',
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Other reason not listed above',
  },
];

export function ReportButton({
  campaignAddress,
  campaignTitle,
  variant = 'ghost',
  className = '',
}: ReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>('scam');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      toast.error('Please select a reason for reporting');
      return;
    }

    if (!details.trim()) {
      toast.error('Please provide additional details');
      return;
    }

    if (details.trim().length < 20) {
      toast.error('Please provide at least 20 characters of detail');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignAddress,
          campaignTitle,
          reason,
          details: details.trim(),
          timestamp: Date.now(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit report');
      }

      toast.success('Report submitted successfully');
      toast.info('Our team will review this campaign shortly');

      // Reset form
      setReason('scam');
      setDetails('');
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to submit report:', error);
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size="sm" className={className}>
          <Flag className="h-4 w-4 mr-2" />
          Report
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Report Campaign</DialogTitle>
          <DialogDescription>
            Help us keep PushFund safe by reporting suspicious or inappropriate campaigns.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Campaign Info */}
          <div className="rounded-lg bg-muted p-3">
            <p className="text-sm font-medium">Reporting:</p>
            <p className="text-sm text-muted-foreground truncate">{campaignTitle}</p>
            <p className="text-xs text-muted-foreground font-mono mt-1">
              {campaignAddress.slice(0, 10)}...{campaignAddress.slice(-8)}
            </p>
          </div>

          {/* Reason Selection */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Report *</Label>
            <Select value={reason} onValueChange={(val) => setReason(val as ReportReason)}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{r.label}</span>
                      <span className="text-xs text-muted-foreground">{r.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Details */}
          <div className="space-y-2">
            <Label htmlFor="details">Additional Details *</Label>
            <Textarea
              id="details"
              placeholder="Please provide specific details about why you're reporting this campaign..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
              disabled={isSubmitting}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground">
              {details.length}/1000 characters (minimum 20)
            </p>
          </div>

          {/* Warning */}
          <div className="rounded-lg bg-destructive/20 p-3 border border-destructive">
            <p className="text-xs text-destructive">
              <strong>Note:</strong> False reports may result in restrictions on your account.
              Please only report campaigns that genuinely violate our terms of service.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
