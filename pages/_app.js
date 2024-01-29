// _app.js
// 是一个特殊的文件名，它不能被删除。在这个文件中，你可以覆盖App组件，它是Next.js中所有页面的父组件。你可以使用它来保持状态，这意味着在页面之间导航时，它将保持不变。

// 引入全局样式
import '@/pages/css/style.css';
// 引入Head
import Head from 'next/head';
// 引入Analytics
import { Analytics } from '@vercel/analytics/react';
// 引入React
import React, {useState, useEffect} from 'react';

// MyApp
function MyApp({Component, pageProps}) {
    const [ogTitle, setOgTitle] = useState([]);
    const [ogImg, setOgImg] = useState([]);
    const [ogDesc, setOgDesc] = useState([]);
    const [ogUrl, setOgUrl] = useState([]);
    const [ogLogo, setOgLogo] = useState([]);
    const [ogKeywords, setOgKeywords] = useState([]);
    useEffect(() => {
        // 获取OGinfo的内容
        fetch('/api/getOGinfo')
            .then(response => response.json())
            .then(data => {
                setOgTitle(data.ogTitle);
                setOgImg(data.ogImg);
                setOgDesc(data.ogDesc);
                setOgUrl(data.ogUrl);
                setOgLogo(data.ogLogo);
                setOgKeywords(data.ogKeywords);
            })
            .catch(error => console.error(error));
    }, []);
    return (
        <>
            <Head>
                <title>{ogTitle}</title>
                <meta property="twitter:image" content={ogImg} />
                <meta property="twitter:card" content="app"/>
                <meta property="twitter:title" content={ogTitle}/>
                <meta property="twitter:description" content={ogDesc}/>
                <meta property="description" content={ogDesc}/>
                <meta property="og:image" content={ogImg}/>
                <meta property="og:title" content={ogTitle}/>
                <meta property="og:description" content={ogDesc}/>
                <meta property="og:url" content={ogUrl}/>
                <meta property="og:type" content="website"/>
                <meta property="og:site_name" content={ogTitle}/>
                <meta name="name" content={ogTitle}/>
                <meta name="description" content={ogDesc}/>
                <meta name="keywords" content={ogKeywords}/>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0"/>
                <meta name="image" content={ogImg}/>
                <meta name="viewport" content="width=device-width,initial-scale=1"/>
                <meta name="color-scheme" content="normal"/>
                <meta name="apple-mobile-web-app-capable" content="yes"/>
                <meta name="apple-mobile-web-app-status-bar-style" content="White" />
                <meta name="apple-mobile-web-app-title" content={ogTitle}/>
                <meta name="msapplication-TileImage" content={ogLogo}/>
                <meta name="msapplication-TileColor" content="#ffffff"/>
                <meta http-equiv="content-Type" content="text/html; charset=UTF-8"/>
                <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1"/>
            </Head>
            <Component {...pageProps} />
            <Analytics />
        </>
    );
}

export default MyApp;