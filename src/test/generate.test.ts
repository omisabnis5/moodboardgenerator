import { describe, expect, it } from 'vitest';
import { BOARD_COUNT, generateBoards } from '../lib/generate';
import { PollinationsProvider } from '../lib/imageProvider';
import type { Selection } from '../types';

const selection: Selection = {
  roomType: 'kitchen',
  style: 'traditional',
  colorPalette: 'pastels',
};

describe('generateBoards (FR-8, AC-5)', () => {
  it('produces exactly 4 boards', () => {
    const boards = generateBoards(selection);
    expect(boards).toHaveLength(BOARD_COUNT);
    expect(BOARD_COUNT).toBe(4);
  });

  it('gives each board a distinct seed', () => {
    const seeds = generateBoards(selection).map((b) => b.seed);
    expect(new Set(seeds).size).toBe(seeds.length);
  });

  it('gives each board a distinct image URL', () => {
    const urls = generateBoards(selection).map((b) => b.imageUrl);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it('starts every board in the loading state with a label and alt text', () => {
    const boards = generateBoards(selection);
    for (const board of boards) {
      expect(board.status).toBe('loading');
      expect(board.label).toBe('Kitchen · Traditional · Pastels');
      expect(board.alt).toContain('Kitchen · Traditional · Pastels');
      expect(board.imageUrl).toContain('image.pollinations.ai');
    }
  });

  it('encodes the selection into each provider URL', () => {
    const boards = generateBoards(selection, new PollinationsProvider());
    for (const board of boards) {
      const decoded = decodeURIComponent(board.imageUrl).toLowerCase();
      expect(decoded).toContain('kitchen');
      expect(decoded).toContain('traditional');
      expect(decoded).toContain('pastels');
      expect(board.imageUrl).toContain(`seed=${board.seed}`);
    }
  });
});
