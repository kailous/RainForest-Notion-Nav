/**
 * IndexedDB 存储封装
 * 持久化存储，不受 Cookie 清理影响
 */

const DB_NAME = 'rainforest-nav';
const DB_VERSION = 4;

let db = null;

export async function initDB() {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      const oldVersion = event.oldVersion;

      // v1 -> v2: 初始结构
      if (oldVersion < 2) {
        if (!database.objectStoreNames.contains('sites')) {
          const siteStore = database.createObjectStore('sites', { keyPath: 'id' });
          siteStore.createIndex('url', 'url', { unique: true });
          siteStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
        if (!database.objectStoreNames.contains('settings')) {
          database.createObjectStore('settings', { keyPath: 'key' });
        }
        if (!database.objectStoreNames.contains('bookmarks')) {
          database.createObjectStore('bookmarks', { keyPath: 'id', autoIncrement: true });
        }
      }

      // v2 -> v3: 添加 categories 和 iconUrl 索引
      if (oldVersion < 3) {
        if (database.objectStoreNames.contains('sites')) {
          try {
            database.deleteObjectStore('sites');
          } catch (e) {}
        }
        const siteStore = database.createObjectStore('sites', { keyPath: 'id', autoIncrement: true });
        siteStore.createIndex('url', 'url', { unique: true });
        siteStore.createIndex('categories', 'categories', { unique: false, multiEntry: true });
        siteStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // v3 -> v4: 添加 icons 对象存储（存储 base64 图标）
      if (oldVersion < 4) {
        if (!database.objectStoreNames.contains('icons')) {
          const iconsStore = database.createObjectStore('icons', { keyPath: 'id' });
          iconsStore.createIndex('mimeType', 'mimeType', { unique: false });
        }
      }
    };
  });
}

// 通用 CRUD 操作
export async function getAll(storeName) {
  await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function get(storeName, key) {
  await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function put(storeName, data) {
  await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.put(data);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function add(storeName, data) {
  await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.add(data);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function remove(storeName, key) {
  await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clear(storeName) {
  await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// 站点专用方法
export async function getSitesByCategory(category) {
  await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sites', 'readonly');
    const store = tx.objectStore('sites');
    const index = store.index('category');
    const request = index.getAll(category);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// 设置专用方法
export async function getSetting(key) {
  await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('settings', 'readonly');
    const store = tx.objectStore('settings');
    const request = store.get(key);
    request.onsuccess = () => {
      const result = request.result;
      resolve(result ? result.value : null);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function setSetting(key, value) {
  return put('settings', { key, value });
}

// 获取所有设置（返回键值对对象）
export async function getAllSettings() {
  const settings = await getAll('settings');
  return settings.reduce((acc, item) => {
    acc[item.key] = item.value;
    return acc;
  }, {});
}

// ===== 图标相关操作 =====

// 将文件转换为 base64
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 将 URL 转换为 base64（用于导入外部图标）
export async function urlToBase64(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn('Failed to fetch icon:', response.status, url);
      return null;
    }
    const blob = await response.blob();
    return fileToBase64(blob);
  } catch (e) {
    console.warn('Failed to convert URL to base64:', url, e.message);
    return null;
  }
}

// 保存图标到 IndexedDB（返回图标 ID）
export async function saveIcon(base64Data) {
  await initDB();
  const id = `icon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const icon = {
    id,
    data: base64Data,
    mimeType: base64Data.match(/^data:(.*?);/)?.[1] || 'image/png',
    createdAt: Date.now()
  };
  await put('icons', icon);
  return id;
}

// 获取图标 base64 数据
export async function getIcon(id) {
  const icon = await get('icons', id);
  return icon ? icon.data : null;
}

// 删除图标
export async function deleteIcon(id) {
  await remove('icons', id);
}

// 从 URL 下载并保存图标
export async function downloadAndSaveIcon(url) {
  // 如果已经是 data: URL，直接返回
  if (url && url.startsWith('data:')) {
    return url;
  }
  // 如果是本地图标 ID，直接获取
  if (url && url.startsWith('icon_')) {
    return await getIcon(url);
  }

  // 检查是否是永久的图标 URL（Vercel Blob）
  const isVercelBlob = url && (
    url.includes('public.blob.vercel-storage.com') ||
    url.includes('blob.vercel-storage.com')
  );
  // 检查是否是 S3 预签名 URL（会过期）
  const isAwsSigned = url && url.includes('amazonaws.com') &&
    (url.includes('X-Amz-Signature') || url.includes('X-Amz-Expires'));

  // Vercel Blob URL 是永久的，下载到本地
  if (url && isVercelBlob && !isAwsSigned) {
    const base64 = await urlToBase64(url);
    if (base64) {
      return await saveIcon(base64);
    }
  }

  // S3 预签名 URL 跳过（已过期）
  // 其他 URL 保留原 URL
  return url;
}

// 从 URL 获取或创建本地图标（用于导入）
export async function getOrCreateLocalIcon(url) {
  return downloadAndSaveIcon(url);
}

// 处理站点图标的本地化
export async function localizeSiteIcon(site) {
  if (site.iconUrl) {
    const localIcon = await getOrCreateLocalIcon(site.iconUrl);
    return { ...site, iconUrl: localIcon };
  }
  return site;
}

// 处理站点列表图标的本地化
export async function localizeAllSiteIcons(sites) {
  const results = [];
  for (const site of sites) {
    const localized = await localizeSiteIcon(site);
    results.push(localized);
  }
  return results;
}
