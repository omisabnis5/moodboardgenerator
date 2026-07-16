interface PaletteSwatchesProps {
  colors: string[];
  size?: number;
}

/** A small row of color chips previewing a palette. Decorative. */
export function PaletteSwatches({ colors, size = 18 }: PaletteSwatchesProps) {
  return (
    <span className="palette-swatches" aria-hidden="true">
      {colors.map((color, i) => (
        <span
          key={`${color}-${i}`}
          className="palette-swatch"
          style={{ backgroundColor: color, width: size, height: size }}
        />
      ))}
    </span>
  );
}
