import { NextApiRequest, NextApiResponse } from 'next';
import { list } from '@vercel/blob';

async function getCurrentPassword(): Promise<string | null> {
  try {
    const { blobs } = await list({ prefix: 'admin-password' });
    if (blobs.length > 0) {
      const res = await fetch(blobs[0].url);
      const data = await res.json();
      return data.password || null;
    }
  } catch {}
  return process.env.ADMIN_PASSWORD || null;
}

export function getAuth(req: NextApiRequest): string | null {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return 'Admin password not configured';

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token !== password) return 'Unauthorized';

  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { password } = req.body;
  const currentPwd = await getCurrentPassword();
  if (!currentPwd) return res.status(500).json({ error: 'Password not configured' });

  if (password === currentPwd) {
    return res.status(200).json({ token: password });
  }
  return res.status(401).json({ error: 'Wrong password' });
}
