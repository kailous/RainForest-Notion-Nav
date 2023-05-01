// pages/Settings.js 用于设置环境变量

import { useState, useEffect } from 'react';

function Settings() {
    const [envVars, setEnvVars] = useState({
        NOTION_API_KEY: '',
        DATABASE_ID: '',
        NAV_NAME: '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        async function fetchEnvVars() {
            try {
                const res = await fetch('/api/update-env-vars');
                const data = await res.json();
                setEnvVars(data);
            } catch (err) {
                setErrorMessage('获取环境变量失败');
            }
        }

        fetchEnvVars();
    }, []);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsSaving(true);
        setErrorMessage('');

        try {
            const res = await fetch('/api/update-env-vars', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(envVars),
            });

            if (!res.ok) {
                const data = await res.json();
                setErrorMessage(data.message || '更新环境变量失败');
            } else {
                setErrorMessage('环境变量更新成功');
            }
        } catch (err) {
            setErrorMessage('更新环境变量失败');
        }

        setIsSaving(false);
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setEnvVars((prevEnvVars) => ({
            ...prevEnvVars,
            [name]: value,
        }));
    };

    return (
        <div id="Settings">
            <h1>设置</h1>
            {/*插入关闭按钮*/}
            {errorMessage && <div style={{ color: 'red' }}>{errorMessage}</div>}
            <form onSubmit={handleSubmit}>
                <label>
                    <p>Notion API Key:</p>
                    <input type="text" name="NOTION_API_KEY" value={envVars.NOTION_API_KEY} onChange={handleChange} />
                </label>
                <label>
                    <p>Database ID:</p>
                    <input type="text" name="DATABASE_ID" value={envVars.DATABASE_ID} onChange={handleChange} />
                </label>
                <label>
                    <p>给导航站命个名字:</p>
                    <input type="text" name="NAV_NAME" value={envVars.NAV_NAME} onChange={handleChange} />
                </label>
                <br />
                <button type="submit" disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save'}
                </button>
            </form>
        </div>
    );
}

export default Settings;
