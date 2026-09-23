'use client';

import { useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { tagColor } from '@/lib/tag-color';
import { cn } from '@/lib/utils';

export function TagPicker({ selected, options, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const toggle = (name) => {
    onChange(selected.includes(name) ? selected.filter((tag) => tag !== name) : [...selected, name]);
  };

  const typed = query.trim();
  const canCreate = typed !== '' && !options.some((name) => name.toLowerCase() === typed.toLowerCase());

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {selected.map((name) => (
        <Badge key={name} className={cn('gap-1 border-transparent', tagColor(name))}>
          {name}
          <button type="button" aria-label={`Remove ${name}`} onClick={() => toggle(name)}>
            <X className="size-3" />
          </button>
        </Badge>
      ))}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="h-7">
            <Plus className="size-3.5" />
            Tag
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-56 p-0" align="start">
          <Command>
            <CommandInput placeholder="Find or create…" value={query} onValueChange={setQuery} />
            <CommandList>
              <CommandEmpty>No matching tag.</CommandEmpty>

              <CommandGroup>
                {options.map((name) => (
                  <CommandItem key={name} value={name} onSelect={() => toggle(name)}>
                    <Check className={cn('size-4', selected.includes(name) ? 'opacity-100' : 'opacity-0')} />
                    {name}
                  </CommandItem>
                ))}

                {canCreate ? (
                  <CommandItem
                    value={`create-${typed}`}
                    onSelect={() => {
                      toggle(typed);
                      setQuery('');
                    }}
                  >
                    <Plus className="size-4" />
                    Create “{typed}”
                  </CommandItem>
                ) : null}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
