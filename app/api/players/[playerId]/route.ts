import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/src/lib/supabaseClient';

export async function GET(
    request: NextRequest,
    { params }: { params: { playerId: string } }
) {
    try {
        const playerId = params.playerId;

        if (!playerId) {
            return NextResponse.json(
                { error: 'Player ID is required' },
                { status: 400 }
            );
        }

        // First try to get the player from our database
        const { data: playerData, error: playerError } = await supabase
            .from('players')
            .select('*')
            .eq('id', playerId)
            .single();

        if (playerData && !playerError) {
            return NextResponse.json(playerData);
        }

        // If not in our database, try to fetch from MLB API
        try {
            const mlbResponse = await fetch(
                `https://statsapi.mlb.com/api/v1/people/${playerId}?hydrate=stats(group=[hitting,pitching],type=[yearByYear])`
            );

            if (!mlbResponse.ok) {
                throw new Error(`MLB API responded with status: ${mlbResponse.status}`);
            }

            const mlbData = await mlbResponse.json();

            if (mlbData.people && mlbData.people.length > 0) {
                const player = mlbData.people[0];

                // Format the player data
                const formattedPlayer = {
                    id: player.id,
                    fullName: player.fullName,
                    firstName: player.firstName,
                    lastName: player.lastName,
                    primaryNumber: player.primaryNumber || '',
                    currentTeam: player.currentTeam?.name || '',
                    primaryPosition: player.primaryPosition?.name || '',
                    birthDate: player.birthDate || '',
                    birthCity: player.birthCity || '',
                    birthCountry: player.birthCountry || '',
                    height: player.height || '',
                    weight: player.weight || '',
                    active: player.active || false,
                    imageUrl: `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${player.id}/headshot/67/current`
                };

                // Store in our database for future use
                try {
                    await supabase.from('players').upsert([formattedPlayer], {
                        onConflict: 'id'
                    });
                } catch (dbError) {
                    console.error('Error storing player in database:', dbError);
                    // Continue even if database storage fails
                }

                return NextResponse.json(formattedPlayer);
            }

            return NextResponse.json(
                { error: 'Player not found in MLB API' },
                { status: 404 }
            );
        } catch (mlbError) {
            console.error('Error fetching from MLB API:', mlbError);
            return NextResponse.json(
                { error: 'Failed to fetch player from MLB API' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Error in player API route:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 