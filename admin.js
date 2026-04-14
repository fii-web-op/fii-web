/* =========================================================
   CMS · Факультет ИИ — admin panel logic
   - tab switching
   - modal open/close
   - news form (simulated POST)
   - WYSIWYG toolbar
   - drag & drop photo upload
   - toast notifications
   ========================================================= */

(function () {
  'use strict';

  // ----- Utilities --------------------------------------------------
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const showToast = (msg, duration = 2600) => {
    const toast = $('#toast');
    toast.textContent = msg;
    toast.classList.add('is-visible');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('is-visible'), duration);
  };

  // ----- Tab switching ----------------------------------------------
  const pageMeta = {
    pages:        { title: 'Страницы сайта', subtitle: 'Управление видимостью плашек на каждой странице' },
    news:         { title: 'Новости',       subtitle: 'Управление публикациями факультета' },
    photos:       { title: 'Фотографии',    subtitle: 'Галерея факультета' },
    achievements: { title: 'Достижения',    subtitle: 'Карточки побед и наград' },
    settings:     { title: 'Настройки сайта', subtitle: 'Тексты, контакты и блоки' },
  };

  // ----- PAGE / TILE REGISTRY ---------------------------------------
  // Определяет структуру «страница → список плашек», которая отображается
  // в разделе «Страницы сайта» и используется публичной частью сайта для
  // скрытия/показа элементов по data-tile.
  const PAGE_REGISTRY = [
    {
      key: 'index',
      title: 'Главная',
      file: 'index.html',
      tiles: [
        { id: 'hero',            name: 'Hero-блок (заголовок + CTA)' },
        { id: 'about-section',   name: 'Секция «О факультете» (целиком)' },
        { id: 'about-card-1',    name: 'Карточка · 10+ лабораторий' },
        { id: 'about-card-2',    name: 'Карточка · Стажировки с 1 курса' },
        { id: 'about-card-3',    name: 'Карточка · 95% трудоустройства' },
        { id: 'about-card-4',    name: 'Карточка · 50+ проектов' },
        { id: 'programs-section',name: 'Секция «Программы обучения» (целиком)' },
        { id: 'program-1',       name: 'Программа · ИИ и машинное обучение' },
        { id: 'program-2',       name: 'Программа · Робототехника' },
        { id: 'program-3',       name: 'Программа · Генеративный ИИ (магистратура)' },
        { id: 'reviews-section', name: 'Секция «Отзывы студентов» (целиком)' },
        { id: 'review-1',        name: 'Отзыв · Анна Климова' },
        { id: 'review-2',        name: 'Отзыв · Дмитрий Морозов' },
        { id: 'review-3',        name: 'Отзыв · Елена Сидорова' },
        { id: 'apply-section',   name: 'CTA «Готов сделать первый шаг?»' },
      ],
    },
    {
      key: 'about',
      title: 'О факультете',
      file: 'about.html',
      tiles: [
        { id: 'about-hero',            name: 'Hero-блок' },
        { id: 'infrastructure-section',name: 'Секция «Инфраструктура и технологии»' },
        { id: 'infra-card-1',          name: 'Карточка · Современное оборудование' },
        { id: 'infra-card-2',          name: 'Карточка · Лаборатория ИИ' },
        { id: 'infra-card-3',          name: 'Карточка · Суперкомпьютер РУДН' },
        { id: 'partners-section',      name: 'Секция «Партнёры и практика»' },
        { id: 'partner-sber',          name: 'Партнёр · Сбер' },
        { id: 'partner-alfa',          name: 'Партнёр · Альфа-Банк' },
        { id: 'career-cta',            name: 'CTA «Карьера ещё до диплома»' },
      ],
    },
    {
      key: 'achievements',
      title: 'Достижения',
      file: 'achievements.html',
      tiles: [
        { id: 'stub-content', name: 'Основной контент страницы' },
      ],
    },
    {
      key: 'news',
      title: 'Новости',
      file: 'news.html',
      tiles: [
        { id: 'stub-content', name: 'Основной контент страницы' },
      ],
    },
    {
      key: 'reviews',
      title: 'Отзывы',
      file: 'reviews.html',
      tiles: [
        { id: 'stub-content', name: 'Основной контент страницы' },
      ],
    },
    {
      key: 'admission',
      title: 'Поступление',
      file: 'admission.html',
      tiles: [
        { id: 'stub-content', name: 'Основной контент страницы' },
      ],
    },
  ];

  const VISIBILITY_KEY = 'fii_tile_visibility';

  // visibility state: { [pageKey]: { [tileId]: boolean } }; true/undefined = видимо, false = скрыто
  const loadVisibility = () => {
    try { return JSON.parse(localStorage.getItem(VISIBILITY_KEY)) || {}; }
    catch { return {}; }
  };
  const saveVisibility = (state) => {
    localStorage.setItem(VISIBILITY_KEY, JSON.stringify(state));
  };
  const isTileVisible = (state, pageKey, tileId) => {
    const page = state[pageKey];
    if (!page) return true;
    return page[tileId] !== false;
  };
  const setTileVisibility = (pageKey, tileId, visible) => {
    const state = loadVisibility();
    if (!state[pageKey]) state[pageKey] = {};
    state[pageKey][tileId] = visible;
    saveVisibility(state);
  };

  // ----- Render pages tree ------------------------------------------
  const renderPagesTree = () => {
    const tree = $('#pagesTree');
    if (!tree) return;
    const state = loadVisibility();
    tree.innerHTML = PAGE_REGISTRY.map(page => {
      const hiddenCount = page.tiles.filter(t => !isTileVisible(state, page.key, t.id)).length;
      const counterText = hiddenCount > 0
        ? `${page.tiles.length - hiddenCount} / ${page.tiles.length} активно`
        : `${page.tiles.length} плашек`;
      const rows = page.tiles.map(tile => {
        const visible = isTileVisible(state, page.key, tile.id);
        return `
          <li class="tile-row">
            <div class="tile-row__label">
              <span class="tile-row__name">${escapeHtml(tile.name)}</span>
              <span class="tile-row__id">data-tile="${escapeHtml(tile.id)}"</span>
            </div>
            <label class="switch" title="${visible ? 'Скрыть' : 'Показать'}">
              <input type="checkbox" data-page="${page.key}" data-tile="${tile.id}" ${visible ? 'checked' : ''}>
              <span class="switch__slider"></span>
            </label>
          </li>`;
      }).join('');
      return `
        <div class="page-item" data-page-key="${page.key}">
          <button class="page-item__head" type="button" aria-expanded="false">
            <svg class="page-item__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            <span class="page-item__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </span>
            <span class="page-item__info">
              <span class="page-item__title">${escapeHtml(page.title)}</span>
              <span class="page-item__meta">${escapeHtml(page.file)}</span>
            </span>
            <span class="page-item__counter">${counterText}</span>
          </button>
          <div class="page-item__body">
            <ul class="tile-list">${rows}</ul>
          </div>
        </div>`;
    }).join('');
  };

  const switchSection = (key) => {
    $$('.admin-nav__link').forEach(btn =>
      btn.classList.toggle('is-active', btn.dataset.section === key)
    );
    $$('.admin-section').forEach(sec =>
      sec.classList.toggle('is-active', sec.dataset.section === key)
    );
    const meta = pageMeta[key];
    if (meta) {
      $('#pageTitle').textContent = meta.title;
      $('#pageSubtitle').textContent = meta.subtitle;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  $$('.admin-nav__link').forEach(btn =>
    btn.addEventListener('click', () => switchSection(btn.dataset.section))
  );

  // ----- Pages tree: render + interactions --------------------------
  renderPagesTree();

  const pagesTree = $('#pagesTree');
  if (pagesTree) {
    // Аккордеон: разворачивание/сворачивание страницы
    pagesTree.addEventListener('click', (e) => {
      const head = e.target.closest('.page-item__head');
      if (!head) return;
      // Не разворачивать, если кликнули по переключателю
      if (e.target.closest('.switch')) return;
      const item = head.closest('.page-item');
      const wasOpen = item.classList.toggle('is-open');
      head.setAttribute('aria-expanded', wasOpen ? 'true' : 'false');
    });

    // Переключение видимости плашки
    pagesTree.addEventListener('change', (e) => {
      const input = e.target.closest('input[type="checkbox"][data-tile]');
      if (!input) return;
      const pageKey = input.dataset.page;
      const tileId  = input.dataset.tile;
      const visible = input.checked;
      setTileVisibility(pageKey, tileId, visible);

      // Обновляем счётчик на шапке страницы
      const pageEl = input.closest('.page-item');
      const state  = loadVisibility();
      const pageDef = PAGE_REGISTRY.find(p => p.key === pageKey);
      if (pageEl && pageDef) {
        const hiddenCount = pageDef.tiles.filter(t => !isTileVisible(state, pageKey, t.id)).length;
        const counter = pageEl.querySelector('.page-item__counter');
        if (counter) {
          counter.textContent = hiddenCount > 0
            ? `${pageDef.tiles.length - hiddenCount} / ${pageDef.tiles.length} активно`
            : `${pageDef.tiles.length} плашек`;
        }
      }
      showToast(visible ? 'Плашка показана ✓' : 'Плашка скрыта');
    });
  }

  // Сброс всех настроек видимости
  const resetBtn = $('#pagesReset');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (!confirm('Показать все плашки на всех страницах?')) return;
      localStorage.removeItem(VISIBILITY_KEY);
      renderPagesTree();
      showToast('Видимость плашек сброшена');
    });
  }

  // ----- Modal ------------------------------------------------------
  const newsModal = $('#newsModal');
  const openModal = () => { newsModal.classList.add('is-open'); newsModal.setAttribute('aria-hidden', 'false'); };
  const closeModal = () => { newsModal.classList.remove('is-open'); newsModal.setAttribute('aria-hidden', 'true'); };

  $('#openNewsModal').addEventListener('click', openModal);
  newsModal.addEventListener('click', (e) => {
    if (e.target.matches('[data-close]')) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && newsModal.classList.contains('is-open')) closeModal();
  });

  // ----- WYSIWYG toolbar --------------------------------------------
  $$('.wysiwyg__toolbar button').forEach(btn => {
    btn.addEventListener('click', () => {
      const cmd = btn.dataset.cmd;
      let val  = btn.dataset.value || null;
      if (cmd === 'createLink') {
        val = prompt('URL ссылки:', 'https://');
        if (!val) return;
      }
      document.execCommand(cmd, false, val);
      $('.wysiwyg__area').focus();
    });
  });

  // ----- News form (simulated POST) ---------------------------------
  $('#newsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = {
      title:   data.get('title'),
      content: $('.wysiwyg__area').innerHTML,
      date:    data.get('date'),
      status:  data.get('status'),
      cover:   data.get('cover')?.name || null,
    };

    // Simulated backend call. Swap the URL for your FastAPI endpoint.
    try {
      // await fetch('/api/admin/news', { method: 'POST', body: data });
      await new Promise(r => setTimeout(r, 450));
      console.log('POST /api/admin/news →', payload);

      // Optimistic UI update
      const tbody = $('#newsTbody');
      const row = document.createElement('tr');
      const statusCls = payload.status === 'published' ? 'status--published' : 'status--draft';
      const statusTxt = payload.status === 'published' ? 'Опубликовано' : 'Черновик';
      const dateFmt   = payload.date ? new Date(payload.date).toLocaleDateString('ru-RU') : '—';
      row.innerHTML = `
        <td>${escapeHtml(payload.title)}</td>
        <td>${dateFmt}</td>
        <td><span class="status ${statusCls}">${statusTxt}</span></td>
        <td class="admin-table__actions">
          <button class="icon-btn" title="Редактировать">✎</button>
          <button class="icon-btn icon-btn--danger" title="Удалить">🗑</button>
        </td>`;
      tbody.prepend(row);
      $('#newsCount').textContent = tbody.children.length;

      closeModal();
      form.reset();
      $('.wysiwyg__area').innerHTML = '';
      showToast('Новость сохранена ✓');
    } catch (err) {
      showToast('Не удалось сохранить новость');
      console.error(err);
    }
  });

  // Delegated delete for news rows
  $('#newsTable').addEventListener('click', (e) => {
    const btn = e.target.closest('.icon-btn--danger');
    if (!btn) return;
    const row = btn.closest('tr');
    if (row && confirm('Удалить новость?')) {
      row.remove();
      $('#newsCount').textContent = $('#newsTbody').children.length;
      showToast('Новость удалена');
    }
  });

  // ----- Achievements form ------------------------------------------
  $('#achievementForm').addEventListener('submit', (e) => {
    e.preventDefault();
    showToast('Достижение добавлено ✓');
    e.currentTarget.reset();
  });

  // ----- Settings form ----------------------------------------------
  $('#settingsForm').addEventListener('submit', (e) => {
    e.preventDefault();
    showToast('Настройки сохранены ✓');
  });

  // ----- Photos: drag & drop ----------------------------------------
  const dropzone = $('#dropzone');
  const photoInput = $('#photoInput');
  const photoGrid = $('#photoGrid');

  dropzone.addEventListener('click', () => photoInput.click());
  $('#photoBrowse').addEventListener('click', (e) => {
    e.stopPropagation();
    photoInput.click();
  });

  ['dragenter', 'dragover'].forEach(evt =>
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.add('is-drag');
    })
  );
  ['dragleave', 'drop'].forEach(evt =>
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.remove('is-drag');
    })
  );
  dropzone.addEventListener('drop', (e) => handleFiles(e.dataTransfer.files));
  photoInput.addEventListener('change', (e) => handleFiles(e.target.files));

  function handleFiles(fileList) {
    const files = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    if (!files.length) return;
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const fig = document.createElement('figure');
        fig.className = 'photo-card';
        fig.innerHTML = `
          <div class="photo-card__img" style="background-image:url('${ev.target.result}')"></div>
          <figcaption>
            <span>${escapeHtml(file.name)}</span>
            <button class="icon-btn icon-btn--danger" title="Удалить">🗑</button>
          </figcaption>`;
        photoGrid.prepend(fig);
      };
      reader.readAsDataURL(file);
    });
    showToast(`Загружено файлов: ${files.length}`);

    // In real app: upload via fetch
    // const fd = new FormData();
    // files.forEach(f => fd.append('photos', f));
    // fetch('/api/admin/photos', { method: 'POST', body: fd });
  }

  // Delegated photo delete
  photoGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('.icon-btn--danger');
    if (!btn) return;
    btn.closest('.photo-card')?.remove();
    showToast('Фото удалено');
  });

  // Delegated achievement delete
  $('#achievementList').addEventListener('click', (e) => {
    const btn = e.target.closest('.icon-btn--danger');
    if (!btn) return;
    btn.closest('.achievement-item')?.remove();
    showToast('Достижение удалено');
  });

  // ----- Helpers ----------------------------------------------------
  function escapeHtml(str = '') {
    return String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }
})();
