'use server';

import { headers } from 'next/headers';
import { getAuth } from '@/lib/auth';
import { emailSchema, codeSchema } from './schema';

export async function sendSignInEmail(rawEmail) {
  const parsed = emailSchema.safeParse({ email: rawEmail });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    // Sending the link also mints the code that travels in the same email, so this is the
    // only entry point; requesting a code directly would send nothing.
    await getAuth().api.signInMagicLink({
      body: { email: parsed.data.email, callbackURL: '/' },
      headers: await headers(),
    });
    return { sent: true, email: parsed.data.email };
  } catch {
    return { error: 'The email could not be sent. Try again in a moment.' };
  }
}

export async function verifySignInCode(email, rawCode) {
  const parsedEmail = emailSchema.safeParse({ email });
  const parsedCode = codeSchema.safeParse({ code: rawCode });
  if (!parsedEmail.success || !parsedCode.success) return { error: 'Check the code and try again.' };

  try {
    await getAuth().api.signInEmailOTP({
      body: { email: parsedEmail.data.email, otp: parsedCode.data.code },
      headers: await headers(),
    });
    return { ok: true };
  } catch {
    return { error: 'That code did not work. It may have expired.' };
  }
}

export async function signOutEverywhere() {
  try {
    await getAuth().api.signOut({ headers: await headers() });
  } catch {
    // Already signed out.
  }
}
