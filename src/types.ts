/** Predefined room types the user can select. */
export type RoomType =
  | 'living_room'
  | 'dining_room'
  | 'bedroom'
  | 'childrens_room'
  | 'kitchen'
  | 'bathroom'
  | 'home_office'
  | 'entryway';

/** Predefined design styles the user can select. */
export type Style =
  | 'bohemian'
  | 'modern'
  | 'traditional'
  | 'contemporary'
  | 'industrial'
  | 'scandinavian'
  | 'mid_century_modern'
  | 'farmhouse';

/** Predefined color palettes the user can select. */
export type ColorPalette =
  | 'neutral_warm'
  | 'cool_blues'
  | 'earth_tones'
  | 'monochrome'
  | 'jewel_tones'
  | 'pastels';

/** A single selectable option in one of the parameter groups. */
export interface ParameterOption<T extends string> {
  value: T;
  label: string;
  description: string;
}

/** A complete, valid selection: one value from each group. */
export interface Selection {
  roomType: RoomType;
  style: Style;
  colorPalette: ColorPalette;
}

/** A request to generate a single board image. */
export interface GenerateRequest extends Selection {
  /** Seed for deterministic variation across the 4 boards. */
  seed: number;
  /** Short phrase appended to the prompt to differentiate this board. */
  variationHint: string;
}

/** Lifecycle status of one board within a batch. */
export type BoardStatus = 'loading' | 'ready' | 'error';

/** One generated (or in-flight) mood board. */
export interface BoardResult {
  /** Stable id within a batch (e.g. `board-1`). */
  id: string;
  seed: number;
  variationHint: string;
  /** The provider image URL for this board. */
  imageUrl: string;
  /** Human-readable label, e.g. "Traditional · Pastels · Kitchen". */
  label: string;
  /** Alt text for the rendered image. */
  alt: string;
  status: BoardStatus;
  /** Whether this board's image request has been started (queue gate). */
  started: boolean;
  /** How many times this board has auto-retried after a failure. */
  retries: number;
}
