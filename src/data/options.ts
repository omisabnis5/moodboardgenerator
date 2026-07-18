import type {
  ColorPalette,
  ParameterOption,
  RoomType,
  Style,
} from '../types';

export const ROOM_TYPE_OPTIONS: ParameterOption<RoomType>[] = [
  { value: 'living_room', label: 'Living Room', description: 'Main gathering space for relaxation and entertainment' },
  { value: 'dining_room', label: 'Dining Room', description: 'Formal or casual dining and meal spaces' },
  { value: 'bedroom', label: 'Bedroom', description: 'Primary sleeping and personal retreat spaces' },
  { value: 'childrens_room', label: "Children's Room", description: 'Playful and functional spaces for kids' },
  { value: 'kitchen', label: 'Kitchen', description: 'Cooking and food preparation areas' },
  { value: 'bathroom', label: 'Bathroom', description: 'Personal care and bathing spaces' },
  { value: 'home_office', label: 'Home Office', description: 'Productive work and study environments' },
  { value: 'entryway', label: 'Entryway', description: 'Welcome spaces and first impressions' },
];

export const STYLE_OPTIONS: ParameterOption<Style>[] = [
  { value: 'bohemian', label: 'Bohemian', description: 'Free-spirited with rich textures and global influences' },
  { value: 'modern', label: 'Modern', description: 'Clean lines with minimalist and contemporary elements' },
  { value: 'traditional', label: 'Traditional', description: 'Classic elegance with timeless furniture and patterns' },
  { value: 'contemporary', label: 'Contemporary', description: 'Current trends with sleek and sophisticated touches' },
  { value: 'industrial', label: 'Industrial', description: 'Raw materials with urban and warehouse-inspired elements' },
  { value: 'scandinavian', label: 'Scandinavian', description: 'Light woods with cozy and functional Nordic design' },
  { value: 'mid_century_modern', label: 'Mid-Century Modern', description: 'Retro charm with 1950s-60s inspired furniture' },
  { value: 'farmhouse', label: 'Farmhouse', description: 'Rustic comfort with country-inspired and vintage elements' },
];

export const COLOR_PALETTE_OPTIONS: ParameterOption<ColorPalette>[] = [
  { value: 'neutral_warm', label: 'Neutral Warm', description: 'Cozy beiges, creams, and soft browns' },
  { value: 'cool_blues', label: 'Cool Blues', description: 'Calming blues, teals, and aqua tones' },
  { value: 'earth_tones', label: 'Earth Tones', description: 'Natural greens, terracotta, and warm browns' },
  { value: 'monochrome', label: 'Monochrome', description: 'Sophisticated blacks, whites, and grays' },
  { value: 'jewel_tones', label: 'Jewel Tones', description: 'Rich emeralds, sapphires, and deep purples' },
  { value: 'pastels', label: 'Pastels', description: 'Soft pinks, lavenders, and gentle mint greens' },
];

/**
 * Fixed hex swatches per palette. Used both to render the on-board swatch row
 * and to steer the image prompt's color language. Ordered light → dark / accent.
 */
export const PALETTE_HEX: Record<ColorPalette, string[]> = {
  neutral_warm: ['#EDE4D3', '#D9C6A5', '#B79F86', '#8C7B6B', '#5E5245'],
  cool_blues: ['#DDEBF2', '#A9CCE3', '#5B9BD5', '#2E75B6', '#1F4E79'],
  earth_tones: ['#E8E0CF', '#A3B18A', '#E07A5F', '#B5651D', '#6B4226'],
  monochrome: ['#FFFFFF', '#D9D9D9', '#A6A6A6', '#595959', '#1A1A1A'],
  jewel_tones: ['#046A38', '#0F52BA', '#6A0DAD', '#7D0633', '#C9A227'],
  pastels: ['#FDE2E4', '#FAD2E1', '#D8C2EF', '#BEE1E6', '#DCF3E8'],
};

const roomLabel = new Map(ROOM_TYPE_OPTIONS.map((o) => [o.value, o.label]));
const styleLabel = new Map(STYLE_OPTIONS.map((o) => [o.value, o.label]));
const paletteLabel = new Map(COLOR_PALETTE_OPTIONS.map((o) => [o.value, o.label]));
const styleDesc = new Map(STYLE_OPTIONS.map((o) => [o.value, o.description]));
const paletteDesc = new Map(COLOR_PALETTE_OPTIONS.map((o) => [o.value, o.description]));

export function roomTypeLabel(value: RoomType): string {
  return roomLabel.get(value) ?? value;
}

export function styleLabelOf(value: Style): string {
  return styleLabel.get(value) ?? value;
}

export function colorPaletteLabel(value: ColorPalette): string {
  return paletteLabel.get(value) ?? value;
}

export function styleDescriptionOf(value: Style): string {
  return styleDesc.get(value) ?? '';
}

export function colorPaletteDescriptionOf(value: ColorPalette): string {
  return paletteDesc.get(value) ?? '';
}
