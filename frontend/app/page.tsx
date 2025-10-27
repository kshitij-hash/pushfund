'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CampaignGrid } from '@/components/campaigns/CampaignGrid';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { useCampaignFactory } from '@/lib/contracts/hooks/useCampaignFactory';
import { Campaign } from '@/lib/types';
import { APP_CONFIG, ROUTES } from '@/config/constants';
import { Network, Zap, Shield, ArrowRight } from 'lucide-react';

export default function Home() {
  const { getActiveCampaigns, getAllCampaigns } = useCampaignFactory();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCampaigns = async () => {
      setIsLoading(true);
      const [activeData, allData] = await Promise.all([
        getActiveCampaigns(),
        getAllCampaigns()
      ]);
      setCampaigns(activeData.slice(0, 6)); // Show only first 6
      setStats({ total: allData.length, active: activeData.length });
      setIsLoading(false);
    };

    fetchCampaigns();
  }, [getActiveCampaigns, getAllCampaigns]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="border-b bg-background py-16 md:py-24">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center space-y-8">
              <div className="space-y-4 slide-up">
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                  {APP_CONFIG.title.split(' - ')[0]}
                </h1>
                <p className="text-lg text-muted-foreground sm:text-xl md:text-2xl">
                  {APP_CONFIG.description}
                </p>
              </div>

              <p className="text-base text-muted-foreground md:text-lg max-w-2xl mx-auto slide-up stagger-1">
                Campaign creators launch on Push Chain. Contributors fund from Ethereum, Arbitrum, Base, or Solana with automatic token bridging.
              </p>

              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center pt-4 slide-up stagger-2">
                <Link href={ROUTES.CAMPAIGNS} className="sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto group">
                    Browse Campaigns
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link href={ROUTES.CREATE_CAMPAIGN} className="sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Create Campaign
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="flex justify-center gap-8 pt-8 slide-up stagger-3">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{stats.total}</div>
                  <div className="text-sm text-muted-foreground">Total Campaigns</div>
                </div>
                <Separator orientation="vertical" className="h-12" />
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{stats.active}</div>
                  <div className="text-sm text-muted-foreground">Active Now</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-24 bg-muted/50">
          <div className="container">
            <div className="text-center mb-12 slide-up">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                Why PushFund?
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Built on Push Chain for true cross-chain crowdfunding
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <Card className="border-2 slide-up stagger-1">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-transform hover:scale-110 duration-300">
                    <Network className="h-6 w-6 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-semibold">Cross-Chain Support</h3>
                  <p className="text-muted-foreground">
                    Accept funding from any blockchain. Contributors use Ethereum, Arbitrum, Base, or Solana seamlessly.
                  </p>
                </CardContent>
              </Card>

              {/* Feature 2 */}
              <Card className="border-2 slide-up stagger-2">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-transform hover:scale-110 duration-300">
                    <Zap className="h-6 w-6 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-semibold">All-or-Nothing Funding</h3>
                  <p className="text-muted-foreground">
                    Campaigns must reach their goal or contributors get automatic refunds. Fair and transparent for everyone.
                  </p>
                </CardContent>
              </Card>

              {/* Feature 3 */}
              <Card className="border-2 slide-up stagger-3">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-transform hover:scale-110 duration-300">
                    <Shield className="h-6 w-6 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-semibold">On-Chain Transparency</h3>
                  <p className="text-muted-foreground">
                    Every contribution tracked on-chain. Smart contract escrow ensures funds released only when goals are met.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Active Campaigns Section */}
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Active Campaigns</h2>
                <p className="text-muted-foreground mt-1">
                  Discover projects seeking funding
                </p>
              </div>
              <Link href={ROUTES.CAMPAIGNS}>
                <Button variant="outline">
                  View All Campaigns
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {isLoading ? (
              <SkeletonLoader variant="campaign-grid" count={6} />
            ) : (
              <CampaignGrid
                campaigns={campaigns}
                emptyMessage="No active campaigns yet. Be the first to create one!"
              />
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
