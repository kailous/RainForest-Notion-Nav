/**
 * RainForest Navigator - 管理页面
 * 操作本地 IndexedDB
 */

import { getAll, add, put, remove, clear, getAll as dbGetAll, fileToBase64, saveIcon, getOrCreateLocalIcon, getIcon, generateUUID } from '../shared/storage.js';

let allEntries = [];
let editingEntry = null;
let categoryTags = [];

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

async function renderTable() {
  const tbody = document.getElementById('entriesTable');
  const search = document.getElementById('searchInput').value.toLowerCase();

  let filtered = allEntries;
  if (search) {
    filtered = allEntries.filter(entry =>
      entry.name.toLowerCase().includes(search) ||
      (entry.description || '').toLowerCase().includes(search) ||
      (entry.categories || []).some(c => c.toLowerCase().includes(search))
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
      <td><a href="${escapeHtml(entry.url)}" target="_blank" class="saas-link">${escapeHtml(entry.url).replace(/^https?:\/\//, '').replace(/\/$/, '')}</a></td>
      <td>
        <div class="saas-table-tags">
          ${(entry.categories || [entry.category || '未分类']).map(tag => `
            <span class="saas-tag">${escapeHtml(tag)}</span>
          `).join('')}
        </div>
      </td>
      <td class="saas-table-desc">${escapeHtml(entry.description || '—')}</td>
      <td>
        <div class="saas-table-actions" style="opacity: 1;">
          <button class="saas-action-btn" data-action="edit" data-id="${entry.id}" title="编辑">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="saas-action-btn saas-action-danger" data-action="delete" data-id="${entry.id}" title="删除">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function setupEventListeners() {
  // 导航切换
  document.querySelectorAll('.saas-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.saas-nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      const page = item.dataset.page;
      document.getElementById('page-entries').style.display = page === 'entries' ? 'block' : 'none';
      document.getElementById('page-data').style.display = page === 'data' ? 'block' : 'none';
    });
  });

  // 搜索
  document.getElementById('searchInput').addEventListener('input', () => renderTable());

  // 添加按钮
  document.getElementById('addBtn').addEventListener('click', () => openModal());

  // 表格操作
  document.getElementById('entriesTable').addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;
    const id = parseInt(btn.dataset.id);

    if (action === 'edit') {
      const entry = allEntries.find(e => e.id === id);
      if (entry) openModal(entry);
    } else if (action === 'delete') {
      if (confirm('确定删除这条记录？')) {
        await remove('sites', id);
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
  document.getElementById('rfImportBtn').addEventListener('click', importFromRainForest);
  document.getElementById('syncIconsBtn').addEventListener('click', syncAllIcons);
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

// 同步所有图标到本地
async function syncAllIcons() {
  const status = document.getElementById('syncStatus');
  const btn = document.getElementById('syncIconsBtn');
  const apiUrl = document.getElementById('rfApiUrl').value.trim();

  btn.disabled = true;
  btn.innerHTML = '同步中...';
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

async function importFromRainForest() {
  const url = document.getElementById('rfApiUrl').value.trim();
  const status = document.getElementById('rfStatus');
  const btn = document.getElementById('rfImportBtn');

  btn.disabled = true;
  btn.innerHTML = '导入中...';
  status.textContent = '正在连接...';

  try {
    status.textContent = '正在获取数据...';
    // Chrome 扩展可以直接 fetch，无需特殊 CORS 设置
    const resp = await fetch(url);

    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
    }

    const data = await resp.json();
    const entries = data.entries || [];

    if (entries.length === 0) {
      status.textContent = '没有找到站点数据';
      return;
    }

    let imported = 0, skipped = 0, iconCount = 0;
    status.textContent = `正在导入 ${entries.length} 个站点...`;

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (allEntries.find(e => e.url === entry.url)) {
        skipped++;
        continue;
      }

      // 尝试将图标转换为 base64 本地存储（失败时保留原 URL）
      let localIconUrl = null;
      if (entry.iconUrl) {
        const localIcon = await getOrCreateLocalIcon(entry.iconUrl);
        if (localIcon) {
          iconCount++;
        }
        localIconUrl = localIcon || entry.iconUrl;
      }

      await add('sites', {
        uuid: entry.uuid || generateUUID(),
        name: entry.name,
        url: entry.url,
        iconUrl: localIconUrl,
        categories: entry.categories || [entry.category || '未分类'],
        category: (entry.categories || [])[0] || entry.category || '未分类',
        description: entry.description || '',
        createdAt: Date.now()
      });
      imported++;

      // 每10个更新一次进度
      if (i % 10 === 0) {
        status.textContent = `正在导入 ${entries.length} 个站点... (${i}/${entries.length})`;
      }
    }

    status.textContent = `✓ 导入完成: ${imported} 个新增, ${skipped} 个跳过, ${iconCount} 个图标已本地化`;
    showToast(`导入完成: ${imported} 个新增`);
    await loadEntries();

  } catch (err) {
    console.error('Import error:', err);
    status.textContent = `✗ 导入失败: ${err.message}`;
    showToast('导入失败: ' + err.message, 'error');
  }

  btn.disabled = false;
  btn.innerHTML = '导入';
}

function exportData() {
  const data = {
    sites: allEntries,
    exportedAt: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `rainforest-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  showToast('数据已导出');
}

async function handleImportFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const data = JSON.parse(await file.text());
    if (data.sites) {
      for (const entry of data.sites) {
        if (!allEntries.find(e => e.url === entry.url)) {
          await add('sites', {
            ...entry,
            uuid: entry.uuid || generateUUID(),
            id: undefined,
            createdAt: Date.now()
          });
        }
      }
    }
    showToast('数据导入成功');
    await loadEntries();
  } catch (err) {
    showToast('导入失败: ' + err.message, 'error');
  }

  e.target.value = '';
}

async function handleClearAll() {
  if (!confirm('确定要清除所有数据吗？此操作不可恢复！')) return;
  if (!confirm('这是最后一次确认。')) return;

  await clear('sites');
  await clear('bookmarks');
  await clear('settings');
  showToast('所有数据已清除');
  await loadEntries();
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.style.display = 'flex';
  toast.style.background = type === 'error'
    ? 'rgba(255, 107, 107, 0.08)'
    : 'rgba(108, 99, 255, 0.08)';
  toast.style.color = type === 'error' ? '#ff6b6b' : 'var(--accent-color, #6c63ff)';

  setTimeout(() => {
    toast.style.display = 'none';
  }, 3000);
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
