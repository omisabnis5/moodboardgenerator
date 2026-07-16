import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

const FIXTURE = readFileSync(new URL('./fixtures/board.jpg', import.meta.url));
const IMAGE_GLOB = '**://image.pollinations.ai/**';

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

  test('generates exactly 4 distinct boards (AC-4, AC-5)', async ({ page }) => {
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
    // Four distinct seeds → four distinct images.
    expect(seeds.size).toBe(4);
  });

  test('a failed board shows an error tile with a working Retry (AC-7)', async ({ page }) => {
    let failFirstBoard = true;
    await page.route(IMAGE_GLOB, (route) => {
      const seed = new URL(route.request().url()).searchParams.get('seed');
      if (failFirstBoard && seed === '101') {
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
    await expect(retry.first()).toBeVisible({ timeout: 25_000 });

    // Now let the provider succeed and retry manually.
    failFirstBoard = false;
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

    // Change the room → results marked stale.
    await page.getByRole('radio', { name: /^Bedroom/ }).click();
    await expect(page.getByTestId('results-status')).toContainText('changed');

    // Regenerate → back to ready with a fresh set of 4.
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
