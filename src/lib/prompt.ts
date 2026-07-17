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
    'fully furnished and beautifully styled',
    `${palette} color palette (${hexes} tones)`,
    // Decorative artifacts so boards read as finished, styled spaces (FR-16).
    'richly decorated with artifacts — framed wall art, ceramic vases, potted plants and greenery, stacked books, woven textiles and patterned rugs, sculptural ornaments and curated accessories',
    'professional interior design photograph, wide angle, natural light, high detail, photorealistic, 8k',
  ];

  if (request.variationHint) {
    parts.push(request.variationHint);
  }

  return parts.join(', ');
}
