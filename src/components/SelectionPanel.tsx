import {
  COLOR_PALETTE_OPTIONS,
  PALETTE_HEX,
  ROOM_TYPE_OPTIONS,
  STYLE_OPTIONS,
} from '../data/options';
import type { ColorPalette, RoomType, Style } from '../types';
import { OptionGroup } from './OptionGroup';
import { PaletteSwatches } from './PaletteSwatches';

interface SelectionPanelProps {
  roomType: RoomType | null;
  style: Style | null;
  colorPalette: ColorPalette | null;
  onRoomTypeChange: (value: RoomType) => void;
  onStyleChange: (value: Style) => void;
  onColorPaletteChange: (value: ColorPalette) => void;
}

/** The three selection groups: Room Type, Style, Color Palette. */
export function SelectionPanel({
  roomType,
  style,
  colorPalette,
  onRoomTypeChange,
  onStyleChange,
  onColorPaletteChange,
}: SelectionPanelProps) {
  return (
    <div className="selection-panel">
      <OptionGroup
        id="room-type"
        legend="Room Type"
        options={ROOM_TYPE_OPTIONS}
        value={roomType}
        onChange={onRoomTypeChange}
      />
      <OptionGroup
        id="style"
        legend="Style"
        options={STYLE_OPTIONS}
        value={style}
        onChange={onStyleChange}
      />
      <OptionGroup
        id="color-palette"
        legend="Color Palette"
        options={COLOR_PALETTE_OPTIONS}
        value={colorPalette}
        onChange={onColorPaletteChange}
        renderExtra={(option) => <PaletteSwatches colors={PALETTE_HEX[option.value]} />}
      />
    </div>
  );
}
