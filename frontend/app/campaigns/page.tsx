'use client';

import { useEffect, useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CampaignGrid } from '@/components/campaigns/CampaignGrid';
import { SearchBar } from '@/components/campaigns/SearchBar';
import { SortDropdown, SortOption } from '@/components/campaigns/SortDropdown';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { useCampaignFactory } from '@/lib/contracts/hooks/useCampaignFactory';
import { Campaign } from '@/lib/types';
import { Separator } from '@/components/ui/separator';

type FilterType = 'all' | 'active' | 'successful' | 'ended';

export const dynamic = 'force-dynamic';

export default function CampaignsPage() {
  const { getAllCampaigns, getActiveCampaigns } = useCampaignFactory();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  useEffect(() => {
    const fetchCampaigns = async () => {
      setIsLoading(true);
      const data = filter === 'active'
        ? await getActiveCampaigns()
        : await getAllCampaigns();
      setCampaigns(data);
      setIsLoading(false);
    };

    fetchCampaigns();
  }, [getAllCampaigns, getActiveCampaigns, filter]);

  // Filter, search, and sort campaigns
  const filteredAndSortedCampaigns = useMemo(() => {
    let result = [...campaigns];

    // Apply status filter
    if (filter === 'successful') {
      result = result.filter((c) => c.goalReached && !c.isActive);
    } else if (filter === 'ended') {
      result = result.filter((c) => !c.isActive && !c.goalReached);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(query) ||
          c.description?.toLowerCase().includes(query) ||
          c.creator.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return Number(b.deadline) - Number(a.deadline);
        case 'oldest':
          return Number(a.deadline) - Number(b.deadline);
        case 'most-funded':
          return Number(b.totalRaised) - Number(a.totalRaised);
        case 'least-funded':
          return Number(a.totalRaised) - Number(b.totalRaised);
        case 'ending-soon':
          return Number(a.deadline) - Number(b.deadline);
        case 'most-contributors':
          return (b.contributorCount || 0) - (a.contributorCount || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [campaigns, filter, searchQuery, sortBy]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <div className="container py-8 md:py-12">
          <div className="space-y-8">
            {/* Page Header */}
            <div className="space-y-3">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Browse Campaigns
              </h1>
              <p className="text-base text-muted-foreground sm:text-lg">
                Discover and support campaigns from creators around the world
              </p>
            </div>

            <Separator />

            {/* Search and Sort */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search campaigns..."
                className="w-full sm:max-w-md"
              />
              <SortDropdown value={sortBy} onChange={setSortBy} />
            </div>

            {/* Tabs for Filters */}
            <Tabs
              value={filter}
              onValueChange={(value) => setFilter(value as FilterType)}
              className="space-y-6"
            >
              <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
                <TabsTrigger value="all">
                  All
                </TabsTrigger>
                <TabsTrigger value="active">
                  Active
                </TabsTrigger>
                <TabsTrigger value="successful">
                  Successful
                </TabsTrigger>
                <TabsTrigger value="ended">
                  Ended
                </TabsTrigger>
              </TabsList>

              {/* Campaign Count */}
              {!isLoading && (
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">{filteredAndSortedCampaigns.length}</span>{' '}
                  campaign{filteredAndSortedCampaigns.length !== 1 ? 's' : ''}
                  {searchQuery && (
                    <>
                      {' '}matching <span className="font-medium">&quot;{searchQuery}&quot;</span>
                    </>
                  )}
                </div>
              )}

              {/* Tab Content - All share the same grid */}
              <TabsContent value={filter} className="mt-6">
                {isLoading ? (
                  <SkeletonLoader variant="campaign-grid" count={6} />
                ) : (
                  <CampaignGrid
                    campaigns={filteredAndSortedCampaigns}
                    emptyMessage={
                      searchQuery
                        ? `No campaigns found matching "${searchQuery}". Try adjusting your search.`
                        : filter === 'active'
                        ? 'No active campaigns at the moment. Be the first to create one!'
                        : filter === 'successful'
                        ? 'No successful campaigns yet.'
                        : filter === 'ended'
                        ? 'No ended campaigns yet.'
                        : 'No campaigns found. Be the first to create one!'
                    }
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
