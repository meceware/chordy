'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, MoveLeft } from 'lucide-react';
import { Pick } from '@/components/pick';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { siteConfig } from '@/components/config';
import { sendSignInEmail, verifySignInCode } from './action';

const RESEND_AFTER = 90;

function Resend({ email, onSent }) {
  const [remaining, setRemaining] = useState(RESEND_AFTER);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (remaining <= 0) return undefined;
    const timer = setInterval(() => setRemaining((current) => current - 1), 1000);
    return () => clearInterval(timer);
  }, [remaining]);

  if (remaining > 0) {
    return <p className="text-center text-xs text-muted-foreground">You can send another in {remaining}s.</p>;
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="w-full"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          // Re-triggers the magic link, never the code endpoint on its own — that one is
          // deliberately silent, so asking it directly would send nothing.
          await sendSignInEmail(email);
          setRemaining(RESEND_AFTER);
          onSent();
        })
      }
    >
      Send another email
    </Button>
  );
}

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState(null);
  const [code, setCode] = useState('');
  const [problem, setProblem] = useState(null);
  const [pending, startTransition] = useTransition();

  const submitEmail = (event) => {
    event.preventDefault();
    setProblem(null);

    startTransition(async () => {
      const result = await sendSignInEmail(email);
      if (result?.error) setProblem(result.error);
      else setSentTo(result.email);
    });
  };

  const submitCode = (value) => {
    setProblem(null);

    startTransition(async () => {
      const result = await verifySignInCode(sentTo, value);
      if (result?.error) {
        setProblem(result.error);
        setCode('');
        return;
      }
      router.push('/');
      router.refresh();
    });
  };

  return (
    <div className="mx-auto w-full max-w-sm space-y-6 py-10">
      <div className="space-y-1 text-center">
        <Pick className="mx-auto size-8 text-primary" />
        <h1 className="text-2xl font-semibold tracking-tight">{siteConfig.name}</h1>
        <p className="text-sm text-muted-foreground">
          {sentTo ? `We sent a link and a code to ${sentTo}.` : 'Sign in to access your chords.'}
        </p>
      </div>

      {problem ? (
        <p role="alert" className="rounded-md bg-destructive/10 p-3 text-center text-sm text-destructive">
          {problem}
        </p>
      ) : null}

      {sentTo ? (
        <div className="space-y-4">
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={code}
              onChange={setCode}
              onComplete={submitCode}
              disabled={pending}
              autoFocus
            >
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <InputOTPSlot key={index} index={index} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Enter the code, or just click the link in the email.
          </p>

          <Resend email={sentTo} onSent={() => setProblem(null)} />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => {
              setSentTo(null);
              setCode('');
              setProblem(null);
            }}
          >
            <MoveLeft className="size-4" />
            Use a different email
          </Button>
        </div>
      ) : (
        <form onSubmit={submitEmail} className="space-y-3">
          <Input
            type="email"
            name="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            aria-label="Email address"
            autoComplete="email"
            autoFocus
            required
          />

          <Button type="submit" className="w-full" disabled={pending}>
            <Mail className="size-4" />
            {pending ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      )}
    </div>
  );
}
