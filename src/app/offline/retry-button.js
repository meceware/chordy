'use client';

import { RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function RetryButton() {
  return (
    <Button variant="outline" onClick={() => location.reload()}>
      <RotateCw className="size-4" />
      Try again
    </Button>
  );
}
