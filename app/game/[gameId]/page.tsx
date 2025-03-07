'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/src/lib/supabaseClient';
import PlayerStats from '@/src/components/PlayerStats';
import { PlayerSearch } from '@/src/components/PlayerSearch';
import { PageWrapper } from '@/src/components/PageWrapper';
import VictoryModal from '@/src/components/VictoryModal';
import { User } from '@supabase/supabase-js';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";

interface Player {
    id: number;
    fullName: string;
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

interface Game {
    id: string;
    title: string;
    creator_id: string | null;
    game_player_config: GamePlayerConfig[];
}

const GamePage = () => {
    const { gameId } = useParams();
    const [game, setGame] = useState<Game | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [showGiveUpDialog, setShowGiveUpDialog] = useState(false);
    const [showVictoryModal, setShowVictoryModal] = useState(false);
    const [guessResult, setGuessResult] = useState<'correct' | 'incorrect' | 'gaveup' | null>(null);
    const [currentGuess, setCurrentGuess] = useState<Player | null>(null);
    const [guesses, setGuesses] = useState<Player[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [showHint, setShowHint] = useState(false);
    const [correctPlayerName, setCorrectPlayerName] = useState<string>('');
    const [revealedStats, setRevealedStats] = useState<{
        info: string[];
        hitting: string[];
        pitching: string[];
    }>({
        info: [],
        hitting: [],
        pitching: []
    });

    useEffect(() => {
        const checkUserSession = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            setUser(session?.user || null);
        };

        checkUserSession();
    }, []);

    useEffect(() => {
        const fetchGame = async () => {
            setIsLoading(true);
            setError(null);

            if (!gameId) {
                setError("No game ID provided");
                setIsLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('games')
                    .select(`
                        *,
                        game_player_config (
                            id,
                            player_id,
                            stats_config,
                            game_options
                        )
                    `)
                    .eq('id', gameId)
                    .single();

                if (error) throw error;
                if (!data) throw new Error("Game not found");
                if (!data.game_player_config?.[0]) throw new Error("Game configuration not found");

                setGame(data as Game);
            } catch (err) {
                setError(err instanceof Error ? err.message : "An error occurred");
            } finally {
                setIsLoading(false);
            }
        };

        fetchGame();
    }, [gameId]);

    useEffect(() => {
        const fetchPlayerName = async () => {
            if (!game) return;

            try {
                const playerId = game.game_player_config[0].player_id;

                // First try to get the player from the MLB API
                try {
                    const response = await fetch(`/api/players/${playerId}`);
                    if (response.ok) {
                        const data = await response.json();
                        if (data && data.fullName) {
                            setCorrectPlayerName(data.fullName);
                            return;
                        }
                    }
                } catch (apiError) {
                    console.warn('Could not fetch player from API, falling back to database:', apiError);
                }

                // Fallback to database
                const { data, error } = await supabase
                    .from('players')
                    .select('fullName')
                    .eq('id', playerId)
                    .single();

                if (error) {
                    // If there's an error with the database query, try to get the name from the game title
                    if (game.title && game.title.includes(' - ')) {
                        const playerNameFromTitle = game.title.split(' - ')[1]?.trim();
                        if (playerNameFromTitle) {
                            setCorrectPlayerName(playerNameFromTitle);
                            return;
                        }
                    }
                    throw error;
                }

                if (data && data.fullName) {
                    setCorrectPlayerName(data.fullName);
                } else {
                    // Default fallback
                    setCorrectPlayerName('the player');
                }
            } catch (err) {
                console.error('Error fetching player name:', err);
                // Set a default name if all methods fail
                setCorrectPlayerName('the player');
            }
        };

        fetchPlayerName();
    }, [game]);

    const handleGuess = (player: Player) => {
        setCurrentGuess(player);
        setShowConfirmDialog(true);
    };

    const revealMoreStats = () => {
        if (!game?.game_player_config[0].game_options.progressiveReveal?.enabled) return;

        const progressiveReveal = game.game_player_config[0].game_options.progressiveReveal;
        const statsPerReveal = progressiveReveal.statsPerReveal;
        const config = game.game_player_config[0].stats_config;
        const protectedStats = progressiveReveal.protectedStats || [];

        // Helper function to get N random items from an array
        const getRandomItems = (arr: string[], n: number) => {
            const shuffled = [...arr].sort(() => 0.5 - Math.random());
            return shuffled.slice(0, n);
        };

        // Helper function to get next N items in order
        const getNextOrderedItems = (
            allStats: string[],
            orderedStats: string[],
            revealedStats: string[],
            n: number
        ) => {
            // Filter out protected stats and already revealed stats
            const availableStats = allStats.filter(
                stat => !protectedStats.includes(stat) && !revealedStats.includes(stat)
            );

            if (orderedStats.length === 0) {
                // If no ordered stats defined, fall back to random
                return getRandomItems(availableStats, n);
            }

            // Find the next stats in the ordered list that haven't been revealed yet
            const nextStats = orderedStats
                .filter(stat => availableStats.includes(stat))
                .slice(0, n);

            // If we don't have enough ordered stats, fill the rest with random stats
            if (nextStats.length < n) {
                const remainingStats = availableStats.filter(
                    stat => !orderedStats.includes(stat)
                );
                nextStats.push(...getRandomItems(remainingStats, n - nextStats.length));
            }

            return nextStats;
        };

        // Get remaining stats that haven't been revealed and aren't protected
        const remainingStats = {
            info: config.info.deselected.filter(
                stat => !protectedStats.includes(stat) && !revealedStats.info.includes(stat)
            ),
            hitting: config.hitting.deselected.filter(
                stat => !protectedStats.includes(stat) && !revealedStats.hitting.includes(stat)
            ),
            pitching: config.pitching.deselected.filter(
                stat => !protectedStats.includes(stat) && !revealedStats.pitching.includes(stat)
            )
        };

        // Get new stats to reveal, either ordered or random
        const newRevealedStats = {
            info: [
                ...revealedStats.info,
                ...getNextOrderedItems(
                    remainingStats.info,
                    progressiveReveal.orderedStats?.info || [],
                    revealedStats.info,
                    statsPerReveal
                )
            ],
            hitting: [
                ...revealedStats.hitting,
                ...getNextOrderedItems(
                    remainingStats.hitting,
                    progressiveReveal.orderedStats?.hitting || [],
                    revealedStats.hitting,
                    statsPerReveal
                )
            ],
            pitching: [
                ...revealedStats.pitching,
                ...getNextOrderedItems(
                    remainingStats.pitching,
                    progressiveReveal.orderedStats?.pitching || [],
                    revealedStats.pitching,
                    statsPerReveal
                )
            ]
        };

        setRevealedStats(newRevealedStats);
    };

    const handleConfirmGuess = async () => {
        if (!currentGuess || !game) return;

        const isCorrect = Number(currentGuess.id) === Number(game.game_player_config[0].player_id);
        const maxGuesses = game.game_player_config[0].game_options?.maxGuesses;
        const newGuesses = [...guesses, currentGuess];

        setGuesses(newGuesses);
        setShowConfirmDialog(false);
        setCurrentGuess(null);

        if (isCorrect) {
            setGuessResult('correct');
            setShowVictoryModal(true);
        } else {
            if (maxGuesses && maxGuesses > 0 && newGuesses.length >= maxGuesses) {
                setGuessResult('gaveup');
            } else {
                setGuessResult('incorrect');
                if (game.game_player_config[0].game_options.progressiveReveal?.enabled) {
                    revealMoreStats();
                }
            }
        }

        if (user) {
            try {
                await supabase.from('user_guesses').insert([{
                    game_id: gameId,
                    user_id: user.id,
                    guess: currentGuess.id,
                    is_correct: isCorrect
                }]);
            } catch (error) {
                console.error('Error saving guess:', error);
            }
        }
    };

    const handleGiveUp = () => {
        setGuessResult('gaveup');
        setShowGiveUpDialog(false);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mlb-blue mx-auto"></div>
                    <p className="text-gray-600">Loading game...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="max-w-md w-full p-6 bg-red-50 rounded-lg border border-red-200">
                    <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
                    <p className="text-red-600">{error}</p>
                </div>
            </div>
        );
    }

    if (!game || !game.game_player_config?.[0]) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="max-w-md w-full p-6 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h2 className="text-xl font-semibold text-yellow-800 mb-2">Game Not Found</h2>
                    <p className="text-yellow-600">This game doesn't exist or has been removed.</p>
                </div>
            </div>
        );
    }

    const playerConfig = game.game_player_config[0];
    const statsConfig = playerConfig.stats_config;

    return (
        <PageWrapper>
            <div className="min-h-screen bg-white">
                <div className="max-w-[1440px] w-full mx-auto space-y-4 sm:space-y-6">
                    <div className="space-y-1.5 text-center">
                        <h1 className="text-3xl sm:text-4xl font-bold text-mlb-blue">Stat Attack</h1>
                        <p className="text-gray-600">Try to guess the player based on their stats.</p>
                        {/* {!user && (
                            <p className="text-sm text-blue-600">
                                Playing as guest. Sign in to save your guesses and track your progress.
                            </p>
                        )} */}
                    </div>

                    <div className="flex flex-col items-center gap-4">
                        <div className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-50 border border-gray-200">
                            <div className="flex items-baseline gap-2">
                                <span className="text-gray-600 font-medium">
                                    {game && game.game_player_config[0].game_options?.maxGuesses > 0 ? (
                                        <>
                                            <span className="text-lg font-semibold text-mlb-blue">
                                                {game.game_player_config[0].game_options.maxGuesses - guesses.length}
                                            </span>
                                            <span className="ml-1">guesses remaining</span>
                                        </>
                                    ) : (
                                        <span className="text-lg font-semibold text-mlb-blue">Unlimited guesses remaining</span>
                                    )}
                                </span>
                            </div>
                        </div>

                        <div className="w-full max-w-xl mx-auto">
                            <PlayerSearch onPlayerSelect={handleGuess} />
                        </div>

                        <div className="flex items-center justify-center gap-4 w-full max-w-xl">
                            {game?.game_player_config[0].game_options?.hint?.enabled && (
                                <Button
                                    variant="outline"
                                    onClick={() => setShowHint(true)}
                                    disabled={showHint}
                                    className="flex-1 text-yellow-600 border-yellow-200 hover:text-yellow-700 hover:bg-yellow-50"
                                >
                                    {showHint ? 'Hint Revealed' : 'Show Hint'}
                                </Button>
                            )}
                            {game?.game_player_config[0].game_options?.progressiveReveal?.enabled &&
                                guessResult !== 'correct' &&
                                guessResult !== 'gaveup' && (
                                    <Button
                                        variant="outline"
                                        onClick={revealMoreStats}
                                        className="flex-1 text-blue-600 border-blue-200 hover:text-blue-700 hover:bg-blue-50"
                                    >
                                        Reveal More Stats
                                    </Button>
                                )}
                            <button
                                onClick={() => setShowGiveUpDialog(true)}
                                className="flex-1 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors font-medium border border-red-200"
                                disabled={guessResult === 'correct' || guessResult === 'gaveup'}
                            >
                                Give Up
                            </button>
                        </div>
                    </div>

                    {showHint && game?.game_player_config[0].game_options?.hint?.text && (
                        <div className="px-4 py-2 rounded-md text-center max-w-sm mx-auto bg-yellow-50 border border-yellow-200">
                            <p className="text-base font-medium text-yellow-800">
                                Hint: {game.game_player_config[0].game_options.hint.text}
                            </p>
                        </div>
                    )}

                    {guessResult !== null && (
                        <div
                            className={`animate-in fade-in slide-in-from-top-4 duration-300 px-4 py-2 rounded-md text-center max-w-sm mx-auto ${guessResult === 'correct'
                                ? 'bg-green-50 text-green-800 border border-green-200'
                                : 'bg-red-50 text-red-800 border border-red-200'
                                }`}
                        >
                            <p className="text-base font-medium">
                                {guessResult === 'correct'
                                    ? 'Congratulations! You guessed correctly!'
                                    : guessResult === 'gaveup'
                                        ? 'Game Over!'
                                        : `Sorry, ${guesses[guesses.length - 1]?.fullName || 'that'} is not the right player.`}
                            </p>
                        </div>
                    )}

                    {game && (
                        <PlayerStats
                            playerId={game.game_player_config[0].player_id}
                            configurable={false}
                            selectedInfo={guessResult === 'correct' || guessResult === 'gaveup'
                                ? []
                                : [...statsConfig.info.selected, ...revealedStats.info]}
                            deselectedInfo={guessResult === 'correct' || guessResult === 'gaveup'
                                ? []
                                : statsConfig.info.deselected.filter(stat => !revealedStats.info.includes(stat))}
                            selectedHittingStats={guessResult === 'correct' || guessResult === 'gaveup'
                                ? []
                                : [...statsConfig.hitting.selected, ...revealedStats.hitting]}
                            deselectedHittingStats={guessResult === 'correct' || guessResult === 'gaveup'
                                ? []
                                : statsConfig.hitting.deselected.filter(stat => !revealedStats.hitting.includes(stat))}
                            selectedPitchingStats={guessResult === 'correct' || guessResult === 'gaveup'
                                ? []
                                : [...statsConfig.pitching.selected, ...revealedStats.pitching]}
                            deselectedPitchingStats={guessResult === 'correct' || guessResult === 'gaveup'
                                ? []
                                : statsConfig.pitching.deselected.filter(stat => !revealedStats.pitching.includes(stat))}
                            onStatsChange={() => { }}
                            showAllStats={guessResult === 'correct' || guessResult === 'gaveup'}
                        />
                    )}
                </div>
            </div>

            {/* Victory Modal */}
            <VictoryModal
                open={showVictoryModal}
                onOpenChange={setShowVictoryModal}
                gameId={gameId as string}
                playerName={correctPlayerName || 'the player'}
                guessCount={guesses.length}
                maxGuesses={game?.game_player_config[0].game_options?.maxGuesses}
            />

            {/* Guess Confirmation Dialog */}
            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogContent className="sm:max-w-md bg-white rounded-lg shadow-lg border border-gray-200">
                    <DialogHeader className="px-6 pt-6">
                        <DialogTitle className="text-xl font-semibold text-gray-900">Confirm your guess</DialogTitle>
                        <DialogDescription className="text-gray-600 mt-2">
                            Are you sure you want to guess {currentGuess?.fullName}?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-4 px-6 py-4 bg-gray-50 rounded-b-lg border-t border-gray-200">
                        <button
                            onClick={() => setShowConfirmDialog(false)}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirmGuess}
                            className="px-4 py-2 bg-mlb-blue text-white rounded-md hover:bg-mlb-blue/90 transition-colors font-medium"
                        >
                            Confirm
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Give Up Confirmation Dialog */}
            <Dialog open={showGiveUpDialog} onOpenChange={setShowGiveUpDialog}>
                <DialogContent className="sm:max-w-md bg-white rounded-lg shadow-lg border border-gray-200">
                    <DialogHeader className="px-6 pt-6">
                        <DialogTitle className="text-xl font-semibold text-gray-900">Confirm Give Up</DialogTitle>
                        <DialogDescription className="text-gray-600 mt-2">
                            Are you sure you want to give up? The player's identity and all stats will be revealed.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-4 px-6 py-4 bg-gray-50 rounded-b-lg border-t border-gray-200">
                        <button
                            onClick={() => setShowGiveUpDialog(false)}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleGiveUp}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
                        >
                            Give Up
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </PageWrapper>
    );
};

export default GamePage; 