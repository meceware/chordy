'use client';

import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { SignInForm } from '@/components/signin-form';
import { siteConfig } from '@/components/config';
import { useMediaQuery } from '@/lib/hooks';
import { usePendingSignIn } from '@/lib/pending-sign-in';
import { cn } from '@/lib/utils';

/**
 * The way in: a button on the home page that opens the sign-in form over it, a dialog on a wide
 * screen and a drawer on a phone.
 *
 * Closing it loses nothing: a sign-in waiting for its code is kept in memory while the page is
 * open, so the button says so and reopening goes straight back to the code.
 *
 * `linkFailed` comes from a sign-in link that no longer works: the dialog opens by itself to say so.
 */
const LINK_PROBLEM = 'That sign-in link did not work. It may have expired or already been used, so send yourself a new one.';

export function SignInDialog({ linkFailed = false, className }) {
  const [open, setOpen] = useState(linkFailed);
  // Said once: closing the dialog dismisses it, and the address bar loses the `?error=` so a
  // reload does not bring it back.
  const [notice, setNotice] = useState(linkFailed ? LINK_PROBLEM : null);
  useEffect(() => {
    if (linkFailed) window.history.replaceState(null, '', window.location.pathname);
  }, [linkFailed]);
  const [pendingSignIn] = usePendingSignIn();
  // Straight into the email box on a wide screen. On a phone the keyboard would rise while the
  // drawer is still sliding up, so there it waits for a tap.
  const wide = useMediaQuery('(min-width: 640px)');

  return (
    <>
      <Button type="button" className={cn('h-12 rounded-xl px-6 text-base', className)} onClick={() => setOpen(true)}>
        {pendingSignIn ? 'Enter your sign-in code' : 'Sign in'}
        <ArrowRight className="size-4" />
      </Button>

      <ResponsiveDialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setNotice(null);
        }}
        title={`Sign in to ${siteConfig.name}`}
        description="We'll email you a link and a six-digit code. There is no password to remember."
        className="sm:max-w-md"
      >
        <SignInForm notice={notice} autoFocus={wide} className="pt-2" />
      </ResponsiveDialog>
    </>
  );
}
