'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useCampaign } from '@/lib/contracts/hooks/useCampaign';
import { useCampaignFactory } from '@/lib/contracts/hooks/useCampaignFactory';
import { useWallet } from '@/hooks/useWallet';
import { Campaign } from '@/lib/types';
import { formatEther } from 'viem';
import { ROUTES } from '@/config/constants';
import { toast } from 'sonner';
import { CampaignStatusBadge } from '@/components/campaigns/CampaignStatusBadge';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { ReportButton } from '@/components/campaigns/ReportButton';
import { CreatorStats } from '@/components/campaigns/CreatorStats';
import { TransactionHistory } from '@/components/campaigns/TransactionHistory';
import { ShareButton } from '@/components/campaigns/ShareButton';
import {
  ArrowLeft,
  Users,
  Clock,
  Target,
  CalendarDays,
  Info,
  Loader2
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function CampaignDetailPage() {
  const params = useParams();
  const campaignAddress = params?.id as string;

  const { getCampaignInfo } = useCampaignFactory();
  const { contribute, claimRefund, withdrawFunds } = useCampaign();
  const { isConnected, address } = useWallet();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [contributionAmount, setContributionAmount] = useState('');
  const [isContributing, setIsContributing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);

  useEffect(() => {
    const fetchCampaign = async () => {
      if (!campaignAddress) return;

      setIsLoading(true);
      try {
        const data = await getCampaignInfo(campaignAddress);
        console.log('Campaign data received:', data);
        setCampaign(data);
      } catch (error) {
        console.error('Error fetching campaign:', error);
        toast.error('Failed to load campaign details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCampaign();
  }, [campaignAddress, getCampaignInfo]);

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!campaignAddress || !contributionAmount) {
      toast.error('Please enter a contribution amount');
      return;
    }

    try {
      const amount = parseFloat(contributionAmount);
      if (isNaN(amount) || amount <= 0) {
        toast.error('Please enter a valid amount');
        return;
      }

      setIsContributing(true);
      await contribute({
        campaignAddress,
        amount: amount.toString(),
      });

      toast.success('Contribution successful!');
      setContributionAmount('');

      // Refresh campaign data
      const updatedData = await getCampaignInfo(campaignAddress);
      setCampaign(updatedData);
    } catch (error) {
      console.error('Contribution error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to contribute');
    } finally {
      setIsContributing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!campaignAddress) return;

    try {
      setIsWithdrawing(true);
      await withdrawFunds({ campaignAddress });
      toast.success('Funds withdrawn successfully!');

      // Refresh campaign data
      const updatedData = await getCampaignInfo(campaignAddress);
      setCampaign(updatedData);
    } catch (error) {
      console.error('Withdrawal error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to withdraw funds');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleRefund = async () => {
    if (!campaignAddress) return;

    try {
      setIsRefunding(true);
      await claimRefund({ campaignAddress });
      toast.success('Refund claimed successfully!');

      // Refresh campaign data
      const updatedData = await getCampaignInfo(campaignAddress);
      setCampaign(updatedData);
    } catch (error) {
      console.error('Refund error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to claim refund');
    } finally {
      setIsRefunding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <div className="container py-8 md:py-12">
            <SkeletonLoader variant="campaign-detail" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <div className="container py-12">
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground mb-4">Campaign not found</p>
              <Link href={ROUTES.CAMPAIGNS}>
                <Button>Browse Campaigns</Button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const totalRaised = campaign.totalRaised ?? 0n;
  const goalAmount = campaign.goalAmount ?? 0n;
  const deadline = campaign.deadline ?? 0n;

  const progress = goalAmount > 0n
    ? Number((totalRaised * 100n) / goalAmount)
    : 0;
  const raised = formatEther(totalRaised);
  const goal = formatEther(goalAmount);
  const daysLeft = Math.max(
    0,
    Math.floor((Number(deadline) * 1000 - Date.now()) / (1000 * 60 * 60 * 24))
  );

  const isCreator = address?.toLowerCase() === campaign.creator?.toLowerCase();
  const canWithdraw = isCreator && !campaign.isActive && campaign.goalReached;
  const canRefund = !campaign.isActive && !campaign.goalReached && totalRaised > 0n;

  const hasChainContributions =
    (campaign.contributionsFromEthereum ?? 0n) > 0n ||
    (campaign.contributionsFromSolana ?? 0n) > 0n ||
    (campaign.contributionsFromPushChain ?? 0n) > 0n;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <div className="container py-6 md:py-12">
          {/* Back Button */}
          <Link href={ROUTES.CAMPAIGNS} className="inline-block mb-6">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Campaigns
            </Button>
          </Link>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="space-y-6 lg:col-span-2">
              {/* Campaign Header */}
              <div className="space-y-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                    {campaign.title}
                  </h1>
                  <div className="flex items-center gap-2">
                    <CampaignStatusBadge
                      isActive={campaign.isActive}
                      goalReached={campaign.goalReached}
                      fundsWithdrawn={campaign.fundsWithdrawn}
                      deadline={campaign.deadline}
                    />
                    <ShareButton
                      campaignAddress={campaign.campaignAddress}
                      campaignTitle={campaign.title}
                      campaignDescription={campaign.description}
                      variant="outline"
                      size="icon"
                    />
                    <ReportButton
                      campaignAddress={campaign.campaignAddress}
                      campaignTitle={campaign.title}
                      variant="outline"
                      size="icon"
                    />
                  </div>
                </div>

                {/* Creator Info */}
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Created by:</span>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {campaign.creator.slice(0, 6)}...{campaign.creator.slice(-4)}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Campaign Image */}
              {campaign.imageUrl && (
                <div className="aspect-video overflow-hidden rounded-lg border bg-muted">
                  <img
                    src={campaign.imageUrl}
                    alt={campaign.title}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://placehold.co/1200x675/EEE/31343C?font=open-sans&text=No+Image';
                    }}
                  />
                </div>
              )}

              {/* Tabs for Organization */}
              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                  <TabsTrigger value="cross-chain">Cross-Chain</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>About This Campaign</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                        {campaign.description || 'No description provided.'}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Campaign Stats */}
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Users className="h-5 w-5 text-primary" aria-hidden="true" />
                          </div>
                          <div>
                            <div className="text-2xl font-bold">{campaign.contributorCount || 0}</div>
                            <div className="text-xs text-muted-foreground">Contributors</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Clock className="h-5 w-5 text-primary" aria-hidden="true" />
                          </div>
                          <div>
                            <div className="text-2xl font-bold">{daysLeft}</div>
                            <div className="text-xs text-muted-foreground">Days Left</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Target className="h-5 w-5 text-primary" aria-hidden="true" />
                          </div>
                          <div>
                            <div className="text-2xl font-bold">{progress.toFixed(0)}%</div>
                            <div className="text-xs text-muted-foreground">Funded</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Activity Tab */}
                <TabsContent value="activity" className="space-y-4">
                  <TransactionHistory campaignAddress={campaign.campaignAddress} />
                </TabsContent>

                {/* Cross-Chain Tab */}
                <TabsContent value="cross-chain" className="space-y-4">
                  {hasChainContributions ? (
                    <Card>
                      <CardHeader>
                        <CardTitle>Contribution Breakdown by Chain</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {(campaign.contributionsFromEthereum ?? 0n) > 0n && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-primary/20 text-primary border-primary">
                                EIP-155
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                Ethereum & EVM Chains
                              </span>
                            </div>
                            <span className="font-semibold">
                              {formatEther(campaign.contributionsFromEthereum ?? 0n)} PC
                            </span>
                          </div>
                        )}

                        {(campaign.contributionsFromSolana ?? 0n) > 0n && (
                          <>
                            <Separator />
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-secondary/20 text-secondary-foreground border-secondary">
                                  Solana
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  Solana Ecosystem
                                </span>
                              </div>
                              <span className="font-semibold">
                                {formatEther(campaign.contributionsFromSolana ?? 0n)} PC
                              </span>
                            </div>
                          </>
                        )}

                        {(campaign.contributionsFromPushChain ?? 0n) > 0n && (
                          <>
                            <Separator />
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-primary/20 text-primary border-primary">
                                  Push Chain
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  Native Push Chain
                                </span>
                              </div>
                              <span className="font-semibold">
                                {formatEther(campaign.contributionsFromPushChain ?? 0n)} PC
                              </span>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">
                          No cross-chain contributions yet
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      PushFund supports contributions from Ethereum, Arbitrum, Base, and Solana.
                      All tokens are automatically bridged to Push Chain.
                    </AlertDescription>
                  </Alert>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Progress Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold">{parseFloat(raised).toFixed(4)} PC</span>
                      <span className="text-muted-foreground">of {parseFloat(goal).toFixed(2)} PC</span>
                    </div>
                    <Progress value={Math.min(progress, 100)} className="h-2" />
                    <div className="text-xs text-muted-foreground text-center">
                      {progress.toFixed(1)}% funded
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CalendarDays className="h-4 w-4" aria-hidden="true" />
                        <span>Deadline</span>
                      </div>
                      <span className="font-medium">
                        {new Date(Number(campaign.deadline) * 1000).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" aria-hidden="true" />
                        <span>Time Left</span>
                      </div>
                      <span className="font-medium">{daysLeft} days</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contribution Form */}
              {campaign.isActive && !isCreator && (
                <Card>
                  <CardHeader>
                    <CardTitle>Support This Campaign</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isConnected ? (
                      <form onSubmit={handleContribute} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="amount">Contribution Amount (PC)</Label>
                          <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="0.00"
                            value={contributionAmount}
                            onChange={(e) => setContributionAmount(e.target.value)}
                            disabled={isContributing}
                          />
                        </div>
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={isContributing || !contributionAmount}
                        >
                          {isContributing ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Contributing...
                            </>
                          ) : (
                            'Contribute Now'
                          )}
                        </Button>
                        <Alert>
                          <Info className="h-4 w-4" />
                          <AlertDescription className="text-xs">
                            Supports contributions from Ethereum, Arbitrum, Base, and Solana with automatic bridging
                          </AlertDescription>
                        </Alert>
                      </form>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">
                          Connect your wallet to contribute to this campaign
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Creator Actions */}
              {isCreator && canWithdraw && (
                <Card className="border-primary">
                  <CardHeader>
                    <CardTitle>Creator Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      onClick={handleWithdraw}
                      disabled={isWithdrawing}
                      className="w-full"
                    >
                      {isWithdrawing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Withdrawing...
                        </>
                      ) : (
                        'Withdraw Funds'
                      )}
                    </Button>
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Platform fee: 2.5% will be deducted from the total raised amount
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              )}

              {/* Refund Action */}
              {!isCreator && canRefund && (
                <Card className="border-destructive">
                  <CardHeader>
                    <CardTitle>Claim Refund</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      onClick={handleRefund}
                      disabled={isRefunding}
                      variant="destructive"
                      className="w-full"
                    >
                      {isRefunding ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Claim Refund'
                      )}
                    </Button>
                    <Alert variant="destructive">
                      <Info className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Campaign goal not reached. You can claim back your contribution.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              )}

              {/* Creator Stats */}
              <CreatorStats creatorAddress={campaign.creator} />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
