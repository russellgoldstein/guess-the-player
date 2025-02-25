// This file is used to set up the test environment

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

// Store the original console.error
const originalConsoleError = console.error;

// Override console.error to filter out specific warnings
console.error = function (...args) {
    const errorMessage = args.join(' ');

    // Skip specific Next.js warnings related to cookies
    if (
        errorMessage.includes('cookies()') &&
        errorMessage.includes('should be awaited') ||
        errorMessage.includes('Use of deprecated punycode module')
    ) {
        return; // Suppress these specific warnings
    }

    // Pass through all other errors
    originalConsoleError.apply(console, args);
};

// Initialize Prisma client
const prisma = new PrismaClient();

// Global setup function
async function globalSetup() {
    // Set environment variables for test
    process.env.NODE_ENV = 'test';

    // Use a test-specific database
    process.env.DATABASE_URL = 'file:./test.db';

    // Use mock Supabase credentials for tests
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

    try {
        // Ensure we're in the right directory
        const projectRoot = process.cwd();

        // Create mocks directory if it doesn't exist
        const mocksDir = path.join(projectRoot, 'src', 'lib', '__mocks__');
        if (!fs.existsSync(mocksDir)) {
            fs.mkdirSync(mocksDir, { recursive: true });
        }

        // Create mock supabaseClient.ts
        const mockSupabasePath = path.join(mocksDir, 'supabaseClient.ts');
        fs.writeFileSync(mockSupabasePath, `
            import { createClient } from '@supabase/supabase-js';
            import { PrismaClient } from '@prisma/client';

            // Initialize Prisma client for local database operations
            const prisma = new PrismaClient();

            // Mock Supabase client that uses Prisma instead of actual Supabase
            const mockSupabase = {
                from: (table: string) => ({
                    select: (query?: string) => {
                        return {
                            data: null,
                            error: null,
                            eq: (field: string, value: any) => {
                                return {
                                    single: async () => {
                                        try {
                                            let data = null;

                                            if (table === 'games') {
                                                // Find the game with the specified ID
                                                const game = await prisma.game.findUnique({
                                                    where: { id: value },
                                                    include: {
                                                        game_player_config: true
                                                    }
                                                });

                                                if (game) {
                                                    // Format the data to match what the game page expects
                                                    data = {
                                                        id: game.id,
                                                        title: game.title || 'Test Game',
                                                        creator_id: game.creator_id,
                                                        game_player_config: game.game_player_config.map(config => ({
                                                            id: config.id,
                                                            player_id: config.player_id,
                                                            stats_config: config.stats_config as any,
                                                            game_options: config.game_options as any
                                                        }))
                                                    };
                                                }
                                            }

                                            return { data, error: null };
                                        } catch (error) {
                                            console.error('Error in mock Supabase client:', error);
                                            return { data: null, error };
                                        }
                                    },
                                    execute: async () => {
                                        try {
                                            let data = null;

                                            if (table === 'games') {
                                                const games = await prisma.game.findMany({
                                                    where: { [field]: value },
                                                    include: {
                                                        game_player_config: true
                                                    }
                                                });

                                                data = games.map(game => ({
                                                    id: game.id,
                                                    title: game.title || 'Test Game',
                                                    creator_id: game.creator_id,
                                                    game_player_config: game.game_player_config.map(config => ({
                                                        id: config.id,
                                                        player_id: config.player_id,
                                                        stats_config: config.stats_config as any,
                                                        game_options: config.game_options as any
                                                    }))
                                                }));
                                            }

                                            return { data, error: null };
                                        } catch (error) {
                                            console.error('Error in mock Supabase client:', error);
                                            return { data: null, error };
                                        }
                                    }
                                };
                            },
                            execute: async () => {
                                try {
                                    let data = null;

                                    if (table === 'games') {
                                        const games = await prisma.game.findMany({
                                            include: {
                                                game_player_config: true
                                            }
                                        });

                                        data = games.map(game => ({
                                            id: game.id,
                                            title: game.title || 'Test Game',
                                            creator_id: game.creator_id,
                                            game_player_config: game.game_player_config.map(config => ({
                                                id: config.id,
                                                player_id: config.player_id,
                                                stats_config: config.stats_config as any,
                                                game_options: config.game_options as any
                                            }))
                                        }));
                                    }

                                    return { data, error: null };
                                } catch (error) {
                                    console.error('Error in mock Supabase client:', error);
                                    return { data: null, error };
                                }
                            }
                        };
                    },
                    insert: (data: any) => ({
                        select: () => ({
                            single: async () => {
                                try {
                                    let result = null;

                                    if (table === 'games') {
                                        result = await prisma.game.create({
                                            data: {
                                                id: data.id || data[0].id,
                                                title: data.title || data[0].title || 'Test Game',
                                                creator_id: data.creator_id || data[0].creator_id || null
                                            }
                                        });
                                    } else if (table === 'game_player_config') {
                                        result = await prisma.gamePlayerConfig.create({
                                            data: {
                                                id: data.id || data[0].id,
                                                game_id: data.game_id || data[0].game_id,
                                                player_id: data.player_id || data[0].player_id,
                                                stats_config: data.stats_config || data[0].stats_config,
                                                game_options: data.game_options || data[0].game_options
                                            }
                                        });
                                    } else if (table === 'user_guesses') {
                                        result = await prisma.userGuess.create({
                                            data: {
                                                id: data.id || data[0].id,
                                                game_id: data.game_id || data[0].game_id,
                                                user_id: data.user_id || data[0].user_id || null,
                                                player_id: data.player_id || data[0].player_id,
                                                is_correct: data.is_correct || data[0].is_correct || false
                                            }
                                        });
                                    }

                                    return { data: result, error: null };
                                } catch (error) {
                                    console.error('Error in mock Supabase client:', error);
                                    return { data: null, error };
                                }
                            }
                        })
                    }),
                    delete: () => ({
                        eq: (field: string, value: any) => ({
                            execute: async () => {
                                try {
                                    if (table === 'games') {
                                        await prisma.game.delete({
                                            where: { id: value }
                                        });
                                    }
                                    return { error: null };
                                } catch (error) {
                                    console.error('Error in mock Supabase client:', error);
                                    return { error };
                                }
                            }
                        })
                    })
                }),
                auth: {
                    getSession: async () => ({
                        data: {
                            session: null
                        },
                        error: null
                    })
                }
            };

            export const supabase = mockSupabase as unknown as ReturnType<typeof createClient>;

            // Helper function to close the Prisma connection when tests are done
            export const closePrismaConnection = async () => {
                await prisma.$disconnect();
            };
        `);

        // Create mock mlbApi.ts
        const mockApiDir = path.join(projectRoot, 'src', 'utils', '__mocks__');
        if (!fs.existsSync(mockApiDir)) {
            fs.mkdirSync(mockApiDir, { recursive: true });
        }

        const mockApiPath = path.join(mockApiDir, 'mlbApi.ts');
        fs.writeFileSync(mockApiPath, `
            export const mockPlayerData = {
                playerInfo: {
                    id: 545361,
                    fullName: "Mike Trout",
                    firstName: "Mike",
                    lastName: "Trout",
                    primaryNumber: "27",
                    currentTeam: { name: "Los Angeles Angels" },
                    primaryPosition: { abbreviation: "CF" },
                    birthDate: "1991-08-07",
                    birthCity: "Vineland",
                    birthStateProvince: "NJ",
                    birthCountry: "USA",
                    height: "6' 2\\"",
                    weight: 235,
                    active: true,
                    imageUrl: "https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/545361/headshot/67/current"
                },
                hittingStats: [{
                    avg: ".296",
                    hr: 40,
                    rbi: 95,
                    obp: ".396",
                    slg: ".596",
                    ops: ".992",
                    sb: 11,
                    r: 82,
                    h: 124,
                    bb: 56,
                    so: 97
                }],
                pitchingStats: []
            };

            export const fetchPlayerData = async (playerId: number) => {
                return mockPlayerData;
            };

            export const searchPlayers = async (query: string) => {
                if (query.toLowerCase().includes('mike trout')) {
                    return [{
                        id: 545361,
                        fullName: "Mike Trout",
                        firstName: "Mike",
                        lastName: "Trout",
                        primaryNumber: "27",
                        currentTeam: { name: "Los Angeles Angels" },
                        primaryPosition: { abbreviation: "CF" }
                    }];
                }
                return [];
            };
        `);

        // Create a mock for the fetch API to intercept API calls during tests
        const mockFetchPath = path.join(projectRoot, 'e2e', 'setup', 'mockFetch.js');
        fs.writeFileSync(mockFetchPath, `
            // Mock fetch implementation for tests
            (function() {
              const originalFetch = window.fetch;
              
              // In-memory storage for test data
              const testData = {
                games: [],
                gamePlayerConfigs: []
              };
              
              window.fetch = async function(url, options) {
                console.log('Intercepted fetch request:', url);
                
                // Handle POST requests to /api/games
                if (url.includes('/api/games') && options?.method === 'POST') {
                  try {
                    const body = JSON.parse(options.body);
                    
                    // Generate a random ID for the game
                    const gameId = \`test-\${Math.random().toString(36).substring(2, 12)}\`;
                    const configId = \`config-\${Math.random().toString(36).substring(2, 12)}\`;
                    
                    // Create the game record
                    const game = {
                      id: gameId,
                      title: body.title || \`Game for \${body.player_id}\`,
                      creator_id: body.creator_id || null,
                      created_at: new Date().toISOString()
                    };
                    
                    // Create the game player config record
                    const config = {
                      id: configId,
                      game_id: gameId,
                      player_id: body.player_id,
                      stats_config: body.stats_config || {
                        info: {
                          selected: ['fullName', 'primaryPosition', 'birthDate', 'height', 'weight'],
                          deselected: []
                        },
                        hitting: {
                          selected: ['avg', 'homeRuns', 'rbi'],
                          deselected: []
                        },
                        pitching: {
                          selected: [],
                          deselected: ['era', 'wins', 'strikeOuts']
                        }
                      },
                      game_options: body.game_options || {
                        maxGuesses: 5,
                        hint: {
                          enabled: true,
                          text: "This player is an outfielder"
                        },
                        progressiveReveal: {
                          enabled: false,
                          statsPerReveal: 1
                        }
                      }
                    };
                    
                    // Store the data in our in-memory storage
                    testData.games.push(game);
                    testData.gamePlayerConfigs.push(config);
                    
                    console.log('Game URL:', \`http://localhost:3000/game/\${gameId}\`);
                    
                    return {
                      ok: true,
                      status: 200,
                      json: async () => ({
                        game,
                        config: [config]
                      })
                    };
                  } catch (error) {
                    console.error('Error in mock fetch:', error);
                    return {
                      ok: false,
                      status: 400,
                      json: async () => ({ error: error.message })
                    };
                  }
                }
                
                // Handle GET requests to /api/games
                if (url.includes('/api/games') && (!options || options.method === 'GET')) {
                  return {
                    ok: true,
                    status: 200,
                    json: async () => {
                      return testData.games.map(game => {
                        return {
                          ...game,
                          game_player_config: testData.gamePlayerConfigs.filter(config => config.game_id === game.id)
                        };
                      });
                    }
                  };
                }
                
                // Handle Supabase API requests for game retrieval
                if (url.includes('/rest/v1/games') && url.includes('select=*')) {
                  // Extract the game ID from the URL
                  const urlObj = new URL(url);
                  const idMatch = urlObj.search.match(/id=eq\\.([^&]+)/);
                  const gameId = idMatch ? idMatch[1] : null;
                  
                  if (gameId) {
                    console.log('Returning mock game data for:', gameId);
                    
                    // Find the game in our in-memory storage
                    const game = testData.games.find(g => g.id === gameId);
                    const configs = testData.gamePlayerConfigs.filter(c => c.game_id === gameId);
                    
                    if (game && configs.length > 0) {
                      return {
                        ok: true,
                        status: 200,
                        json: async () => [{
                          ...game,
                          game_player_config: configs
                        }]
                      };
                    }
                    
                    // If we don't have the game in our storage, return a mock game
                    return {
                      ok: true,
                      status: 200,
                      json: async () => [{
                        id: gameId,
                        title: 'Test Game',
                        creator_id: null,
                        game_player_config: [{
                          id: \`config-\${gameId}\`,
                          player_id: 545361, // Mike Trout's ID
                          stats_config: {
                            info: {
                              selected: ['fullName', 'primaryPosition', 'birthDate', 'height', 'weight'],
                              deselected: []
                            },
                            hitting: {
                              selected: ['avg', 'homeRuns', 'rbi'],
                              deselected: []
                            },
                            pitching: {
                              selected: [],
                              deselected: ['era', 'wins', 'strikeOuts']
                            }
                          },
                          game_options: {
                            maxGuesses: 5,
                            hint: {
                              enabled: true,
                              text: "This player is an outfielder"
                            },
                            progressiveReveal: {
                              enabled: false,
                              statsPerReveal: 1
                            }
                          }
                        }]
                      }]
                    };
                  }
                }
                
                // Pass through all other requests to the original fetch
                return originalFetch(url, options);
              };
            })();
        `);

        // Run migrations
        console.log('Running database migrations...');
        execSync('npx prisma migrate reset --force', {
            stdio: 'inherit',
            cwd: projectRoot,
            env: {
                ...process.env,
                DATABASE_URL: 'file:./test.db',
                NODE_ENV: 'test'
            }
        });

        // Verify database connection
        console.log('Verifying database connection...');
        const gameCount = await prisma.game.count();
        console.log(`Database connection verified. Current game count: ${gameCount}`);

    } catch (error) {
        console.error('Error during database setup:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

export default globalSetup; 