import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    const supabase = createRouteHandlerClient({ cookies });

    const { title, creator_id, player_id, stats_config } = await request.json();

    // Start a transaction by using single batch
    const { data: gameData, error: gameError } = await supabase
        .from('games')
        .insert([{
            title,
            creator_id
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
            stats_config
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
}

export async function GET() {
    const supabase = createRouteHandlerClient({ cookies });

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
} 