interface GenerateBarProps {
  /** Ordered summary chips (Room · Style · Palette), null when unset. */
  summary: { label: string; value: string | null }[];
  canGenerate: boolean;
  /** Names of the groups still missing a selection. */
  missing: string[];
  isGenerating: boolean;
  onGenerate: () => void;
}

/** Selection summary + the primary Generate action. */
export function GenerateBar({
  summary,
  canGenerate,
  missing,
  isGenerating,
  onGenerate,
}: GenerateBarProps) {
  const hintId = 'generate-hint';
  const hint = canGenerate
    ? 'Ready to generate 4 mood boards.'
    : `Select a ${missing.join(', ')} to continue.`;

  return (
    <div className="generate-bar">
      <div className="generate-bar__summary" aria-label="Current selection">
        {summary.map((item) => (
          <span
            key={item.label}
            className={`summary-chip${item.value ? ' summary-chip--set' : ''}`}
          >
            <span className="summary-chip__label">{item.label}</span>
            <span className="summary-chip__value">{item.value ?? '—'}</span>
          </span>
        ))}
      </div>
      <div className="generate-bar__action">
        <button
          type="button"
          className="btn btn--primary"
          onClick={onGenerate}
          disabled={!canGenerate || isGenerating}
          aria-describedby={hintId}
        >
          {isGenerating ? 'Generating…' : 'Generate mood boards'}
        </button>
        <p id={hintId} className="generate-bar__hint">
          {hint}
        </p>
      </div>
    </div>
  );
}
