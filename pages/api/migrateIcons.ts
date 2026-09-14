import { NextApiRequest, NextApiResponse } from 'next';
import { list, put } from '@vercel/blob';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const BLOB_PREFIX = 'nav-data';
const MIGRATED_PREFIX = 'nav-data-migrated';

async function fetchWithTimeout(url: string, timeout = 10000): Promise<Response | null> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch {
    clearTimeout(id);
    return null;
  }
}

async function rewriteIconUrl(iconUrl: string): Promise<string> {
  // 检查是否是 S3 预签名 URL
  const isAwsSigned = iconUrl && iconUrl.includes('amazonaws.com') &&
    (iconUrl.includes('X-Amz-Signature') || iconUrl.includes('X-Amz-Expires'));

  if (!isAwsSigned) {
    return iconUrl;
  }

  // 尝试下载并重新上传到 Vercel Blob
  try {
    const res = await fetchWithTimeout(iconUrl);
    if (!res || !res.ok) {
      console.warn('Failed to fetch icon:', iconUrl);
      return iconUrl;
    }

    const content = await res.text();
    if (!content.trim().startsWith('<svg')) {
      console.warn('Not a valid SVG:', iconUrl);
      return iconUrl;
    }

    const safeName = `icons/migrated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.svg`;
    const blob = await put(safeName, content, {
      access: 'public',
      contentType: 'image/svg+xml',
    });

    console.log('Icon migrated:', iconUrl, '->', blob.url);
    return blob.url;
  } catch (e) {
    console.warn('Failed to rewrite icon URL:', iconUrl, e);
    return iconUrl;
  }
}

async function getCurrentData() {
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

async function saveData(data: any) {
  // 保存到本地文件
  const localPath = join(process.cwd(), 'data', 'data.json');
  writeFileSync(localPath, JSON.stringify(data, null, 2));

  // 保存到 Vercel Blob
  try {
    const blob = await put(`${MIGRATED_PREFIX}-${Date.now()}.json`, JSON.stringify(data, null, 2), {
      access: 'public',
      contentType: 'application/json',
    });
    console.log('Data saved to Vercel Blob:', blob.url);
    return blob.url;
  } catch (e) {
    console.warn('Failed to save to Vercel Blob, local file saved:', e);
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('Starting icon migration...');
    const data = await getCurrentData();

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const entry of data.entries) {
      if (entry.iconUrl) {
        const originalUrl = entry.iconUrl;
        const newUrl = await rewriteIconUrl(entry.iconUrl);

        if (newUrl !== originalUrl) {
          if (newUrl.includes('amazonaws.com')) {
            // URL 未被重写
            skippedCount++;
          } else {
            entry.iconUrl = newUrl;
            migratedCount++;
          }
        }
      }
    }

    // 保存更新后的数据
    const savedUrl = await saveData(data);

    console.log(`Migration complete: ${migratedCount} migrated, ${skippedCount} skipped, ${errorCount} errors`);

    res.status(200).json({
      success: true,
      migratedCount,
      skippedCount,
      savedUrl,
      message: `迁移完成: ${migratedCount} 个图标已更新, ${skippedCount} 个跳过`
    });
  } catch (error) {
    console.error('Migration failed:', error);
    res.status(500).json({ error: 'Migration failed' });
  }
}
