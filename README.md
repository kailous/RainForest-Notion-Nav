This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## RainForest Notion Nav
一个可以通过 Notion 数据库 生成导航的 Next.js 项目。
可以很方便的部署在 Vercel 上，也可以自己部署在服务器上。
只需要修改.env 文件中的变量即可。
变量说明：
- NOTION_API_KEY: Notion 的 API Key，可以在 Notion 的设置中找到。
- DATABASE_ID: Notion 数据库的 ID，可以在 Notion 数据库的链接中找到。
- NAV_NAME: 导航的名称，会显示在网页的标题中。
- EDGE_CONFIG: Vercel Edge Config 的配置链接，用于在边缘节点上管理和配置项目的运行时设置。
- OG_DESC: 网页的 Open Graph 描述，通常用于在社交媒体上分享时显示的描述。
- OG_KEYWORDS: 网页的 Open Graph 关键词，有助于搜索引擎优化。
- OG_IMG: 网页的 Open Graph 图片 URL，用于在社交媒体上分享时显示的图片。
- OG_LOGO: 网页的 Open Graph Logo URL，通常用于品牌标识。
- OG_URL: 网页的 Open Graph URL，指向该网页的链接。

## Notion 模板
https://www.notion.so/bc70befb9e3341e89890e659dcc56673?v=b942cafbdfd248b8b90c919ebc87830b&pvs=4

数据库说明：
- Name: 导航站点的名称，通常是站点的标题或名称。
- Category: 导航站点的分类标签（属性为`多选项`），用于描述站点的类型或所属的领域，例如“新闻”、“科技”、“娱乐”等。
- Website: 导航站点的网址链接（属性为`URL`）。
- Icons: 导航站点的图标（属性为`文件`），为了美观我用的是自制svg格式的图标,所以目前只支持自己上传，最好是svg格式，如果希望是链接，需要自行修改代码。
- Description: 导航站点的简要描述（属性为`文本`），用于介绍站点的主要功能和特点。

## 部署
### Vercel
1. Fork 本项目
2. 修改.env 文件中的变量
2. 在 Vercel 中导入 Fork 的项目
3. 部署

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000) 来查看结果。

你可以通过修改 `pages/index.js` 来开始编辑页面。当你编辑文件时，页面会自动更新。

[API 路由](https://nextjs.org/docs/api-routes/introduction) 可以在 [http://localhost:3000/api/hello](http://localhost:3000/api/hello) 上访问。这个端点可以在 `pages/api/hello.js` 中编辑。

`pages/api` 目录被映射到 `/api/*`。这个目录中的文件被视为 [API 路由](https://nextjs.org/docs/api-routes/introduction)，而不是 React 页面。

这个项目使用 [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) 自动优化和加载 Inter，这是一个自定义的 Google 字体。

## 了解更多

要了解更多关于 Next.js 的信息，可以查看以下资源：

- [Next.js 文档](https://nextjs.org/docs) - 了解 Next.js 的特性和 API。
- [学习 Next.js](https://nextjs.org/learn) - 一个交互式的 Next.js 教程。

你可以查看 [Next.js 的 GitHub 仓库](https://github.com/vercel/next.js/) - 欢迎你的反馈和贡献！

## 在 Vercel 上部署

部署你的 Next.js 应用最简单的方式就是使用 [Vercel 平台](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme)，这是 Next.js 的创建者。

查看我们的 [Next.js 部署文档](https://nextjs.org/docs/deployment) 了解更多详情。
