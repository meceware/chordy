'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { signOutEverywhere } from '@/app/login/action';

function Avatar({ email, className }) {
  return (
    <span
      aria-hidden
      className={`grid place-items-center rounded-full bg-primary font-semibold text-primary-foreground ${className}`}
    >
      {email.trim().charAt(0).toUpperCase()}
    </span>
  );
}

export function AccountMenu({ email }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (!email) return null;

  const [name, domain] = email.split('@');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Account: ${email}`}>
          <Avatar email={email} className="size-7 text-xs" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar email={email} className="size-9 shrink-0 text-sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="truncate text-xs text-muted-foreground">@{domain}</p>
          </div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          disabled={pending}
          onSelect={() =>
            startTransition(async () => {
              await signOutEverywhere();
              router.push('/login');
              router.refresh();
            })
          }
        >
          <LogOut className="size-4" />
          {pending ? 'Signing out…' : 'Sign out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
