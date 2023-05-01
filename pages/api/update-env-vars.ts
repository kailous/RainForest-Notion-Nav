// pages/api/update-env-vars.ts

import { NextApiRequest, NextApiResponse } from 'next';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({
    path: undefined,
});

export default function handler(req: NextApiRequest, res: NextApiResponse): void {
    if (req.method === 'GET') {
        const data = {
            NOTION_API_KEY: process.env.NOTION_API_KEY,
            DATABASE_ID: process.env.DATABASE_ID,
            NAV_NAME: process.env.NAV_NAME,
        };
        res.status(200).json(data);
        return;
    }

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        res.status(405).end('Method Not Allowed');
        return;
    }

    const { NOTION_API_KEY, DATABASE_ID, NAV_NAME } = req.body;

    // 更新环境变量值
    process.env.NOTION_API_KEY = NOTION_API_KEY;
    process.env.DATABASE_ID = DATABASE_ID;
    process.env.NAV_NAME = NAV_NAME;

    // 写入环境变量到 .env.local 文件
    const envContent = `
    NOTION_API_KEY=${NOTION_API_KEY}
    DATABASE_ID=${DATABASE_ID}
    NAV_NAME=${NAV_NAME}
  `;
    try {
        fs.writeFileSync('.env.local', envContent, 'utf-8');
        res.status(200).end('Environment Variables Updated Successfully');
    } catch (err) {
        console.error(err);
        res.status(500).end('Internal Server Error');
    }
}
