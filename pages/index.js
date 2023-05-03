// pages/index.js

import React, { useEffect, useState } from 'react';


const IndexPage = () => {
    const [databaseContent, setDatabaseContent] = useState([]);
    const [titleName, setTitleName] = useState([]);
    const [uniqueTags, setUniqueTags] = useState([]);

    // 过滤数据库内容
    const filterDatabaseContent = (tag) => {
        // 如果标签为"全部"，则显示全部内容
        if (tag === '全部') {
            // 获取数据库内容
            fetch('/api/getDatabaseContent')
                .then(response => response.json())
                .then(data => {
                    // 更新数据库内容
                    setDatabaseContent(data);
                })
                .catch(error => console.error(error));
            return;
        }
        // 获取数据库内容
        fetch('/api/getDatabaseContent')
            .then(response => response.json())
            .then(data => {
                // 过滤数据库内容
                const filteredDatabaseContent = data.results.filter(page => {
                    // 这里将显示页面分类
                    const pageTags = page.properties.Category.multi_select.map(tag => tag.name);
                    // 返回过滤后的数据库内容
                    return pageTags.includes(tag);
                });
                // 更新数据库内容
                setDatabaseContent({
                    results: filteredDatabaseContent,
                });
            })
            .catch(error => console.error(error));
    }

    useEffect(() => {

        // 获取getUniqueTags的内容
        fetch('/api/getUniqueTags')
            .then(response => response.json())
            .then(data => setUniqueTags(data))
            .catch(error => console.error(error));

        // 获取数据库内容
        fetch('/api/getDatabaseContent')
            .then(response => response.json())
            .then(data => setDatabaseContent(data))
            .catch(error => console.error(error));

        // 获取标题名称
        fetch('/api/getTitleName')
            .then(response => response.json())
            .then(data => setTitleName(data))
            .catch(error => console.error(error));
    }, []);



    // 刷新缓存处理函数
    const handleButtonClick = async () => {

        try {
            // 发送 POST 请求到 refreshCache API 路由
            const response = await fetch('/api/getDatabaseContent', {
                method: 'POST',
            });

            if (response.ok) {
                // 缓存刷新成功，可以在此处理刷新后的数据
                console.log('Cache refreshed successfully');
                // 刷新页面
                window.location.reload();
            } else {
                // 缓存刷新失败，可以在此处理错误情况
                console.error('Failed to refresh cache');
            }
        } catch (error) {
            console.error('Failed to send request', error);
        }
    }
    // 渲染页面内容和使用 `databaseContent` 数据
    return (
        <div id="body">
            {/* 渲染页面内容和使用 `databaseContent` 数据 */}
            <header>
                {/* 这里将显示数据库名称 */}
                <div id="right">
                    <h1 id="title">
                        <img src="/logo.png" id="logo" alt="图片加载失败" />
                        {titleName && titleName.titleName}
                        <button id="refresh-button" onClick={handleButtonClick}/>
                    </h1>
                    <div id="nav">
                        {/* 插入按钮"全部"*/}
                        <button className="nav-button" onClick={() => {filterDatabaseContent('全部');}}>全部</button>
                        {/* 这里将显示标签选项 */}
                        {uniqueTags && uniqueTags.map((tag, index) => {
                            return (
                                <button className="nav-button" key={index} onClick={() => {filterDatabaseContent(tag);}}>
                                    {tag}
                                </button>)
                        })}
                    </div>
                </div>
            </header>
            <main>
                <div id="cards-container">
                    {/* 这里将显示数据库内容 */}
                    {databaseContent.results && databaseContent.results.map((page, index) => {
                        return (
                            <a href={page.properties.Website.url} target="_blank" className="card" key={index}>
                                {/* 这里将显示页面名称 */}
                                <img src = {page.properties.Icons.files && page.properties.Icons.files[0] && page.properties.Icons.files[0].file.url} className="card-image" alt="图片加载失败" />
                                <h2 className="card-title">{page.properties.Name.title[0].plain_text}</h2>
                                {/* 这里将显示页面分类 */}
                                <div className="card-tags">
                                    {page.properties.Category.multi_select.map((tag, index) => {
                                        return (
                                            <span className="tag" key={index}>
                                                {tag.name}
                                            </span>
                                        );
                                    })}
                                </div>
                                {/* 这里将显示页面描述 */}
                                <p>{page.properties.Description.rich_text[0].plain_text}</p>
                                {/* 这里将显示页面链接 */}
                            </a>
                        );
                    })}
                </div>
            </main>
            <footer>
                <img src="/next.svg" alt="图片加载失败" />
                <a href="https://vercel.com/kailous/rain-forest-notion-nav"><img src="/vercel.svg" alt="图片加载失败" /></a>
                <a href="https://github.com/kailous/RainForest-Notion-Nav"><img src="/github.svg" alt="图片加载失败" /></a>
                <p>Notion database nav for RainForest, developed by Kailous.</p>
            </footer>
        </div>
    );
};
console.log(process.env.NAV_NAME);

export default IndexPage;