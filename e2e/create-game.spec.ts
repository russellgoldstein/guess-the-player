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

        // Add request logging
        page.on('request', request => {
            console.log(`>> ${request.method()} ${request.url()}`);
        });
        page.on('response', response => {
            console.log(`<< ${response.status()} ${response.url()}`);
        });

        // Mock the MLB API player search endpoint
        await page.route('https://statsapi.mlb.com/api/v1/people/search**', async (route, request) => {
            console.log('Mocking MLB API search request:', request.url());
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    people: [
                        {
                            id: 545361,
                            fullName: 'Mike Trout',
                            firstName: 'Mike',
                            lastName: 'Trout',
                            primaryNumber: '27',
                            currentTeam: { id: 108, name: 'Los Angeles Angels' },
                            primaryPosition: { code: 'CF', name: 'Outfielder' }
                        }
                    ]
                })
            });
        });

        // Mock player stats endpoint with hydrate parameter
        await page.route('https://statsapi.mlb.com/api/v1/people/545361?hydrate=stats(group=hitting,type=yearByYear),awards', async (route, request) => {
            console.log('Mocking MLB API hitting stats request:', request.url());
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    people: [{
                        id: 545361,
                        fullName: 'Mike Trout',
                        firstName: 'Mike',
                        lastName: 'Trout',
                        primaryNumber: '27',
                        currentTeam: { id: 108, name: 'Los Angeles Angels' },
                        primaryPosition: { code: 'CF', name: 'Outfielder' },
                        birthDate: '1991-08-07',
                        height: '6\' 2"',
                        weight: 235,
                        stats: [{
                            group: { displayName: "hitting" },
                            type: { displayName: "yearByYear" },
                            splits: [{
                                season: "2023",
                                team: { name: "Los Angeles Angels" },
                                stat: {
                                    gamesPlayed: 82,
                                    avg: '.274',
                                    homeRuns: 40,
                                    rbi: 95,
                                    ops: '.972',
                                    obp: '.384',
                                    slg: '.588',
                                    hits: 120,
                                    doubles: 25,
                                    triples: 2,
                                    stolenBases: 12,
                                    strikeouts: 95,
                                    walks: 65
                                }
                            }]
                        }]
                    }]
                })
            });
        });

        // Mock player pitching stats endpoint
        await page.route('https://statsapi.mlb.com/api/v1/people/545361?hydrate=stats(group=pitching,type=yearByYear),awards', async (route, request) => {
            console.log('Mocking MLB API pitching stats request:', request.url());
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    people: [{
                        id: 545361,
                        fullName: 'Mike Trout',
                        firstName: 'Mike',
                        lastName: 'Trout',
                        primaryNumber: '27',
                        currentTeam: { id: 108, name: 'Los Angeles Angels' },
                        primaryPosition: { code: 'CF', name: 'Outfielder' },
                        birthDate: '1991-08-07',
                        height: '6\' 2"',
                        weight: 235,
                        stats: []
                    }]
                })
            });
        });
    });

    test('should load the home page', async ({ page }) => {
        // Navigate to the home page
        await page.goto('/');

        // Wait for the page to load and check that it contains key elements
        await expect(page.locator('h1')).toBeVisible();

        // Take a screenshot of the page to inspect what's loaded
        await page.screenshot({ path: 'test-results/home-page.png', fullPage: true });

        // Log the entire page HTML for debugging
        const html = await page.content();
        console.log('Page HTML:', html);

        // Try to find the player-search component
        const hasSearch = await page.locator('.player-search').count() > 0;
        console.log('Has search component:', hasSearch);

        // Try to find input elements that might be the search field
        const inputs = await page.locator('input').all();
        console.log('Number of inputs found:', inputs.length);

        for (let i = 0; i < inputs.length; i++) {
            const input = inputs[i];
            const placeholder = await input.getAttribute('placeholder');
            const testId = await input.getAttribute('data-testid');
            console.log(`Input ${i}:`, { placeholder, testId });
        }
    });

    test('should verify stats selection functionality in create game page', async ({ page }) => {
        // Navigate to the create game page
        await page.goto('/create-game');

        // Wait for the page to load and hydrate
        await expect(page.locator('h1:has-text("Search for a Player")')).toBeVisible();
        await page.waitForLoadState('networkidle');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForLoadState('load');

        // Take a screenshot of the initial page state
        await page.screenshot({ path: 'test-results/initial-page.png' });

        // Log the page content for debugging
        console.log('Initial page content:', await page.content());

        // Wait for client-side hydration to complete
        await page.waitForFunction(() => {
            const input = document.querySelector('input[role="combobox"]');
            const style = input ? window.getComputedStyle(input) : null;
            console.log('Input element:', input);
            console.log('Input style:', style);
            return input && style && style.display !== 'none';
        });

        // Wait for and click the search input
        const searchInput = page.locator('input[role="combobox"]');
        await expect(searchInput).toBeVisible();
        await expect(searchInput).toBeEnabled();

        // Log all inputs on the page for debugging
        const inputs = await page.locator('input').all();
        console.log('Number of inputs found:', inputs.length);
        for (let i = 0; i < inputs.length; i++) {
            const input = inputs[i];
            const placeholder = await input.getAttribute('placeholder');
            const role = await input.getAttribute('role');
            const testId = await input.getAttribute('data-testid');
            console.log(`Input ${i}:`, { placeholder, role, testId });
        }

        // Try to click the input
        await searchInput.click();

        // Set up response promise before typing
        const searchResponsePromise = page.waitForResponse(response =>
            response.url().includes('statsapi.mlb.com/api/v1/people/search') &&
            response.status() === 200
        );

        // Type the search query
        await searchInput.fill('Trout');

        // Wait for the search response
        await searchResponsePromise;

        // Wait for the Command menu to show results
        await page.waitForSelector('[role="listbox"]', { state: 'visible' });

        // Take a screenshot of search results for debugging
        await page.screenshot({ path: 'test-results/search-results.png' });

        // Log the search results for debugging
        const searchResults = await page.locator('[role="listbox"]').innerHTML();
        console.log('Search results HTML:', searchResults);

        // Click on Mike Trout in the search results
        await page.waitForSelector('[data-testid="player-option-545361"]', { state: 'visible' });
        await page.getByTestId('player-option-545361').click();

        // Set up response promises for player data
        const [hittingResponse, pitchingResponse] = await Promise.all([
            page.waitForResponse(response =>
                response.url().includes('statsapi.mlb.com/api/v1/people/545361') &&
                response.url().includes('hydrate=stats(group=hitting') &&
                response.status() === 200
            ),
            page.waitForResponse(response =>
                response.url().includes('statsapi.mlb.com/api/v1/people/545361') &&
                response.url().includes('hydrate=stats(group=pitching') &&
                response.status() === 200
            )
        ]);

        // Take a screenshot after player selection
        await page.screenshot({ path: 'test-results/player-selected.png' });

        // Wait for player info and stats sections to appear
        await expect(page.locator('h1:has-text("Mike Trout")')).toBeVisible();
        await expect(page.locator('text=Hitting Statistics')).toBeVisible();

        // Test stats selection functionality
        // First, verify initial state - all stats should be selected by default
        const initialGreenStats = await page.locator('.text-green-600').count();
        console.log('Initial green (selected) stats:', initialGreenStats);
        expect(initialGreenStats).toBeGreaterThan(0);

        // Click Deselect All and verify stats are deselected
        const deselectAllButton = page.getByRole('button', { name: /Deselect All/i }).first();
        await deselectAllButton.click();
        await page.waitForTimeout(500);

        // Take a screenshot after clicking Deselect All
        await page.screenshot({ path: 'test-results/after-deselect.png' });

        // Verify stats are deselected (should be red)
        const redStatsAfterDeselect = await page.locator('.text-red-600').count();
        console.log('Red (deselected) stats after Deselect All:', redStatsAfterDeselect);
        expect(redStatsAfterDeselect).toBeGreaterThan(0);
        expect(await page.locator('.text-green-600').count()).toBe(0);

        // Click Select All and verify stats are selected
        const selectAllButton = page.getByRole('button', { name: /Select All/i }).first();
        await selectAllButton.click();
        await page.waitForTimeout(500);

        // Take a screenshot after clicking Select All
        await page.screenshot({ path: 'test-results/after-select.png' });

        // Verify stats are selected (should be green)
        const greenStatsAfterSelect = await page.locator('.text-green-600').count();
        console.log('Green (selected) stats after Select All:', greenStatsAfterSelect);
        expect(greenStatsAfterSelect).toBeGreaterThan(0);
        expect(await page.locator('.text-red-600').count()).toBe(0);
    });
});

// Clean up after all tests
test.afterAll(async () => {
    await prisma.$disconnect();
}); 