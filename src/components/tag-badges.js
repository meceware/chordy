import { Badge } from '@/components/ui/badge';
import { tagColor } from '@/lib/tag-color';
import { cn } from '@/lib/utils';

export function TagBadges({ tags, className }) {
  if (tags.length === 0) return null;

  return (
    <span className={cn('flex flex-wrap gap-1', className)}>
      {tags.map((name) => (
        <Badge key={name} className={cn('border-transparent', tagColor(name))}>
          {name}
        </Badge>
      ))}
    </span>
  );
}
