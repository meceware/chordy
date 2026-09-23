import { PICK_PATH } from '@/lib/pick-path';

// viewBox is cropped to the glyph so a `size-*` class fills like a lucide icon rather than
// leaving the icon's tile padding around it.
export function Pick({ className }) {
  return (
    <svg viewBox="101 104 310 310" fill="currentColor" aria-hidden="true" className={className}>
      <path d={PICK_PATH} />
    </svg>
  );
}
