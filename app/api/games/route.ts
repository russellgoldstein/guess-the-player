import { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const supabase = createPagesServerClient({ req, res });

    switch (req.method) {
        case 'POST':
            const { title, creator_id } = req.body;
            const { data, error } = await supabase.from('games').insert([{ title, creator_id }]);
            if (error) return res.status(400).json({ error: error.message });
            return res.status(201).json(data);
        case 'GET':
            const { data: games, error: fetchError } = await supabase.from('games').select('*');
            if (fetchError) return res.status(400).json({ error: fetchError.message });
            return res.status(200).json(games);
        default:
            res.setHeader('Allow', ['POST', 'GET']);
            return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
} 