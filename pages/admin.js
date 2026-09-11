import React, { useState, useEffect } from 'react';
import Head from 'next/head';

const AdminPage = () => {
  const [token, setToken] = useState(null);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [entries, setEntries] = useState([]);
  const [editingEntry, setEditingEntry] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', url: '', description: '', categories: '', iconUrl: '' });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const fetchEntries = async () => {
    const res = await fetch('/api/getDatabaseContent');
    const data = await res.json();
    setEntries(data.entries || []);
  };

  useEffect(() => {
    const saved = sessionStorage.getItem('admin_token');
    if (saved) setToken(saved);
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
        if (res.ok) {
          setMessage('更新成功');
          setShowModal(false);
        }
      } else {
        const res = await fetch('/api/manageData', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          setMessage('添加成功');
          setShowModal(false);
        }
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
    setShowModal(true);
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
    setShowModal(false);
  };

  const handleAddNew = () => {
    setEditingEntry(null);
    setForm({ name: '', url: '', description: '', categories: '', iconUrl: '' });
    setShowModal(true);
  };

  const handleLogout = () => {
    setToken(null);
    sessionStorage.removeItem('admin_token');
  };

  const filteredEntries = entries.filter(entry =>
    entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (entry.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (entry.categories || []).some(c => c.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const uniqueTags = [...new Set(entries.flatMap(e => e.categories || []))];

  if (!token) {
    return (
      <>
        <Head><title>管理登录 - RainForest Nav</title></Head>
        <div className="saas-login">
          <div className="saas-login-card">
            <div className="saas-login-logo">RF</div>
            <h2>RainForest Nav</h2>
            <p className="saas-login-subtitle">导航管理后台</p>
            <form onSubmit={handleLogin}>
              <div className="saas-input-group">
                <label>管理密码</label>
                <input
                  type="password"
                  placeholder="请输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                />
              </div>
              {loginError && <p className="saas-error">{loginError}</p>}
              <button type="submit" className="saas-btn-primary saas-btn-full">登录</button>
            </form>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head><title>导航管理 - RainForest Nav</title></Head>
      <div className="saas-layout">
        <aside className="saas-sidebar">
          <div className="saas-sidebar-header">
            <div className="saas-sidebar-logo">RF</div>
            <span className="saas-sidebar-title">RainForest</span>
          </div>
          <nav className="saas-nav">
            <a className="saas-nav-item active">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              导航管理
            </a>
          </nav>
          <div className="saas-sidebar-footer">
            <div className="saas-user-info">
              <div className="saas-user-avatar">A</div>
              <span>管理员</span>
            </div>
            <button className="saas-logout-icon" onClick={handleLogout} title="退出登录">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </aside>

        <main className="saas-main">
          <header className="saas-topbar">
            <div>
              <h1 className="saas-page-title">导航管理</h1>
              <p className="saas-page-desc">管理所有导航站点条目</p>
            </div>
            <button className="saas-btn-primary" onClick={handleAddNew}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              添加条目
            </button>
          </header>

          {message && (
            <div className="saas-toast">
              {message}
              <button onClick={() => setMessage('')}>&times;</button>
            </div>
          )}

          <div className="saas-stats">
            <div className="saas-stat-card">
              <span className="saas-stat-value">{entries.length}</span>
              <span className="saas-stat-label">总条目数</span>
            </div>
            <div className="saas-stat-card">
              <span className="saas-stat-value">{uniqueTags.length}</span>
              <span className="saas-stat-label">分类标签</span>
            </div>
            <div className="saas-stat-card">
              <span className="saas-stat-value">{entries.filter(e => e.iconUrl).length}</span>
              <span className="saas-stat-label">已设图标</span>
            </div>
          </div>

          <div className="saas-table-wrapper">
            <div className="saas-table-header">
              <h3>所有条目</h3>
              <div className="saas-search">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input
                  type="text"
                  placeholder="搜索名称、描述、标签..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <table className="saas-table">
              <thead>
                <tr>
                  <th style={{ width: 44 }}></th>
                  <th>名称</th>
                  <th>链接</th>
                  <th>分类</th>
                  <th>描述</th>
                  <th style={{ width: 120 }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td>
                      <div className="saas-table-icon">
                        {entry.iconUrl ? <img src={entry.iconUrl} alt="" /> : <span>—</span>}
                      </div>
                    </td>
                    <td><strong>{entry.name}</strong></td>
                    <td><a href={entry.url} target="_blank" rel="noopener noreferrer" className="saas-link">{entry.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</a></td>
                    <td>
                      <div className="saas-table-tags">
                        {(entry.categories || []).map((tag, i) => (
                          <span className="saas-tag" key={i}>{tag}</span>
                        ))}
                      </div>
                    </td>
                    <td className="saas-table-desc">{entry.description || '—'}</td>
                    <td>
                      <div className="saas-table-actions">
                        <button className="saas-action-btn" onClick={() => handleEdit(entry)} title="编辑">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button className="saas-action-btn saas-action-danger" onClick={() => handleDelete(entry.id)} title="删除">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredEntries.length === 0 && (
                  <tr><td colSpan="6" className="saas-empty">暂无数据</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {showModal && (
        <div className="saas-modal-overlay" onClick={handleCancel}>
          <div className="saas-modal" onClick={(e) => e.stopPropagation()}>
            <div className="saas-modal-header">
              <h3>{editingEntry ? '编辑条目' : '添加条目'}</h3>
              <button className="saas-modal-close" onClick={handleCancel}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="saas-modal-body">
                <div className="saas-form-row">
                  <div className="saas-field">
                    <label>名称 <span className="saas-required">*</span></label>
                    <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="站点名称" required />
                  </div>
                  <div className="saas-field">
                    <label>链接 <span className="saas-required">*</span></label>
                    <input type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://example.com" required />
                  </div>
                </div>
                <div className="saas-field">
                  <label>描述</label>
                  <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="简短描述" />
                </div>
                <div className="saas-field">
                  <label>分类（逗号分隔）</label>
                  <input type="text" value={form.categories} onChange={(e) => setForm({ ...form, categories: e.target.value })} placeholder="工具, AI, 设计" />
                </div>
                <div className="saas-field">
                  <label>图标</label>
                  <div className="saas-icon-upload">
                    {form.iconUrl && <img src={form.iconUrl} alt="preview" className="saas-icon-preview" />}
                    <input type="text" value={form.iconUrl} readOnly placeholder="上传后自动填充" />
                    <label className="saas-upload-btn">
                      {uploading ? '上传中...' : '选择 SVG'}
                      <input type="file" accept=".svg" onChange={handleUploadIcon} disabled={uploading} />
                    </label>
                  </div>
                </div>
              </div>
              <div className="saas-modal-footer">
                <button type="button" className="saas-btn-ghost" onClick={handleCancel}>取消</button>
                <button type="submit" className="saas-btn-primary" disabled={saving}>
                  {saving ? '保存中...' : (editingEntry ? '保存修改' : '添加条目')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminPage;
