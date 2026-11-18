import { tagColor } from '@/lib/tag-color';
import { cn } from '@/lib/utils';

export function TagPill({ name, className }) {
  return (
    <span
      className={cn(
        'inline-flex h-5 shrink-0 items-center rounded-full px-2 text-[11px] leading-none font-medium ring-1 ring-inset',
        tagColor(name),
        className,
      )}
    >
      {name}
    </span>
  );
}

export function TagPills({ tags, className }) {
  if (!tags?.length) return null;

  return (
    <span className={cn('flex flex-wrap gap-1.5', className)}>
      {tags.map((name) => (
        <TagPill key={name} name={name} />
      ))}
    </span>
  );
}
