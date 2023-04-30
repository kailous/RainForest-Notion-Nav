// pages/api/getDatabaseContent.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { Client } from '@notionhq/client';
import * as dotenv from 'dotenv';

dotenv.config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });

let databaseContentCache: any = null;

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
    const tag = Array.isArray(req.query.tag) ? req.query.tag[0] : req.query.tag;

    if (req.method === 'GET') {
        if (databaseContentCache && !tag) {
            res.status(200).json(databaseContentCache);
        } else {
            try {
                let response;
                if (tag) {
                    response = await notion.databases.query({
                        database_id: process.env.DATABASE_ID!,
                        filter: {
                            property: "Tags",
                            multi_select: {
                                contains: tag,
                            },
                        },
                    });
                } else {
                    response = await notion.databases.query({
                        database_id: process.env.DATABASE_ID!,
                    });
                }

                databaseContentCache = response;

                res.status(200).json(response);
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: 'Failed to get database content' });
            }
        }
    } else if (req.method === 'POST') {
        try {
            const response = await notion.databases.query({
                database_id: process.env.DATABASE_ID!,
            });

            databaseContentCache = response;
            res.status(200).json(response);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to refresh database content' });
        }
    } else {
        res.setHeader('Allow', 'GET, POST');
        res.status(405).json({ message: 'Method not allowed' });
    }
}
