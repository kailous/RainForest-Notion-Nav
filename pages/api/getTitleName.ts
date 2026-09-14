import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse): void {
    if (req.method === 'GET') {
        const titleName = process.env.NAV_NAME;
        res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
        res.status(200).json({ titleName });
    } else {
        res.setHeader('Allow', 'GET');
        res.status(405).json({ message: 'Method not allowed' });
    }
}
