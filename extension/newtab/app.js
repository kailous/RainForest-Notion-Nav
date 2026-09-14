/**
 * RainForest Navigator - 新标签页应用
 * 数据格式与 nav.rainforest.org.cn 完全一致
 */

import { getAll, add, getIcon } from '../shared/storage.js';

let allEntries = [];
let currentTag = '全部';

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

function init() {
  loadData();
  setupEventListeners();
  setupImageErrorHandlers();
}

function setupImageErrorHandlers() {
  // 处理 logo 图片加载失败
  const logo = document.getElementById('logo');
  if (logo) {
    logo.addEventListener('error', () => {
      logo.style.display = 'none';
    });
  }
}

async function loadData() {
  try {
    allEntries = await getAll('sites');
    await renderNav();
    await renderCards();
  } catch (error) {
    console.error('加载数据失败:', error);
  }
}

async function renderNav() {
  const nav = document.getElementById('nav');

  // 获取所有分类（兼容 categories 数组格式）
  const tags = new Set(['全部']);
  allEntries.forEach(entry => {
    if (entry.categories && Array.isArray(entry.categories)) {
      entry.categories.forEach(cat => tags.add(cat));
    } else if (entry.category) {
      tags.add(entry.category);
    }
  });

  nav.innerHTML = [...tags].map(tag => `
    <button class="nav-button ${currentTag === tag ? 'active' : ''}" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</button>
  `).join('');

  nav.querySelectorAll('.nav-button').forEach(btn => {
    btn.addEventListener('click', () => {
      currentTag = btn.dataset.tag;
      nav.querySelectorAll('.nav-button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderCards();
    });
  });
}

async function renderCards() {
  const container = document.getElementById('cards-container');

  let filtered = allEntries;
  if (currentTag !== '全部') {
    filtered = allEntries.filter(entry => {
      if (entry.categories && Array.isArray(entry.categories)) {
        return entry.categories.includes(currentTag);
      }
      return entry.category === currentTag;
    });
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>还没有添加任何站点</p>
        <p style="font-size: var(--font-size-base); margin-top: 10px;">点击右上角「管理」添加</p>
      </div>
    `;
    return;
  }

  // 解析所有图标的 base64 数据
  const entriesWithIcons = await Promise.all(
    filtered.map(async (entry) => ({
      ...entry,
      resolvedIconUrl: await resolveIconUrl(entry.iconUrl)
    }))
  );

  container.innerHTML = entriesWithIcons.map(entry => {
    const iconUrl = entry.resolvedIconUrl;
    const isLocalData = iconUrl && iconUrl.startsWith('data:');
    const isExternalUrl = iconUrl && !isLocalData;
    const domain = getDomain(entry.url);
    const fallbackSvg = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect fill="#999" width="64" height="64" rx="12"/></svg>');

    return `
      <a href="${escapeHtml(entry.url)}" target="_blank" class="card">
        <div class="icons">
          ${iconUrl ? `
            <img src="${escapeHtml(iconUrl)}" class="card-image-shadow" alt="" data-type="local" data-domain="${escapeHtml(domain)}">
            <img src="${escapeHtml(iconUrl)}" class="card-image" alt="" data-type="local" data-domain="${escapeHtml(domain)}">
          ` : `
            <img src="${`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`}" class="card-image-shadow" alt="" data-type="external" data-domain="${escapeHtml(domain)}">
            <img src="${`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`}" class="card-image" alt="" data-type="external" data-domain="${escapeHtml(domain)}">
          `}
        </div>
        <h2 class="card-title">${escapeHtml(entry.name)}</h2>
        <div class="card-tags">
          ${(entry.categories || [entry.category || '未分类']).map(cat => `
            <span>${escapeHtml(cat)}</span>
          `).join('')}
        </div>
        <p>${escapeHtml(entry.description || '')}</p>
      </a>
    `;
  }).join('');

  // 处理图片加载失败
  container.querySelectorAll('img').forEach(img => {
    img.addEventListener('error', function() {
      const type = this.dataset.type;
      const domain = this.dataset.domain;
      const isShadow = this.classList.contains('card-image-shadow');
      const fallbackSvg = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect fill="#999" width="64" height="64" rx="12"/></svg>');
      const googleFavicon = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;

      if (type === 'local') {
        // 本地图标加载失败，尝试 Google Favicon
        if (this.src !== googleFavicon) {
          this.src = googleFavicon;
          this.dataset.type = 'external';
        } else {
          // Google Favicon 也失败，显示占位符
          if (isShadow) {
            this.style.display = 'none';
          } else {
            this.src = fallbackSvg;
          }
        }
      } else if (type === 'external') {
        // 外部 URL 加载失败，显示占位符
        if (isShadow) {
          this.style.display = 'none';
        } else {
          this.src = fallbackSvg;
        }
      } else {
        // 无图标，显示占位符
        if (isShadow) {
          this.style.display = 'none';
        } else {
          this.src = fallbackSvg;
        }
      }
    });
  });
}

function setupEventListeners() {
  // 刷新按钮
  document.getElementById('refresh-button').addEventListener('click', () => {
    loadData();
  });

  // 响应式调整
  setTimeout(setResponsivePadding, 300);
  window.addEventListener('resize', setResponsivePadding);
}

function setResponsivePadding() {
  const headerHeight = document.querySelector('header')?.offsetHeight || 0;
  const footerHeight = document.querySelector('footer')?.offsetHeight || 0;

  const body = document.querySelector('body');
  if (body) body.style.paddingTop = `${headerHeight}px`;

  const main = document.querySelector('main');
  if (main) main.style.paddingBottom = `${footerHeight}px`;
}

function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
