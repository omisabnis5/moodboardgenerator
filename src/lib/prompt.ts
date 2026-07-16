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
    'fully furnished and styled with decor, furniture and lighting',
    `${palette} color palette (${hexes} tones)`,
    'professional interior design photograph, wide angle, natural light, high detail, photorealistic',
  ];

  if (request.variationHint) {
    parts.push(request.variationHint);
  }

  return parts.join(', ');
}
