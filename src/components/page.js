import { cn } from '@/lib/utils';

/** The content column every page sits in: one width, one gutter, everywhere. */
export function Page({ className, children }) {
  return <div className={cn('mx-auto w-full max-w-3xl px-4 pt-5 pb-10', className)}>{children}</div>;
}
