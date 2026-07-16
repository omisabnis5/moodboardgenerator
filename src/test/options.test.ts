import { describe, expect, it } from 'vitest';
import {
  COLOR_PALETTE_OPTIONS,
  PALETTE_HEX,
  ROOM_TYPE_OPTIONS,
  STYLE_OPTIONS,
} from '../data/options';

describe('option data (AC-1)', () => {
  it('offers exactly 8 room types, 8 styles, 6 palettes', () => {
    expect(ROOM_TYPE_OPTIONS).toHaveLength(8);
    expect(STYLE_OPTIONS).toHaveLength(8);
    expect(COLOR_PALETTE_OPTIONS).toHaveLength(6);
  });

  it('includes the expected room, style and palette values', () => {
    expect(ROOM_TYPE_OPTIONS.map((o) => o.value)).toEqual([
      'living_room', 'dining_room', 'bedroom', 'childrens_room',
      'kitchen', 'bathroom', 'home_office', 'entryway',
    ]);
    expect(STYLE_OPTIONS.map((o) => o.value)).toEqual([
      'bohemian', 'modern', 'traditional', 'contemporary',
      'industrial', 'scandinavian', 'mid_century_modern', 'farmhouse',
    ]);
    expect(COLOR_PALETTE_OPTIONS.map((o) => o.value)).toEqual([
      'neutral_warm', 'cool_blues', 'earth_tones',
      'monochrome', 'jewel_tones', 'pastels',
    ]);
  });

  it('gives every option a non-empty label and description', () => {
    for (const option of [...ROOM_TYPE_OPTIONS, ...STYLE_OPTIONS, ...COLOR_PALETTE_OPTIONS]) {
      expect(option.label.length).toBeGreaterThan(0);
      expect(option.description.length).toBeGreaterThan(0);
    }
  });

  it('defines a hex swatch set for every palette', () => {
    for (const option of COLOR_PALETTE_OPTIONS) {
      const hexes = PALETTE_HEX[option.value];
      expect(hexes.length).toBeGreaterThanOrEqual(3);
      for (const hex of hexes) {
        expect(hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    }
  });
});
