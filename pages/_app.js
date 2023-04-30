import '@/styles/globals.css'
import Head from 'next/head';
import Script from 'next/script';
import React, { useState, useEffect } from 'react';

// export default function App({ Component, pageProps }) {
//   return <Component {...pageProps} />
// }

function MyApp({ Component, pageProps }) {
    const [titleName, setTitleName] = useState('');
    useEffect(() => {
        fetch('/api/getTitleName')
            .then(response => response.json())
            .then(data => {
                setTitleName(data.titleName);
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }, []);
  return (
      <>
        <Head>
          <title>{titleName}</title>
        </Head>
          <script src="/js/style.js"></script>
          <link rel="stylesheet" href="/css/style.css"></link>
        <Component {...pageProps} />
      </>
  );
}

export default MyApp;