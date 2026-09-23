import { redirect } from 'next/navigation';
import { currentUserId } from '@/lib/session';
import { SignInForm } from './signin-form';

export const metadata = { title: 'Sign in' };

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  if (await currentUserId()) redirect('/');

  return <SignInForm />;
}
