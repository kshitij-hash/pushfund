'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { APP_CONFIG, ROUTES } from '@/config/constants';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { MobileNav } from '@/components/layout/MobileNav';

// Dynamically import the PushUniversalAccountButton with no SSR
const PushUniversalAccountButton = dynamic(
  () => import('@pushchain/ui-kit').then((mod) => mod.PushUniversalAccountButton),
  { ssr: false }
);

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 slide-up">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4 md:gap-8">
          {/* Mobile Navigation */}
          <MobileNav />

          {/* Logo */}
          <Link href={ROUTES.HOME} className="flex items-center space-x-2 group">
            <span className="text-xl md:text-2xl font-bold text-primary transition-transform group-hover:scale-105">
              {APP_CONFIG.name}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link
              href={ROUTES.CAMPAIGNS}
              className="transition-all duration-200 hover:text-primary hover:translate-y-[-2px]"
            >
              Browse Campaigns
            </Link>
            <Link
              href={ROUTES.CREATE_CAMPAIGN}
              className="transition-all duration-200 hover:text-primary hover:translate-y-[-2px]"
            >
              Create Campaign
            </Link>
            <Link
              href={ROUTES.DASHBOARD}
              className="transition-all duration-200 hover:text-primary hover:translate-y-[-2px]"
            >
              Dashboard
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* Desktop Theme Toggle */}
          <div className="hidden md:block">
            <ThemeToggle />
          </div>

          {/* Wallet Button */}
          <PushUniversalAccountButton
            connectButtonText="Connect Wallet"
            uid="pushfund"
          />
        </div>
      </div>
    </header>
  );
}
