import { useEffect, useRef, useState } from 'react';
import type { BoardResult } from '../types';

/** Per-image timeout: if it hasn't loaded in this long, treat as an error. */
const DEFAULT_TIMEOUT_MS = 45_000;

interface BoardCardProps {
  board: BoardResult;
  onLoaded: (id: string) => void;
  onError: (id: string) => void;
  onRetry: (id: string) => void;
  onDownload: (board: BoardResult) => void;
  timeoutMs?: number;
}

export function BoardCard({
  board,
  onLoaded,
  onError,
  onRetry,
  onDownload,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: BoardCardProps) {
  const [downloading, setDownloading] = useState(false);
  const timerRef = useRef<number | undefined>(undefined);

  // Start a timeout only once the queue has actually started this board's
  // request; queued (not-yet-started) boards must not time out while waiting.
  useEffect(() => {
    if (board.status !== 'loading' || !board.started) return;
    timerRef.current = window.setTimeout(() => onError(board.id), timeoutMs);
    return () => window.clearTimeout(timerRef.current);
  }, [board.status, board.started, board.imageUrl, board.id, onError, timeoutMs]);

  async function handleDownload() {
    setDownloading(true);
    try {
      await onDownload(board);
    } finally {
      setDownloading(false);
    }
  }

  const isLoading = board.status === 'loading';
  const isError = board.status === 'error';
  const isReady = board.status === 'ready';

  return (
    <figure className={`board-card board-card--${board.status}`} data-testid="board-card">
      <div className="board-card__media">
        {isError ? (
          <div className="board-card__error" role="alert">
            <p className="board-card__error-msg">Couldn’t generate this board.</p>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => onRetry(board.id)}
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {isLoading && (
              <div className="board-card__skeleton" aria-hidden="true">
                <span className="board-card__spinner" />
              </div>
            )}
            {/* Only request the image once the queue has started this board.
                key on imageUrl so a retry (new cache-bust) remounts the img. */}
            {board.started && (
              <img
                key={board.imageUrl}
                className="board-card__img"
                src={board.imageUrl}
                alt={board.alt}
                loading="lazy"
                onLoad={() => onLoaded(board.id)}
                onError={() => onError(board.id)}
                style={{ opacity: isReady ? 1 : 0 }}
              />
            )}
          </>
        )}
      </div>
      <figcaption className="board-card__caption">
        <span className="board-card__label">{board.label}</span>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={handleDownload}
          disabled={!isReady || downloading}
        >
          {downloading ? 'Saving…' : 'Download'}
        </button>
      </figcaption>
    </figure>
  );
}
