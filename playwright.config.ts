import { defineConfig, devices } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Ensure the logs directory exists
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Set test-specific environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'file:./test.db';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

export default defineConfig({
    testDir: './e2e',
    timeout: 30000,
    expect: {
        timeout: 30000,
    },
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 1,
    workers: process.env.CI ? 1 : undefined,
    reporter: [
        ['html', { open: 'never', port: 9324 }]
    ],
    globalSetup: './e2e/setup/test-setup.ts',
    use: {
        baseURL: 'http://localhost:3000',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'on',
        actionTimeout: 15000,
        navigationTimeout: 30000,
        // Disable CORS for testing
        launchOptions: {
            args: ['--disable-web-security']
        },
        // Prevent service workers from interfering with mocks
        contextOptions: {
            serviceWorkers: 'block'
        }
    },
    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                permissions: ['clipboard-read', 'clipboard-write'],
            },
        },
        {
            name: 'firefox',
            use: {
                ...devices['Desktop Firefox'],
                launchOptions: {
                    firefoxUserPrefs: {
                        'dom.events.testing.asyncClipboard': true,
                    },
                },
            },
        },
        {
            name: 'webkit',
            use: {
                ...devices['Desktop Safari'],
            },
        },
    ],
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
        // Redirect stdout and stderr to files instead of console
        stdout: 'file:logs/webserver-stdout.log',
        stderr: 'file:logs/webserver-stderr.log',
        env: {
            NODE_ENV: 'test',
            DATABASE_URL: 'file:./test.db',
            NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
            NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key'
        }
    },
}); 