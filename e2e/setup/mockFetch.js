
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
                    const gameId = `test-${Math.random().toString(36).substring(2, 12)}`;
                    const configId = `config-${Math.random().toString(36).substring(2, 12)}`;
                    
                    // Create the game record
                    const game = {
                      id: gameId,
                      title: body.title || `${body.player_id}`,
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
                    
                    console.log('Game URL:', `http://localhost:3000/game/${gameId}`);
                    
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
                  const idMatch = urlObj.search.match(/id=eq\.([^&]+)/);
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
                          id: `config-${gameId}`,
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
        