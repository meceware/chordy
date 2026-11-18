'use client';

import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { useMediaQuery } from '@/lib/hooks';
import { cn } from '@/lib/utils';

/**
 * A bottom drawer on phones and a centred dialog from `sm` up.
 *
 * On a phone every drawer closes the way a phone's own sheets do: slide it down, or tap outside.
 * What must not close it is work inside it, so anything you drag across on purpose — the beat
 * grid, the fret grid — carries `data-vaul-no-drag`, and a drag that starts there paints instead.
 *
 * `persistent` only matters on wider screens, where a centred dialog has no swipe: a click
 * outside it is ignored and it closes from its X.
 *
 * `actions` sits at the start of the header row, for a back button inside a multi-step panel;
 * `footer` stays pinned below the scrolling body.
 */
export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  persistent = false,
  actions = null,
  footer = null,
}) {
  const isMobile = useMediaQuery('(max-width: 639px)');

  const close = (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="-mr-2 size-11 shrink-0 rounded-xl"
      aria-label="Close"
      onClick={() => onOpenChange(false)}
    >
      <X className="size-5" />
    </Button>
  );

  const heading = (Title, Description, withClose) => (
    <div className="flex items-center gap-2">
      {actions}
      <div className="flex min-h-10 min-w-0 flex-1 flex-col justify-center">
        <Title className="truncate text-lg font-semibold">{title}</Title>
        {description ? <Description className="mt-0.5">{description}</Description> : null}
      </div>
      {withClose ? close : null}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className={cn('max-h-[88dvh] rounded-t-2xl', className)}>
          <DrawerHeader className="px-4 pt-2 pb-3 text-left group-data-[vaul-drawer-direction=bottom]/drawer-content:text-left">{heading(DrawerTitle, DrawerDescription, false)}</DrawerHeader>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">{children}</div>
          {footer ? (
            <div className="border-t border-border px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">{footer}</div>
          ) : (
            <div className="pb-[env(safe-area-inset-bottom)]" />
          )}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn('flex max-h-[min(85vh,52rem)] flex-col gap-0 rounded-xl p-0', className)}
        onInteractOutside={persistent ? (event) => event.preventDefault() : undefined}
      >
        <DialogHeader className="px-6 pt-5 pb-3 text-left">{heading(DialogTitle, DialogDescription, true)}</DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">{children}</div>
        {footer ? <div className="border-t border-border px-6 py-3">{footer}</div> : null}
      </DialogContent>
    </Dialog>
  );
}
