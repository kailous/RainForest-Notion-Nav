// pages/api/getTitleName.ts

import { NextApiRequest, NextApiResponse } from 'next';
import * as dotenv from 'dotenv';

dotenv.config({
    path: undefined,
});

export default function handler(req: NextApiRequest, res: NextApiResponse): void {
    if (req.method === 'GET') {
        // 直接从环境变量中获取 NAV_NAME 的值，并返回给客户端
        const titleName = process.env.NAV_NAME;
        res.status(200).json({ titleName });
    } else {
        res.setHeader('Allow', 'GET');
        res.status(405).json({ message: 'Method not allowed' });
    }
}
