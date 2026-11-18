import { WifiOff } from 'lucide-react';
import { RetryButton } from './retry-button';
import { Page } from '@/components/page';

export const metadata = { title: 'Offline' };

export default function OfflinePage() {
  return (
    <Page className="mx-auto max-w-sm space-y-4 py-16 text-center">
      <WifiOff className="mx-auto size-8 text-muted-foreground" />
      <h1 className="text-2xl font-semibold tracking-tight">You are offline</h1>
      <p className="text-sm text-muted-foreground">
        Your chord sheets live on the server, so Chordy needs a connection to open them. Everything you saved is
        still there.
      </p>
      <RetryButton />
    </Page>
  );
}
