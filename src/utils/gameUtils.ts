import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { v4 as uuidv4 } from 'uuid';
import { cookies } from 'next/headers';
import { fetchAwardWinners, fetchPlayerData } from './mlbApi';

interface GamePlayerConfig {
    id: string;
    game_id: string;
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

interface CreateGameResult {
    game: {
        id: string;
        title: string;
        creator_id: string | null;
        created_at: string;
    };
    config: GamePlayerConfig[];
}

export const generatePlayerConfig = async (playerId: number): Promise<GamePlayerConfig['stats_config'] | null> => {
    try {
        const data = await fetchPlayerData(playerId);

        if (!data.playerInfo) {
            console.error(`No player info found for player ID: ${playerId}`);
            return null;
        }

        // Determine if player is primarily a pitcher
        const isPitcher = data.playerInfo.primaryPosition === 'Pitcher';

        // Get all available hitting and pitching stat keys
        const hittingKeys = data.hittingStats.length > 0
            ? Object.keys(data.hittingStats[0]).filter(key => !['teamDetails'].includes(key))
            : [];
        const pitchingKeys = data.pitchingStats.length > 0
            ? Object.keys(data.pitchingStats[0]).filter(key => !['teamDetails'].includes(key))
            : [];

        return {
            info: {
                selected: [],
                deselected: Object.keys(data.playerInfo)
            },
            hitting: {
                selected: isPitcher ? [] : hittingKeys,
                deselected: isPitcher ? hittingKeys : []
            },
            pitching: {
                selected: isPitcher ? pitchingKeys : [],
                deselected: isPitcher ? [] : pitchingKeys
            }
        };
    } catch (error) {
        console.error(`Error generating config for player ID: ${playerId}`, error);
        return null;
    }
};

export const createGame = async (
    title: string,
    creator_id: string | null,
    player_id: number,
    stats_config: GamePlayerConfig['stats_config'],
    game_options: GamePlayerConfig['game_options']
): Promise<CreateGameResult> => {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({
        cookies: () => cookieStore
    });

    // Start a transaction by using single batch
    const { data: gameData, error: gameError } = await supabase
        .from('games')
        .insert([{
            title,
            creator_id: creator_id || null
        }])
        .select()
        .single();

    if (gameError) {
        throw new Error(gameError.message);
    }

    // Insert the game_player_config using the game id from the first insert
    const { data: configData, error: configError } = await supabase
        .from('game_player_config')
        .insert([{
            game_id: gameData.id,
            player_id,
            stats_config,
            game_options
        }])
        .select();

    if (configError) {
        // If config insert fails, delete the game we just created
        await supabase.from('games').delete().eq('id', gameData.id);
        throw new Error(configError.message);
    }

    return {
        game: gameData,
        config: configData
    };
};

export const createGamesFromAwardWinners = async (
    numRecords?: number,
    creator_id: string | null = null
): Promise<CreateGameResult[]> => {
    const winners = await fetchAwardWinners();
    const selectedWinners = numRecords ? winners.slice(0, numRecords) : winners;

    const results: CreateGameResult[] = [];

    for (const winner of selectedWinners) {
        try {
            const stats_config = await generatePlayerConfig(winner.playerId);
            if (!stats_config) {
                console.error(`Failed to generate config for player ${winner.playerName}`);
                continue;
            }

            const defaultOptions = {
                maxGuesses: 10,
                hint: {
                    enabled: false,
                    text: ''
                },
                progressiveReveal: {
                    enabled: false,
                    statsPerReveal: 3
                }
            };

            const result = await createGame(
                winner.playerName,
                creator_id,
                winner.playerId,
                stats_config,
                defaultOptions
            );

            results.push(result);
        } catch (error) {
            console.error(`Error creating game for player ${winner.playerName}:`, error);
            // Continue with the next player even if one fails
            continue;
        }
    }

    return results;
}; 