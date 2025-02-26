'use client';

import React, { useState, useEffect } from 'react';
import { PlayerSearch } from '../../src/components/PlayerSearch';
import { supabase } from '../../src/lib/supabaseClient';
import PlayerStats from '@/src/components/PlayerStats';
import { PageWrapper } from '@/src/components/PageWrapper';
import { GameOptions } from '@/src/components/GameOptions';
import { Button } from '@/src/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/src/components/ui/dialog';
import { Settings } from 'lucide-react';

interface Player {
    id: number;
    fullName: string;
}

interface StatsConfig {
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
}

interface User {
    id: string;
}

const CreateGamePage = () => {
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
    const [statsConfig, setStatsConfig] = useState<StatsConfig>({
        info: { selected: [], deselected: [] },
        hitting: { selected: [], deselected: [] },
        pitching: { selected: [], deselected: [] }
    });
    const [gameOptions, setGameOptions] = useState<GameOptions>({
        maxGuesses: 3,
        hint: {
            enabled: false,
            text: ''
        },
        progressiveReveal: {
            enabled: true,
            statsPerReveal: 1,
            protectedStats: [
                'fullName',
                'imageUrl',
                'currentTeam',
                'firstName',
                'lastName',
                'middleName',
                'useFirstName',
                'useLastName',
                'useMiddleName',
                'nickName'
            ],
            orderedStats: {
                info: [],
                hitting: [],
                pitching: []
            },
            useOrderedReveal: false
        }
    });
    const [link, setLink] = useState('');
    const [user, setUser] = useState<User | null>(null);
    const [showOptions, setShowOptions] = useState(false);

    useEffect(() => {
        const checkUserSession = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            setUser(session?.user || null);
        };

        checkUserSession();
    }, []);

    const handlePlayerSelect = (player: Player) => {
        setSelectedPlayer(player);
    };

    const handleStatsChange = (type: 'info' | 'hitting' | 'pitching', selected: string[], deselected: string[]) => {
        setStatsConfig(prev => ({
            ...prev,
            [type]: {
                selected,
                deselected
            }
        }));
    };

    const saveGameConfiguration = async () => {
        if (!selectedPlayer) return;

        try {
            const response = await fetch('/api/games', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: `${selectedPlayer.fullName}`,
                    creator_id: user?.id || null,
                    player_id: selectedPlayer.id,
                    stats_config: {
                        info: {
                            selected: statsConfig.info.selected,
                            deselected: statsConfig.info.deselected
                        },
                        hitting: {
                            selected: statsConfig.hitting.selected,
                            deselected: statsConfig.hitting.deselected
                        },
                        pitching: {
                            selected: statsConfig.pitching.selected,
                            deselected: statsConfig.pitching.deselected
                        }
                    },
                    game_options: {
                        maxGuesses: gameOptions.maxGuesses,
                        hint: {
                            enabled: gameOptions.hint?.enabled || false,
                            text: gameOptions.hint?.text || ''
                        },
                        progressiveReveal: gameOptions.progressiveReveal
                    }
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to save game configuration');
            }

            const data = await response.json();
            const generatedLink = `${window.location.origin}/game/${data.game.id}`;
            setLink(generatedLink);
        } catch (error) {
            console.error('Error saving game:', error);
        }
    };

    return (
        <PageWrapper>
            <div className="container mx-auto px-4 py-8">
                <h1>Search for a Player to Create a Game</h1>
                <div className="mb-4">
                    <PlayerSearch onPlayerSelect={handlePlayerSelect} />
                </div>

                <div className="mb-8 space-y-4">
                    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-sm border border-gray-100">
                        <div className="w-full flex justify-end mb-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowOptions(true)}
                                className="flex items-center gap-2"
                                disabled={!selectedPlayer}
                            >
                                <Settings className="h-4 w-4" />
                                Game Options
                            </Button>
                        </div>
                        {!user && (
                            <div className="mb-4 p-4 bg-blue-50 text-blue-700 rounded-md">
                                <p>You are creating a game as a guest. Sign in to save your games and track your history.</p>
                            </div>
                        )}
                        <button
                            onClick={saveGameConfiguration}
                            disabled={!selectedPlayer}
                            className={`font-semibold py-2 px-6 rounded-lg transition-colors ${selectedPlayer
                                ? 'bg-mlb-blue hover:bg-blue-700 text-white cursor-pointer'
                                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            Generate Shareable Link
                        </button>
                        {link && (
                            <div className="mt-4 w-full max-w-2xl">
                                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <span className="text-gray-600 font-medium">Shareable Link:</span>
                                    <a
                                        href={link}
                                        className="text-mlb-blue hover:text-blue-700 font-medium truncate flex-1"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {link}
                                    </a>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(link);
                                        }}
                                        className="text-gray-500 hover:text-mlb-blue p-2 rounded-md transition-colors"
                                        title="Copy to clipboard"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                                            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                {selectedPlayer && (
                    <div className="mb-4">
                        <PlayerStats
                            playerId={selectedPlayer.id}
                            configurable={true}
                            selectedInfo={statsConfig.info.selected}
                            deselectedInfo={statsConfig.info.deselected}
                            selectedHittingStats={statsConfig.hitting.selected}
                            deselectedHittingStats={statsConfig.hitting.deselected}
                            selectedPitchingStats={statsConfig.pitching.selected}
                            deselectedPitchingStats={statsConfig.pitching.deselected}
                            onStatsChange={handleStatsChange}
                        />
                    </div>
                )}
                <Dialog open={showOptions} onOpenChange={setShowOptions}>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white">
                        <DialogHeader>
                            <DialogTitle>Game Options</DialogTitle>
                        </DialogHeader>
                        <GameOptions
                            options={gameOptions}
                            onOptionsChange={setGameOptions}
                            deselectedStats={{
                                info: statsConfig.info.deselected,
                                hitting: statsConfig.hitting.deselected,
                                pitching: statsConfig.pitching.deselected
                            }}
                        />
                    </DialogContent>
                </Dialog>
            </div>
        </PageWrapper>
    );
};

export default CreateGamePage; 