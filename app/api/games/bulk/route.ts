import { NextResponse } from 'next/server';
import { createGamesFromAwardWinners } from '../../../../src/utils/gameUtils';

export async function POST(request: Request) {
    const { numRecords, creator_id } = await request.json();

    // Only validate numRecords if it's provided
    if (numRecords !== undefined && (typeof numRecords !== 'number' || numRecords < 1)) {
        return NextResponse.json(
            { error: 'If provided, numRecords must be a positive number' },
            { status: 400 }
        );
    }

    try {
        const results = await createGamesFromAwardWinners(numRecords, creator_id);
        return NextResponse.json({
            message: `Successfully created ${results.length} games`,
            results
        });
    } catch (error: any) {
        console.error('Error:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
} 