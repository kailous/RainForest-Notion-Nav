import { NextApiRequest, NextApiResponse } from 'next';
import { list, put } from '@vercel/blob';
import { readFileSync } from 'fs';
import { join } from 'path';

const BLOB_PREFIX = 'nav-data';

// 生成 UUID
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function saveData(data: { entries: any[] }): Promise<string> {
  const blob = await put(`${BLOB_PREFIX}.json`, JSON.stringify(data), {
    access: 'public',
    contentType: 'application/json',
  });
  return blob.url;
}

async function getData(): Promise<{ entries: any[] }> {
  try {
    const { blobs } = await list({ prefix: BLOB_PREFIX });
    if (blobs.length > 0) {
      const newest = blobs.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())[0];
      const res = await fetch(newest.url);
      const data = await res.json();

      // 确保所有条目都有 UUID，并删除旧的 id 字段
      let updated = false;
      data.entries = data.entries.map((entry: any) => {
        if (!entry.uuid) {
          entry.uuid = generateUUID();
          updated = true;
        }
        // 删除旧的 id 字段
        if (entry.id) {
          delete entry.id;
          updated = true;
        }
        return entry;
      });

      // 如果有更新，保存回去
      if (updated) {
        console.log('Added UUIDs to entries, saving...');
        await saveData(data);
      }

      return data;
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

      // 不设置缓存，确保每次获取最新数据
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
