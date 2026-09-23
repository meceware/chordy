import { currentUserId } from '@/lib/session';
import { getSong } from '@/lib/songs';
import { songToMarkdown, markdownFilename } from '@/lib/sheet/export-markdown';

export async function GET(request, { params }) {
  const { id } = await params;
  const userId = await currentUserId();
  if (!userId) return new Response('Unauthorised', { status: 401 });

  const song = getSong(userId, id);
  if (!song) return new Response('Not found', { status: 404 });

  return new Response(songToMarkdown(song), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="${markdownFilename(song)}"`,
    },
  });
}
