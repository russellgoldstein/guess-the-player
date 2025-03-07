const { fetchAwardWinners } = require('../src/utils/mlbApi');
const { generatePlayerConfig } = require('../src/utils/gameUtils');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

interface AwardWinner {
    playerId: number;
    playerName: string;
}

interface GamePlayerConfig {
    id: string;
    player_id: number;
    stats_config: {
        info: {
            selected: string[];
            deselected: string[];
        };
        hitting: {
            selected: string[];
            deselected: string[];
        };
        pitching: {
            selected: string[];
            deselected: string[];
        };
    };
    game_options: {
        maxGuesses: number;
        hint?: {
            enabled: boolean;
            text: string;
        };
        progressiveReveal?: {
            enabled: boolean;
            statsPerReveal: number;
            orderedStats?: {
                info: string[];
                hitting: string[];
                pitching: string[];
            };
            protectedStats?: string[];
        };
    };
}

const saveConfigs = (configs: GamePlayerConfig[], outputPath: string) => {
    // Create data directory if it doesn't exist
    const dataDir = path.dirname(outputPath);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(configs, null, 2));
};

const main = async () => {
    try {
        const outputPath = path.join(__dirname, '..', 'data', 'playerConfigs.json');

        // Load existing configs if they exist
        let configs: GamePlayerConfig[] = [];
        if (fs.existsSync(outputPath)) {
            console.log('Loading existing configs...');
            const existingConfigs = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
            configs = existingConfigs;
            console.log(`Loaded ${configs.length} existing configs`);
        }

        console.log('Fetching award winners...');
        const awardWinners = await fetchAwardWinners();

        // Filter out players we already have configs for
        const existingPlayerIds = new Set(configs.map(c => c.player_id));
        const newWinners = awardWinners.filter((w: AwardWinner) => !existingPlayerIds.has(w.playerId));

        console.log(`Found ${newWinners.length} new award winners to process. Generating configs...`);

        // Process winners in batches of 10 to avoid rate limiting
        const batchSize = 10;
        for (let i = 0; i < newWinners.length; i += batchSize) {
            const batch = newWinners.slice(i, i + batchSize);
            const batchConfigs = await Promise.all(batch.map(async (winner: AwardWinner) => {
                const stats_config = await generatePlayerConfig(winner.playerId);
                if (!stats_config) {
                    console.log(`Failed to generate config for ${winner.playerName} (ID: ${winner.playerId})`);
                    return null;
                }

                const config: GamePlayerConfig = {
                    id: uuidv4(),
                    player_id: winner.playerId,
                    stats_config,
                    game_options: {
                        maxGuesses: 10,
                        hint: {
                            enabled: false,
                            text: ''
                        },
                        progressiveReveal: {
                            enabled: false,
                            statsPerReveal: 3
                        }
                    }
                };

                console.log(`Generated config for ${winner.playerName} (ID: ${winner.playerId})`);
                return config;
            }));

            // Add successful configs to our list
            const validConfigs = batchConfigs.filter((c): c is GamePlayerConfig => c !== null);
            configs.push(...validConfigs);

            // Save after each batch
            saveConfigs(configs, outputPath);
            console.log(`Saved ${configs.length} configs to ${outputPath}`);

            // Add a small delay between batches to avoid rate limiting
            if (i + batchSize < newWinners.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        console.log(`\nFinished! Total configs saved: ${configs.length}`);
        return configs;
    } catch (error) {
        console.error('Error in main:', error);
        return [];
    }
};

// Run the script
main(); 