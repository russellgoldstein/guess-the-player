import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const supabase = createPagesServerClient({ req, res });

    const { data, error } = await supabase.auth.getSession();

    if (error) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    res.status(200).json({ session: data });
} 