import { describe, expect, it } from 'vitest';
import { buildPrompt } from '../lib/prompt';
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

  it('reinforces the style with its description (CR-5)', () => {
    const prompt = buildPrompt(base).toLowerCase();
    // Traditional: "Classic elegance with timeless furniture and patterns"
    expect(prompt).toContain('classic elegance');
    expect(prompt).toContain('timeless furniture');
  });

  it('describes the palette in words and demands it scene-wide (CR-5)', () => {
    const prompt = buildPrompt(base).toLowerCase();
    // Pastels: "Soft pinks, lavenders, and gentle mint greens"
    expect(prompt).toContain('soft pinks');
    expect(prompt).toContain('lavenders');
    expect(prompt).toContain('mint greens');
    expect(prompt).toContain('strict');
    expect(prompt).toContain('across walls, furniture and decor');
  });

  it('includes the per-board variation hint', () => {
    expect(buildPrompt(base)).toContain('bright and airy composition');
  });

  it('asks for a photorealistic interior photograph', () => {
    const prompt = buildPrompt(base).toLowerCase();
    expect(prompt).toContain('photorealistic');
    expect(prompt).toContain('interior');
  });

  it('requests restrained decorative artifacts with the room as the focus (AC-14)', () => {
    const prompt = buildPrompt(base).toLowerCase();
    expect(prompt).toContain('artifacts');
    expect(prompt).toContain('focal point');
    // Keeps artifacts a minor accent, not the subject.
    expect(prompt).toContain('20-25%');
    expect(prompt).toContain('uncluttered');
    // A few representative artifact cues.
    for (const cue of ['artwork', 'plant', 'vase', 'rug']) {
      expect(prompt).toContain(cue);
    }
  });
});
