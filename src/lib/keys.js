// Shortcuts must not fire while the reader is typing into the sheet or a metadata field.
export function isTyping(event) {
  const tag = event.target?.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || event.target?.isContentEditable === true;
}
