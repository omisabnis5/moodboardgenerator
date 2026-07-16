import { useState } from 'react';
import { SelectionPanel } from './components/SelectionPanel';
import { GenerateBar } from './components/GenerateBar';
import {
  colorPaletteLabel,
  roomTypeLabel,
  styleLabelOf,
} from './data/options';
import {
  EMPTY_SELECTION,
  isComplete,
  missingGroups,
  type PartialSelection,
} from './lib/selection';
import './App.css';

export default function App() {
  const [selection, setSelection] = useState<PartialSelection>(EMPTY_SELECTION);

  const canGenerate = isComplete(selection);
  const missing = missingGroups(selection);

  const summary = [
    { label: 'Room', value: selection.roomType && roomTypeLabel(selection.roomType) },
    { label: 'Style', value: selection.style && styleLabelOf(selection.style) },
    {
      label: 'Palette',
      value: selection.colorPalette && colorPaletteLabel(selection.colorPalette),
    },
  ];

  function handleGenerate() {
    // Wired to the generation flow in PR-4.
  }

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
          onRoomTypeChange={(roomType) => setSelection((s) => ({ ...s, roomType }))}
          onStyleChange={(style) => setSelection((s) => ({ ...s, style }))}
          onColorPaletteChange={(colorPalette) =>
            setSelection((s) => ({ ...s, colorPalette }))
          }
        />

        <GenerateBar
          summary={summary}
          canGenerate={canGenerate}
          missing={missing}
          isGenerating={false}
          onGenerate={handleGenerate}
        />
      </main>
    </div>
  );
}
