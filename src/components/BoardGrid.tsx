import type { BoardResult } from '../types';
import { BoardCard } from './BoardCard';

interface BoardGridProps {
  boards: BoardResult[];
  isGenerating: boolean;
  stale: boolean;
  onBoardLoaded: (id: string) => void;
  onBoardError: (id: string) => void;
  onRetryBoard: (id: string) => void;
  onDownload: (board: BoardResult) => void;
}

export function BoardGrid({
  boards,
  isGenerating,
  stale,
  onBoardLoaded,
  onBoardError,
  onRetryBoard,
  onDownload,
}: BoardGridProps) {
  const statusMessage = isGenerating
    ? 'Generating your mood boards…'
    : stale
      ? 'Selections changed — generate again to refresh these boards.'
      : 'Your mood boards are ready.';

  if (boards.length === 0) {
    return (
      <section className="results" aria-labelledby="results-heading">
        <h2 id="results-heading" className="results__heading">
          Mood boards
        </h2>
        <div className="results__empty" data-testid="results-empty">
          <p>Your four mood boards will appear here after you generate.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="results" aria-labelledby="results-heading">
      <div className="results__header">
        <h2 id="results-heading" className="results__heading">
          Mood boards
        </h2>
        <p
          className={`results__status${stale ? ' results__status--stale' : ''}`}
          role="status"
          aria-live="polite"
          data-testid="results-status"
        >
          {statusMessage}
        </p>
      </div>
      <div
        className={`board-grid${stale ? ' board-grid--stale' : ''}`}
        data-testid="board-grid"
      >
        {boards.map((board) => (
          <BoardCard
            key={board.id}
            board={board}
            onLoaded={onBoardLoaded}
            onError={onBoardError}
            onRetry={onRetryBoard}
            onDownload={onDownload}
          />
        ))}
      </div>
    </section>
  );
}
