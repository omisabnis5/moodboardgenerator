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
 * Fixed seeds + light phrasing so the 4 boards are distinct, on-brief
 * directions (not four identical images). Deterministic → unit-testable.
 */
const VARIATIONS: { seed: number; hint: string }[] = [
  { seed: 101, hint: 'bright and airy composition' },
  { seed: 202, hint: 'cozy and layered composition' },
  { seed: 303, hint: 'elegant and refined composition' },
  { seed: 404, hint: 'warm and inviting composition' },
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
