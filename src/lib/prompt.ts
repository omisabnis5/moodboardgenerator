import {
  colorPaletteLabel,
  PALETTE_HEX,
  roomTypeLabel,
  styleLabelOf,
} from '../data/options';
import type { GenerateRequest } from '../types';

/**
 * Build a deterministic text-to-image prompt from a validated selection.
 *
 * Only whitelisted option values reach this function (their union types), so no
 * free-text/user-injected content is ever composed into the prompt/URL.
 */
export function buildPrompt(request: GenerateRequest): string {
  const room = roomTypeLabel(request.roomType);
  const style = styleLabelOf(request.style);
  const palette = colorPaletteLabel(request.colorPalette);
  const hexes = PALETTE_HEX[request.colorPalette].join(', ');

  const parts = [
    `a ${style} ${room} interior`,
    // Room + furniture is the subject; artifacts are a restrained accent (FR-16).
    "well furnished, with the room's core furniture and architecture as the clear focal point",
    `${palette} color palette (${hexes} tones)`,
    'tastefully accented with a few decorative artifacts (a framed artwork, a potted plant, a vase, books, a patterned rug) occupying only about 20-25% of the scene — uncluttered, balanced and realistic, not crowded',
    'professional interior design photograph, wide angle, natural light, high detail, photorealistic, 8k',
  ];

  if (request.variationHint) {
    parts.push(request.variationHint);
  }

  return parts.join(', ');
}
