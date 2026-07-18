import {
  colorPaletteDescriptionOf,
  colorPaletteLabel,
  roomTypeLabel,
  styleDescriptionOf,
  styleLabelOf,
} from '../data/options';
import type { GenerateRequest } from '../types';

/**
 * Build a deterministic text-to-image prompt from a validated selection.
 *
 * Fidelity notes (CR-5): the style and palette are reinforced with their
 * human-readable descriptions — diffusion models follow "soft pinks, lavenders,
 * and gentle mint greens" far better than hex codes — and the palette is
 * demanded across the whole scene so it can't be ignored.
 *
 * Only whitelisted option values reach this function (their union types), so no
 * free-text/user-injected content is ever composed into the prompt/URL.
 */
export function buildPrompt(request: GenerateRequest): string {
  const room = roomTypeLabel(request.roomType);
  const style = styleLabelOf(request.style);
  const styleDetail = styleDescriptionOf(request.style).toLowerCase();
  const palette = colorPaletteLabel(request.colorPalette);
  const paletteDetail = colorPaletteDescriptionOf(request.colorPalette).toLowerCase();

  const parts = [
    `professional interior design photograph of a ${style} style ${room}`,
    // Reinforce what the style actually means so the model can't drift.
    `${styleDetail}`,
    "fully furnished, with the room's characteristic furniture and architecture as the clear focal point",
    // Palette in words the model understands, enforced scene-wide.
    `strict ${palette} color scheme — ${paletteDetail} — applied consistently across walls, furniture and decor`,
    // Restrained decorative artifacts (FR-16), ~20-25% of the scene.
    'tastefully accented with a few decorative artifacts (a framed artwork, a potted plant, a vase, books, a patterned rug) occupying only about 20-25% of the scene — uncluttered, balanced and realistic, not crowded',
    'wide angle, natural light, high detail, photorealistic, 8k',
  ];

  if (request.variationHint) {
    parts.push(request.variationHint);
  }

  return parts.join(', ');
}
