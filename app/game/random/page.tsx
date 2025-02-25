'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/src/lib/supabaseClient';
import { PageWrapper } from '@/src/components/PageWrapper';

export default function RandomGamePage() {
    const router = useRouter();

    useEffect(() => {
        const fetchRandomGame = async () => {
            try {
                // Fetch a random game from the database
                const { data, error } = await supabase
                    .from('games')
                    .select('id')
                    .order('created_at', { ascending: false })
                    .limit(100); // Get the most recent 100 games

                if (error) {
                    throw error;
                }

                if (data && data.length > 0) {
                    // Select a random game from the results
                    const randomIndex = Math.floor(Math.random() * data.length);
                    const randomGameId = data[randomIndex].id;

                    // Redirect to the random game
                    router.push(`/game/${randomGameId}`);
                } else {
                    // If no games found, redirect to create game page
                    router.push('/create-game');
                }
            } catch (error) {
                console.error('Error fetching random game:', error);
                // On error, redirect to create game page
                router.push('/create-game');
            }
        };

        fetchRandomGame();
    }, [router]);

    return (
        <PageWrapper>
            <div className="container mx-auto px-4 py-12">
                <div className="flex flex-col items-center justify-center min-h-[50vh]">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold mb-4">Finding a random game for you...</h1>
                        <div className="mt-4 animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
                        </div>
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
} 