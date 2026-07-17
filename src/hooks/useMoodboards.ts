import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { generateBoards } from '../lib/generate';
import { getGenConfig } from '../lib/config';
import type { BoardResult, Selection } from '../types';

/** Append a cache-busting param so a retry actually re-requests the image. */
function withCacheBust(url: string, nonce: number): string {
  const stripped = url.replace(/[&?]cb=\d+/, '');
  const separator = stripped.includes('?') ? '&' : '?';
  return `${stripped}${separator}cb=${nonce}`;
}

/** Boards currently occupying a concurrency slot (started and still loading). */
function inFlight(boards: BoardResult[]): number {
  return boards.filter((b) => b.started && b.status === 'loading').length;
}

export interface MoodboardsApi {
  boards: BoardResult[];
  /** True while at least one board is still loading. */
  isGenerating: boolean;
  /** True once a batch has been produced (any status). */
  hasResults: boolean;
  /** True when the selection changed after results were produced. */
  stale: boolean;
  /** Per-image timeout (ms) for board cards, from config. */
  timeoutMs: number;
  /** Start a new batch for the given selection, replacing any prior one. */
  generate: (selection: Selection) => void;
  /** Mark the current results stale (selection changed). */
  markStale: () => void;
  onBoardLoaded: (id: string) => void;
  onBoardError: (id: string) => void;
  /** Manually retry a single board after it errored. */
  retryBoard: (id: string) => void;
}

/**
 * Owns the batch of boards and drives a **bounded-concurrency queue**:
 * at most `concurrency` image requests are in flight, new ones start staggered,
 * and transient failures auto-retry with exponential backoff. Pollinations gates
 * browser-origin requests to ~2 per short window (extra ones get a 403 the
 * browser ORB-blocks), so the default config is concurrency 1 (fully sequential)
 * — each request starts only after the previous settles — which stays under the
 * limit and makes all four boards succeed. See lib/config.ts.
 */
export function useMoodboards(): MoodboardsApi {
  const config = useMemo(() => getGenConfig(), []);
  const [boards, setBoards] = useState<BoardResult[]>([]);
  const [stale, setStale] = useState(false);

  const boardsRef = useRef<BoardResult[]>([]);
  useEffect(() => {
    boardsRef.current = boards;
  }, [boards]);

  const timersRef = useRef<number[]>([]);
  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
  }, []);
  useEffect(() => clearTimers, [clearTimers]);

  const startBoard = useCallback((id: string) => {
    setBoards((prev) => prev.map((b) => (b.id === id ? { ...b, started: true } : b)));
  }, []);

  // Pump the queue: whenever there is spare capacity and a not-yet-started
  // board, start the next one — staggered if something is already in flight.
  useEffect(() => {
    if (inFlight(boards) >= config.concurrency) return;
    const next = boards.find((b) => !b.started);
    if (!next) return;
    const delay = inFlight(boards) === 0 ? 0 : config.staggerMs;
    const timer = window.setTimeout(() => startBoard(next.id), delay);
    timersRef.current.push(timer);
    return () => window.clearTimeout(timer);
  }, [boards, config.concurrency, config.staggerMs, startBoard]);

  const generate = useCallback(
    (selection: Selection) => {
      clearTimers();
      setStale(false);
      setBoards(generateBoards(selection)); // all started:false; queue pumps them
    },
    [clearTimers],
  );

  const markStale = useCallback(() => setStale(true), []);

  const onBoardLoaded = useCallback((id: string) => {
    setBoards((prev) => prev.map((b) => (b.id === id ? { ...b, status: 'ready' } : b)));
  }, []);

  const onBoardError = useCallback(
    (id: string) => {
      const current = boardsRef.current.find((b) => b.id === id);
      if (!current) return;

      if (current.retries < config.maxAutoRetries) {
        // Transient (rate-limit / ORB): keep the slot, back off, re-request.
        const backoff = Math.min(
          config.retryBaseMs * 2 ** current.retries,
          config.retryMaxMs,
        );
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
        }, backoff);
        timersRef.current.push(timer);
      } else {
        // Give up → error tile; slot frees and the queue pumps the next board.
        setBoards((prev) => prev.map((b) => (b.id === id ? { ...b, status: 'error' } : b)));
      }
    },
    [config.maxAutoRetries, config.retryBaseMs, config.retryMaxMs],
  );

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
    timeoutMs: config.timeoutMs,
    generate,
    markStale,
    onBoardLoaded,
    onBoardError,
    retryBoard,
  };
}
