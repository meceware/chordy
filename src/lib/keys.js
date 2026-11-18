const TYPING = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

// Controls that already answer Space or Enter themselves; a page shortcut must not steal them.
const INTERACTIVE = 'button, a[href], summary, [role="button"], [role="checkbox"], [role="switch"], ' +
  '[role="radio"], [role="tab"], [role="menuitem"], [role="option"], [role="slider"]';

// Shortcuts must not fire while the reader is typing into the sheet or a metadata field.
export function isTyping(event) {
  const target = event.target;
  return TYPING.has(target?.tagName) || target?.isContentEditable === true;
}

/**
 * Whether a page-wide shortcut should leave this key press alone: typing, a modifier chord, a
 * focused control that the key would otherwise activate, or an open dialog or drawer, whose
 * contents are what the reader is working on.
 */
export function shouldIgnoreShortcut(event, doc = globalThis.document) {
  if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return true;
  if (isTyping(event)) return true;
  if ((event.key === ' ' || event.key === 'Enter') && event.target?.closest?.(INTERACTIVE)) return true;
  return Boolean(doc?.querySelector?.('[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]'));
}
