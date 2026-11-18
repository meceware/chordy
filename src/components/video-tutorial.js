'use client';

import { CirclePlay, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CollapsibleCard } from '@/components/collapsible-card';
import { youtubeId } from '@/lib/youtube';

/**
 * The song's tutorial, folded until asked for: nothing is fetched from YouTube until it is opened.
 * Open, the video runs edge to edge under the title. A link that is not a YouTube video cannot be
 * embedded, so the card holds a button to open it instead.
 */
export function VideoTutorial({ url }) {
  if (!url) return null;

  const id = youtubeId(url);

  return (
    <CollapsibleCard icon={CirclePlay} title="Tutorial">
      {id ? (
        <div className="aspect-video w-full bg-muted">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}`}
            title="Video tutorial"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="size-full"
          />
        </div>
      ) : (
        <div className="px-4 py-4">
          <Button asChild variant="outline" className="h-11 rounded-xl">
            <a href={url} target="_blank" rel="noopener noreferrer">
              Watch the tutorial
              <ExternalLink className="size-4" aria-hidden />
            </a>
          </Button>
        </div>
      )}
    </CollapsibleCard>
  );
}
