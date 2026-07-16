import { useState } from 'react';
import { SelectionPanel } from './components/SelectionPanel';
import { GenerateBar } from './components/GenerateBar';
import { BoardGrid } from './components/BoardGrid';
import {
  colorPaletteLabel,
  roomTypeLabel,
  styleLabelOf,
} from './data/options';
import { downloadBoard } from './lib/download';
import {
  EMPTY_SELECTION,
  isComplete,
  missingGroups,
  toSelection,
  type PartialSelection,
} from './lib/selection';
import { useMoodboards } from './hooks/useMoodboards';
import './App.css';

export default function App() {
  const [selection, setSelection] = useState<PartialSelection>(EMPTY_SELECTION);
  const moodboards = useMoodboards();

  const canGenerate = isComplete(selection);
  const missing = missingGroups(selection);

  // Any change after results exist marks them stale until re-generated.
  function updateSelection(patch: Partial<PartialSelection>) {
    setSelection((prev) => ({ ...prev, ...patch }));
    if (moodboards.hasResults) {
      moodboards.markStale();
    }
  }

  function handleGenerate() {
    const complete = toSelection(selection);
    if (complete) {
      console.info('[moodboards] generate', complete);
      moodboards.generate(complete);
    }
  }

  const summary = [
    { label: 'Room', value: selection.roomType && roomTypeLabel(selection.roomType) },
    { label: 'Style', value: selection.style && styleLabelOf(selection.style) },
    {
      label: 'Palette',
      value: selection.colorPalette && colorPaletteLabel(selection.colorPalette),
    },
  ];

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1 className="app-header__title">Mood Board Generator</h1>
        <p className="app-header__subtitle">
          Pick a room, a style, and a color palette — then generate four mood boards.
        </p>
      </header>

      <main>
        <SelectionPanel
          roomType={selection.roomType}
          style={selection.style}
          colorPalette={selection.colorPalette}
          onRoomTypeChange={(roomType) => updateSelection({ roomType })}
          onStyleChange={(style) => updateSelection({ style })}
          onColorPaletteChange={(colorPalette) => updateSelection({ colorPalette })}
        />

        <GenerateBar
          summary={summary}
          canGenerate={canGenerate}
          missing={missing}
          isGenerating={moodboards.isGenerating}
          onGenerate={handleGenerate}
        />

        <BoardGrid
          boards={moodboards.boards}
          isGenerating={moodboards.isGenerating}
          stale={moodboards.stale}
          onBoardLoaded={moodboards.onBoardLoaded}
          onBoardError={moodboards.onBoardError}
          onRetryBoard={moodboards.retryBoard}
          onDownload={downloadBoard}
        />
      </main>
    </div>
  );
}
