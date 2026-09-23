const YOUTUBE = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|live\/|shorts\/)|youtu\.be\/)([\w-]{11})/;

export function youtubeId(url) {
  if (!url) return null;
  const match = YOUTUBE.exec(url);
  return match ? match[1] : null;
}
