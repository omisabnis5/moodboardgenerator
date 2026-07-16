import { describe, expect, it } from 'vitest';
import {
  EMPTY_SELECTION,
  isComplete,
  missingGroups,
  toSelection,
  type PartialSelection,
} from '../lib/selection';

describe('selection state (AC-2, AC-3)', () => {
  it('starts empty and incomplete', () => {
    expect(isComplete(EMPTY_SELECTION)).toBe(false);
    expect(missingGroups(EMPTY_SELECTION)).toEqual([
      'Room Type',
      'Style',
      'Color Palette',
    ]);
    expect(toSelection(EMPTY_SELECTION)).toBeNull();
  });

  it('reports only the groups still missing', () => {
    const partial: PartialSelection = {
      roomType: 'kitchen',
      style: null,
      colorPalette: 'pastels',
    };
    expect(isComplete(partial)).toBe(false);
    expect(missingGroups(partial)).toEqual(['Style']);
  });

  it('is complete once all three groups are set', () => {
    const full: PartialSelection = {
      roomType: 'kitchen',
      style: 'traditional',
      colorPalette: 'pastels',
    };
    expect(isComplete(full)).toBe(true);
    expect(missingGroups(full)).toEqual([]);
    expect(toSelection(full)).toEqual(full);
  });
});
