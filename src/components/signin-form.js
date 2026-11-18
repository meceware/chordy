'use client';

import { useEffect, useId, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { ArrowRight, CircleCheck, Loader2, MoveLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { sendSignInEmail, verifySignInCode } from '@/app/auth-actions';
import { resendWaitFor, usePendingSignIn } from '@/lib/pending-sign-in';
import { cn } from '@/lib/utils';

// Counts down from when the email actually went out, so reopening the form a minute later shows
// the time that is really left. Keyed on `sentAt` by its caller, so a new email restarts it.
function Resend({ email, sentAt, onSent }) {
  const [remaining, setRemaining] = useState(() => resendWaitFor(sentAt));
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (remaining <= 0) return undefined;
    const timer = setInterval(() => setRemaining(resendWaitFor(sentAt)), 1000);
    return () => clearInterval(timer);
  }, [remaining, sentAt]);

  if (remaining > 0) {
    return (
      <p className="flex h-11 items-center justify-center text-sm text-muted-foreground">
        You can send another in {remaining}s.
      </p>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      className="h-11 w-full rounded-xl"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          // Re-triggers the magic link, never the code endpoint on its own — that one is
          // deliberately silent, so asking it directly would send nothing.
          const result = await sendSignInEmail(email);
          if (!result?.error) onSent(Date.now());
        })
      }
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : null}
      Send another email
    </Button>
  );
}

/**
 * The way in, inside the home page's sign-in dialog: an email box, then the six-digit code in the
 * same spot once the email is on its way. The code step outlives the form (see
 * `usePendingSignIn`), so closing the dialog and opening it again comes back to it.
 *
 * `notice` is a problem to show before anything is typed, such as a sign-in link that had already
 * expired.
 */
export function SignInForm({ notice = null, autoFocus = false, className }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [pendingSignIn, setPendingSignIn] = usePendingSignIn();
  const sentTo = pendingSignIn?.email ?? null;
  const [code, setCode] = useState('');
  const [banner, setBanner] = useState(notice);
  const [problem, setProblem] = useState(null);
  const [signedIn, setSignedIn] = useState(false);
  const [pending, startTransition] = useTransition();
  const codeInput = useRef(null);
  // Whether this form has sent or checked anything yet. A code step restored on opening only
  // takes focus where `autoFocus` allows it; one the user just asked for always does.
  const acted = useRef(false);
  const id = useId();

  // autoFocus alone misses: the code field mounts while the send is still pending, so it
  // is disabled at that moment. Focus once it's enabled — also after a rejected code.
  useEffect(() => {
    if (!sentTo || pending || signedIn) return;
    if (acted.current || autoFocus) codeInput.current?.focus();
  }, [sentTo, pending, signedIn, autoFocus]);

  const submitEmail = (event) => {
    event.preventDefault();
    acted.current = true;
    setBanner(null);
    setProblem(null);

    startTransition(async () => {
      const result = await sendSignInEmail(email);
      if (result?.error) {
        setProblem(result.error);
        return;
      }
      setCode('');
      setPendingSignIn({ email: result.email, sentAt: Date.now() });
    });
  };

  const submitCode = (value) => {
    acted.current = true;
    setBanner(null);
    setProblem(null);

    startTransition(async () => {
      const result = await verifySignInCode(sentTo, value);
      if (result?.error) {
        setProblem(result.error);
        setCode('');
        return;
      }
      setSignedIn(true);
      setPendingSignIn(null);
      router.push('/');
      router.refresh();
    });
  };

  // Back to the email box with the address still in it, so a typo is one edit away.
  const changeEmail = () => {
    setEmail(sentTo);
    setCode('');
    setProblem(null);
    setPendingSignIn(null);
  };

  if (signedIn) {
    return (
      <p role="status" className={cn('flex items-center gap-2 py-4 text-[15px]', className)}>
        <CircleCheck className="size-5 shrink-0 text-brand" />
        Signed in. Opening your songs…
      </p>
    );
  }

  return (
    <div id="sign-in" className={cn('w-full space-y-5', className)}>
      {banner ? (
        <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2.5 text-sm text-pretty text-destructive">
          {banner}
        </p>
      ) : null}

      {sentTo ? (
        <div className="space-y-4">
          <p className="text-[15px] text-pretty">
            We sent a link and a code to <b className="font-semibold">{sentTo}</b>. Enter the code, or open the link.
          </p>

          <div className="space-y-2">
            <label id={`${id}-code`} className="block text-sm font-medium">
              Six-digit code
            </label>
            <InputOTP
              ref={codeInput}
              maxLength={6}
              pattern={REGEXP_ONLY_DIGITS}
              value={code}
              onChange={(value) => {
                setCode(value);
                if (problem) setProblem(null);
              }}
              onComplete={submitCode}
              disabled={pending}
              aria-labelledby={`${id}-code`}
              aria-describedby={problem ? `${id}-code-problem` : undefined}
              aria-invalid={problem ? true : undefined}
              containerClassName="w-full"
            >
              {/* Six separate boxes sharing the column's width, the same width as the email box. */}
              <InputOTPGroup className="w-full gap-2">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <InputOTPSlot
                    key={index}
                    index={index}
                    aria-invalid={problem ? true : undefined}
                    className="h-12 w-auto flex-1 rounded-xl border bg-card font-mono text-xl shadow-none first:rounded-xl last:rounded-xl"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>

            {pending ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
                <Loader2 className="size-4 animate-spin" />
                Checking the code…
              </p>
            ) : problem ? (
              <p id={`${id}-code-problem`} role="alert" className="text-sm text-destructive">
                {problem}
              </p>
            ) : null}

            <Resend
              key={pendingSignIn.sentAt}
              email={sentTo}
              sentAt={pendingSignIn.sentAt}
              onSent={(sentAt) => {
                setProblem(null);
                setPendingSignIn({ email: sentTo, sentAt });
              }}
            />
          </div>

          <Button type="button" variant="outline" className="h-12 w-full rounded-xl text-base" onClick={changeEmail}>
            <MoveLeft className="size-4" />
            Use a different email
          </Button>
        </div>
      ) : (
        <>
          {/* noValidate: the server's messages show inline under the field, not as browser bubbles. */}
          <form onSubmit={submitEmail} noValidate className="space-y-4">
            <div className="space-y-2">
              <label htmlFor={`${id}-email`} className="block text-sm font-medium">
                Email
              </label>
              <input
                id={`${id}-email`}
                type="email"
                name="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (problem) setProblem(null);
                }}
                placeholder="you@example.com"
                autoComplete="email"
                autoFocus={autoFocus}
                aria-invalid={problem ? true : undefined}
                aria-describedby={problem ? `${id}-email-problem` : undefined}
                className="h-12 w-full rounded-xl border border-input bg-card px-4 text-base outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/40"
              />
              {problem ? (
                <p id={`${id}-email-problem`} role="alert" className="text-sm text-destructive">
                  {problem}
                </p>
              ) : null}
            </div>

            <Button type="submit" className="h-12 w-full rounded-xl px-5 text-base" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  Email me a sign-in link
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
