import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

// Helper function to clear the database before each test
async function clearDatabase() {
    try {
        // Delete all records in reverse order of dependencies
        await prisma.userGuess.deleteMany({});
        await prisma.gamePlayerConfig.deleteMany({});
        await prisma.game.deleteMany({});
    } catch (error) {
        console.error('Error clearing database:', error);
    }
}

test.describe('Create Game Page', () => {
    test.beforeEach(async ({ page }) => {
        // Clear the database before each test
        await clearDatabase();

        // Read the mock fetch implementation
        const mockFetchPath = path.join(__dirname, 'setup', 'mockFetch.js');
        const mockFetchContent = fs.readFileSync(mockFetchPath, 'utf8');

        // Add the mock fetch implementation to the page
        await page.addInitScript(mockFetchContent);
    });

    test('should create a basic game', async ({ page }) => {
        // Navigate to the home page
        await page.goto('/');

        // Wait for the page to load
        await page.waitForSelector('h1', { state: 'visible' });

        // Search for a player
        const createPageSearchInput = page.getByPlaceholder('Search for a player');
        await createPageSearchInput.fill('Mike Trout');
        await page.waitForTimeout(500); // Wait for search results

        // Select the first player from the results
        await page.getByText('Mike Trout').first().click();

        // Wait for player stats to load
        await page.waitForSelector('[data-testid="player-stats"]', { state: 'visible' });

        // Click on the "Generate Shareable Link" button
        await page.getByRole('button', { name: 'Generate Shareable Link' }).click();

        // Wait for the game URL to be displayed
        await page.waitForSelector('a[href^="http://localhost:3000/game/"]', { state: 'visible' });

        // Get the game URL
        const gameUrlElement = await page.locator('a[href^="http://localhost:3000/game/"]');
        const gameUrl = await gameUrlElement.getAttribute('href');
        console.log('Game URL:', gameUrl);

        // Verify that a game URL was generated
        expect(gameUrl).toBeTruthy();
        expect(gameUrl).toContain('http://localhost:3000/game/');
    });
});

// Clean up after all tests
test.afterAll(async () => {
    await prisma.$disconnect();
}); 