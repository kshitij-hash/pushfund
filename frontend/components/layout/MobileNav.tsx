'use client';

import Link from 'next/link';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';

const navigationLinks = [
  { href: '/', label: 'Home' },
  { href: '/campaigns', label: 'Browse Campaigns' },
  { href: '/campaigns/create', label: 'Create Campaign' },
  { href: '/dashboard', label: 'Dashboard' },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="text-left">Navigation</SheetTitle>
          <SheetDescription className="text-left">
            Explore PushFund campaigns and manage your account
          </SheetDescription>
        </SheetHeader>

        <nav className="mt-6 flex flex-col space-y-2">
          {navigationLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-4 py-3 text-base font-medium hover:bg-accent transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Separator className="my-6" />

        <div className="flex items-center justify-between px-4">
          <span className="text-sm font-medium">Theme</span>
          <ThemeToggle />
        </div>
      </SheetContent>
    </Sheet>
  );
}
