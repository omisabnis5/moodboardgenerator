import {
  colorPaletteLabel,
  roomTypeLabel,
  styleLabelOf,
} from '../data/options';
import { defaultProvider, type ImageProvider } from './imageProvider';
import type { BoardResult, GenerateRequest, Selection } from '../types';

/** How many boards a single Generate produces. */
export const BOARD_COUNT = 4;

/**
 * Four distinct directions — different seed AND a meaningfully different
 * composition/lighting/styling phrase — so the boards are genuinely varied
 * options, not near-duplicates (FR-8). Deterministic → unit-testable.
 */
const VARIATIONS: { seed: number; hint: string }[] = [
  {
    seed: 137,
    hint: 'daytime wide-angle eye-level view, bright airy natural daylight, clean minimal uncluttered styling',
  },
  {
    seed: 268,
    hint: 'cozy evening atmosphere, warm ambient lamp and candle lighting, deeply layered textiles and soft furnishings',
  },
  {
    seed: 415,
    hint: 'elegant symmetrical composition, statement pendant lighting, curated gallery wall and refined luxe decor',
  },
  {
    seed: 592,
    hint: 'relaxed eclectic corner view, abundant plants and greenery, characterful vintage accessories and collected objects',
  },
];

function labelFor(selection: Selection): string {
  return [
    roomTypeLabel(selection.roomType),
    styleLabelOf(selection.style),
    colorPaletteLabel(selection.colorPalette),
  ].join(' · ');
}

function toRequest(selection: Selection, index: number): GenerateRequest {
  const variation = VARIATIONS[index % VARIATIONS.length];
  return {
    ...selection,
    seed: variation.seed,
    variationHint: variation.hint,
  };
}

/**
 * Build the ordered list of {@link BoardResult}s for a selection. Each board
 * gets a distinct seed (and thus a distinct provider URL) and starts in the
 * `loading` state; the UI flips it to `ready`/`error` as the image resolves.
 */
export function generateBoards(
  selection: Selection,
  provider: ImageProvider = defaultProvider,
): BoardResult[] {
  const label = labelFor(selection);

  return Array.from({ length: BOARD_COUNT }, (_, index) => {
    const request = toRequest(selection, index);
    return {
      id: `board-${index + 1}`,
      seed: request.seed,
      variationHint: request.variationHint,
      imageUrl: provider.buildImageUrl(request),
      label,
      alt: `${label} mood board ${index + 1}`,
      status: 'loading' as const,
      started: false,
      retries: 0,
    };
  });
}
