/**
 * End-to-end tests for game listing, navigation, and filtering.
 */
import { test, expect, type Response } from '@playwright/test';

test.describe('Game Listing and Navigation', () => {
  test('should display games with titles on index page', async ({ page }) => {
    await test.step('Navigate to homepage', async () => {
      await page.goto('/');
    });

    await test.step('Verify games grid is visible', async () => {
      const gamesGrid = page.getByTestId('games-grid');
      await expect(gamesGrid).toBeVisible();
    });

    await test.step('Verify game cards are displayed', async () => {
      const gameCards = page.getByTestId('game-card');
      await expect(gameCards.first()).toBeVisible();
      expect(await gameCards.count()).toBeGreaterThan(0);
    });

    await test.step('Verify game cards have titles with content', async () => {
      const gameCards = page.getByTestId('game-card');
      await expect(gameCards.first().getByTestId('game-title')).toBeVisible();
      await expect(gameCards.first().getByTestId('game-title')).not.toBeEmpty();
    });
  });

  test('should filter games by category and publisher', async ({ page }) => {
    const categoryFilter = page.getByTestId('category-filter-1');
    const secondCategoryFilter = page.getByTestId('category-filter-2');
    const publisherFilter = page.getByTestId('publisher-filter');
    const visibleCards = page.locator('[data-testid="game-card"]:visible');

    await page.goto('/');

    await test.step('Verify filter controls are accessible', async () => {
      await expect(page.getByRole('group', { name: 'Filter by category' })).toBeVisible();
      await expect(categoryFilter).toBeVisible();
      await expect(publisherFilter).toHaveAccessibleName('Filter by publisher');
      await expect(page.getByTestId('clear-filters')).toBeVisible();
    });

    await test.step('Filter by category', async () => {
      await categoryFilter.check();
      await expect(visibleCards).toHaveCount(await page.locator('[data-game-category-id="1"]:visible').count());
      await expect(page.getByTestId('visible-game-count')).not.toHaveText('0');
    });

    await test.step('Combine multiple category filters', async () => {
      await secondCategoryFilter.check();
      await expect(page.getByTestId('visible-game-count')).toHaveText('8');
    });

    await test.step('Combine category and publisher filters', async () => {
      await publisherFilter.selectOption({ label: 'CodeForge Studios' });
      await expect(visibleCards).toHaveCount(2);
      const selectedPublisherId = await publisherFilter.locator('option:checked').getAttribute('value');
      if (selectedPublisherId === null) {
        throw new Error('The selected publisher option must have a value.');
      }
      await expect(visibleCards.first()).toHaveAttribute('data-game-publisher-id', selectedPublisherId);
    });

    await test.step('Show an empty state when no games match', async () => {
      await page.locator('[data-testid="category-filter-1"]').uncheck();
      await page.locator('[data-testid="category-filter-2"]').uncheck();
      await categoryFilter.evaluate((input) => {
        input.dataset.categoryId = 'missing-category';
        (input as HTMLInputElement).checked = true;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await expect(page.getByTestId('filter-empty-state')).toBeVisible();
      await expect(page.getByTestId('visible-game-count')).toHaveText('0');
    });

    await test.step('Clear filters', async () => {
      await page.getByTestId('clear-filters').click();
      await expect(visibleCards).toHaveCount(await page.locator('[data-testid="game-card"]').count());
    });
  });

  test('should navigate to correct game details page when clicking on a game', async ({ page }) => {
    let gameId: string | null;
    let gameTitle: string | null;

    await test.step('Navigate to homepage and wait for games to load', async () => {
      await page.goto('/');
      const gamesGrid = page.getByTestId('games-grid');
      await expect(gamesGrid).toBeVisible();
    });

    await test.step('Get first game information and click it', async () => {
      const firstGameCard = page.getByTestId('game-card').first();
      gameId = await firstGameCard.getAttribute('data-game-id');
      gameTitle = await firstGameCard.getAttribute('data-game-title');
      await firstGameCard.click();
    });

    await test.step('Verify navigation to game details page', async () => {
      await expect(page).toHaveURL(`/game/${gameId}`);
      await expect(page.getByTestId('game-details')).toBeVisible();
    });

    await test.step('Verify game title matches clicked game', async () => {
      if (gameTitle) {
        await expect(page.getByTestId('game-details-title')).toHaveText(gameTitle);
      }
    });
  });

  test('should display game details with all required information', async ({ page }) => {
    await test.step('Navigate to specific game details page', async () => {
      await page.goto('/game/1');
      await expect(page.getByTestId('game-details')).toBeVisible();
    });

    await test.step('Verify game title is displayed', async () => {
      const gameTitle = page.getByTestId('game-details-title');
      await expect(gameTitle).toBeVisible();
      await expect(gameTitle).not.toBeEmpty();
    });

    await test.step('Verify game description is displayed', async () => {
      const gameDescription = page.getByTestId('game-details-description');
      await expect(gameDescription).toBeVisible();
      await expect(gameDescription).not.toBeEmpty();
    });

    await test.step('Verify publisher or category information is present', async () => {
      const publisherExists = await page.getByTestId('game-details-publisher').isVisible();
      const categoryExists = await page.getByTestId('game-details-category').isVisible();
      expect(publisherExists || categoryExists).toBeTruthy();

      if (publisherExists) {
        await expect(page.getByTestId('game-details-publisher')).not.toBeEmpty();
      }

      if (categoryExists) {
        await expect(page.getByTestId('game-details-category')).not.toBeEmpty();
      }
    });
  });

  test('should display a button to back the game', async ({ page }) => {
    await test.step('Navigate to game details page', async () => {
      await page.goto('/game/1');
      await expect(page.getByTestId('game-details')).toBeVisible();
    });

    await test.step('Verify back game button is visible and enabled', async () => {
      const backButton = page.getByTestId('back-game-button');
      await expect(backButton).toBeVisible();
      await expect(backButton).toContainText('Support This Game');
      await expect(backButton).toBeEnabled();
    });
  });

  test('should be able to navigate back to home from game details', async ({ page }) => {
    await test.step('Navigate to game details page', async () => {
      await page.goto('/game/1');
      await expect(page.getByTestId('game-details')).toBeVisible();
    });

    await test.step('Click back to all games link', async () => {
      const backLink = page.getByRole('link', { name: /back to all games/i });
      await expect(backLink).toBeVisible();
      await backLink.click();
    });

    await test.step('Verify navigation back to homepage', async () => {
      await expect(page).toHaveURL('/');
      await expect(page.getByTestId('games-grid')).toBeVisible();
    });
  });

  test('should return a 404 page for a non-existent game', async ({ page }) => {
    let response: Response | null;

    await test.step('Navigate to non-existent game', async () => {
      response = await page.goto('/game/99999');
    });

    await test.step('Verify a branded 404 page is served', async () => {
      expect(response?.status()).toBe(404);
      await expect(page).toHaveTitle(/Page Not Found - Tailspin Toys/);
      await expect(page.getByTestId('not-found')).toBeVisible();
      await expect(page.getByTestId('not-found-heading')).not.toBeEmpty();
      await expect(page.getByTestId('not-found-home-link')).toBeVisible();
    });
  });
});
