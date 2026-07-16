import { buildPrompt } from './prompt';
import type { GenerateRequest } from '../types';

/**
 * Abstraction over a text-to-image backend. The app depends only on this
 * interface, so a keyed provider (behind a server proxy) can replace the
 * default keyless one without touching the UI.
 */
export interface ImageProvider {
  /** Build the image URL for a single board request. */
  buildImageUrl(request: GenerateRequest): string;
}

export interface PollinationsOptions {
  width?: number;
  height?: number;
  model?: string;
  baseUrl?: string;
}

const DEFAULTS: Required<PollinationsOptions> = {
  width: 1024,
  height: 1024,
  model: 'flux',
  baseUrl: 'https://image.pollinations.ai/prompt',
};

/**
 * Default provider: Pollinations.ai. Keyless and free — the browser requests
 * the returned URL directly (no backend, no secret). A `seed` differentiates
 * the boards in a batch.
 */
export class PollinationsProvider implements ImageProvider {
  private readonly opts: Required<PollinationsOptions>;

  constructor(options: PollinationsOptions = {}) {
    this.opts = { ...DEFAULTS, ...options };
  }

  buildImageUrl(request: GenerateRequest): string {
    const prompt = buildPrompt(request);
    const params = new URLSearchParams({
      width: String(this.opts.width),
      height: String(this.opts.height),
      seed: String(request.seed),
      model: this.opts.model,
      nologo: 'true',
    });
    return `${this.opts.baseUrl}/${encodeURIComponent(prompt)}?${params.toString()}`;
  }
}

/** Shared default instance. */
export const defaultProvider: ImageProvider = new PollinationsProvider();
