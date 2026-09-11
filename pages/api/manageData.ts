import { NextApiRequest, NextApiResponse } from 'next';
import { list, put } from '@vercel/blob';
import { readFileSync } from 'fs';
import { join } from 'path';
import { getAuth } from './_auth';

const BLOB_PREFIX = 'nav-data';

async function getData(): Promise<{ entries: any[] }> {
  try {
    const { blobs } = await list({ prefix: BLOB_PREFIX });
    if (blobs.length > 0) {
      const newest = blobs.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())[0];
      const res = await fetch(newest.url);
      return await res.json();
    }
  } catch (e) {
    console.warn('Failed to read from Vercel Blob, falling back to local file:', e);
  }
  const localPath = join(process.cwd(), 'data', 'data.json');
  return JSON.parse(readFileSync(localPath, 'utf-8'));
}

async function saveData(data: { entries: any[] }): Promise<void> {
  await put(`${BLOB_PREFIX}.json`, JSON.stringify(data), {
    access: 'public',
    contentType: 'application/json',
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const authError = getAuth(req);
  if (authError) return res.status(401).json({ error: authError });

  try {
    const data = await getData();

    if (req.method === 'POST') {
      const { name, url, description, categories, iconUrl } = req.body;
      if (!name || !url) {
        return res.status(400).json({ error: 'Name and URL are required' });
      }
      const newEntry = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        name,
        url,
        description: description || '',
        categories: categories || [],
        iconUrl: iconUrl || '',
      };
      data.entries.push(newEntry);
      await saveData(data);
      return res.status(200).json(newEntry);
    }

    if (req.method === 'PUT') {
      const { id, ...updates } = req.body;
      const index = data.entries.findIndex((e: any) => e.id === id);
      if (index === -1) return res.status(404).json({ error: 'Entry not found' });
      data.entries[index] = { ...data.entries[index], ...updates };
      await saveData(data);
      return res.status(200).json(data.entries[index]);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      data.entries = data.entries.filter((e: any) => e.id !== id);
      await saveData(data);
      return res.status(200).json({ success: true });
    }

    res.setHeader('Allow', 'POST, PUT, DELETE');
    res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Operation failed' });
  }
}
