import type { BoardResult } from '../types';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[·]/g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function triggerAnchor(href: string, filename: string, newTab = false): void {
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  if (newTab) {
    a.target = '_blank';
    a.rel = 'noopener';
  }
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/**
 * Download a board image to the user's device.
 *
 * Primary path fetches the image as a blob so the browser saves a file. If the
 * cross-origin fetch is blocked (CORS), it falls back to opening the image URL
 * directly with a download hint (M1 in review.md).
 */
export async function downloadBoard(board: BoardResult): Promise<void> {
  const filename = `${slugify(board.label)}-${board.id}.jpg`;
  try {
    const response = await fetch(board.imageUrl, { mode: 'cors' });
    if (!response.ok) {
      throw new Error(`Request failed with ${response.status}`);
    }
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    triggerAnchor(objectUrl, filename);
    URL.revokeObjectURL(objectUrl);
  } catch {
    // CORS or network failure — fall back to a direct link / new tab.
    triggerAnchor(board.imageUrl, filename, true);
  }
}
