import { NextApiRequest, NextApiResponse } from 'next';

export function getAuth(req: NextApiRequest): string | null {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return 'Admin password not configured';

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token !== password) return 'Unauthorized';

  return null;
}

export default function handler(req: NextApiRequest, res: NextApiResponse): void {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    return res.status(200).json({ token: password });
  }
  return res.status(401).json({ error: 'Wrong password' });
}
