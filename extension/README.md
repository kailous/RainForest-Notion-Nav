# RainForest Navigator - 浏览器扩展

本地导航扩展，新标签页 + 管理面板，数据存储在 IndexedDB。

## 功能

- **新标签页** - 显示你的导航站点和快捷书签
- **管理面板** - 右键扩展图标 → 选项，进入后台管理
  - 站点管理 - 添加/删除/搜索站点
  - 书签管理 - 管理快捷访问书签
  - 设置 - 自定义显示选项
  - 数据管理 - 导入/导出/清除数据

## 安装

1. 打开 Chrome，进入 `chrome://extensions/`
2. 开启右上角「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择 `extension` 文件夹

## 技术栈

- **存储**: IndexedDB (持久化，不受 Cookie 清理影响)
- **无框架**: 纯 HTML + CSS + JavaScript
- **模块化**: ES Module 共享存储逻辑

## 目录结构

```
extension/
├── manifest.json       # 扩展清单
├── newtab/
│   └── index.html      # 新标签页
├── options/
│   └── options.html    # 管理面板
├── shared/
│   ├── storage.js      # IndexedDB 封装
│   └── style.css       # 共享样式
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## 数据模型

```javascript
// 站点
{ id: 1, name: "Google", url: "https://google.com", category: "搜索", createdAt: timestamp }

// 书签
{ id: 1, title: "Gmail", url: "https://gmail.com", createdAt: timestamp }

// 设置
{ key: "theme", value: "light" }
```

## 数据管理

### 从 RainForest 导入

在管理页 → 数据管理 → 从 RainForest 导入：

1. 输入 RainForest 导航站的 API 地址（默认：`https://nav.rainforest.org.cn/api/getAllData`）
2. 点击「测试连接」验证
3. 点击「导入」同步站点数据

导入会自动：
- 跳过已存在的 URL（不重复）
- 将第一个分类映射为站点分类

### 手动导入/导出

支持 JSON 格式导入导出，格式如下：

```json
{
  "sites": [
    { "name": "Google", "url": "https://google.com", "category": "搜索" }
  ],
  "bookmarks": [
    { "title": "Gmail", "url": "https://gmail.com" }
  ]
}
```

## 自定义

### 替换图标

用你的图标替换 `icons/` 目录下的 PNG 文件，推荐尺寸:
- 16px - 工具栏
- 48px - 扩展页面
- 128px - Chrome Web Store

### 修改样式

编辑 `shared/style.css` 来自定义配色和样式。

## 后续可以添加的功能

- [ ] 导入/同步 RainForest 导航站数据
- [ ] 书签栏同步浏览器书签
- [ ] 暗色模式
- [ ] 搜索功能
- [ ] 快捷键支持
- [ ] 页面截图保存
