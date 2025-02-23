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
} from "@/components/ui/dialog";
import { Player } from '../../../src/types/player';
const GamePage = () => {
    const { gameId } = useParams();
    const [game, setGame] = useState<Game | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [guessResult, setGuessResult] = useState<'correct' | 'incorrect' | null>(null);
    const [currentGuess, setCurrentGuess] = useState<Player | null>(null);

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

    const handleConfirmGuess = () => {
        if (!currentGuess || !game?.game_player_config[0]) return;

        const isCorrect = currentGuess.id === Number(game.game_player_config[0].player_id);
        setGuessResult(isCorrect ? 'correct' : 'incorrect');
        setShowConfirmDialog(false);
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
        <div className="min-h-screen bg-white">
            <div className="max-w-[1440px] w-full mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
                <div className="space-y-2">
                    <h1 className="text-3xl sm:text-4xl font-bold text-mlb-blue">Guess the Player</h1>
                    <p className="text-gray-600">Try to guess the player based on their stats.</p>
                </div>

                <div className="max-w-xl">
                    <PlayerSearch onPlayerSelect={handleGuess} />
                </div>

                {guessResult !== null && (
                    <div
                        className={`p-4 sm:p-6 rounded-lg border ${guessResult === 'correct'
                            ? 'bg-green-50 border-green-200 text-green-800'
                            : 'bg-red-50 border-red-200 text-red-800'
                            }`}
                    >
                        <p className="text-lg font-semibold">
                            {guessResult === 'correct'
                                ? 'Congratulations! You guessed correctly!'
                                : 'Sorry, that\'s not the right player. Try again!'}
                        </p>
                    </div>
                )}

                <div className="-mx-3 sm:-mx-6">
                    <PlayerStats
                        playerId={playerConfig.player_id}
                        configurable={false}
                        selectedInfo={statsConfig.info.selected}
                        deselectedInfo={statsConfig.info.deselected}
                        selectedHittingStats={statsConfig.hitting.selected}
                        deselectedHittingStats={statsConfig.hitting.deselected}
                        selectedPitchingStats={statsConfig.pitching.selected}
                        deselectedPitchingStats={statsConfig.pitching.deselected}
                        onStatsChange={() => { }}
                    />
                </div>
            </div>

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
        </div>
    );
};

export default GamePage; 