import { NextApiRequest, NextApiResponse } from 'next';
import { list, put } from '@vercel/blob';

const BLOB_PREFIX = 'nav-data';

async function getData() {
  try {
    const { blobs } = await list({ prefix: BLOB_PREFIX });
    if (blobs.length > 0) {
      const newest = blobs.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())[0];
      const res = await fetch(newest.url);
      return await res.json();
    }
  } catch (e) {
    console.error('Failed to read from Vercel Blob:', e);
  }
  return null;
}

async function saveData(data: any) {
  await put(`${BLOB_PREFIX}.json`, JSON.stringify(data), {
    access: 'public',
    contentType: 'application/json',
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const data = await getData();
    if (!data) {
      return res.status(500).json({ error: 'Failed to get data' });
    }

    // 找到 Cosmos 条目
    const cosmosEntry = data.entries.find((e: any) => e.name === 'Cosmos');
    if (!cosmosEntry) {
      return res.status(404).json({ error: 'Cosmos entry not found' });
    }

    console.log('Found Cosmos entry:', cosmosEntry.id);
    console.log('Current iconUrl:', cosmosEntry.iconUrl);

    // 上传 Cosmos.svg 到 Vercel Blob
    const cosmosSvg = `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="3" y="3" width="58" height="58" rx="20" fill="black"/>
<path d="M35.36 18.4C35.36 20.2778 33.8557 21.8 32 21.8C30.1443 21.8 28.64 20.2778 28.64 18.4C28.64 16.5222 30.1443 15 32 15C33.8557 15 35.36 16.5222 35.36 18.4Z" fill="white"/>
<path d="M45.3194 28.1445C43.7124 29.0834 41.6574 28.5262 40.7296 26.9C39.8017 25.2738 40.3524 23.1944 41.9594 22.2555C43.5665 21.3166 45.6214 21.8738 46.5493 23.5C47.4771 25.1262 46.9265 27.2056 45.3194 28.1445Z" fill="white"/>
<path d="M41.9594 41.7445C40.3524 40.8056 39.8017 38.7262 40.7296 37.1C41.6574 35.4738 43.7124 34.9166 45.3194 35.8555C46.9265 36.7944 47.4771 38.8738 46.5493 40.5C45.6214 42.1262 43.5665 42.6834 41.9594 41.7445Z" fill="white"/>
<path d="M28.64 45.6C28.64 43.7222 30.1443 42.2 32 42.2C33.8557 42.2 35.36 43.7222 35.36 45.6C35.36 47.4778 33.8557 49 32 49C30.1443 49 28.64 47.4778 28.64 45.6Z" fill="white"/>
<path d="M18.6806 35.8555C20.2876 34.9166 22.3426 35.4738 23.2704 37.1C24.1983 38.7262 23.6476 40.8056 22.0406 41.7445C20.4335 42.6834 18.3786 42.1262 17.4507 40.5C16.5229 38.8738 17.0735 36.7944 18.6806 35.8555Z" fill="white"/>
<path d="M22.0406 22.2555C23.6476 23.1944 24.1983 25.2738 23.2704 26.9C22.3426 28.5262 20.2876 29.0834 18.6806 28.1445C17.0735 27.2056 16.5229 25.1262 17.4507 23.5C18.3786 21.8738 20.4335 21.3166 22.0406 22.2555Z" fill="white"/>
</svg>`;

    const blob = await put(`icons/cosmos-fixed-${Date.now()}.svg`, cosmosSvg, {
      access: 'public',
      contentType: 'image/svg+xml',
    });

    console.log('Uploaded Cosmos icon to:', blob.url);

    // 更新 Cosmos 条目
    cosmosEntry.iconUrl = blob.url;
    await saveData(data);

    console.log('Updated Cosmos iconUrl to:', blob.url);

    return res.status(200).json({
      success: true,
      oldUrl: 'S3 signed URL (expired)',
      newUrl: blob.url,
    });
  } catch (error) {
    console.error('Fix failed:', error);
    return res.status(500).json({ error: 'Fix failed' });
  }
}
