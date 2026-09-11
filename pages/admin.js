import React, { useState, useEffect } from 'react';
import Head from 'next/head';

const AdminPage = () => {
  const [token, setToken] = useState(null);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [entries, setEntries] = useState([]);
  const [editingEntry, setEditingEntry] = useState(null);
  const [form, setForm] = useState({ name: '', url: '', description: '', categories: '', iconUrl: '' });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const fetchEntries = async () => {
    const res = await fetch('/api/getDatabaseContent');
    const data = await res.json();
    setEntries(data.entries || []);
  };

  useEffect(() => {
    const saved = sessionStorage.getItem('admin_token');
    if (saved) {
      setToken(saved);
    }
  }, []);

  useEffect(() => {
    if (token) fetchEntries();
  }, [token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    const res = await fetch('/api/_auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      const data = await res.json();
      setToken(data.token);
      sessionStorage.setItem('admin_token', data.token);
    } else {
      setLoginError('密码错误');
    }
  };

  const handleUploadIcon = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.svg')) {
      setMessage('只支持 SVG 文件');
      return;
    }
    setUploading(true);
    try {
      const text = await file.text();
      const res = await fetch('/api/uploadIcon', {
        method: 'POST',
        headers,
        body: JSON.stringify({ filename: file.name, content: text }),
      });
      if (res.ok) {
        const data = await res.json();
        setForm({ ...form, iconUrl: data.url });
        setMessage('图标上传成功');
      } else {
        setMessage('上传失败');
      }
    } catch (err) {
      setMessage('上传出错');
    }
    setUploading(false);
    e.target.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    const categories = form.categories.split(/[,，]/).map(s => s.trim()).filter(Boolean);
    const payload = { ...form, categories };

    try {
      if (editingEntry) {
        const res = await fetch('/api/manageData', {
          method: 'PUT',
          headers,
          body: JSON.stringify({ id: editingEntry.id, ...payload }),
        });
        if (res.ok) setMessage('更新成功');
      } else {
        const res = await fetch('/api/manageData', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });
        if (res.ok) setMessage('添加成功');
      }
      setForm({ name: '', url: '', description: '', categories: '', iconUrl: '' });
      setEditingEntry(null);
      fetchEntries();
    } catch (err) {
      setMessage('操作失败');
    }
    setSaving(false);
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setForm({
      name: entry.name,
      url: entry.url,
      description: entry.description || '',
      categories: (entry.categories || []).join(', '),
      iconUrl: entry.iconUrl || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!confirm('确定删除这条记录？')) return;
    const res = await fetch('/api/manageData', {
      method: 'DELETE',
      headers,
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setMessage('删除成功');
      fetchEntries();
    }
  };

  const handleCancel = () => {
    setEditingEntry(null);
    setForm({ name: '', url: '', description: '', categories: '', iconUrl: '' });
  };

  const handleLogout = () => {
    setToken(null);
    sessionStorage.removeItem('admin_token');
  };

  if (!token) {
    return (
      <>
        <Head><title>管理登录</title></Head>
        <div className="admin-login">
          <form onSubmit={handleLogin}>
            <h2>管理后台</h2>
            <input
              type="password"
              placeholder="请输入管理密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {loginError && <p className="error">{loginError}</p>}
            <button type="submit">登录</button>
          </form>
        </div>
      </>
    );
  }

  return (
    <>
      <Head><title>导航管理</title></Head>
      <div className="admin-container">
        <div className="admin-header">
          <h1>导航管理</h1>
          <button className="logout-btn" onClick={handleLogout}>退出</button>
        </div>

        {message && <div className="admin-message">{message}</div>}

        <form className="admin-form" onSubmit={handleSubmit}>
          <h3>{editingEntry ? '编辑条目' : '添加条目'}</h3>
          <div className="form-row">
            <div className="form-group">
              <label>名称 *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="站点名称"
                required
              />
            </div>
            <div className="form-group">
              <label>链接 *</label>
              <input
                type="url"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://example.com"
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>描述</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="简短描述"
            />
          </div>
          <div className="form-group">
            <label>分类（用逗号分隔）</label>
            <input
              type="text"
              value={form.categories}
              onChange={(e) => setForm({ ...form, categories: e.target.value })}
              placeholder="工具, AI, 设计"
            />
          </div>
          <div className="form-group">
            <label>图标</label>
            <div className="icon-upload-row">
              {form.iconUrl && (
                <img src={form.iconUrl} alt="icon" className="icon-preview" />
              )}
              <input type="text" value={form.iconUrl} readOnly placeholder="上传后自动填充" />
              <label className="upload-btn">
                {uploading ? '上传中...' : '上传 SVG'}
                <input type="file" accept=".svg" onChange={handleUploadIcon} disabled={uploading} />
              </label>
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" disabled={saving}>
              {saving ? '保存中...' : (editingEntry ? '更新' : '添加')}
            </button>
            {editingEntry && (
              <button type="button" onClick={handleCancel} className="cancel-btn">取消</button>
            )}
          </div>
        </form>

        <div className="admin-list">
          <h3>所有条目 ({entries.length})</h3>
          {entries.map((entry) => (
            <div className="entry-card" key={entry.id}>
              <div className="entry-icon">
                {entry.iconUrl ? <img src={entry.iconUrl} alt="" /> : <span>🔗</span>}
              </div>
              <div className="entry-info">
                <strong>{entry.name}</strong>
                <span className="entry-url">{entry.url}</span>
                <div className="entry-tags">
                  {(entry.categories || []).map((tag, i) => (
                    <span className="tag" key={i}>{tag}</span>
                  ))}
                </div>
              </div>
              <div className="entry-actions">
                <button onClick={() => handleEdit(entry)}>编辑</button>
                <button className="delete-btn" onClick={() => handleDelete(entry.id)}>删除</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default AdminPage;
