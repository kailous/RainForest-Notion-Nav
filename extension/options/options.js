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
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M11 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22H15C20 22 22 20 22 15V13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M16.04 3.02001L8.16 10.9C7.86 11.2 7.56 11.79 7.5 12.22L7.07 15.23C6.91 16.32 7.68 17.08 8.77 16.93L11.78 16.5C12.2 16.44 12.79 16.14 13.1 15.84L20.98 7.96001C22.34 6.60001 22.98 5.02001 20.98 3.02001C18.98 1.02001 17.4 1.66001 16.04 3.02001Z" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/><path d="M14.91 4.1499C15.58 6.5399 17.45 8.4099 19.85 9.0899" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <button class="saas-action-btn saas-action-danger" data-action="delete" data-uuid="${entry.uuid || entry.id}" title="删除">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M5.11686 7.7517C5.53016 7.72415 5.88754 8.03685 5.91509 8.45015L6.37503 15.3493C6.46489 16.6971 6.52892 17.6349 6.66948 18.3406C6.80583 19.025 6.99617 19.3873 7.26958 19.6431C7.54299 19.8989 7.91715 20.0647 8.60915 20.1552C9.32255 20.2485 10.2626 20.25 11.6134 20.25H12.3868C13.7376 20.25 14.6776 20.2485 15.391 20.1552C16.083 20.0647 16.4572 19.8989 16.7306 19.6431C17.004 19.3873 17.1943 19.025 17.3307 18.3406C17.4713 17.6349 17.5353 16.6971 17.6251 15.3493L18.0851 8.45015C18.1126 8.03685 18.47 7.72415 18.8833 7.7517C19.2966 7.77925 19.6093 8.13663 19.5818 8.54993L19.1183 15.5017C19.0328 16.7844 18.9638 17.8206 18.8018 18.6336C18.6334 19.4789 18.347 20.185 17.7554 20.7385C17.1638 21.2919 16.4402 21.5308 15.5856 21.6425C14.7635 21.7501 13.7251 21.7501 12.4395 21.75H11.5607C10.2751 21.7501 9.23664 21.7501 8.4146 21.6425C7.55995 21.5308 6.8364 21.2919 6.2448 20.7385C5.65321 20.185 5.36679 19.4789 5.19839 18.6336C5.03642 17.8205 4.96736 16.7844 4.88186 15.5017L4.41841 8.54993C4.39086 8.13663 4.70357 7.77925 5.11686 7.7517Z" fill="currentColor"/><path fill-rule="evenodd" clip-rule="evenodd" d="M10.3553 2.25004L10.3094 2.25002C10.093 2.24988 9.90445 2.24976 9.72643 2.27819C9.02313 2.39049 8.41453 2.82915 8.08559 3.46084C8.00232 3.62074 7.94282 3.79964 7.87452 4.00496L7.86 4.04858L7.76291 4.33984C7.74392 4.39681 7.73863 4.41251 7.73402 4.42524C7.55891 4.90936 7.10488 5.23659 6.59023 5.24964C6.5767 5.24998 6.56013 5.25004 6.50008 5.25004H3.5C3.08579 5.25004 2.75 5.58582 2.75 6.00004C2.75 6.41425 3.08579 6.75004 3.5 6.75004L6.50865 6.75004L6.52539 6.75004H17.4748L17.4915 6.75004L20.5001 6.75004C20.9143 6.75004 21.2501 6.41425 21.2501 6.00004C21.2501 5.58582 20.9143 5.25004 20.5001 5.25004H17.5001C17.44 5.25004 17.4235 5.24998 17.4099 5.24964C16.8953 5.23659 16.4413 4.90933 16.2661 4.42522C16.2616 4.41258 16.2562 4.39653 16.2373 4.33984L16.1402 4.04858L16.1256 4.00494C16.0573 3.79961 15.9978 3.62073 15.9146 3.46084C15.5856 2.82915 14.977 2.39049 14.2737 2.27819C14.0957 2.24976 13.9072 2.24988 13.6908 2.25002L13.6448 2.25004H10.3553ZM9.14458 4.93548C9.10531 5.04404 9.05966 5.14902 9.00815 5.25004H14.992C14.9405 5.14902 14.8949 5.04405 14.8556 4.9355L14.8169 4.82216L14.7171 4.52292C14.626 4.2494 14.605 4.19363 14.5842 4.15364C14.4745 3.94307 14.2716 3.79686 14.0372 3.75942C13.9927 3.75231 13.9331 3.75004 13.6448 3.75004H10.3553C10.067 3.75004 10.0075 3.75231 9.96296 3.75942C9.72853 3.79686 9.52566 3.94307 9.41601 4.15364C9.39519 4.19363 9.37419 4.24942 9.28302 4.52292L9.18322 4.82234C9.1682 4.86742 9.1565 4.90251 9.14458 4.93548Z" fill="currentColor"/></svg>
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

  // 退出设置按钮
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
  btn.innerHTML = '<svg class="pwd-spinner" width="15" height="15" viewBox="0 0 24 24" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M2.93077 11.2003C3.00244 6.23968 7.07619 2.25 12.0789 2.25C15.3873 2.25 18.287 3.99427 19.8934 6.60721C20.1103 6.96007 20.0001 7.42199 19.6473 7.63892C19.2944 7.85585 18.8325 7.74565 18.6156 7.39279C17.2727 5.20845 14.8484 3.75 12.0789 3.75C7.8945 3.75 4.50372 7.0777 4.431 11.1982L4.83138 10.8009C5.12542 10.5092 5.60029 10.511 5.89203 10.8051C6.18377 11.0991 6.18191 11.574 5.88787 11.8657L4.20805 13.5324C3.91565 13.8225 3.44398 13.8225 3.15157 13.5324L1.47176 11.8657C1.17772 11.574 1.17585 11.0991 1.46759 10.8051C1.75933 10.5111 2.2342 10.5092 2.52824 10.8009L2.93077 11.2003ZM19.7864 10.4666C20.0786 10.1778 20.5487 10.1778 20.8409 10.4666L22.5271 12.1333C22.8217 12.4244 22.8245 12.8993 22.5333 13.1939C22.2421 13.4885 21.7673 13.4913 21.4727 13.2001L21.0628 12.7949C20.9934 17.7604 16.9017 21.75 11.8825 21.75C8.56379 21.75 5.65381 20.007 4.0412 17.3939C3.82366 17.0414 3.93307 16.5793 4.28557 16.3618C4.63806 16.1442 5.10016 16.2536 5.31769 16.6061C6.6656 18.7903 9.09999 20.25 11.8825 20.25C16.0887 20.25 19.4922 16.9171 19.5625 12.7969L19.1546 13.2001C18.86 13.4913 18.3852 13.4885 18.094 13.1939C17.8028 12.8993 17.8056 12.4244 18.1002 12.1333L19.7864 10.4666Z" fill="currentColor"/></svg> 同步中...';
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
      btn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M2.93077 11.2003C3.00244 6.23968 7.07619 2.25 12.0789 2.25C15.3873 2.25 18.287 3.99427 19.8934 6.60721C20.1103 6.96007 20.0001 7.42199 19.6473 7.63892C19.2944 7.85585 18.8325 7.74565 18.6156 7.39279C17.2727 5.20845 14.8484 3.75 12.0789 3.75C7.8945 3.75 4.50372 7.0777 4.431 11.1982L4.83138 10.8009C5.12542 10.5092 5.60029 10.511 5.89203 10.8051C6.18377 11.0991 6.18191 11.574 5.88787 11.8657L4.20805 13.5324C3.91565 13.8225 3.44398 13.8225 3.15157 13.5324L1.47176 11.8657C1.17772 11.574 1.17585 11.0991 1.46759 10.8051C1.75933 10.5111 2.2342 10.5092 2.52824 10.8009L2.93077 11.2003ZM19.7864 10.4666C20.0786 10.1778 20.5487 10.1778 20.8409 10.4666L22.5271 12.1333C22.8217 12.4244 22.8245 12.8993 22.5333 13.1939C22.2421 13.4885 21.7673 13.4913 21.4727 13.2001L21.0628 12.7949C20.9934 17.7604 16.9017 21.75 11.8825 21.75C8.56379 21.75 5.65381 20.007 4.0412 17.3939C3.82366 17.0414 3.93307 16.5793 4.28557 16.3618C4.63806 16.1442 5.10016 16.2536 5.31769 16.6061C6.6656 18.7903 9.09999 20.25 11.8825 20.25C16.0887 20.25 19.4922 16.9171 19.5625 12.7969L19.1546 13.2001C18.86 13.4913 18.3852 13.4885 18.094 13.1939C17.8028 12.8993 17.8056 12.4244 18.1002 12.1333L19.7864 10.4666Z" fill="currentColor"/></svg> 同步数据';
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
  btn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M2.93077 11.2003C3.00244 6.23968 7.07619 2.25 12.0789 2.25C15.3873 2.25 18.287 3.99427 19.8934 6.60721C20.1103 6.96007 20.0001 7.42199 19.6473 7.63892C19.2944 7.85585 18.8325 7.74565 18.6156 7.39279C17.2727 5.20845 14.8484 3.75 12.0789 3.75C7.8945 3.75 4.50372 7.0777 4.431 11.1982L4.83138 10.8009C5.12542 10.5092 5.60029 10.511 5.89203 10.8051C6.18377 11.0991 6.18191 11.574 5.88787 11.8657L4.20805 13.5324C3.91565 13.8225 3.44398 13.8225 3.15157 13.5324L1.47176 11.8657C1.17772 11.574 1.17585 11.0991 1.46759 10.8051C1.75933 10.5111 2.2342 10.5092 2.52824 10.8009L2.93077 11.2003ZM19.7864 10.4666C20.0786 10.1778 20.5487 10.1778 20.8409 10.4666L22.5271 12.1333C22.8217 12.4244 22.8245 12.8993 22.5333 13.1939C22.2421 13.4885 21.7673 13.4913 21.4727 13.2001L21.0628 12.7949C20.9934 17.7604 16.9017 21.75 11.8825 21.75C8.56379 21.75 5.65381 20.007 4.0412 17.3939C3.82366 17.0414 3.93307 16.5793 4.28557 16.3618C4.63806 16.1442 5.10016 16.2536 5.31769 16.6061C6.6656 18.7903 9.09999 20.25 11.8825 20.25C16.0887 20.25 19.4922 16.9171 19.5625 12.7969L19.1546 13.2001C18.86 13.4913 18.3852 13.4885 18.094 13.1939C17.8028 12.8993 17.8056 12.4244 18.1002 12.1333L19.7864 10.4666Z" fill="currentColor"/></svg> 同步数据';
}

// 导出数据（含图标 base64 数据）
async function exportData() {
  const btn = document.getElementById('exportBtn');
  btn.disabled = true;
  btn.innerHTML = '<svg class="pwd-spinner" width="15" height="15" viewBox="0 0 24 24" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M2.93077 11.2003C3.00244 6.23968 7.07619 2.25 12.0789 2.25C15.3873 2.25 18.287 3.99427 19.8934 6.60721C20.1103 6.96007 20.0001 7.42199 19.6473 7.63892C19.2944 7.85585 18.8325 7.74565 18.6156 7.39279C17.2727 5.20845 14.8484 3.75 12.0789 3.75C7.8945 3.75 4.50372 7.0777 4.431 11.1982L4.83138 10.8009C5.12542 10.5092 5.60029 10.511 5.89203 10.8051C6.18377 11.0991 6.18191 11.574 5.88787 11.8657L4.20805 13.5324C3.91565 13.8225 3.44398 13.8225 3.15157 13.5324L1.47176 11.8657C1.17772 11.574 1.17585 11.0991 1.46759 10.8051C1.75933 10.5111 2.2342 10.5092 2.52824 10.8009L2.93077 11.2003ZM19.7864 10.4666C20.0786 10.1778 20.5487 10.1778 20.8409 10.4666L22.5271 12.1333C22.8217 12.4244 22.8245 12.8993 22.5333 13.1939C22.2421 13.4885 21.7673 13.4913 21.4727 13.2001L21.0628 12.7949C20.9934 17.7604 16.9017 21.75 11.8825 21.75C8.56379 21.75 5.65381 20.007 4.0412 17.3939C3.82366 17.0414 3.93307 16.5793 4.28557 16.3618C4.63806 16.1442 5.10016 16.2536 5.31769 16.6061C6.6656 18.7903 9.09999 20.25 11.8825 20.25C16.0887 20.25 19.4922 16.9171 19.5625 12.7969L19.1546 13.2001C18.86 13.4913 18.3852 13.4885 18.094 13.1939C17.8028 12.8993 17.8056 12.4244 18.1002 12.1333L19.7864 10.4666Z" fill="currentColor"/></svg> 导出中...';

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
  btn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 1.25C12.4142 1.25 12.75 1.58579 12.75 2V12.9726L14.4306 11.0119C14.7001 10.6974 15.1736 10.661 15.4881 10.9306C15.8026 11.2001 15.839 11.6736 15.5694 11.9881L12.5694 15.4881C12.427 15.6543 12.2189 15.75 12 15.75C11.7811 15.75 11.573 15.6543 11.4306 15.4881L8.43056 11.9881C8.16099 11.6736 8.19741 11.2001 8.51191 10.9306C8.8264 10.661 9.29988 10.6974 9.56944 11.0119L11.25 12.9726V2C11.25 1.58579 11.5858 1.25 12 1.25ZM6.99583 8.25196C7.41003 8.24966 7.74768 8.58357 7.74999 8.99778C7.7523 9.41199 7.41838 9.74964 7.00418 9.75194C5.91068 9.75803 5.1356 9.78643 4.54735 9.89448C3.98054 9.99859 3.65246 10.1658 3.40901 10.4092C3.13225 10.686 2.9518 11.0746 2.85315 11.8083C2.75159 12.5637 2.75 13.5648 2.75 15.0002V16.0002C2.75 17.4356 2.75159 18.4367 2.85315 19.1921C2.9518 19.9259 3.13225 20.3144 3.40901 20.5912C3.68577 20.868 4.07435 21.0484 4.80812 21.1471C5.56347 21.2486 6.56458 21.2502 8 21.2502H16C17.4354 21.2502 18.4365 21.2486 19.1919 21.1471C19.9257 21.0484 20.3142 20.868 20.591 20.5912C20.8678 20.3144 21.0482 19.9259 21.1469 19.1921C21.2484 18.4367 21.25 17.4356 21.25 16.0002V15.0002C21.25 13.5648 21.2484 12.5637 21.1469 11.8083C21.0482 11.0746 20.8678 10.686 20.591 10.4092C20.3475 10.1658 20.0195 9.99859 19.4527 9.89448C18.8644 9.78643 18.0893 9.75803 16.9958 9.75194C16.5816 9.74964 16.2477 9.41199 16.25 8.99778C16.2523 8.58357 16.59 8.24966 17.0042 8.25196C18.0857 8.25799 18.9871 8.28387 19.7236 8.41916C20.4816 8.55839 21.1267 8.82364 21.6517 9.34857C22.2536 9.95048 22.5125 10.7084 22.6335 11.6085C22.75 12.4754 22.75 13.5778 22.75 14.9453V16.0551C22.75 17.4227 22.75 18.525 22.6335 19.392C22.5125 20.2921 22.2536 21.0499 21.6517 21.6519C21.0497 22.2538 20.2919 22.5127 19.3918 22.6337C18.5248 22.7503 17.4225 22.7502 16.0549 22.7502H7.94513C6.57754 22.7502 5.47522 22.7503 4.60825 22.6337C3.70814 22.5127 2.95027 22.2538 2.34835 21.6519C1.74643 21.0499 1.48754 20.2921 1.36652 19.392C1.24996 18.525 1.24998 17.4227 1.25 16.0551V14.9453C1.24998 13.5778 1.24996 12.4754 1.36652 11.6085C1.48754 10.7084 1.74643 9.95048 2.34835 9.34857C2.87328 8.82363 3.51835 8.55839 4.27635 8.41916C5.01291 8.28387 5.9143 8.25798 6.99583 8.25196Z" fill="currentColor"/></svg> 导出';
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
