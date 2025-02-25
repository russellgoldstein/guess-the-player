/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        // Warning: This allows production builds to successfully complete even if
        // your project has ESLint errors.
        ignoreDuringBuilds: true,
    },
    typescript: {
        // !! WARN !!
        // Dangerously allow production builds to successfully complete even if
        // your project has type errors.
        ignoreBuildErrors: true,
    },
    reactStrictMode: true,
    images: {
        domains: ['img.mlbstatic.com', 'securea.mlb.com', 'www.mlbstatic.com'],
    },
    // Suppress specific warnings during development and testing
    onDemandEntries: {
        // Keep the pages in memory for longer during development
        maxInactiveAge: 25 * 1000,
        // Number of pages to keep in memory
        pagesBufferLength: 2,
    },
    // Custom webpack configuration to suppress specific warnings
    webpack: (config, { dev, isServer }) => {
        // Only apply in development mode
        if (dev) {
            // Filter out specific warnings
            config.infrastructureLogging = {
                level: 'error', // Only show errors, not warnings
            };
        }
        return config;
    },
}

module.exports = nextConfig 