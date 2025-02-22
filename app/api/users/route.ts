import { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createPagesServerClient({ req, res });

  switch (req.method) {
    case 'GET':
      const { data: user, error } = await supabase.auth.getUser();
      if (error) return res.status(401).json({ error: 'Not authenticated' });
      return res.status(200).json(user);
    case 'PUT':
      const { email, password } = req.body;
      const { data, error: updateError } = await supabase.auth.updateUser({ email, password });
      if (updateError) return res.status(400).json({ error: updateError.message });
      return res.status(200).json(data);
    default:
      res.setHeader('Allow', ['GET', 'PUT']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 