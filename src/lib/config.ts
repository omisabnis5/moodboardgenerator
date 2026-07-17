/**
 * Runtime-tunable generation settings. Production uses the defaults; tests (and
 * advanced users) can override via `window.__MB_CONFIG__` before the app mounts,
 * which lets E2E shrink the timings for fast, deterministic runs without
 * weakening production reliability.
 */
export interface GenConfig {
  /** Max image requests in flight at once (queue width). */
  concurrency: number;
  /** Delay between starting successive queued requests. */
  staggerMs: number;
  /** Base delay for exponential backoff between auto-retries. */
  retryBaseMs: number;
  /** Cap for the exponential backoff delay. */
  retryMaxMs: number;
  /** Auto-retries per board before showing an error tile. */
  maxAutoRetries: number;
  /** Per-image load timeout before it is treated as failed. */
  timeoutMs: number;
}

export const DEFAULT_GEN_CONFIG: GenConfig = {
  concurrency: 1,
  staggerMs: 1500,
  retryBaseMs: 5000,
  retryMaxMs: 30000,
  maxAutoRetries: 5,
  timeoutMs: 60000,
};

declare global {
  interface Window {
    __MB_CONFIG__?: Partial<GenConfig>;
  }
}

/** Resolve the effective config, applying any runtime override. */
export function getGenConfig(): GenConfig {
  const override =
    typeof window !== 'undefined' ? window.__MB_CONFIG__ : undefined;
  return override ? { ...DEFAULT_GEN_CONFIG, ...override } : DEFAULT_GEN_CONFIG;
}
