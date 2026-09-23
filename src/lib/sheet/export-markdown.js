/**
 * The sheet body goes inside a fenced block because Markdown collapses runs of spaces,
 * which would destroy the column alignment the whole format depends on.
 */
export function songToMarkdown(song) {
  const facts = [
    song.songKey ? `**Key:** ${song.songKey}` : null,
    song.capo ? `**Capo:** ${song.capo}` : null,
    song.bpm ? `**Tempo:** ${song.bpm} bpm` : null,
  ].filter(Boolean);

  const links = [
    song.mediaUrl ? `- [Listen](${song.mediaUrl})` : null,
    song.tutorialUrl ? `- [Tutorial](${song.tutorialUrl})` : null,
  ].filter(Boolean);

  const parts = [`# ${song.title}`, song.artist ? `*${song.artist}*` : null];

  if (facts.length > 0) parts.push(facts.join(' · '));
  if (song.tags?.length > 0) parts.push(song.tags.map((tag) => `\`${tag}\``).join(' '));

  // A longer fence than any run of backticks in the body keeps the block intact.
  const longest = Math.max(0, ...(song.body.match(/`+/g) ?? []).map((run) => run.length));
  const fence = '`'.repeat(Math.max(3, longest + 1));

  parts.push(`${fence}\n${song.body}\n${fence}`);
  if (links.length > 0) parts.push(links.join('\n'));

  return `${parts.filter(Boolean).join('\n\n')}\n`;
}

export function markdownFilename(song) {
  const stem = [song.title, song.artist].filter(Boolean).join(' - ');
  const slug = stem
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();

  return `${slug || 'sheet'}.md`;
}
