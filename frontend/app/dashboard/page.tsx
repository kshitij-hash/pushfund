'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CampaignGrid } from '@/components/campaigns/CampaignGrid';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { useCampaignFactory } from '@/lib/contracts/hooks/useCampaignFactory';
import { useWallet } from '@/hooks/useWallet';
import { Campaign } from '@/lib/types';
import { ROUTES } from '@/config/constants';
import { formatEther } from 'viem';
import {
  TrendingUp,
  Target,
  CheckCircle2,
  Coins,
  Plus,
  Info,
  Rocket,
  Shield,
  Zap
} from 'lucide-react';

// Disable static optimization for this page
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const { getCampaignsByCreator } = useCampaignFactory();
  const { isConnected, address } = useWallet();

  const [createdCampaigns, setCreatedCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserCampaigns = async () => {
      if (!isConnected || !address) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const campaigns = await getCampaignsByCreator(address);
        setCreatedCampaigns(campaigns);
      } catch (error) {
        console.error('Error fetching user campaigns:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserCampaigns();
  }, [isConnected, address, getCampaignsByCreator]);

  // Calculate stats
  const totalRaised = createdCampaigns.reduce(
    (sum, campaign) => sum + campaign.totalRaised,
    0n
  );
  const activeCampaigns = createdCampaigns.filter((c) => c.isActive);
  const successfulCampaigns = createdCampaigns.filter((c) => c.goalReached);
  const successRate = createdCampaigns.length > 0
    ? Math.round((successfulCampaigns.length / createdCampaigns.length) * 100)
    : 0;

  if (!isConnected) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <div className="container py-12">
            <div className="mx-auto max-w-md space-y-6 text-center py-12">
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Please connect your wallet to view your dashboard
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <div className="container py-8 md:py-12">
          <div className="space-y-8">
            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Dashboard
                </h1>
                <p className="text-base text-muted-foreground sm:text-lg">
                  Manage your campaigns and track your impact
                </p>
              </div>
              <Link href={ROUTES.CREATE_CAMPAIGN}>
                <Button size="lg">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Campaign
                </Button>
              </Link>
            </div>

            <Separator />

            {/* Stats Cards */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Campaigns
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{createdCampaigns.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    All-time campaigns created
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Now
                  </CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activeCampaigns.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Currently accepting contributions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Successful
                  </CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{successfulCampaigns.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {successRate}% success rate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Raised
                  </CardTitle>
                  <Coins className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {parseFloat(formatEther(totalRaised)).toFixed(2)} PC
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Across all campaigns
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* User Address */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Wallet Address</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between gap-4">
                  <Badge variant="secondary" className="font-mono text-sm py-2 px-4">
                    {address}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Campaigns Tabs */}
            <Tabs defaultValue="all" className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <TabsList>
                  <TabsTrigger value="all">
                    All ({createdCampaigns.length})
                  </TabsTrigger>
                  <TabsTrigger value="active">
                    Active ({activeCampaigns.length})
                  </TabsTrigger>
                  <TabsTrigger value="ended">
                    Ended ({createdCampaigns.length - activeCampaigns.length})
                  </TabsTrigger>
                </TabsList>

                {createdCampaigns.length > 0 && (
                  <Link href={ROUTES.CAMPAIGNS}>
                    <Button variant="outline" size="sm">
                      Browse All Campaigns
                    </Button>
                  </Link>
                )}
              </div>

              <TabsContent value="all" className="space-y-4">
                {isLoading ? (
                  <SkeletonLoader variant="campaign-grid" count={3} />
                ) : (
                  <CampaignGrid
                    campaigns={createdCampaigns}
                    emptyMessage="You haven't created any campaigns yet."
                  />
                )}
              </TabsContent>

              <TabsContent value="active" className="space-y-4">
                <CampaignGrid
                  campaigns={activeCampaigns}
                  emptyMessage="No active campaigns. Create a new campaign to get started!"
                />
              </TabsContent>

              <TabsContent value="ended" className="space-y-4">
                <CampaignGrid
                  campaigns={createdCampaigns.filter((c) => !c.isActive)}
                  emptyMessage="No ended campaigns yet."
                />
              </TabsContent>
            </Tabs>

            {/* Getting Started Guide */}
            {createdCampaigns.length === 0 && !isLoading && (
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Rocket className="h-5 w-5" aria-hidden="true" />
                    Getting Started with PushFund
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-3">
                    <div className="space-y-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Plus className="h-5 w-5 text-primary" aria-hidden="true" />
                      </div>
                      <h3 className="font-semibold">1. Create Your Campaign</h3>
                      <p className="text-sm text-muted-foreground">
                        Set your funding goal, campaign duration, and tell your story.
                        Launch in minutes on Push Chain.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Zap className="h-5 w-5 text-primary" aria-hidden="true" />
                      </div>
                      <h3 className="font-semibold">2. Accept Cross-Chain Contributions</h3>
                      <p className="text-sm text-muted-foreground">
                        Contributors fund from Ethereum, Arbitrum, Base, or Solana.
                        Automatic bridging to Push Chain.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Shield className="h-5 w-5 text-primary" aria-hidden="true" />
                      </div>
                      <h3 className="font-semibold">3. Reach Your Goal</h3>
                      <p className="text-sm text-muted-foreground">
                        When your goal is met, withdraw funds minus a 2.5% platform fee.
                        If not, contributors get full refunds.
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <span className="font-semibold">All-or-Nothing Model:</span> Campaigns must
                      reach their funding goal or all contributions are refunded. This protects both
                      creators and contributors.
                    </AlertDescription>
                  </Alert>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link href={ROUTES.CREATE_CAMPAIGN} className="flex-1">
                      <Button size="lg" className="w-full">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Your First Campaign
                      </Button>
                    </Link>
                    <Link href={ROUTES.CAMPAIGNS} className="flex-1">
                      <Button size="lg" variant="outline" className="w-full">
                        Browse Example Campaigns
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
