import { useRef, type ReactNode } from 'react';
import type { ParameterOption } from '../types';

interface OptionGroupProps<T extends string> {
  /** Group heading, e.g. "Room Type". */
  legend: string;
  /** Stable id used to associate the group label with the radiogroup. */
  id: string;
  options: ParameterOption<T>[];
  /** Currently selected value, or null when nothing is chosen yet. */
  value: T | null;
  onChange: (value: T) => void;
  /** Optional extra content per option (e.g. palette swatches). */
  renderExtra?: (option: ParameterOption<T>) => ReactNode;
}

/**
 * An accessible single-select group rendered as an ARIA radiogroup.
 * - Exactly one option is selected at a time (radio semantics).
 * - Roving tabindex: only the active option is in the tab order.
 * - Arrow / Home / End keys move and select, matching the radio pattern.
 */
export function OptionGroup<T extends string>({
  legend,
  id,
  options,
  value,
  onChange,
  renderExtra,
}: OptionGroupProps<T>) {
  const labelId = `${id}-label`;
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  // The option that owns the tab stop: the selected one, else the first.
  const activeIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );

  function focusAndSelect(index: number) {
    const clamped = (index + options.length) % options.length;
    const option = options[clamped];
    onChange(option.value);
    refs.current[clamped]?.focus();
  }

  function onKeyDown(event: React.KeyboardEvent, index: number) {
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        focusAndSelect(index + 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        focusAndSelect(index - 1);
        break;
      case 'Home':
        event.preventDefault();
        focusAndSelect(0);
        break;
      case 'End':
        event.preventDefault();
        focusAndSelect(options.length - 1);
        break;
      default:
        break;
    }
  }

  return (
    <fieldset className="option-group" aria-labelledby={labelId}>
      <legend id={labelId} className="option-group__legend">
        {legend}
      </legend>
      <div role="radiogroup" aria-labelledby={labelId} className="option-group__list">
        {options.map((option, index) => {
          const selected = option.value === value;
          const tabbable = index === activeIndex;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={tabbable ? 0 : -1}
              ref={(el) => {
                refs.current[index] = el;
              }}
              className={`option-card${selected ? ' option-card--selected' : ''}`}
              onClick={() => onChange(option.value)}
              onKeyDown={(e) => onKeyDown(e, index)}
            >
              <span className="option-card__check" aria-hidden="true">
                {selected ? '✓' : ''}
              </span>
              <span className="option-card__body">
                <span className="option-card__label">{option.label}</span>
                <span className="option-card__desc">{option.description}</span>
                {renderExtra?.(option)}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
