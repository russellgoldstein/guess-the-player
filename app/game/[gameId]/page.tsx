'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '../../../src/lib/supabaseClient';

const GamePage = () => {
    const { gameId } = useParams();
    const [game, setGame] = useState(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchGame = async () => {
            if (!gameId) return;

            const { data, error } = await supabase.from('games').select('*').eq('id', gameId).single();
            if (error) {
                setError(error.message);
            } else {
                setGame(data);
            }
        };

        fetchGame();
    }, [gameId]);

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (!game) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h1>{game.title}</h1>
            {/* Display other game details here */}
        </div>
    );
};

export default GamePage; 