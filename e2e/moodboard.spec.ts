import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

const FIXTURE = readFileSync(new URL('./fixtures/board.jpg', import.meta.url));
const IMAGE_GLOB = '**://image.pollinations.ai/**';

/** Shrink generation timings so the queue/retry paths run fast & deterministic. */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__MB_CONFIG__ = {
      concurrency: 2,
      staggerMs: 40,
      retryBaseMs: 40,
      retryMaxMs: 120,
      maxAutoRetries: 2,
      timeoutMs: 4000,
    };
  });
});

/** Intercept all provider image requests and serve the local fixture. */
async function stubImages(page: Page): Promise<void> {
  await page.route(IMAGE_GLOB, (route) => {
    route.fulfill({ status: 200, contentType: 'image/jpeg', body: FIXTURE });
  });
}

async function selectKitchenTraditionalPastels(page: Page): Promise<void> {
  await page.getByRole('radio', { name: /^Kitchen/ }).click();
  await page.getByRole('radio', { name: /^Traditional/ }).click();
  await page.getByRole('radio', { name: /^Pastels/ }).click();
}

const generateButton = (page: Page) =>
  page.getByRole('button', { name: /Generate mood boards/ });

test.describe('Mood Board Generator', () => {
  test('renders all three option groups with the expected counts (AC-1)', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('radiogroup', { name: 'Room Type' }).getByRole('radio')).toHaveCount(8);
    await expect(page.getByRole('radiogroup', { name: 'Style' }).getByRole('radio')).toHaveCount(8);
    await expect(page.getByRole('radiogroup', { name: 'Color Palette' }).getByRole('radio')).toHaveCount(6);
  });

  test('Generate is disabled until all three groups are selected (AC-2)', async ({ page }) => {
    await page.goto('/');
    await expect(generateButton(page)).toBeDisabled();
    await page.getByRole('radio', { name: /^Kitchen/ }).click();
    await expect(generateButton(page)).toBeDisabled();
    await page.getByRole('radio', { name: /^Traditional/ }).click();
    await expect(generateButton(page)).toBeDisabled();
    await page.getByRole('radio', { name: /^Pastels/ }).click();
    await expect(generateButton(page)).toBeEnabled();
  });

  test('each group is single-select (AC-3)', async ({ page }) => {
    await page.goto('/');
    const kitchen = page.getByRole('radio', { name: /^Kitchen/ });
    const bedroom = page.getByRole('radio', { name: /^Bedroom/ });
    await kitchen.click();
    await expect(kitchen).toHaveAttribute('aria-checked', 'true');
    await bedroom.click();
    await expect(bedroom).toHaveAttribute('aria-checked', 'true');
    await expect(kitchen).toHaveAttribute('aria-checked', 'false');
  });

  test('keyboard arrow keys move the selection (AC-10)', async ({ page }) => {
    await page.goto('/');
    const living = page.getByRole('radio', { name: /^Living Room/ });
    const dining = page.getByRole('radio', { name: /^Dining Room/ });
    await living.click();
    await expect(living).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(dining).toHaveAttribute('aria-checked', 'true');
    await expect(dining).toBeFocused();
  });

  test('two-pane on wide screens, stacked on narrow (AC-12)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');
    const controls = page.locator('.app-layout__controls');
    const results = page.locator('.app-layout__results');

    const c1 = (await controls.boundingBox())!;
    const r1 = (await results.boundingBox())!;
    // Side by side: results start to the right of the controls' midpoint.
    expect(r1.x).toBeGreaterThan(c1.x + c1.width / 2);

    await page.setViewportSize({ width: 480, height: 900 });
    const c2 = (await controls.boundingBox())!;
    const r2 = (await results.boundingBox())!;
    // Stacked: results sit below the controls.
    expect(r2.y).toBeGreaterThan(c2.y + c2.height / 2);
  });

  test('generates exactly 4 distinct boards, all ready (AC-4, AC-5, AC-13, AC-15)', async ({ page }) => {
    const seeds = new Set<string>();
    await page.route(IMAGE_GLOB, (route) => {
      const seed = new URL(route.request().url()).searchParams.get('seed');
      if (seed) seeds.add(seed);
      route.fulfill({ status: 200, contentType: 'image/jpeg', body: FIXTURE });
    });

    await page.goto('/');
    await selectKitchenTraditionalPastels(page);
    await generateButton(page).click();

    const cards = page.getByTestId('board-card');
    await expect(cards).toHaveCount(4);
    await expect(page.getByTestId('results-status')).toContainText('ready', { timeout: 20_000 });

    const images = page.locator('.board-card__img');
    await expect(images).toHaveCount(4);
    for (let i = 0; i < 4; i++) {
      await expect(images.nth(i)).toBeVisible();
    }
    // No board errored (AC-15) and four distinct seeds requested (AC-5/AC-13).
    await expect(page.getByRole('button', { name: 'Retry' })).toHaveCount(0);
    expect(seeds.size).toBe(4);
  });

  test('a failed board shows an error tile with a working Retry (AC-7)', async ({ page }) => {
    let failing = true;
    let firstSeed: string | null = null;
    await page.route(IMAGE_GLOB, (route) => {
      const seed = new URL(route.request().url()).searchParams.get('seed');
      if (firstSeed === null) firstSeed = seed;
      if (failing && seed === firstSeed) {
        route.fulfill({ status: 500, contentType: 'text/plain', body: 'error' });
      } else {
        route.fulfill({ status: 200, contentType: 'image/jpeg', body: FIXTURE });
      }
    });

    await page.goto('/');
    await selectKitchenTraditionalPastels(page);
    await generateButton(page).click();

    // Auto-retries are exhausted, then the error tile appears.
    const retry = page.getByRole('button', { name: 'Retry' });
    await expect(retry.first()).toBeVisible({ timeout: 20_000 });

    // Now let the provider succeed and retry manually.
    failing = false;
    await retry.first().click();
    await expect(page.getByRole('button', { name: 'Retry' })).toHaveCount(0, { timeout: 20_000 });
    await expect(page.locator('.board-card__img')).toHaveCount(4);
  });

  test('changing a selection marks results stale, regenerate replaces (AC-8)', async ({ page }) => {
    await stubImages(page);
    await page.goto('/');
    await selectKitchenTraditionalPastels(page);
    await generateButton(page).click();
    await expect(page.getByTestId('results-status')).toContainText('ready', { timeout: 20_000 });

    await page.getByRole('radio', { name: /^Bedroom/ }).click();
    await expect(page.getByTestId('results-status')).toContainText('changed');

    await generateButton(page).click();
    await expect(page.getByTestId('results-status')).toContainText('ready', { timeout: 20_000 });
    await expect(page.getByTestId('board-card')).toHaveCount(4);
  });

  test('a board can be downloaded (AC-9)', async ({ page }) => {
    await stubImages(page);
    await page.goto('/');
    await selectKitchenTraditionalPastels(page);
    await generateButton(page).click();
    await expect(page.getByTestId('results-status')).toContainText('ready', { timeout: 20_000 });

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download' }).first().click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/kitchen-traditional-pastels-board-\d\.jpg/);
  });
});
