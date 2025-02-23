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
    <div>
      <h1>Create a Game</h1>
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
          <button onClick={saveGameConfiguration}>Generate Link</button>
          {link && <p>Shareable Link: <a href={link}>{link}</a></p>}
        </>
      )}
    </div>
  );
};

export default CreateGamePage;
