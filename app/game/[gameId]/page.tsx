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
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [guessResult, setGuessResult] = useState<'correct' | 'incorrect' | null>(null);
    const [currentGuess, setCurrentGuess] = useState<Player | null>(null);

    useEffect(() => {
        const fetchGame = async () => {
            if (!gameId) return;

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

            if (error) {
                setError(error.message);
            } else {
                setGame(data as Game);
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

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (!game || !game.game_player_config?.[0]) {
        return <div>Loading...</div>;
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
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold">Confirm your guess</DialogTitle>
                        <DialogDescription className="text-gray-600">
                            Are you sure you want to guess {currentGuess?.fullName}?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-4 mt-6">
                        <button
                            onClick={() => setShowConfirmDialog(false)}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirmGuess}
                            className="px-4 py-2 bg-mlb-blue text-white rounded-lg hover:bg-mlb-blue/90 font-medium"
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