'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '../../../src/lib/supabaseClient';
import PlayerStats from '../../../src/components/PlayerStats';
import { PlayerSearch } from '../../../src/components/PlayerSearch';
import { Game } from '../../../src/types/player';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "../../../src/components/ui/dialog";
import { Player } from '../../../src/types/player';
import { PageWrapper } from '@/src/components/PageWrapper';
import { User } from '@supabase/supabase-js';

const GamePage = () => {
    const { gameId } = useParams();
    const [game, setGame] = useState<Game | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [showGiveUpDialog, setShowGiveUpDialog] = useState(false);
    const [guessResult, setGuessResult] = useState<'correct' | 'incorrect' | 'gaveup' | null>(null);
    const [currentGuess, setCurrentGuess] = useState<Player | null>(null);
    const [user, setUser] = useState<User | null>(null);

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
                            stats_config
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

    const handleGuess = (player: Player) => {
        setCurrentGuess(player);
        setShowConfirmDialog(true);
    };

    const handleConfirmGuess = async () => {
        if (!currentGuess || !game?.game_player_config[0]) return;

        const isCorrect = currentGuess.id === Number(game.game_player_config[0].player_id);
        setGuessResult(isCorrect ? 'correct' : 'incorrect');
        setShowConfirmDialog(false);

        // Save the guess if user is authenticated
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
                <div className="max-w-[1440px] w-full mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
                    <div className="space-y-2">
                        <h1 className="text-3xl sm:text-4xl font-bold text-mlb-blue">Guess the Player</h1>
                        <p className="text-gray-600">Try to guess the player based on their stats.</p>
                        {!user && (
                            <p className="text-sm text-blue-600">
                                Playing as guest. Sign in to save your guesses and track your progress.
                            </p>
                        )}
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="flex-1 max-w-xl">
                            <PlayerSearch onPlayerSelect={handleGuess} />
                        </div>
                        <button
                            onClick={() => setShowGiveUpDialog(true)}
                            className="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors font-medium border border-red-200"
                            disabled={guessResult !== null}
                        >
                            Give Up
                        </button>
                    </div>

                    {guessResult !== null && (
                        <div
                            className={`p-4 sm:p-6 rounded-lg border ${guessResult === 'correct'
                                ? 'bg-green-50 border-green-200 text-green-800'
                                : guessResult === 'gaveup'
                                    ? 'bg-gray-50 border-gray-200 text-gray-800'
                                    : 'bg-red-50 border-red-200 text-red-800'
                                }`}
                        >
                            <p className="text-lg font-semibold">
                                {guessResult === 'correct'
                                    ? 'Congratulations! You guessed correctly!'
                                    : guessResult === 'gaveup'
                                        ? 'Better luck next time! Here are the player stats.'
                                        : 'Sorry, that\'s not the right player. Try again!'}
                            </p>
                        </div>
                    )}

                    {game && (
                        <PlayerStats
                            playerId={game.game_player_config[0].player_id}
                            configurable={false}
                            selectedInfo={guessResult === 'correct' || guessResult === 'gaveup' ? [] : statsConfig.info.selected}
                            deselectedInfo={guessResult === 'correct' || guessResult === 'gaveup' ? [] : statsConfig.info.deselected}
                            selectedHittingStats={guessResult === 'correct' || guessResult === 'gaveup' ? [] : statsConfig.hitting.selected}
                            deselectedHittingStats={guessResult === 'correct' || guessResult === 'gaveup' ? [] : statsConfig.hitting.deselected}
                            selectedPitchingStats={guessResult === 'correct' || guessResult === 'gaveup' ? [] : statsConfig.pitching.selected}
                            deselectedPitchingStats={guessResult === 'correct' || guessResult === 'gaveup' ? [] : statsConfig.pitching.deselected}
                            onStatsChange={() => { }}
                            showAllStats={guessResult === 'correct' || guessResult === 'gaveup'}
                        />
                    )}
                </div>
            </div>

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