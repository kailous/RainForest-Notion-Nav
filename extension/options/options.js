/**
 * RainForest Navigator - 管理页面
 * 操作本地 IndexedDB
 */

import { getAll, add, put, remove, clear, getAll as dbGetAll, getOrCreateLocalIcon, getIcon, generateUUID } from '../shared/storage.js';

let allEntries = [];
let editingEntry = null;
let categoryTags = [];
let activeNav = 'entries';

// 解析图标 URL（如果是 icon_ ID，从 IndexedDB 获取 base64）
async function resolveIconUrl(iconUrl) {
  if (!iconUrl) return null;
  if (iconUrl.startsWith('icon_')) {
    return await getIcon(iconUrl);
  }
  return iconUrl;
}

// 初始化
document.addEventListener('DOMContentLoaded', init);

async function init() {
  await loadEntries();
  setupEventListeners();
  setupNavigation();
}

async function loadEntries() {
  allEntries = await dbGetAll('sites');
  updateStats();
  await renderTable();
}

function updateStats() {
  const uniqueCategories = new Set();
  let iconCount = 0;

  allEntries.forEach(entry => {
    if (entry.categories && Array.isArray(entry.categories)) {
      entry.categories.forEach(c => uniqueCategories.add(c));
    } else if (entry.category) {
      uniqueCategories.add(entry.category);
    }
    if (entry.iconUrl) iconCount++;
  });

  document.getElementById('stat-entries').textContent = allEntries.length;
  document.getElementById('stat-categories').textContent = uniqueCategories.size;
  document.getElementById('stat-icons').textContent = iconCount;
}

function setupNavigation() {
  document.querySelectorAll('.saas-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const nav = item.dataset.nav;
      switchNav(nav);
    });
  });
}

function switchNav(nav) {
  activeNav = nav;
  
  // 更新导航状态
  document.querySelectorAll('.saas-nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.nav === nav);
  });

  // 切换页面
  document.getElementById('page-entries').style.display = nav === 'entries' ? 'block' : 'none';
  document.getElementById('page-data').style.display = nav === 'data' ? 'block' : 'none';
}

async function renderTable() {
  const tbody = document.getElementById('entriesTable');
  const search = document.getElementById('searchInput').value.toLowerCase();

  let filtered = allEntries;
  if (search) {
    filtered = allEntries.filter(entry =>
      entry.name.toLowerCase().includes(search) ||
      (entry.description || '').toLowerCase().includes(search) ||
      (entry.categories || []).some(c => c.toLowerCase().includes(search)) ||
      (entry.category || '').toLowerCase().includes(search)
    );
  }

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="saas-empty">暂无数据</td></tr>';
    return;
  }

  // 解析所有图标 URL
  const entriesWithIcons = await Promise.all(
    filtered.map(async (entry) => ({
      ...entry,
      resolvedIconUrl: await resolveIconUrl(entry.iconUrl)
    }))
  );

  tbody.innerHTML = entriesWithIcons.map(entry => `
    <tr>
      <td>
        <div class="saas-table-icon">
          ${entry.resolvedIconUrl
            ? `<img src="${escapeHtml(entry.resolvedIconUrl)}" alt="">`
            : '<span>—</span>'}
        </div>
      </td>
      <td><strong>${escapeHtml(entry.name)}</strong></td>
      <td><a href="${escapeHtml(entry.url)}" target="_blank" rel="noopener noreferrer" class="saas-link">${escapeHtml(entry.url).replace(/^https?:\/\//, '').replace(/\/$/, '')}</a></td>
      <td>
        <div class="saas-table-tags">
          ${(entry.categories || [entry.category || '未分类']).map(tag => `
            <span class="saas-tag">${escapeHtml(tag)}</span>
          `).join('')}
        </div>
      </td>
      <td class="saas-table-desc">${escapeHtml(entry.description || '—')}</td>
      <td>
        <div class="saas-table-actions">
          <button class="saas-action-btn" data-action="edit" data-uuid="${entry.uuid || entry.id}" title="编辑">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="saas-action-btn saas-action-danger" data-action="delete" data-uuid="${entry.uuid || entry.id}" title="删除">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function setupEventListeners() {
  // 搜索
  document.getElementById('searchInput').addEventListener('input', () => renderTable());

  // 添加按钮
  document.getElementById('addBtn').addEventListener('click', () => openModal());

  // 表格操作
  document.getElementById('entriesTable').addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;
    const uuid = btn.dataset.uuid;

    if (action === 'edit') {
      const entry = allEntries.find(e => (e.uuid || String(e.id)) === uuid);
      if (entry) openModal(entry);
    } else if (action === 'delete') {
      const entry = allEntries.find(e => (e.uuid || String(e.id)) === uuid);
      if (entry && confirm('确定删除这条记录？')) {
        await remove('sites', entry.id);
        showToast('删除成功');
        await loadEntries();
      }
    }
  });

  // 弹窗关闭
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('cancelBtn').addEventListener('click', closeModal);
  document.getElementById('modal').addEventListener('click', (e) => {
    if (e.target.id === 'modal') closeModal();
  });

  // 表单提交
  document.getElementById('entryForm').addEventListener('submit', handleSubmit);

  // 标签输入
  document.getElementById('tagInputField').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(e.target.value.trim());
    } else if (e.key === 'Backspace' && !e.target.value && categoryTags.length > 0) {
      categoryTags.pop();
      renderTags();
    }
  });

  document.getElementById('tagInputField').addEventListener('blur', () => {
    const val = document.getElementById('tagInputField').value.trim();
    if (val) addTag(val);
  });

  // 退出登录按钮
  document.getElementById('logoutBtn').addEventListener('click', () => {
    window.location.href = '../newtab/index.html';
  });

  // 数据管理
  document.getElementById('syncIconsBtn').addEventListener('click', syncAllData);
  document.getElementById('exportBtn').addEventListener('click', exportData);
  document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('importFile').click();
  });
  document.getElementById('importFile').addEventListener('change', handleImportFile);
  document.getElementById('clearBtn').addEventListener('click', handleClearAll);
}

function openModal(entry = null) {
  editingEntry = entry;
  document.getElementById('modalTitle').textContent = entry ? '编辑条目' : '添加条目';
  document.getElementById('modalSubtitle').textContent = entry ? '修改导航条目的详细信息' : '填写新导航条目的信息';
  document.getElementById('saveBtn').textContent = entry ? '保存修改' : '添加';

  if (entry) {
    document.getElementById('entryName').value = entry.name || '';
    document.getElementById('entryUrl').value = entry.url || '';
    document.getElementById('entryDesc').value = entry.description || '';
    document.getElementById('entryIcon').value = entry.iconUrl || '';
    categoryTags = [...(entry.categories || [entry.category])];
  } else {
    document.getElementById('entryName').value = '';
    document.getElementById('entryUrl').value = '';
    document.getElementById('entryDesc').value = '';
    document.getElementById('entryIcon').value = '';
    categoryTags = [];
  }

  renderTags();
  document.getElementById('modal').style.display = 'flex';
  document.getElementById('entryName').focus();
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
  editingEntry = null;
  categoryTags = [];
}

function addTag(tag) {
  if (tag && !categoryTags.includes(tag)) {
    categoryTags.push(tag);
    renderTags();
  }
  document.getElementById('tagInputField').value = '';
}

function removeTag(index) {
  categoryTags.splice(index, 1);
  renderTags();
}

function renderTags() {
  const container = document.getElementById('tagChips');
  container.innerHTML = categoryTags.map((tag, i) => `
    <span class="saas-tag-chip">
      ${escapeHtml(tag)}
      <button type="button" class="saas-tag-remove" data-index="${i}">&times;</button>
    </span>
  `).join('');

  container.querySelectorAll('.saas-tag-remove').forEach(btn => {
    btn.addEventListener('click', () => removeTag(parseInt(btn.dataset.index)));
  });
}

async function handleSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('entryName').value.trim();
  const url = document.getElementById('entryUrl').value.trim();
  const description = document.getElementById('entryDesc').value.trim();
  const iconUrl = document.getElementById('entryIcon').value.trim();

  if (!name || !url) {
    showToast('请填写必填项');
    return;
  }

  // 将图标 URL 转换为 base64 本地存储
  let localIconUrl = null;
  if (iconUrl) {
    const localIcon = await getOrCreateLocalIcon(iconUrl);
    localIconUrl = localIcon;
  }

  const entry = {
    uuid: editingEntry?.uuid || generateUUID(),
    name,
    url,
    description,
    iconUrl: localIconUrl,
    categories: categoryTags.length > 0 ? categoryTags : ['未分类'],
    category: categoryTags[0] || '未分类'
  };

  if (editingEntry) {
    entry.id = editingEntry.id;
    await put('sites', entry);
    showToast('更新成功');
  } else {
    entry.createdAt = Date.now();
    await add('sites', entry);
    showToast('添加成功');
  }

  closeModal();
  await loadEntries();
}

// 同步所有数据
async function syncAllData() {
  const status = document.getElementById('syncStatus');
  const btn = document.getElementById('syncIconsBtn');
  const apiUrl = document.getElementById('rfApiUrl').value.trim();

  btn.disabled = true;
  btn.innerHTML = '<svg class="pwd-spinner" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/></svg> 同步中...';
  status.textContent = '正在获取在线数据...';

  try {
    // 从在线 API 获取数据
    const resp = await fetch(apiUrl);
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
    }
    const data = await resp.json();
    const onlineEntries = data.entries || [];

    if (onlineEntries.length === 0) {
      status.textContent = '在线数据为空';
      showToast('在线数据为空');
      btn.disabled = false;
      btn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9V3m-9 9a9 9 0 0 1 9-9"/></svg> 同步数据';
      return;
    }

    // 获取本地所有条目，建立 UUID 和 URL 索引
    const localEntries = await dbGetAll('sites');
    const localByUuid = new Map(localEntries.map(e => [e.uuid, e]));
    const localByUrl = new Map(localEntries.map(e => [e.url, e]));

    let updated = 0, added = 0;

    for (let i = 0; i < onlineEntries.length; i++) {
      const onlineEntry = onlineEntries[i];
      status.textContent = `正在同步 ${i + 1}/${onlineEntries.length}...`;

      // 处理图标：下载到本地
      let localIconUrl = null;
      if (onlineEntry.iconUrl) {
        localIconUrl = await getOrCreateLocalIcon(onlineEntry.iconUrl);
      }

      // 查找本地条目：优先 UUID，其次 URL
      const existingByUuid = onlineEntry.uuid && localByUuid.get(onlineEntry.uuid);
      const existingByUrl = localByUrl.get(onlineEntry.url);
      const existing = existingByUuid || existingByUrl;

      const entryData = {
        uuid: onlineEntry.uuid || (existing?.uuid) || generateUUID(),
        name: onlineEntry.name,
        url: onlineEntry.url,
        iconUrl: localIconUrl,
        categories: onlineEntry.categories || [onlineEntry.category || '未分类'],
        category: (onlineEntry.categories || [])[0] || onlineEntry.category || '未分类',
        description: onlineEntry.description || '',
        updatedAt: Date.now()
      };

      if (existing) {
        // 本地已有，更新（保留本地 ID 和创建时间）
        entryData.id = existing.id;
        entryData.createdAt = existing.createdAt;
        await put('sites', entryData);
        updated++;
      } else {
        // 本地没有，添加
        entryData.createdAt = Date.now();
        await add('sites', entryData);
        added++;
      }
    }

    status.textContent = `✓ 同步完成: ${updated} 个更新, ${added} 个新增`;
    showToast(`同步完成: ${updated} 个更新, ${added} 个新增`);

    // 重新加载表格
    await loadEntries();
  } catch (err) {
    console.error('Sync error:', err);
    status.textContent = `✗ 同步失败: ${err.message}`;
    showToast('同步失败: ' + err.message, 'error');
  }

  btn.disabled = false;
  btn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9V3m-9 9a9 9 0 0 1 9-9"/></svg> 同步数据';
}

// 导出数据（含图标 base64 数据）
async function exportData() {
  const btn = document.getElementById('exportBtn');
  btn.disabled = true;
  btn.innerHTML = '<svg class="pwd-spinner" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/></svg> 导出中...';

  try {
    // 收集所有本地图标数据
    const icons = await dbGetAll('icons');

    // 找出条目引用但图标库中缺失的 icon_ ID（数据不一致时兜底）
    const iconIds = new Set(icons.map(i => i.id));
    const sites = allEntries.map(entry => {
      const { id, ...rest } = entry;
      return rest;
    });
    for (const site of sites) {
      if (site.iconUrl && site.iconUrl.startsWith('icon_') && !iconIds.has(site.iconUrl)) {
        site.iconUrl = null;
      }
    }

    const data = {
      version: 2,
      sites,
      icons: icons.map(({ id, data, originUrl }) => ({ id, data, originUrl })),
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `rainforest-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast(`导出成功：${sites.length} 个条目，${icons.length} 个图标`);
  } catch (err) {
    showToast('导出失败: ' + err.message, 'error');
  }

  btn.disabled = false;
  btn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> 导出';
}

// 导入数据
async function handleImportFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const data = JSON.parse(await file.text());

    // 先恢复图标库（保留原 ID，条目的 icon_ 引用才能生效）
    if (data.icons && Array.isArray(data.icons)) {
      for (const icon of data.icons) {
        if (icon.id && icon.data) {
          await put('icons', {
            id: icon.id,
            data: icon.data,
            mimeType: icon.data.match(/^data:(.*?);/)?.[1] || 'image/png',
            originUrl: icon.originUrl || null,
            createdAt: Date.now()
          });
        }
      }
    }

    if (data.sites) {
      let imported = 0;
      for (const entry of data.sites) {
        const existing = allEntries.find(e => e.url === entry.url);
        if (existing) {
          // 已存在：更新内容，保留本地 id
          await put('sites', {
            ...entry,
            id: existing.id,
            createdAt: existing.createdAt,
            uuid: entry.uuid || existing.uuid || generateUUID()
          });
        } else {
          const { id, ...newEntry } = entry;
          await add('sites', {
            ...newEntry,
            uuid: entry.uuid || generateUUID(),
            createdAt: Date.now()
          });
        }
        imported++;
      }
      showToast(`导入成功：${imported} 个条目${data.icons ? `，${data.icons.length} 个图标` : ''}`);
    } else {
      showToast('导入成功');
    }
    await loadEntries();
  } catch (err) {
    showToast('导入失败: ' + err.message, 'error');
  }

  e.target.value = '';
}

// 清除所有数据
async function handleClearAll() {
  if (!confirm('确定要清除所有数据吗？此操作不可恢复！')) return;
  if (!confirm('这是最后一次确认。')) return;

  await clear('sites');
  await clear('bookmarks');
  await clear('settings');
  showToast('所有数据已清除');
  await loadEntries();
}

// 显示提示
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  document.getElementById('toast-message').textContent = message;
  toast.style.display = 'flex';
  toast.style.background = type === 'error'
    ? 'rgba(255, 107, 107, 0.08)'
    : 'rgba(108, 99, 255, 0.08)';
  toast.style.color = type === 'error' ? '#ff6b6b' : 'var(--accent-color, #6c63ff)';

  document.getElementById('toast-close').onclick = () => {
    toast.style.display = 'none';
  };

  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toast.style.display = 'none';
  }, 3000);
}

// HTML 转义
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
