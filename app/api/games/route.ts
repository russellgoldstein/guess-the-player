import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    const { title, creator_id, player_id, stats_config, game_options } = await request.json();

    try {
        // Create a new Supabase client for each request
        // This ensures we don't share clients across requests
        const cookieStore = cookies();
        const supabase = createRouteHandlerClient({
            cookies: () => cookieStore
        });

        // Start a transaction by using single batch
        const { data: gameData, error: gameError } = await supabase
            .from('games')
            .insert([{
                title,
                creator_id: creator_id || null // Allow null creator_id for anonymous users
            }])
            .select()
            .single();

        if (gameError) {
            return NextResponse.json({ error: gameError.message }, { status: 400 });
        }

        // Insert the game_player_config using the game id from the first insert
        const { data: configData, error: configError } = await supabase
            .from('game_player_config')
            .insert([{
                game_id: gameData.id,
                player_id,
                stats_config,
                game_options
            }])
            .select();

        if (configError) {
            // If config insert fails, we should ideally delete the game we just created
            await supabase.from('games').delete().eq('id', gameData.id);
            return NextResponse.json({ error: configError.message }, { status: 400 });
        }

        return NextResponse.json({
            game: gameData,
            config: configData
        });
    } catch (error: any) {
        console.error('Error:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

export async function GET() {
    try {
        // Create a new Supabase client for each request
        // This ensures we don't share clients across requests
        const cookieStore = cookies();
        const supabase = createRouteHandlerClient({
            cookies: () => cookieStore
        });

        const { data: games, error } = await supabase
            .from('games')
            .select(`
                *,
                game_player_config (*)
            `);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(games);
    } catch (error: any) {
        console.error('Error:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
} 