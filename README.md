## RainForest Nav

一个基于 Next.js + Vercel Blob 的导航网站项目，无需数据库，通过管理后台即可管理所有导航条目。

在线地址：[nav.rainforest.org.cn](https://nav.rainforest.org.cn)

## 特性

- 数据存储于 Vercel Blob，零成本、无需数据库
- 内置管理后台（`/admin`），支持增删改查、图标上传
- 支持自定义 SVG 图标
- 响应式设计
- 部署在 Vercel 上，开箱即用

## 环境变量

- `ADMIN_PASSWORD`: 管理后台密码
- `BLOB_READ_WRITE_TOKEN`: Vercel Blob 的读写 Token（部署到 Vercel 后自动生成）
- `NAV_NAME`: 导航名称，显示在网页标题中
- `EDGE_CONFIG`: Vercel Edge Config 配置
- `OG_DESC`: Open Graph 描述
- `OG_KEYWORDS`: Open Graph 关键词
- `OG_IMG`: Open Graph 图片 URL
- `OG_LOGO`: Open Graph Logo URL
- `OG_URL`: Open Graph URL

## 部署

### Vercel

1. Fork 本项目
2. 在 Vercel 中导入 Fork 的项目
3. 配置环境变量（至少需要 `ADMIN_PASSWORD` 和 `BLOB_READ_WRITE_TOKEN`）
4. 部署

```bash
npm run dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000) 查看。

访问 [http://localhost:3000/admin](http://localhost:3000/admin) 管理导航条目。
