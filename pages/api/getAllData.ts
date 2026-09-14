import { NextApiRequest, NextApiResponse } from 'next';
import { list } from '@vercel/blob';
import { readFileSync } from 'fs';
import { join } from 'path';

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

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  if (req.method === 'GET' || req.method === 'POST') {
    try {
      const data = await getData();
      const tagSet = new Set<string>();
      data.entries.forEach((entry: any) => {
        (entry.categories || []).forEach((tag: string) => tagSet.add(tag));
      });
      res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
      res.status(200).json({
        titleName: process.env.NAV_NAME || '',
        entries: data.entries,
        uniqueTags: Array.from(tagSet),
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to get data' });
    }
  } else {
    res.setHeader('Allow', 'GET, POST');
    res.status(405).json({ message: 'Method not allowed' });
  }
}
