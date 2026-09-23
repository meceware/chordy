import { ExternalLink, CirclePlay } from 'lucide-react';
import { youtubeId } from '@/lib/youtube';

export function VideoTutorial({ url }) {
  if (!url) return null;

  const id = youtubeId(url);

  return (
    <section className="no-print hide-in-stage space-y-2 border-t border-border pt-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold tracking-wide uppercase">
        <CirclePlay className="size-4 text-red-500" />
        Tutorial
      </h2>

      {id ? (
        <div className="aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}`}
            title="Video tutorial"
            loading="lazy"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="size-full"
          />
        </div>
      ) : (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          Watch the tutorial
          <ExternalLink className="size-3.5" />
        </a>
      )}
    </section>
  );
}
