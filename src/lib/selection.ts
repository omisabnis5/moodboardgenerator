import type { ColorPalette, RoomType, Selection, Style } from '../types';

/** A selection in progress — any group may still be unset. */
export interface PartialSelection {
  roomType: RoomType | null;
  style: Style | null;
  colorPalette: ColorPalette | null;
}

export const EMPTY_SELECTION: PartialSelection = {
  roomType: null,
  style: null,
  colorPalette: null,
};

/** Display names for each group, used in the "what's missing" hint. */
export const GROUP_LABELS = {
  roomType: 'Room Type',
  style: 'Style',
  colorPalette: 'Color Palette',
} as const;

/** True when all three groups have a value. */
export function isComplete(selection: PartialSelection): selection is Selection {
  return (
    selection.roomType !== null &&
    selection.style !== null &&
    selection.colorPalette !== null
  );
}

/** Labels of the groups still missing a selection, in group order. */
export function missingGroups(selection: PartialSelection): string[] {
  const missing: string[] = [];
  if (selection.roomType === null) missing.push(GROUP_LABELS.roomType);
  if (selection.style === null) missing.push(GROUP_LABELS.style);
  if (selection.colorPalette === null) missing.push(GROUP_LABELS.colorPalette);
  return missing;
}

/** Narrow a partial selection to a complete {@link Selection}, or null. */
export function toSelection(selection: PartialSelection): Selection | null {
  return isComplete(selection) ? selection : null;
}
