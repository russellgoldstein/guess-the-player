'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PlayerSearch } from '../src/components/PlayerSearch';
import { supabase } from '../src/lib/supabaseClient';
import PlayerStats from '@/src/components/PlayerStats';

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

const CreateGamePage = () => {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [statsConfig, setStatsConfig] = useState<StatsConfig>({
    info: { selected: [], deselected: [] },
    hitting: { selected: [], deselected: [] },
    pitching: { selected: [], deselected: [] }
  });
  const [link, setLink] = useState('');
  const router = useRouter();

  useEffect(() => {
    const checkUserSession = async () => {
      const {
        data: { session },
        error: sessionError
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.error('User not logged in:', sessionError);
        router.push('/login');
      }
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

    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.error('Error retrieving user session:', sessionError);
      return;
    }

    try {
      const response = await fetch('/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `Game for ${selectedPlayer.fullName}`,
          creator_id: session.user.id,
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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 space-y-4">
        <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-sm border border-gray-100">
          <button
            onClick={saveGameConfiguration}
            className="bg-mlb-blue hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
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
      <h1>Search for a Player to Create a Game</h1>
      <PlayerSearch onPlayerSelect={handlePlayerSelect} />
      {selectedPlayer && (
        <>
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
        </>
      )}
    </div>
  );
};

export default CreateGamePage;
