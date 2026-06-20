/* =========================================================
   CMS · Faculty AI — thin HTTP client for the admin panel.
   Centralises JWT storage, error handling, and the base URL
   so the rest of admin.js can stay declarative.
   ========================================================= */
(function (global) {
  'use strict';

  // The admin SPA and the API live on the same host, so relative URLs
  // are enough. If you ever split them, set window.FII_API_BASE before
  // loading this script.
  const BASE = (global.FII_API_BASE || '').replace(/\/$/, '');
  const TOKEN_KEY = 'fii_admin_token';

  const getToken = () => localStorage.getItem(TOKEN_KEY);
  const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
  const clearToken = () => localStorage.removeItem(TOKEN_KEY);

  async function request(path, { method = 'GET', body, headers = {}, form } = {}) {
    const opts = { method, headers: { ...headers } };
    const tok = getToken();
    if (tok) opts.headers['Authorization'] = `Bearer ${tok}`;

    if (form) {
      opts.body = form;          // FormData → browser sets Content-Type
    } else if (body !== undefined) {
      opts.body = JSON.stringify(body);
      opts.headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${BASE}${path}`, opts);
    if (res.status === 401) {
      clearToken();
      if (!location.pathname.endsWith('/login.html') && !location.pathname.endsWith('/')) {
        location.replace('login.html');
      }
      throw new Error('Требуется авторизация');
    }
    if (!res.ok) {
      let detail = `Ошибка ${res.status}`;
      try {
        const j = await res.json();
        if (j && j.detail) {
          detail = typeof j.detail === 'string' ? j.detail : JSON.stringify(j.detail);
        }
      } catch { /* non-JSON body */ }
      throw new Error(detail);
    }
    if (res.status === 204) return null;
    const ct = res.headers.get('content-type') || '';
    return ct.includes('application/json') ? res.json() : res.text();
  }

  async function login(username, password) {
    const tok = await request('/api/auth/login', {
      method: 'POST',
      body: { username, password },
    });
    setToken(tok.access_token);
    return tok;
  }

  async function logout() {
    clearToken();
    location.replace('login.html');
  }

  const me      = ()       => request('/api/auth/me');

  // Blocks
  const listBlocks   = ()         => request('/api/admin/blocks');
  const saveBlock    = (b)        => request('/api/admin/blocks', { method: 'PUT', body: b });
  const deleteTile   = (p, t)     => request(`/api/admin/blocks?page_key=${encodeURIComponent(p)}&tile_id=${encodeURIComponent(t)}`, { method: 'DELETE' });
  const deleteField  = (p, t, f)  => request(`/api/admin/blocks?page_key=${encodeURIComponent(p)}&tile_id=${encodeURIComponent(t)}&field_id=${encodeURIComponent(f)}`, { method: 'DELETE' });
  const resetAll     = ()         => request('/api/admin/blocks/all', { method: 'DELETE' });

  // Dynamic blocks (admin-added, repeatable items inside a page list)
  const listDynamicBlocks  = ()      => request('/api/admin/blocks/dynamic');
  const createDynamicBlock = (b)     => request('/api/admin/blocks/dynamic', { method: 'POST', body: b });
  const updateDynamicBlock = (p, t, b) =>
    request(`/api/admin/blocks/dynamic/${encodeURIComponent(t)}?page_key=${encodeURIComponent(p)}`, { method: 'PATCH', body: b });
  const deleteDynamicBlock = (p, t)  =>
    request(`/api/admin/blocks/dynamic/${encodeURIComponent(t)}?page_key=${encodeURIComponent(p)}`, { method: 'DELETE' });

  // Visibility
  const listVisibility = ()       => request('/api/admin/visibility');
  const setVisibility  = (v)      => request('/api/admin/visibility', { method: 'PUT', body: v });

  // Ticker
  const getTicker      = ()       => request('/api/admin/ticker');
  const replaceTicker  = (items)  => request('/api/admin/ticker', { method: 'PUT', body: { items } });

  // News
  const listNews    = ()          => request('/api/admin/news');
  const createNews  = (fd)        => request('/api/admin/news', { method: 'POST', form: fd });
  const deleteNews  = (id)        => request(`/api/admin/news/${id}`, { method: 'DELETE' });

  // Photos
  const listPhotos   = ()         => request('/api/admin/photos');
  const uploadPhotos = (files, caption) => {
    const fd = new FormData();
    for (const f of files) fd.append('files', f);
    if (caption) fd.append('caption', caption);
    return request('/api/admin/photos', { method: 'POST', form: fd });
  };
  const deletePhoto  = (id)       => request(`/api/admin/photos/${id}`, { method: 'DELETE' });

  // Inline image upload (e.g. a photo dropped straight into a tile). Returns
  // { url, original_name }; the URL is stored as the block field value.
  const uploadImage  = (file)     => {
    const fd = new FormData();
    fd.append('file', file);
    return request('/api/admin/uploads/image', { method: 'POST', form: fd });
  };

  global.FiiAdminApi = {
    getToken, setToken, clearToken,
    login, logout, me,
    listBlocks, saveBlock, deleteTile, deleteField, resetAll,
    listDynamicBlocks, createDynamicBlock, updateDynamicBlock, deleteDynamicBlock,
    listVisibility, setVisibility,
    getTicker, replaceTicker,
    listNews, createNews, deleteNews,
    listPhotos, uploadPhotos, deletePhoto, uploadImage,
  };
})(window);
