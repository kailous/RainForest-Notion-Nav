import { NextApiRequest, NextApiResponse } from 'next';
import { Client } from '@notionhq/client';
import * as dotenv from 'dotenv';

// properties

dotenv.config({
    path: '.env.local',
});

const notion = new Client({ auth: process.env.NOTION_API_KEY });

// 使用内存对象作为简单的缓存存储
let uniqueTagsCache: any = null; // 根据实际情况设置缓存的类型

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {

    // 处理 GET 请求
    if (req.method === 'GET') {
        // 检查缓存是否存在
        if (uniqueTagsCache) {
            // 如果缓存存在，则直接返回缓存内容
            res.status(200).json(uniqueTagsCache);
        } else {
            try {
                // 从 Notion API 获取数据库内容
                const response = await notion.databases.query({
                    database_id: process.env.DATABASE_ID!,
                });

                // 提取标签名称列表并去重
                const tagNames: string[] = [];
                response.results.forEach((page) => {
                    if ((page as any).properties && (page as any).properties.Category && (page as any).properties.Category.multi_select) {
                        (page as any).properties.Category.multi_select.forEach((tag: { name: string }) => {
                            if (!tagNames.includes(tag.name)) {
                                tagNames.push(tag.name);
                            }
                        });
                    }
                });

                // 将去重后的标签名称列表存入缓存
                uniqueTagsCache = tagNames;
                // 返回去重后的标签名称列表
                res.status(200).json(tagNames);
            } catch (error) {
                // 处理错误
                console.error(error);
                res.status(500).json({ error: 'Failed to get unique tags' });
            }
        }
    } else {
        res.setHeader('Allow', 'GET');
        res.status(405).json({ message: 'Method not allowed' });
    }
}
// 清除缓存
export async function clearCache(): Promise<void> {
    uniqueTagsCache = null;
}