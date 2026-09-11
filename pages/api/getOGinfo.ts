import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse): void {
    if (req.method === 'GET') {
        const ogTitle = process.env.NAV_NAME;
        const ogImg = process.env.OG_IMG;
        const ogLogo = process.env.OG_LOGO;
        const ogDesc = process.env.OG_DESC;
        const ogUrl = process.env.OG_URL;
        const ogKeywords = process.env.OG_KEYWORDS;
        res.status(200).json({ ogTitle, ogImg, ogLogo, ogDesc, ogUrl, ogKeywords });
    } else {
        res.setHeader('Allow', 'GET');
        res.status(405).json({ message: 'Method not allowed' });
    }
}
