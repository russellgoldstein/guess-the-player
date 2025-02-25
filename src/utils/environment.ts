/**
 * Utility functions for environment detection
 */

/**
 * Checks if the current environment is a test environment
 */
export const isTestEnvironment = (): boolean => {
    return process.env.NODE_ENV === 'test';
};

/**
 * Checks if the current environment is a development environment
 */
export const isDevelopmentEnvironment = (): boolean => {
    return process.env.NODE_ENV === 'development';
};

/**
 * Checks if the current environment is a production environment
 */
export const isProductionEnvironment = (): boolean => {
    return process.env.NODE_ENV === 'production';
}; 