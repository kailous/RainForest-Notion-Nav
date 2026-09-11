import React, { useEffect, useState } from 'react';
import setResponsivePadding from './js/responsive';

const IndexPage = () => {
    const [entries, setEntries] = useState([]);
    const [titleName, setTitleName] = useState('');
    const [uniqueTags, setUniqueTags] = useState([]);

    const filterByTag = (tag) => {
        fetch('/api/getDatabaseContent')
            .then(response => response.json())
            .then(data => {
                if (tag === '全部') {
                    setEntries(data.entries || []);
                } else {
                    const filtered = (data.entries || []).filter(entry =>
                        (entry.categories || []).includes(tag)
                    );
                    setEntries(filtered);
                }
            })
            .catch(error => console.error(error));
    }

    useEffect(() => {
        fetch('/api/getUniqueTags')
            .then(response => response.json())
            .then(data => setUniqueTags(data))
            .catch(error => console.error(error));

        fetch('/api/getDatabaseContent')
            .then(response => response.json())
            .then(data => setEntries(data.entries || []))
            .catch(error => console.error(error));

        fetch('/api/getTitleName')
            .then(response => response.json())
            .then(data => setTitleName(data.titleName || ''))
            .catch(error => console.error(error));

        const timeoutId = setTimeout(() => {
            setResponsivePadding();
        }, 1000);

        const handleResize = () => {
            setResponsivePadding();
        };

        window.addEventListener('resize', handleResize);

        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const handleRefresh = async () => {
        try {
            const response = await fetch('/api/getDatabaseContent', {
                method: 'POST',
            });
            if (response.ok) {
                window.location.reload();
            }
        } catch (error) {
            console.error('Failed to refresh', error);
        }
    }

    return (
        <>
            <header className='blur'>
                <div id='title'>
                    <div id="left">
                        <img src="/logo.webp" alt="图片加载失败" />
                        <h1>{titleName}<br></br>Nav</h1>
                        <button id="refresh-button" onClick={handleRefresh} />
                    </div>
                    <div id="right">
                        <p>{titleName} Nav</p>
                        <p>Powered by Vercel</p>
                    </div>
                </div>
                <div id="nav">
                    <button className="nav-button" onClick={() => filterByTag('全部')}>全部</button>
                    {uniqueTags.map((tag, index) => (
                        <button className="nav-button" key={index} onClick={() => filterByTag(tag)}>
                            {tag}
                        </button>
                    ))}
                </div>
            </header>
            <main>
                <div id="cards-container">
                    {entries.map((entry) => (
                        <a href={entry.url} target="_blank" className="card" key={entry.id}>
                            <div className='icons'>
                                {entry.iconUrl ? (
                                    <>
                                        <img src={entry.iconUrl} className="card-image-shadow" alt="" />
                                        <img src={entry.iconUrl} className="card-image" alt="" />
                                    </>
                                ) : (
                                    <>
                                        <div className="card-image-shadow card-icon-placeholder" />
                                        <div className="card-image card-icon-placeholder" />
                                    </>
                                )}
                            </div>
                            <h2 className="card-title">{entry.name}</h2>
                            <div className="card-tags">
                                {(entry.categories || []).map((tag, index) => (
                                    <span className="tag" key={index}>{tag}</span>
                                ))}
                            </div>
                            <p>{entry.description}</p>
                        </a>
                    ))}
                </div>
            </main>
            <footer className='blur'>
                <img src="/next.svg" alt="图片加载失败" />
                <a href="https://vercel.com/kailous/rainforest-nav"><img src="/vercel.svg" alt="图片加载失败" /></a>
                <a href="https://github.com/kailous/RainForest-Nav"><img src="/github.svg" alt="图片加载失败" /></a>
                <p>RainForest Nav</p>
                <p>Powered by Vercel</p>
            </footer>
        </>
    );
};

export default IndexPage;
