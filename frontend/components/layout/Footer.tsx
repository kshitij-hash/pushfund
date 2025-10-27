'use client';

import Link from 'next/link';
import { APP_CONFIG } from '@/config/constants';
import { Separator } from '@/components/ui/separator';
import { Github, ExternalLink } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t bg-background">
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand Section */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-primary">{APP_CONFIG.name}</h3>
            <p className="text-sm text-muted-foreground">
              Universal crowdfunding powered by Push Chain. Fund from any blockchain.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Platform</h4>
            <nav className="flex flex-col space-y-2 text-sm">
              <Link
                href="/campaigns"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Browse Campaigns
              </Link>
              <Link
                href="/campaigns/create"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Create Campaign
              </Link>
              <Link
                href="/dashboard"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Dashboard
              </Link>
            </nav>
          </div>

          {/* Resources */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Resources</h4>
            <nav className="flex flex-col space-y-2 text-sm">
              <a
                href="https://pushchain.github.io/push-chain-website/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
              >
                Push Chain Docs
                <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href="https://donut.push.network"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
              >
                Block Explorer
                <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href="https://faucet.push.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
              >
                Testnet Faucet
                <ExternalLink className="h-3 w-3" />
              </a>
            </nav>
          </div>

          {/* Community */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Community</h4>
            <nav className="flex flex-col space-y-2 text-sm">
              <a
                href="https://github.com/pushchain"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
              >
                <Github className="h-4 w-4" />
                GitHub
              </a>
            </nav>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Bottom Section */}
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-xs text-muted-foreground text-center md:text-left">
            © {currentYear} {APP_CONFIG.name}. Built on Push Chain Testnet.
          </p>
          <p className="text-xs text-muted-foreground text-center md:text-right">
            Disclaimer: This is a testnet application. Use at your own risk.
          </p>
        </div>
      </div>
    </footer>
  );
}
