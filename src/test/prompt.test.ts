import { describe, expect, it } from 'vitest';
import { buildPrompt } from '../lib/prompt';
import { PALETTE_HEX } from '../data/options';
import type { GenerateRequest } from '../types';

const base: GenerateRequest = {
  roomType: 'kitchen',
  style: 'traditional',
  colorPalette: 'pastels',
  seed: 101,
  variationHint: 'bright and airy composition',
};

describe('buildPrompt (AC-6, security)', () => {
  it('mentions the selected room, style and palette by label', () => {
    const prompt = buildPrompt(base).toLowerCase();
    expect(prompt).toContain('kitchen');
    expect(prompt).toContain('traditional');
    expect(prompt).toContain('pastels');
  });

  it('embeds the palette hex tones to steer color', () => {
    const prompt = buildPrompt(base);
    for (const hex of PALETTE_HEX.pastels) {
      expect(prompt).toContain(hex);
    }
  });

  it('includes the per-board variation hint', () => {
    expect(buildPrompt(base)).toContain('bright and airy composition');
  });

  it('asks for a photorealistic interior photograph', () => {
    const prompt = buildPrompt(base).toLowerCase();
    expect(prompt).toContain('photorealistic');
    expect(prompt).toContain('interior');
  });
});
