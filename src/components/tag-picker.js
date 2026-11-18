'use client';

import { useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Tags typed straight into the field: Enter or a comma adds one, Backspace on an empty box takes
 * the last back off, and existing tags are offered underneath as you type. The text box keeps the
 * focus throughout — suggestions are pressed with mousedown prevented — so adding three tags is
 * three words and three Enters, not three trips to a menu.
 */
export function TagPicker({ selected, options, onChange }) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const input = useRef(null);

  const typed = query.trim().replace(/,+$/, '');
  const lower = typed.toLowerCase();
  const has = (name) => selected.some((tag) => tag.toLowerCase() === name.toLowerCase());

  const suggestions = options
    .filter((name) => !has(name) && (lower === '' || name.toLowerCase().includes(lower)))
    .slice(0, 8);
  const exact = options.find((name) => name.toLowerCase() === lower);
  const canCreate = typed !== '' && !exact && !has(typed);

  const add = (name) => {
    const clean = name.trim();
    if (clean && !has(clean)) onChange([...selected, clean]);
    setQuery('');
    input.current?.focus();
  };

  const remove = (name) => {
    onChange(selected.filter((tag) => tag !== name));
    input.current?.focus();
  };

  const onKeyDown = (event) => {
    if ((event.key === 'Enter' || event.key === ',') && typed !== '') {
      event.preventDefault();
      add(exact ?? typed);
    } else if (event.key === 'Enter') {
      event.preventDefault();
    } else if (event.key === 'Backspace' && query === '' && selected.length > 0) {
      remove(selected[selected.length - 1]);
    }
  };

  // Keeps the caret in the box when a suggestion is pressed, which is what stops a phone keyboard
  // from closing and reopening between tags.
  const keepFocus = (event) => event.preventDefault();

  return (
    <div className="space-y-2">
      <div
        onClick={() => input.current?.focus()}
        className={cn(
          'flex min-h-11 flex-wrap items-center gap-1.5 rounded-xl border border-input bg-card px-2 py-1.5',
          focused && 'ring-2 ring-ring',
        )}
      >
        {selected.map((name) => (
          <span key={name} className="inline-flex h-8 items-center gap-1 rounded-lg bg-secondary pr-1 pl-2.5 text-sm font-medium">
            {name}
            <button
              type="button"
              aria-label={`Remove ${name}`}
              onMouseDown={keepFocus}
              onClick={() => remove(name)}
              className="grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          </span>
        ))}

        <input
          ref={input}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          enterKeyHint="done"
          autoCapitalize="off"
          autoCorrect="off"
          aria-label="Add a tag"
          placeholder={selected.length === 0 ? 'Add tags — press Enter after each' : 'Add another'}
          className="h-8 min-w-32 flex-1 bg-transparent px-1 text-base outline-none placeholder:text-muted-foreground sm:text-sm"
        />
      </div>

      {focused && (suggestions.length > 0 || canCreate) ? (
        <div className="flex flex-wrap gap-1.5" aria-label="Suggestions">
          {canCreate ? (
            <button
              type="button"
              onMouseDown={keepFocus}
              onClick={() => add(typed)}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-dashed border-input px-2.5 text-sm hover:bg-accent"
            >
              <Plus className="size-3.5" />
              Create “{typed}”
            </button>
          ) : null}
          {suggestions.map((name) => (
            <button
              key={name}
              type="button"
              onMouseDown={keepFocus}
              onClick={() => add(name)}
              className="inline-flex h-9 items-center rounded-lg border border-input px-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              {name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
