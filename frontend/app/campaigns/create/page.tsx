'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { useCampaignFactory } from '@/lib/contracts/hooks/useCampaignFactory';
import { useWallet } from '@/hooks/useWallet';
import { CAMPAIGN_LIMITS, ROUTES } from '@/config/constants';
import { toast } from 'sonner';
import { ArrowLeft, Info, Loader2, AlertCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

const createCampaignSchema = z.object({
  title: z
    .string()
    .min(CAMPAIGN_LIMITS.MIN_TITLE_LENGTH, `Title must be at least ${CAMPAIGN_LIMITS.MIN_TITLE_LENGTH} characters`)
    .max(CAMPAIGN_LIMITS.MAX_TITLE_LENGTH, `Title must not exceed ${CAMPAIGN_LIMITS.MAX_TITLE_LENGTH} characters`),
  description: z
    .string()
    .min(CAMPAIGN_LIMITS.MIN_DESCRIPTION_LENGTH, `Description must be at least ${CAMPAIGN_LIMITS.MIN_DESCRIPTION_LENGTH} characters`)
    .max(CAMPAIGN_LIMITS.MAX_DESCRIPTION_LENGTH, `Description must not exceed ${CAMPAIGN_LIMITS.MAX_DESCRIPTION_LENGTH} characters`),
  goalAmount: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, 'Goal amount must be a positive number')
    .refine(
      (val) => parseFloat(val) >= CAMPAIGN_LIMITS.MIN_GOAL_AMOUNT,
      `Goal amount must be at least ${CAMPAIGN_LIMITS.MIN_GOAL_AMOUNT} PC`
    )
    .refine(
      (val) => parseFloat(val) <= CAMPAIGN_LIMITS.MAX_GOAL_AMOUNT,
      `Goal amount must not exceed ${CAMPAIGN_LIMITS.MAX_GOAL_AMOUNT} PC`
    ),
  durationInDays: z
    .string()
    .refine((val) => !isNaN(parseInt(val)) && parseInt(val) > 0, 'Duration must be a positive integer')
    .refine(
      (val) => parseInt(val) >= CAMPAIGN_LIMITS.MIN_DURATION_DAYS,
      `Duration must be at least ${CAMPAIGN_LIMITS.MIN_DURATION_DAYS} days`
    )
    .refine(
      (val) => parseInt(val) <= CAMPAIGN_LIMITS.MAX_DURATION_DAYS,
      `Duration must not exceed ${CAMPAIGN_LIMITS.MAX_DURATION_DAYS} days`
    ),
  imageUrl: z
    .string()
    .url('Must be a valid URL')
    .min(1, 'Image URL is required')
    .refine((val) => val.startsWith('http://') || val.startsWith('https://'), 'Must be a valid HTTP(S) URL'),
});

type CreateCampaignFormData = z.infer<typeof createCampaignSchema>;

export default function CreateCampaignPage() {
  const router = useRouter();
  const { createCampaign } = useCampaignFactory();
  const { isConnected } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateCampaignFormData>({
    resolver: zodResolver(createCampaignSchema),
  });

  const onSubmit = async (data: CreateCampaignFormData) => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsSubmitting(true);
      const campaignAddress = await createCampaign({
        title: data.title,
        description: data.description,
        goalAmount: data.goalAmount,
        durationInDays: parseInt(data.durationInDays),
        imageUrl: data.imageUrl,
      });

      console.log('Campaign created with address:', campaignAddress);
      toast.success('Campaign created successfully!', {
        description: 'Share your campaign to reach more contributors!',
        duration: 5000,
      });

      // Navigate to the new campaign after a brief delay to ensure blockchain state is ready
      if (campaignAddress) {
        console.log('Preparing to redirect to:', ROUTES.CAMPAIGN_DETAIL(campaignAddress));
        // Wait 2 seconds to allow the transaction to be fully processed
        await new Promise(resolve => setTimeout(resolve, 2000));
        router.push(ROUTES.CAMPAIGN_DETAIL(campaignAddress));
      } else {
        router.push(ROUTES.CAMPAIGNS);
      }
    } catch (error) {
      console.error('Campaign creation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create campaign');
    } finally{
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <div className="container py-8 md:py-12">
          <div className="mx-auto max-w-3xl space-y-8">
            {/* Back Button */}
            <Link href={ROUTES.CAMPAIGNS} className="inline-block">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Campaigns
              </Button>
            </Link>

            {/* Page Header */}
            <div className="space-y-3">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Create a Campaign
              </h1>
              <p className="text-base text-muted-foreground sm:text-lg">
                Launch your campaign on Push Chain and accept contributions from any supported blockchain
              </p>
            </div>

            <Separator />

            {/* Form Card */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Details</CardTitle>
                <CardDescription>
                  Fill in the information below to create your crowdfunding campaign
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isConnected ? (
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Title */}
                    <div className="space-y-2">
                      <Label htmlFor="title">
                        Campaign Title <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="title"
                        placeholder="Enter a compelling title for your campaign"
                        {...register('title')}
                        disabled={isSubmitting}
                      />
                      {errors.title && (
                        <p className="flex items-center gap-1 text-sm text-destructive">
                          <AlertCircle className="h-3 w-3" />
                          {errors.title.message}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {CAMPAIGN_LIMITS.MIN_TITLE_LENGTH}-{CAMPAIGN_LIMITS.MAX_TITLE_LENGTH} characters
                      </p>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <Label htmlFor="description">
                        Description <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        id="description"
                        rows={6}
                        placeholder="Describe your campaign, its goals, and how the funds will be used"
                        {...register('description')}
                        disabled={isSubmitting}
                      />
                      {errors.description && (
                        <p className="flex items-center gap-1 text-sm text-destructive">
                          <AlertCircle className="h-3 w-3" />
                          {errors.description.message}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {CAMPAIGN_LIMITS.MIN_DESCRIPTION_LENGTH}-{CAMPAIGN_LIMITS.MAX_DESCRIPTION_LENGTH} characters
                      </p>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                      {/* Goal Amount */}
                      <div className="space-y-2">
                        <Label htmlFor="goalAmount">
                          Funding Goal (PC) <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="goalAmount"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...register('goalAmount')}
                          disabled={isSubmitting}
                        />
                        {errors.goalAmount && (
                          <p className="flex items-center gap-1 text-sm text-destructive">
                            <AlertCircle className="h-3 w-3" />
                            {errors.goalAmount.message}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {CAMPAIGN_LIMITS.MIN_GOAL_AMOUNT}-{CAMPAIGN_LIMITS.MAX_GOAL_AMOUNT} PC
                        </p>
                      </div>

                      {/* Duration */}
                      <div className="space-y-2">
                        <Label htmlFor="durationInDays">
                          Duration (days) <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="durationInDays"
                          type="number"
                          placeholder="30"
                          {...register('durationInDays')}
                          disabled={isSubmitting}
                        />
                        {errors.durationInDays && (
                          <p className="flex items-center gap-1 text-sm text-destructive">
                            <AlertCircle className="h-3 w-3" />
                            {errors.durationInDays.message}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {CAMPAIGN_LIMITS.MIN_DURATION_DAYS}-{CAMPAIGN_LIMITS.MAX_DURATION_DAYS} days
                        </p>
                      </div>
                    </div>

                    {/* Image URL */}
                    <div className="space-y-2">
                      <Label htmlFor="imageUrl">
                        Campaign Image URL <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="imageUrl"
                        type="url"
                        placeholder="https://example.com/image.jpg"
                        {...register('imageUrl')}
                        disabled={isSubmitting}
                      />
                      {errors.imageUrl && (
                        <p className="flex items-center gap-1 text-sm text-destructive">
                          <AlertCircle className="h-3 w-3" />
                          {errors.imageUrl.message}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Must be a valid HTTP(S) URL to an image (16:9 aspect ratio recommended)
                      </p>
                    </div>

                    <Separator />

                    {/* Platform Fee Notice */}
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        <span className="font-semibold">Platform Fee:</span> A 2.5% fee will be deducted when you withdraw funds after reaching your goal. Contributors receive full refunds if the goal is not reached.
                      </AlertDescription>
                    </Alert>

                    {/* Submit Button */}
                    <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating Campaign...
                        </>
                      ) : (
                        'Create Campaign'
                      )}
                    </Button>
                  </form>
                ) : (
                  <div className="py-12 text-center">
                    <Alert className="mx-auto max-w-md">
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Please connect your wallet to create a campaign
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Info Accordion */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="cross-chain">
                <AccordionTrigger>Cross-Chain Contribution Support</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Your campaign will automatically accept contributions from Ethereum, Arbitrum, Base,
                  and Solana. All tokens are automatically bridged to Push Chain using Universal Execution Accounts (UEA).
                  Contributors don&apos;t need to know about bridging - it happens seamlessly in the background.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="all-or-nothing">
                <AccordionTrigger>All-or-Nothing Funding Model</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Campaigns must reach their funding goal by the deadline to be successful. If the goal is not reached,
                  all contributors will be able to claim full refunds automatically through the smart contract.
                  This ensures creators receive adequate funding and protects contributors from partial campaigns.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="anti-fraud">
                <AccordionTrigger>Anti-Fraud Protections</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  To prevent spam and fraud, there are limits on campaign creation:
                  <ul className="mt-2 list-inside list-disc space-y-1">
                    <li>Maximum 10 campaigns per creator</li>
                    <li>24-hour cooldown between creating campaigns</li>
                    <li>Minimum campaign duration of 7 days</li>
                    <li>All campaigns are transparent and verifiable on-chain</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="smart-contracts">
                <AccordionTrigger>Smart Contract Security</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  All funds are held in audited smart contracts on Push Chain. The contracts enforce:
                  <ul className="mt-2 list-inside list-disc space-y-1">
                    <li>Automatic deadline enforcement</li>
                    <li>Goal-based fund release or refunds</li>
                    <li>Transparent transaction history</li>
                    <li>Immutable campaign parameters</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
