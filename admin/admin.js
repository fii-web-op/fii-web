/* =========================================================
   CMS · Факультет ИИ — визуальный редактор сайта.

   Слева — список страниц сайта. Справа — живое превью
   (реальная страница в <iframe>, отдаётся с того же хоста
   по /preview/...). Админ кликает по любому тексту прямо
   в превью и правит его на месте; изменения сохраняются
   в БД через FiiAdminApi и сразу видны на публичном сайте.
   ========================================================= */
(function () {
  'use strict';

  const api = window.FiiAdminApi;
  if (!api) { console.error('admin-api.js не загружен'); return; }
  if (!api.getToken()) { location.replace('login.html'); return; }

  const PAGES = window.PAGE_REGISTRY || [];

  // ---------- helpers ----------------------------------------------
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  function showToast(msg, ms = 2400) {
    const t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('is-visible');
    clearTimeout(t._t);
    t._t = setTimeout(() => t.classList.remove('is-visible'), ms);
  }

  function escapeHtml(s = '') {
    return String(s).replace(/[&<>"']/g, (c) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }

  // In-memory mirror of overrides/visibility — keyed by page → tile → field.
  const state = { content: {}, visibility: {}, ticker: [], news: [], photos: [] };
  const loaded = { ticker: false, news: false, photos: false };

  const frame = $('#preview');
  let currentPage = PAGES[0] || null;

  // =================================================================
  //  BOOT
  // =================================================================
  (async function boot() {
    try {
      const user = await api.me();
      $('#userName').textContent = user.username;
      $('#userAvatar').textContent = (user.username || '?').slice(0, 2).toUpperCase();
    } catch (e) {
      // me() failure with 401 already redirects via admin-api.
      console.warn(e);
    }
    try {
      const [blocks, vis] = await Promise.all([api.listBlocks(), api.listVisibility()]);
      for (const r of blocks) {
        (state.content[r.page_key] ||= {});
        (state.content[r.page_key][r.tile_id] ||= {});
        state.content[r.page_key][r.tile_id][r.field_id] = r.value;
      }
      for (const r of vis) {
        (state.visibility[r.page_key] ||= {});
        state.visibility[r.page_key][r.tile_id] = r.is_visible;
      }
    } catch (e) { console.warn('Не удалось загрузить состояние:', e); }

    renderPagesNav();
    if (currentPage) selectPage(currentPage.key);
  })();

  $('#logoutBtn')?.addEventListener('click', () => api.logout());

  // =================================================================
  //  SIDEBAR — список страниц
  // =================================================================
  function renderPagesNav() {
    const nav = $('#pagesNav');
    if (!nav) return;
    nav.innerHTML = PAGES.map((p) => `
      <button class="ed-page" data-page="${escapeHtml(p.key)}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        <span>${escapeHtml(p.title)}</span>
        <span class="ed-page__meta">${(p.tiles || []).length}</span>
      </button>`).join('');
    nav.addEventListener('click', (e) => {
      const btn = e.target.closest('.ed-page');
      if (btn) selectPage(btn.dataset.page);
    });
  }

  function selectPage(key) {
    const page = PAGES.find((p) => p.key === key);
    if (!page) return;
    finishActiveEdit(false);
    endImageEdit();
    currentPage = page;
    $$('.ed-page').forEach((b) => b.classList.toggle('is-active', b.dataset.page === key));
    $('#previewTitle').textContent = page.title;
    showLoader(true);
    frame.src = `/preview/${page.file}`;
  }

  function showLoader(on) {
    $('#frameLoader')?.classList.toggle('is-hidden', !on);
  }

  $('#reloadPreview')?.addEventListener('click', () => {
    if (!currentPage) return;
    showLoader(true);
    // eslint-disable-next-line no-self-assign
    frame.src = frame.src;
  });

  // Device width toggle
  $$('.ed-device__btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      $$('.ed-device__btn').forEach((b) => b.classList.toggle('is-active', b === btn));
      $('#frameWrap').dataset.device = btn.dataset.device;
    });
  });

  // =================================================================
  //  PREVIEW EDITOR — клик-редактирование внутри iframe
  // =================================================================
  let editing = null;   // { el, original, tile, field, type }
  let imgEditing = null; // { el, tile, field } — active image slot
  let fieldBar = null;
  let imageBar = null;
  let tileBar = null;
  let tileHideTimer = null;

  // One hidden file input, reused for every image slot. Lives in the admin
  // document (not the iframe) so the native picker is unaffected by preview.
  const imgFileInput = document.createElement('input');
  imgFileInput.type = 'file';
  imgFileInput.accept = 'image/*';
  imgFileInput.style.display = 'none';
  document.body.appendChild(imgFileInput);
  imgFileInput.addEventListener('change', onImageChosen);

  const EDITOR_CSS = `
    .fii-editable{outline:1px dashed rgba(43,78,234,0);outline-offset:2px;border-radius:3px;
      cursor:pointer;transition:outline-color .12s,background .12s;}
    .fii-editable:hover{outline-color:rgba(43,78,234,.7);background:rgba(43,78,234,.08);}
    .fii-editing{outline:2px solid #2b4eea !important;background:#fff !important;
      color:#1b2138 !important;cursor:text;box-shadow:0 0 0 4px rgba(43,78,234,.15);}
    [data-fii-hidden]{position:relative;opacity:.45;outline:2px dashed #e0344b;outline-offset:-2px;}
    .fii-image-field{position:relative;}
    .fii-image-field::after{content:'📷';position:absolute;top:2px;right:2px;font-size:12px;
      background:rgba(43,78,234,.92);border-radius:50%;width:22px;height:22px;
      display:flex;align-items:center;justify-content:center;opacity:0;
      transition:opacity .12s;pointer-events:none;z-index:5;box-shadow:0 2px 6px rgba(0,0,0,.3);}
    .fii-image-field:hover::after{opacity:1;}
    .fii-bar{position:absolute;z-index:2147483000;display:none;gap:6px;
      font-family:'Inter',system-ui,sans-serif;font-size:13px;}
    .fii-bar button{display:inline-flex;align-items:center;gap:5px;border:0;cursor:pointer;
      padding:7px 12px;border-radius:8px;font:inherit;font-size:13px;font-weight:600;
      box-shadow:0 6px 16px -6px rgba(0,0,0,.4);}
    .fii-bar .fii-save{background:#2b4eea;color:#fff;}
    .fii-bar .fii-cancel{background:#fff;color:#1b2138;}
    .fii-bar .fii-reset{background:#fff;color:#e0344b;}
    .fii-bar .fii-toggle{background:#0f1530;color:#fff;}
    .fii-bar button:hover{filter:brightness(1.08);}
  `;

  function injectStyle(doc) {
    if (doc.getElementById('fii-editor-style')) return;
    const st = doc.createElement('style');
    st.id = 'fii-editor-style';
    st.textContent = EDITOR_CSS;
    doc.head.appendChild(st);
  }

  function ensureBars(doc) {
    // Field editing toolbar
    if (!fieldBar || fieldBar.ownerDocument !== doc) {
      fieldBar = doc.createElement('div');
      fieldBar.className = 'fii-bar';
      fieldBar.innerHTML =
        '<button type="button" class="fii-save">✓ Сохранить</button>' +
        '<button type="button" class="fii-cancel">Отмена</button>' +
        '<button type="button" class="fii-reset">↺ Сбросить</button>';
      doc.body.appendChild(fieldBar);
      fieldBar.querySelector('.fii-save').addEventListener('click', (e) => { e.preventDefault(); saveEdit(); });
      fieldBar.querySelector('.fii-cancel').addEventListener('click', (e) => { e.preventDefault(); cancelEdit(); });
      fieldBar.querySelector('.fii-reset').addEventListener('click', (e) => { e.preventDefault(); resetField(); });
    }
    // Image-slot toolbar (upload / remove a photo)
    if (!imageBar || imageBar.ownerDocument !== doc) {
      imageBar = doc.createElement('div');
      imageBar.className = 'fii-bar';
      imageBar.innerHTML =
        '<button type="button" class="fii-save fii-img-upload">📷 Загрузить фото</button>' +
        '<button type="button" class="fii-toggle fii-img-text" style="display:none">✎ Текст</button>' +
        '<button type="button" class="fii-reset fii-img-reset">↺ Убрать</button>' +
        '<button type="button" class="fii-cancel fii-img-close">Закрыть</button>';
      doc.body.appendChild(imageBar);
      imageBar.querySelector('.fii-img-upload').addEventListener('click', (e) => { e.preventDefault(); pickImage(); });
      imageBar.querySelector('.fii-img-reset').addEventListener('click', (e) => { e.preventDefault(); resetImage(); });
      imageBar.querySelector('.fii-img-close').addEventListener('click', (e) => { e.preventDefault(); endImageEdit(); });
      imageBar.querySelector('.fii-img-text').addEventListener('click', (e) => {
        e.preventDefault();
        const el = imgEditing && imgEditing.el;
        endImageEdit();
        if (el) startEdit(el);
      });
    }
    // Tile visibility toolbar
    if (!tileBar || tileBar.ownerDocument !== doc) {
      tileBar = doc.createElement('div');
      tileBar.className = 'fii-bar';
      tileBar.innerHTML = '<button type="button" class="fii-toggle"></button>';
      doc.body.appendChild(tileBar);
      tileBar.addEventListener('mouseenter', () => clearTimeout(tileHideTimer));
      tileBar.addEventListener('mouseleave', () => hideTileBar(250));
      tileBar.querySelector('.fii-toggle').addEventListener('click', (e) => {
        e.preventDefault();
        if (tileBar._tile) toggleTile(tileBar._tile);
      });
    }
  }

  frame.addEventListener('load', () => {
    showLoader(false);
    const doc = frame.contentDocument;
    if (!doc) return; // cross-origin guard (shouldn't happen — same host)
    // Re-run after overrides are applied, and once as a fallback.
    doc.addEventListener('fii:applied', () => setupEditor(), { once: true });
    setTimeout(() => setupEditor(), 1400);
  });

  function setupEditor() {
    const doc = frame.contentDocument;
    const win = frame.contentWindow;
    if (!doc || !doc.body || !currentPage) return;
    injectStyle(doc);
    ensureBars(doc);

    (currentPage.tiles || []).forEach((tile) => {
      let tileEl;
      try { tileEl = doc.querySelector(`[data-tile="${tile.id}"]`); } catch (e) { tileEl = null; }
      if (!tileEl) return;
      bindTile(tileEl, doc);
      (tile.fields || []).forEach((field) => {
        let el;
        try { el = tileEl.querySelector(field.selector); } catch (e) { el = null; }
        if (!el) return;
        el.dataset.fiiTile = tile.id;
        el.classList.add('fii-editable');
        // An element can carry both a text field and an image field (e.g. an
        // avatar showing initials that can be replaced by a photo). Track them
        // independently so neither overwrites the other.
        if (field.type === 'image') {
          el.dataset.fiiImageField = field.id;
          el.classList.add('fii-image-field');
        } else {
          el.dataset.fiiTextField = field.id;
          el.dataset.fiiTextType = field.type;
        }
      });
    });

    bindDoc(doc, win);
  }

  function bindDoc(doc, win) {
    if (doc.__fiiBound) return;
    doc.__fiiBound = true;

    // Block all in-preview navigation / form submits — this is an editor.
    doc.addEventListener('click', (e) => {
      if (e.target.closest('a')) e.preventDefault();
    }, true);
    doc.addEventListener('submit', (e) => e.preventDefault(), true);

    // Click → edit (or commit current edit when clicking elsewhere).
    doc.addEventListener('click', async (e) => {
      if (e.target.closest('.fii-bar')) return;
      const el = e.target.closest('.fii-editable');
      if (el && el.dataset.fiiTile) {
        // Prefer the photo uploader when the element is an image slot; the
        // toolbar still offers a shortcut to edit any accompanying text.
        if (el.dataset.fiiImageField) {
          if (imgEditing && imgEditing.el === el) return;
          await finishActiveEdit(true);
          startImageEdit(el);
          return;
        }
        if (el.dataset.fiiTextField) {
          if (editing && editing.el === el) return;
          await finishActiveEdit(true);
          endImageEdit();
          startEdit(el);
        }
      } else if (editing) {
        await finishActiveEdit(true);
      } else if (imgEditing) {
        endImageEdit();
      }
    });

    // Keep toolbars glued to their targets while scrolling/resizing.
    win.addEventListener('scroll', repositionBars, { passive: true });
    win.addEventListener('resize', repositionBars, { passive: true });
  }

  function bindTile(tileEl, doc) {
    if (tileEl.__fiiTileBound) return;
    tileEl.__fiiTileBound = true;
    tileEl.addEventListener('mouseenter', () => {
      clearTimeout(tileHideTimer);
      showTileBar(tileEl);
    });
    tileEl.addEventListener('mouseleave', () => hideTileBar(250));
  }

  // ---------- field editing ----------------------------------------
  function startEdit(el) {
    const tile = el.dataset.fiiTile;
    const field = el.dataset.fiiTextField;
    const type = el.dataset.fiiTextType || 'text';
    editing = {
      el, tile, field, type,
      original: type === 'html' ? el.innerHTML : el.innerText,
    };
    el.classList.add('fii-editing');
    el.setAttribute('contenteditable', type === 'html' ? 'true' : 'plaintext-only');
    el.focus();
    hideTileBar(0);
    repositionBars();
  }

  function endEdit() {
    if (!editing) return;
    editing.el.classList.remove('fii-editing');
    editing.el.removeAttribute('contenteditable');
    editing = null;
    if (fieldBar) fieldBar.style.display = 'none';
  }

  async function saveEdit() {
    if (!editing) return;
    const { el, tile, field, type } = editing;
    const value = type === 'html' ? el.innerHTML : el.innerText.replace(/\s+$/g, '');
    try {
      await api.saveBlock({ page_key: currentPage.key, tile_id: tile, field_id: field, value });
      (state.content[currentPage.key] ||= {});
      (state.content[currentPage.key][tile] ||= {});
      state.content[currentPage.key][tile][field] = value;
      endEdit();
      showToast('Сохранено ✓');
    } catch (err) {
      showToast('Не удалось сохранить: ' + err.message, 3500);
    }
  }

  function cancelEdit() {
    if (!editing) return;
    const { el, type, original } = editing;
    if (type === 'html') el.innerHTML = original; else el.innerText = original;
    endEdit();
  }

  // Used when switching elements/pages: commit silently without a toast.
  async function finishActiveEdit(save) {
    if (!editing) return;
    if (!save) { cancelEdit(); return; }
    const { el, tile, field, type, original } = editing;
    const value = type === 'html' ? el.innerHTML : el.innerText.replace(/\s+$/g, '');
    if (value === original) { endEdit(); return; }
    try {
      await api.saveBlock({ page_key: currentPage.key, tile_id: tile, field_id: field, value });
      (state.content[currentPage.key] ||= {});
      (state.content[currentPage.key][tile] ||= {});
      state.content[currentPage.key][tile][field] = value;
      showToast('Сохранено ✓');
    } catch (err) {
      showToast('Не удалось сохранить: ' + err.message, 3500);
    }
    endEdit();
  }

  async function resetField() {
    if (!editing) return;
    const { el, tile, field, type } = editing;
    const def = getFieldDefault(tile, field);
    if (!confirm('Вернуть исходный текст этого элемента?')) return;
    try {
      await api.deleteField(currentPage.key, tile, field);
      if (state.content[currentPage.key]?.[tile]) delete state.content[currentPage.key][tile][field];
      if (type === 'html') el.innerHTML = def; else el.innerText = def;
      endEdit();
      showToast('Текст сброшен к исходному');
    } catch (err) {
      showToast('Не удалось сбросить: ' + err.message, 3500);
    }
  }

  function getFieldDefault(tileId, fieldId) {
    const tile = (currentPage.tiles || []).find((t) => t.id === tileId);
    const field = tile && (tile.fields || []).find((f) => f.id === fieldId);
    return (field && field.default) || '';
  }

  // ---------- image slots (photo upload directly into a tile) -------
  function startImageEdit(el) {
    imgEditing = { el, tile: el.dataset.fiiTile, field: el.dataset.fiiImageField };
    hideTileBar(0);
    // Offer a shortcut to the element's text (e.g. avatar initials) if it has one.
    if (imageBar) {
      const textBtn = imageBar.querySelector('.fii-img-text');
      if (textBtn) textBtn.style.display = el.dataset.fiiTextField ? 'inline-flex' : 'none';
    }
    positionImageBar();
  }

  function endImageEdit() {
    imgEditing = null;
    if (imageBar) imageBar.style.display = 'none';
  }

  function pickImage() {
    if (!imgEditing) return;
    imgFileInput.value = '';
    imgFileInput.click();
  }

  async function onImageChosen() {
    const file = imgFileInput.files && imgFileInput.files[0];
    if (!file || !imgEditing) return;
    if (!file.type.startsWith('image/')) { showToast('Это не изображение'); return; }
    const { el, tile, field } = imgEditing;
    showToast('Загружаем фото…');
    try {
      const { url } = await api.uploadImage(file);
      await api.saveBlock({ page_key: currentPage.key, tile_id: tile, field_id: field, value: url });
      (state.content[currentPage.key] ||= {});
      (state.content[currentPage.key][tile] ||= {});
      state.content[currentPage.key][tile][field] = url;
      applyImageToEl(el, url);
      positionImageBar();
      showToast('Фото обновлено ✓');
    } catch (err) {
      showToast('Не удалось загрузить: ' + err.message, 3500);
    }
  }

  async function resetImage() {
    if (!imgEditing) return;
    const { el, tile, field } = imgEditing;
    if (!confirm('Убрать фотографию и вернуть исходный вид?')) return;
    try {
      await api.deleteField(currentPage.key, tile, field);
      if (state.content[currentPage.key]?.[tile]) delete state.content[currentPage.key][tile][field];
      applyImageToEl(el, '');
      positionImageBar();
      showToast('Фотография убрана');
    } catch (err) {
      showToast('Не удалось убрать: ' + err.message, 3500);
    }
  }

  // Mirror of script.js applyImage — paints <img src> or a cover background.
  function applyImageToEl(el, url) {
    if (!el) return;
    if (url) {
      if (el.tagName === 'IMG') {
        if (el.dataset.fiiOrigSrc == null) el.dataset.fiiOrigSrc = el.getAttribute('src') || '';
        el.src = url;
      } else {
        el.style.backgroundImage = `url("${url}")`;
        el.style.backgroundSize = 'cover';
        el.style.backgroundPosition = 'center';
        el.style.backgroundRepeat = 'no-repeat';
        el.style.color = 'transparent';
      }
      el.classList.add('fii-has-photo');
    } else {
      if (el.tagName === 'IMG') {
        if (el.dataset.fiiOrigSrc != null) el.src = el.dataset.fiiOrigSrc;
      } else {
        el.style.backgroundImage = '';
        el.style.color = '';
      }
      el.classList.remove('fii-has-photo');
    }
  }

  function positionImageBar() {
    if (!imgEditing || !imageBar) return;
    const win = frame.contentWindow;
    const r = imgEditing.el.getBoundingClientRect();
    imageBar.style.display = 'flex';
    const barH = imageBar.offsetHeight || 38;
    let top = r.top + win.scrollY - barH - 8;
    if (r.top < barH + 14) top = r.bottom + win.scrollY + 8;
    imageBar.style.top = Math.max(4, top) + 'px';
    imageBar.style.left = Math.max(4, r.left + win.scrollX) + 'px';
  }

  // ---------- tile visibility ---------------------------------------
  async function toggleTile(tileEl) {
    const tileId = tileEl.dataset.tile;
    const willHide = !tileEl.hasAttribute('data-fii-hidden');
    try {
      await api.setVisibility({ page_key: currentPage.key, tile_id: tileId, is_visible: !willHide });
      (state.visibility[currentPage.key] ||= {});
      state.visibility[currentPage.key][tileId] = !willHide;
      if (willHide) tileEl.setAttribute('data-fii-hidden', '1');
      else tileEl.removeAttribute('data-fii-hidden');
      updateTileBarLabel(tileEl);
      showToast(willHide ? 'Блок скрыт на сайте' : 'Блок снова виден');
    } catch (err) {
      showToast('Не удалось изменить видимость: ' + err.message, 3500);
    }
  }

  // ---------- toolbar positioning -----------------------------------
  function repositionBars() {
    if (editing && fieldBar) positionFieldBar();
    if (imgEditing && imageBar) positionImageBar();
    if (tileBar && tileBar.style.display === 'flex' && tileBar._tile) positionTileBar(tileBar._tile);
  }

  function positionFieldBar() {
    const win = frame.contentWindow;
    const r = editing.el.getBoundingClientRect();
    fieldBar.style.display = 'flex';
    const barH = fieldBar.offsetHeight || 38;
    let top = r.top + win.scrollY - barH - 8;
    if (r.top < barH + 14) top = r.bottom + win.scrollY + 8; // not enough room above
    fieldBar.style.top = Math.max(4, top) + 'px';
    fieldBar.style.left = Math.max(4, r.left + win.scrollX) + 'px';
  }

  function showTileBar(tileEl) {
    if (editing) return;
    tileBar._tile = tileEl;
    updateTileBarLabel(tileEl);
    tileBar.style.display = 'flex';
    positionTileBar(tileEl);
  }

  function positionTileBar(tileEl) {
    const win = frame.contentWindow;
    const r = tileEl.getBoundingClientRect();
    const w = tileBar.offsetWidth || 130;
    tileBar.style.top = (r.top + win.scrollY + 10) + 'px';
    tileBar.style.left = Math.max(4, r.right + win.scrollX - w - 12) + 'px';
  }

  function updateTileBarLabel(tileEl) {
    const hidden = tileEl.hasAttribute('data-fii-hidden');
    tileBar.querySelector('.fii-toggle').textContent = hidden ? '👁 Показать блок' : '🚫 Скрыть блок';
  }

  function hideTileBar(delay) {
    clearTimeout(tileHideTimer);
    tileHideTimer = setTimeout(() => { if (tileBar) tileBar.style.display = 'none'; }, delay);
  }

  // =================================================================
  //  TOOLS DRAWER (новости / фото / бегущая строка)
  // =================================================================
  const drawer = $('#toolDrawer');
  const TOOL_TITLES = { news: 'Новости', photos: 'Фотографии', ticker: 'Бегущая строка' };

  function openDrawer() { drawer.classList.add('is-open'); drawer.setAttribute('aria-hidden', 'false'); }
  function closeDrawer() { drawer.classList.remove('is-open'); drawer.setAttribute('aria-hidden', 'true'); }

  drawer?.addEventListener('click', (e) => { if (e.target.matches('[data-close]')) closeDrawer(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if ($('#newsModal').classList.contains('is-open')) closeNewsModal();
      else if (drawer.classList.contains('is-open')) closeDrawer();
    }
  });

  $$('.ed-tool').forEach((btn) => {
    btn.addEventListener('click', () => openTool(btn.dataset.tool));
  });

  async function openTool(tool) {
    $('#drawerTitle').textContent = TOOL_TITLES[tool] || 'Инструмент';
    $$('.tool-pane').forEach((p) => p.classList.toggle('is-active', p.dataset.pane === tool));
    openDrawer();
    try {
      if (tool === 'news' && !loaded.news) { state.news = await api.listNews(); loaded.news = true; renderNews(); }
      if (tool === 'photos' && !loaded.photos) { state.photos = await api.listPhotos(); loaded.photos = true; renderPhotos(); }
      if (tool === 'ticker' && !loaded.ticker) { state.ticker = await api.getTicker(); loaded.ticker = true; renderTicker(); }
    } catch (err) { showToast('Ошибка загрузки: ' + err.message, 3500); }
  }

  // ---------- News --------------------------------------------------
  function renderNews() {
    const tb = $('#newsTbody');
    $('#newsCount').textContent = state.news.length;
    tb.innerHTML = state.news.map((n) => {
      const cls = n.status === 'published' ? 'status--published' : 'status--draft';
      const txt = n.status === 'published' ? 'Опубликовано' : 'Черновик';
      const date = n.publish_date ? new Date(n.publish_date).toLocaleDateString('ru-RU') : '—';
      return `<tr data-id="${n.id}">
        <td>${escapeHtml(n.title)}</td>
        <td>${date}</td>
        <td><span class="status ${cls}">${txt}</span></td>
        <td><button class="icon-btn icon-btn--danger" title="Удалить">🗑</button></td>
      </tr>`;
    }).join('');
  }

  $('#newsTable')?.addEventListener('click', async (e) => {
    const btn = e.target.closest('.icon-btn--danger');
    if (!btn) return;
    const id = Number(btn.closest('tr')?.dataset.id);
    if (!id || !confirm('Удалить новость?')) return;
    try {
      await api.deleteNews(id);
      state.news = state.news.filter((n) => n.id !== id);
      renderNews();
      showToast('Новость удалена');
    } catch (err) { showToast(err.message); }
  });

  const newsModal = $('#newsModal');
  const openNewsModal = () => { newsModal.classList.add('is-open'); newsModal.setAttribute('aria-hidden', 'false'); };
  const closeNewsModal = () => { newsModal.classList.remove('is-open'); newsModal.setAttribute('aria-hidden', 'true'); };
  $('#openNewsModal')?.addEventListener('click', openNewsModal);
  newsModal?.addEventListener('click', (e) => { if (e.target.matches('[data-close]')) closeNewsModal(); });

  $('#newsForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const d = fd.get('date');
    if (d) fd.set('publish_date', new Date(d).toISOString());
    fd.delete('date');
    const cover = fd.get('cover');
    if (!cover || (cover instanceof File && !cover.size)) fd.delete('cover');
    try {
      const created = await api.createNews(fd);
      state.news.unshift(created);
      renderNews();
      closeNewsModal();
      form.reset();
      showToast('Новость сохранена ✓');
    } catch (err) { showToast('Не удалось сохранить: ' + err.message, 3500); }
  });

  // ---------- Photos ------------------------------------------------
  function renderPhotos() {
    const grid = $('#photoGrid');
    grid.innerHTML = state.photos.map((p) => `
      <figure class="photo-card" data-id="${p.id}">
        <div class="photo-card__img" style="background-image:url('${escapeHtml(p.url)}')"></div>
        <figcaption>
          <span>${escapeHtml(p.original_name || p.url.split('/').pop())}</span>
          <button class="icon-btn icon-btn--danger" title="Удалить">🗑</button>
        </figcaption>
      </figure>`).join('');
  }

  const dropzone = $('#dropzone');
  const photoInput = $('#photoInput');
  dropzone?.addEventListener('click', () => photoInput.click());
  $('#photoBrowse')?.addEventListener('click', (e) => { e.stopPropagation(); photoInput.click(); });
  ['dragenter', 'dragover'].forEach((ev) =>
    dropzone?.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.add('is-drag'); }));
  ['dragleave', 'drop'].forEach((ev) =>
    dropzone?.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.remove('is-drag'); }));
  dropzone?.addEventListener('drop', (e) => handleFiles(e.dataTransfer.files));
  photoInput?.addEventListener('change', (e) => handleFiles(e.target.files));

  async function handleFiles(list) {
    const files = Array.from(list).filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;
    showToast(`Загружаем ${files.length} файл(ов)…`);
    try {
      const created = await api.uploadPhotos(files);
      state.photos = [...created, ...state.photos];
      renderPhotos();
      showToast(`Загружено: ${created.length}`);
    } catch (err) { showToast('Ошибка загрузки: ' + err.message, 3500); }
  }

  $('#photoGrid')?.addEventListener('click', async (e) => {
    const btn = e.target.closest('.icon-btn--danger');
    if (!btn) return;
    const id = Number(btn.closest('.photo-card')?.dataset.id);
    if (!id || !confirm('Удалить фото?')) return;
    try {
      await api.deletePhoto(id);
      state.photos = state.photos.filter((p) => p.id !== id);
      renderPhotos();
      showToast('Фото удалено');
    } catch (err) { showToast(err.message); }
  });

  // ---------- Ticker ------------------------------------------------
  function renderTicker() {
    const list = $('#tickerList');
    list.innerHTML = state.ticker.map((text, i) => `
      <li class="ticker-item" data-index="${i}">
        <span class="ticker-item__num">${i + 1}</span>
        <input type="text" class="ticker-item__input" value="${escapeHtml(text)}" placeholder="Текст строки…">
        <button class="icon-btn icon-btn--danger" title="Удалить">🗑</button>
      </li>`).join('');
  }

  $('#tickerList')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.icon-btn--danger');
    if (!btn) return;
    syncTickerFromInputs();
    state.ticker.splice(Number(btn.closest('.ticker-item').dataset.index), 1);
    renderTicker();
  });

  $('#tickerAddItem')?.addEventListener('click', () => {
    syncTickerFromInputs();
    state.ticker.push('Новая строка…');
    renderTicker();
    const last = $('#tickerList').querySelector('.ticker-item:last-child .ticker-item__input');
    if (last) { last.focus(); last.select(); }
  });

  function syncTickerFromInputs() {
    state.ticker = $$('.ticker-item__input').map((i) => i.value);
  }

  $('#tickerSave')?.addEventListener('click', async () => {
    const items = $$('.ticker-item__input').map((i) => i.value.trim()).filter(Boolean);
    try {
      state.ticker = await api.replaceTicker(items);
      renderTicker();
      showToast('Бегущая строка сохранена ✓');
    } catch (err) { showToast(err.message); }
  });

  $('#tickerReset')?.addEventListener('click', async () => {
    if (!confirm('Очистить все строки?')) return;
    try {
      state.ticker = await api.replaceTicker([]);
      renderTicker();
      showToast('Бегущая строка очищена');
    } catch (err) { showToast(err.message); }
  });
})();
