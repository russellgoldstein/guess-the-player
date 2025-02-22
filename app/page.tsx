'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PlayerSearch from '../src/components/PlayerSearch';
import PlayerStatsConfig from '../src/components/PlayerStatsConfig';
import { supabase } from '../src/lib/supabaseClient';
import PlayerStats from '@/src/components/PlayerStats';

interface Player {
  id: string;
  name: string;
}

const CreateGamePage = () => {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [hiddenStats, setHiddenStats] = useState<string[]>([]);
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
        router.push('/login'); // Redirect to login page
      }
    };

    checkUserSession();
  }, []);

  const handlePlayerSelect = (player: Player) => {
    setSelectedPlayer(player);
  };

  const handleStatsChange = (stats: string[]) => {
    setHiddenStats(stats);
  };

  const saveGameConfiguration = async () => {
    if (!selectedPlayer) return;

    // Get the current user's session
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.error('Error retrieving user session:', sessionError);
      return;
    }

    const userId = session.user.id; // Get the user's UUID

    const { data, error } = await supabase.from('games').insert([
      { title: `Game for ${selectedPlayer}`, creator_id: userId },
    ]).select('id');

    if (error || !data || data.length === 0) {
      console.error('Error saving game:', error);
      return;
    }

    const gameId = data[0].id;

    await supabase.from('game_player_config').insert([
      { game_id: gameId, player_id: selectedPlayer, hidden_stats: hiddenStats },
    ]);

    const generatedLink = `${window.location.origin}/game/${gameId}`;
    setLink(generatedLink);
  };

  return (
    <div>
      <h1>Create a Game</h1>
      <PlayerSearch onPlayerSelect={handlePlayerSelect} />
      {selectedPlayer && (
        <>
          <PlayerStats playerId={Number(selectedPlayer)} configurable={true} />
          <button onClick={saveGameConfiguration}>Generate Link</button>
          {link && <p>Shareable Link: <a href={link}>{link}</a></p>}
        </>
      )}
    </div>
  );
};

export default CreateGamePage;
