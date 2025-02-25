
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
        