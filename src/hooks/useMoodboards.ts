import { useCallback, useEffect, useRef, useState } from 'react';
import { generateBoards } from '../lib/generate';
import type { BoardResult, Selection } from '../types';

/**
 * Pollinations rate-limits bursts of anonymous requests (concurrent ones get a
 * 403 that the browser ORB-blocks at the <img>). Spacing the *starts* ~2s apart
 * lets every request through, so we stagger board starts and back off on retry
 * rather than firing all four at once.
 */
const STAGGER_MS = 1800;
const RETRY_BACKOFF_MS = 3000;
const MAX_AUTO_RETRIES = 3;

/** Append a cache-busting param so a retry actually re-requests the image. */
function withCacheBust(url: string, nonce: number): string {
  const stripped = url.replace(/[&?]cb=\d+/, '');
  const separator = stripped.includes('?') ? '&' : '?';
  return `${stripped}${separator}cb=${nonce}`;
}

export interface MoodboardsApi {
  boards: BoardResult[];
  /** True while at least one board is still loading. */
  isGenerating: boolean;
  /** True once a batch has been produced (any status). */
  hasResults: boolean;
  /** True when the selection changed after results were produced. */
  stale: boolean;
  /** Start a new batch for the given selection, replacing any prior one. */
  generate: (selection: Selection) => void;
  /** Mark the current results stale (selection changed). */
  markStale: () => void;
  onBoardLoaded: (id: string) => void;
  onBoardError: (id: string) => void;
  /** Manually retry a single board after it errored. */
  retryBoard: (id: string) => void;
}

export function useMoodboards(): MoodboardsApi {
  const [boards, setBoards] = useState<BoardResult[]>([]);
  const [stale, setStale] = useState(false);

  // Mirror of `boards` for reading current retry counts inside callbacks.
  const boardsRef = useRef<BoardResult[]>([]);
  useEffect(() => {
    boardsRef.current = boards;
  }, [boards]);

  // Pending stagger/backoff timers, cleared on regenerate + unmount.
  const timersRef = useRef<number[]>([]);
  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
  }, []);
  useEffect(() => clearTimers, [clearTimers]);

  const startBoard = useCallback((id: string) => {
    setBoards((prev) => prev.map((b) => (b.id === id ? { ...b, started: true } : b)));
  }, []);

  const generate = useCallback(
    (selection: Selection) => {
      clearTimers();
      setStale(false);
      const fresh = generateBoards(selection);
      setBoards(fresh);
      // Stagger the start of each board so requests don't burst.
      fresh.forEach((board, index) => {
        const timer = window.setTimeout(() => startBoard(board.id), index * STAGGER_MS);
        timersRef.current.push(timer);
      });
    },
    [clearTimers, startBoard],
  );

  const markStale = useCallback(() => setStale(true), []);

  const onBoardLoaded = useCallback((id: string) => {
    setBoards((prev) => prev.map((b) => (b.id === id ? { ...b, status: 'ready' } : b)));
  }, []);

  const onBoardError = useCallback((id: string) => {
    const current = boardsRef.current.find((b) => b.id === id);
    if (!current) return;

    if (current.retries < MAX_AUTO_RETRIES) {
      // Transient (rate-limit / ORB): back off, then re-request with a fresh URL.
      const timer = window.setTimeout(() => {
        setBoards((prev) =>
          prev.map((b) =>
            b.id === id
              ? {
                  ...b,
                  status: 'loading',
                  started: true,
                  retries: b.retries + 1,
                  imageUrl: withCacheBust(b.imageUrl, Date.now()),
                }
              : b,
          ),
        );
      }, RETRY_BACKOFF_MS);
      timersRef.current.push(timer);
    } else {
      setBoards((prev) => prev.map((b) => (b.id === id ? { ...b, status: 'error' } : b)));
    }
  }, []);

  const retryBoard = useCallback((id: string) => {
    setBoards((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              status: 'loading',
              started: true,
              retries: 0,
              imageUrl: withCacheBust(b.imageUrl, Date.now()),
            }
          : b,
      ),
    );
  }, []);

  const isGenerating = boards.some((b) => b.status === 'loading');
  const hasResults = boards.length > 0;

  return {
    boards,
    isGenerating,
    hasResults,
    stale,
    generate,
    markStale,
    onBoardLoaded,
    onBoardError,
    retryBoard,
  };
}
