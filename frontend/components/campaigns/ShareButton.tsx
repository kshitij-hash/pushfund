'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { copyToClipboard } from '@/lib/utils';
import { toast } from 'sonner';
import { Share2, Copy, Check } from 'lucide-react';

interface ShareButtonProps {
  campaignAddress: string;
  campaignTitle: string;
  campaignDescription?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function ShareButton({
  campaignAddress,
  campaignTitle,
  campaignDescription,
  variant = 'outline',
  size = 'default',
  className,
}: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Construct the shareable URL
  // In production, use window.location.origin; fallback to env var or localhost
  const baseUrl = typeof window !== 'undefined' && window.location.origin !== 'http://localhost:3000'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const shareUrl = `${baseUrl}/campaigns/${campaignAddress}`;

  // Create engaging social media text
  const shareText = `🚀 Help fund: ${campaignTitle}\n\nSupport this campaign on @PushFund - contribute from any chain (ETH, SOL, ARB, BASE) 💜\n\n👉`;

  const handleCopyLink = async () => {
    const success = await copyToClipboard(shareUrl);

    if (success) {
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('Failed to copy link. Please try again.');
    }
  };

  const handleTwitterShare = () => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(shareText);
    // Add hashtags for better discoverability
    const hashtags = 'PushChain,Crowdfunding,Web3';
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}&hashtags=${hashtags}`;

    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Share2 className="h-4 w-4" />
          {size !== 'icon' && <span className="ml-2">Share</span>}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Campaign</DialogTitle>
          <DialogDescription>
            Share this campaign with your network to help it reach its goal
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Campaign Title Preview */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Campaign</Label>
            <p className="text-sm font-semibold">{campaignTitle}</p>
          </div>

          <Separator />

          {/* Copy Link Section */}
          <div className="space-y-2">
            <Label htmlFor="share-link">Campaign Link</Label>
            <div className="flex gap-2">
              <Input
                id="share-link"
                value={shareUrl}
                readOnly
                className="flex-1 font-mono text-xs"
              />
              <Button
                size="icon"
                variant="secondary"
                onClick={handleCopyLink}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span className="sr-only">
                  {copied ? 'Copied' : 'Copy link'}
                </span>
              </Button>
            </div>
          </div>

          <Separator />

          {/* Twitter Share Button */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Share on X (Twitter)
            </Label>
            <Button
              variant="outline"
              className="w-full border-black text-black hover:bg-black hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black"
              onClick={handleTwitterShare}
            >
              <svg
                className="h-4 w-4 mr-2"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Post on X
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
