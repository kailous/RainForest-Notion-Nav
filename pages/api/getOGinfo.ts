// pages/api/getOGinfo.ts

import {NextApiRequest, NextApiResponse} from 'next';
import * as dotenv from 'dotenv';

dotenv.config();

export default function handler(req: NextApiRequest, res: NextApiResponse): void {
    if (req.method === 'GET') {
        // 直接从环境变量中获取 NAV_NAME、OG_IMG、OG_LOGO、OG_DESC、OG_URL 的值，并返回给客户端const titleName = process.env.NAV_NAME;
        const ogTitle = process.env.NAV_NAME;
        const ogImg = process.env.OG_IMG;
        const ogLogo = process.env.OG_LOGO;
        const ogDesc = process.env.OG_DESC;
        const ogUrl = process.env.OG_URL;
        const ogKeywords = process.env.OG_KEYWORDS;
        res.status(200).json({ogTitle, ogImg, ogLogo, ogDesc, ogUrl, ogKeywords});

    } else {
        res.setHeader('Allow', 'GET');
        res.status(405).json({message: 'Method not allowed'});
    }
}
