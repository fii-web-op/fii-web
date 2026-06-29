// ===== HERO COUNTDOWN =====
function calculateDaysLeft() {
  const deadline = new Date(2026, 6, 20); // 20 июля 2026 (месяцы с 0)
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.max(0, Math.round((deadline - today) / msPerDay));
}

function pluralizeDays(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'день';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'дня';
  return 'дней';
}

document.addEventListener('DOMContentLoaded', () => {
  const countdownEl = document.getElementById('heroCountdown');
  if (!countdownEl) return;
  const days = calculateDaysLeft();
  countdownEl.textContent = `${days} ${pluralizeDays(days)}`;
});

// ===== ФОРМА «ОСТАВИТЬ ЗАЯВКУ» =====
// Виджет с заявкой (ФИО / телефон / почта) отправляет данные в Google-таблицу
// через Google Apps Script Web App. После деплоя скрипта (см. google-apps-script.gs
// и FORM-SETUP.md) вставьте сюда URL вида https://script.google.com/macros/s/.../exec
const APPLY_ENDPOINT = 'https://script.google.com/macros/s/AKfycbx6IQ8BhUoNFhh56ti4U8ZEqbGsUtJ8-quKq-Q8hSiIS4AJ46-poR291kHXt5Cp_Aw/exec';

function buildApplyWidget() {
  if (document.getElementById('applyWidget')) return;

  const wrap = document.createElement('div');
  wrap.className = 'apply-widget';
  wrap.id = 'applyWidget';
  wrap.innerHTML = `
    <button type="button" class="apply-fab" id="applyFab" aria-haspopup="dialog" aria-controls="applyModal">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
      </svg>
      <span>Оставить заявку</span>
    </button>

    <div class="apply-modal" id="applyModal" role="dialog" aria-modal="true" aria-labelledby="applyModalTitle" hidden>
      <div class="apply-modal__overlay" data-apply-close></div>
      <div class="apply-modal__card" role="document">
        <button type="button" class="apply-modal__close" data-apply-close aria-label="Закрыть форму">&times;</button>
        <span class="apply-modal__eyebrow">Приёмная кампания 2026</span>
        <h3 class="apply-modal__title" id="applyModalTitle">Оставить заявку</h3>
        <p class="apply-modal__subtitle">Заполните форму — приёмная комиссия свяжется с вами и расскажет о поступлении.</p>

        <form class="apply-form" id="applyForm" novalidate>
          <label class="apply-field">
            <span class="apply-field__label">ФИО <i>*</i></span>
            <input type="text" name="name" class="apply-field__input" autocomplete="name"
                   placeholder="Иванов Иван Иванович" required minlength="2">
          </label>
          <label class="apply-field">
            <span class="apply-field__label">Телефон <i>*</i></span>
            <input type="tel" name="phone" class="apply-field__input" autocomplete="tel"
                   placeholder="+7 (___) ___-__-__" required
                   pattern="[0-9+()\\-\\s]{6,20}">
          </label>
          <label class="apply-field">
            <span class="apply-field__label">Электронная почта <i>*</i></span>
            <input type="email" name="email" class="apply-field__input" autocomplete="email"
                   placeholder="you@example.com" required>
          </label>

          <label class="apply-consent">
            <input type="checkbox" name="consent" required>
            <span>Я даю согласие на обработку моих персональных данных в соответствии с
              <a href="#data-policy">политикой обработки персональных данных</a>.</span>
          </label>

          <button type="submit" class="btn btn--primary apply-form__submit" id="applySubmit">
            Отправить заявку <span class="arrow">→</span>
          </button>
          <p class="apply-form__status" id="applyStatus" role="status" aria-live="polite"></p>
        </form>
      </div>
    </div>`;

  document.body.appendChild(wrap);

  document.getElementById('applyFab').addEventListener('click', openApplyForm);
  wrap.querySelectorAll('[data-apply-close]').forEach((el) =>
    el.addEventListener('click', closeApplyForm));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeApplyForm();
  });
  document.getElementById('applyForm').addEventListener('submit', submitApplyForm);
}

function openApplyForm() {
  const modal = document.getElementById('applyModal');
  if (!modal) return;
  modal.hidden = false;
  document.body.classList.add('apply-modal-open');
  const first = modal.querySelector('input[name="name"]');
  if (first) setTimeout(() => first.focus(), 50);
}

function closeApplyForm() {
  const modal = document.getElementById('applyModal');
  if (!modal) return;
  modal.hidden = true;
  document.body.classList.remove('apply-modal-open');
}

async function submitApplyForm(e) {
  e.preventDefault();
  const form = e.target;
  const statusEl = document.getElementById('applyStatus');
  const submitBtn = document.getElementById('applySubmit');

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const payload = {
    name: form.name.value.trim(),
    phone: form.phone.value.trim(),
    email: form.email.value.trim(),
    page: window.location.pathname || '/',
    submittedAt: new Date().toISOString(),
  };

  statusEl.className = 'apply-form__status';
  statusEl.textContent = 'Отправляем заявку…';
  submitBtn.disabled = true;

  if (!APPLY_ENDPOINT || APPLY_ENDPOINT.indexOf('PASTE_') === 0) {
    statusEl.className = 'apply-form__status is-error';
    statusEl.textContent = 'Форма ещё не подключена к Google-таблице. Укажите URL в script.js (APPLY_ENDPOINT).';
    submitBtn.disabled = false;
    return;
  }

  try {
    // Google Apps Script Web App не отдаёт CORS-заголовки, поэтому отправляем
    // как text/plain в режиме no-cors: запись в таблицу проходит, ответ не читаем.
    await fetch(APPLY_ENDPOINT, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });
    form.reset();
    statusEl.className = 'apply-form__status is-success';
    statusEl.textContent = 'Спасибо! Ваша заявка отправлена — мы свяжемся с вами в ближайшее время.';
  } catch (err) {
    statusEl.className = 'apply-form__status is-error';
    statusEl.textContent = 'Не удалось отправить заявку. Попробуйте позже или напишите на admission@ai-faculty.ru';
  } finally {
    submitBtn.disabled = false;
  }
}

// ===== ПРАВОВОЕ УВЕДОМЛЕНИЕ О СБОРЕ ДАННЫХ (низ сайта) =====
function buildDataPolicyNotice() {
  const footer = document.querySelector('.footer .container') || document.querySelector('.footer');
  if (!footer || document.getElementById('data-policy')) return;

  const year = new Date().getFullYear();
  const notice = document.createElement('div');
  notice.className = 'footer__legal';
  notice.id = 'data-policy';
  notice.innerHTML = `
    <h4 class="footer__legal-title">Обработка персональных данных</h4>
    <p>
      Отправляя заявку через формы на этом сайте, вы в соответствии с
      Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных данных»
      даёте согласие на обработку указанных вами персональных данных
      (фамилия, имя, отчество, номер телефона, адрес электронной почты).
    </p>
    <p>
      Оператор персональных данных — Федеральное государственное автономное
      образовательное учреждение высшего образования «Российский университет
      дружбы народов» (РУДН), факультет искусственного интеллекта.
      Цель обработки — обработка обращений и заявок абитуриентов, информирование
      о поступлении, образовательных программах и мероприятиях факультета.
    </p>
    <p>
      Обработка данных осуществляется с момента их получения и до достижения
      целей обработки либо до отзыва согласия. Вы вправе в любой момент отозвать
      согласие на обработку персональных данных, направив запрос на адрес
      <a href="mailto:admission@ai-faculty.ru">admission@ai-faculty.ru</a>.
      Мы не передаём ваши данные третьим лицам, кроме случаев, предусмотренных
      законодательством Российской Федерации.
    </p>
    <p class="footer__legal-copy">&copy; ${year} РУДН · Факультет искусственного интеллекта · Политика обработки персональных данных</p>`;
  footer.appendChild(notice);
}

document.addEventListener('DOMContentLoaded', () => {
  buildApplyWidget();
  buildDataPolicyNotice();
});

// Обратная совместимость со старыми вызовами в разметке.
window.openApplyForm = openApplyForm;
window.closeApplyForm = closeApplyForm;
window.openChat = openApplyForm;

// ===== SIDEBAR NAV =====
const burger = document.getElementById('burger');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const sidebarClose = document.getElementById('sidebarClose');

function openSidebar() {
  sidebar.classList.add('is-open');
  sidebarOverlay.classList.add('is-visible');
  burger.classList.add('is-active');
  burger.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
}

function closeSidebar() {
  sidebar.classList.remove('is-open');
  sidebarOverlay.classList.remove('is-visible');
  burger.classList.remove('is-active');
  burger.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

burger.addEventListener('click', () => {
  if (sidebar.classList.contains('is-open')) {
    closeSidebar();
  } else {
    openSidebar();
  }
});

sidebarClose.addEventListener('click', closeSidebar);
sidebarOverlay.addEventListener('click', closeSidebar);

// Закрытие по Escape — стандартное поведение off-canvas меню.
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && sidebar.classList.contains('is-open')) {
    closeSidebar();
  }
});

// Если экран расширился до десктопа, пока меню открыто — закрываем,
// чтобы не остался залоченный скролл body при появлении горизонтальной навигации.
window.addEventListener('resize', () => {
  if (window.innerWidth >= 1024 && sidebar.classList.contains('is-open')) {
    closeSidebar();
  }
});

// ===== SCROLL ANIMATIONS =====
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -60px 0px',
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// Animate cards, reviews, section titles, subtitles, and hero elements
document.querySelectorAll('.card, .review, .section__title, .section__subtitle, .hero__title, .hero__subtitle, .hero__actions, .apply__inner').forEach((el) => {
  el.classList.add('fade-up');
  observer.observe(el);
});

// Add stagger delay to grid items
document.querySelectorAll('.cards, .cards--programs, .reviews__grid').forEach((grid) => {
  grid.querySelectorAll('.card, .review').forEach((item, i) => {
    item.classList.add('fade-up-delay-' + (i + 1));
  });
});

// ===== CMS overrides loader =====
// Тянет с админского API:
//   - тексты блоков (data-tile / fields из tile-registry.js)
//   - видимость блоков
//   - бегущую строку
// При недоступности API падает обратно на localStorage (дев-режим).
//
// URL API задаётся одним из способов (в порядке приоритета):
//   1. window.FII_API_BASE = 'https://admin.example.com';
//   2. <meta name="fii-api-base" content="https://admin.example.com">
//   3. пусто → ничего не тянем, работает только localStorage-fallback.
(function () {
  const metaEl = document.querySelector('meta[name="fii-api-base"]');
  const apiBase = (window.FII_API_BASE || (metaEl && metaEl.content) || '').replace(/\/$/, '');

  // Static pages carry their key in <body data-page>. Admin-created pages are
  // served from a shared shell that injects window.__FII_PAGE_KEY__ instead.
  const pageKey = (document.body && document.body.dataset && document.body.dataset.page)
    || window.__FII_PAGE_KEY__ || null;
  const SHARED_KEY = '_shared'; // global tiles (footer) shared across every page

  // Build a map: tile_id -> field_id -> { selector, type } from the shared registry.
  function buildFieldMap(pageDef) {
    const map = {};
    (pageDef?.tiles || []).forEach(tile => {
      map[tile.id] = {};
      (tile.fields || []).forEach(f => {
        map[tile.id][f.id] = { selector: f.selector, type: f.type };
      });
    });
    return map;
  }

  // Build a map: template_id -> field_id -> { selector, type }. Dynamic blocks
  // share their field descriptors via the page's templates, keyed by template.
  function buildTemplateFieldMap(pageDef) {
    const map = {};
    const templates = (pageDef && pageDef.templates) || {};
    Object.keys(templates).forEach(tid => {
      map[tid] = {};
      (templates[tid].fields || []).forEach(f => {
        map[tid][f.id] = { selector: f.selector, type: f.type };
      });
    });
    return map;
  }

  function renderTemplateEl(html) {
    const wrap = document.createElement('div');
    wrap.innerHTML = (html || '').trim();
    return wrap.firstElementChild;
  }

  const SECTIONS_LIST_ID = window.SECTIONS_LIST_ID || '__sections__';

  // Insert admin-added whole sections (list `__sections__`) just before the
  // footer, without touching the page's static content. Each section's template
  // — and its inner card list, if any — is registered into the page object so
  // the regular list rendering/binding below handles its cards.
  function renderSections(pageDef, blocks) {
    document.querySelectorAll('[data-fii-section]').forEach((el) => el.remove());
    if (!pageDef || !Array.isArray(blocks) || !blocks.length || !window.SECTION_TEMPLATES) return;
    const sections = blocks
      .filter((b) => b.list_id === SECTIONS_LIST_ID)
      .sort((a, b) => a.position - b.position);
    if (!sections.length) return;
    const footer = document.querySelector('.footer');
    sections.forEach((b) => {
      const tmpl = window.SECTION_TEMPLATES[b.template_id];
      const el = tmpl && renderTemplateEl(tmpl.html);
      if (!el) return;
      el.dataset.tile = b.tile_id;
      el.dataset.fiiTemplate = b.template_id;
      el.dataset.fiiSection = '1';
      const reg = window.FII_SECTIONS.registerInto(pageDef, b.tile_id, b.template_id);
      if (reg && reg.innerContainerSelector) {
        const grid = el.querySelector(reg.innerContainerSelector);
        if (grid) grid.dataset.fiiList = reg.innerListId;
      }
      if (footer && footer.parentNode) footer.parentNode.insertBefore(el, footer);
      else document.body.appendChild(el);
    });
  }

  // Replace a list container's children with the admin-managed blocks from the
  // DB. When a list has no blocks (not migrated, or API offline) the page's
  // static markup is left untouched as a fallback.
  function renderDynamicBlocks(pageDef, blocks) {
    if (!pageDef || !Array.isArray(pageDef.lists) || !Array.isArray(blocks) || !blocks.length) return;
    pageDef.lists.forEach(list => {
      const container = document.querySelector(list.container);
      if (!container) return;
      const items = blocks
        .filter(b => b.list_id === list.id)
        .sort((a, b) => a.position - b.position);
      if (!items.length) return;
      container.innerHTML = '';
      items.forEach(b => {
        const templateId = b.template_id || list.template;
        const tmpl = (pageDef.templates || {})[templateId];
        const el = tmpl && renderTemplateEl(tmpl.html);
        if (!el) return;
        el.dataset.tile = b.tile_id;
        el.dataset.fiiTemplate = templateId;
        container.appendChild(el);
      });
    });
  }

  // Merge a page payload with the shared (global) payload. Page-level keys win
  // on the (unexpected) chance of a collision.
  function mergePayload(page, shared) {
    return {
      content:    { ...(shared.content || {}),    ...(page.content || {}) },
      visibility: { ...(shared.visibility || {}), ...(page.visibility || {}) },
      blocks:     page.blocks || [],
    };
  }

  // True when the page is rendered inside the admin visual editor's iframe.
  // In that case hidden tiles are kept on screen (just flagged) so the editor
  // can show them dimmed and let the admin toggle them back on.
  const editMode = window.__FII_PREVIEW__ === true;

  function applyOverrides(payload) {
    const registry = window.PAGE_REGISTRY || [];
    // Admin-created pages aren't in the static registry; synthesize a minimal
    // page so the section mechanism (which registers its own templates) works.
    let pageDef = registry.find(p => p.key === pageKey);
    if (!pageDef && pageKey && pageKey !== SHARED_KEY) {
      pageDef = { key: pageKey, tiles: [], lists: [], templates: {} };
    }
    const sharedDef = registry.find(p => p.key === SHARED_KEY);

    // Materialise admin-added blocks before the apply loop runs, so the freshly
    // inserted [data-tile] elements receive their content/visibility below.
    // Sections first: they register their inner card lists into pageDef, which
    // renderDynamicBlocks then fills.
    renderSections(pageDef, payload.blocks || []);
    renderDynamicBlocks(pageDef, payload.blocks || []);

    // Include both the current page's tiles and the global/shared tiles so the
    // footer (present on every page) is recognised and overridden everywhere.
    const fieldMap = { ...buildFieldMap(pageDef), ...buildFieldMap(sharedDef) };
    const templateFieldMap = buildTemplateFieldMap(pageDef);

    const visibility = payload.visibility || {};
    const content    = payload.content || {};

    document.querySelectorAll('[data-tile]').forEach((tileEl) => {
      const tileId = tileEl.dataset.tile;
      if (visibility[tileId] === false) {
        if (editMode) {
          tileEl.setAttribute('data-fii-hidden', '1');
        } else {
          tileEl.setAttribute('hidden', '');
          tileEl.style.display = 'none';
          return;
        }
      } else if (editMode) {
        tileEl.removeAttribute('data-fii-hidden');
      }
      const overrides = content[tileId];
      // Static tiles look up their fields by tile_id; dynamic blocks share field
      // descriptors via their template (stamped as data-fii-template).
      const descriptors = fieldMap[tileId] || templateFieldMap[tileEl.dataset.fiiTemplate];
      if (!overrides || !descriptors) return;
      Object.entries(overrides).forEach(([fieldId, value]) => {
        const descriptor = descriptors[fieldId];
        if (!descriptor) return;
        const target = tileEl.querySelector(descriptor.selector);
        if (!target) return;
        if (descriptor.type === 'image') applyImage(target, value);
        else if (descriptor.type === 'link') applyLink(target, value);
        else if (descriptor.type === 'html') target.innerHTML = value;
        else target.textContent = value;
      });
    });

    // The mobile sidebar duplicates the header's menu and social icons but is
    // hidden in the editor, so it isn't edited directly. Mirror the header's
    // (possibly overridden) nav labels and social links into it so both stay
    // in sync from a single edit.
    syncHeaderToSidebar();
  }

  // Point an <a> at a new URL. External links open in a new tab. An empty
  // value restores the element's original href.
  function applyLink(el, url) {
    const v = (url || '').trim();
    if (!v) {
      if (el.dataset.fiiOrigHref != null) el.setAttribute('href', el.dataset.fiiOrigHref);
      el.removeAttribute('target');
      return;
    }
    if (el.dataset.fiiOrigHref == null) el.dataset.fiiOrigHref = el.getAttribute('href') || '';
    el.setAttribute('href', v);
    if (/^https?:\/\//i.test(v) || v.startsWith('//')) {
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener noreferrer');
    }
  }

  function syncHeaderToSidebar() {
    const hNav = document.querySelectorAll('.header__nav-list .header__nav-link');
    const sNav = document.querySelectorAll('.sidebar__menu .sidebar__link');
    hNav.forEach((h, i) => { if (sNav[i]) sNav[i].textContent = h.textContent; });

    const hSoc = document.querySelectorAll('.header__socials .header__social');
    const sSoc = document.querySelectorAll('.sidebar__socials .sidebar__social');
    hSoc.forEach((h, i) => {
      const s = sSoc[i];
      if (!s) return;
      const href = h.getAttribute('href');
      if (href) s.setAttribute('href', href); // keep sidebar's own labels (Telegram/VK/YouTube)
      if (h.getAttribute('target')) {
        s.setAttribute('target', h.getAttribute('target'));
        s.setAttribute('rel', h.getAttribute('rel') || 'noopener noreferrer');
      }
    });
  }

  // Put an uploaded image into a tile element. For <img> we swap `src`;
  // for any other element (e.g. an avatar <div>/<span>) we paint it as a
  // cover background and hide whatever text/initials were inside. An empty
  // value clears the image and brings the original content back.
  // Uploaded files live on the admin host (/uploads/...). On the public site
  // (a different origin) a root-relative path would 404, so resolve it against
  // the configured API base. Absolute URLs are left untouched.
  function resolveAssetUrl(url) {
    if (apiBase && /^\/uploads\//.test(url)) return apiBase + url;
    return url;
  }

  function applyImage(el, rawUrl) {
    const url = resolveAssetUrl(rawUrl);
    if (!url) {
      if (el.tagName === 'IMG') {
        if (el.dataset.fiiOrigSrc != null) el.src = el.dataset.fiiOrigSrc;
      } else {
        el.style.backgroundImage = '';
        el.style.color = '';
      }
      el.classList.remove('fii-has-photo');
      return;
    }
    if (el.tagName === 'IMG') {
      if (el.dataset.fiiOrigSrc == null) el.dataset.fiiOrigSrc = el.getAttribute('src') || '';
      el.src = url;
    } else {
      el.style.backgroundImage = `url("${url}")`;
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
      el.style.backgroundRepeat = 'no-repeat';
      el.style.color = 'transparent'; // hide initials behind the photo
    }
    el.classList.add('fii-has-photo');
  }

  // `authoritative` is true when the items come straight from the CMS API.
  // In that case an empty list means the admin deliberately cleared the
  // ticker — so we wipe the hardcoded fallback items and hide the bar,
  // instead of leaving the page's default markup on screen. For the
  // localStorage/offline fallback we only override when there is content.
  function applyTicker(items, authoritative) {
    const ticker = document.querySelector('.ticker');
    const track = document.querySelector('.ticker__track');
    if (!track) return;
    if (!Array.isArray(items) || !items.length) {
      if (authoritative) {
        track.innerHTML = '';
        if (ticker) ticker.style.display = 'none';
      }
      return;
    }
    if (ticker) ticker.style.display = '';

    const renderItem = (text) => {
      const span = document.createElement('span');
      span.className = 'ticker__item';
      const dot = document.createElement('span');
      dot.className = 'ticker__dot';
      span.appendChild(dot);
      span.appendChild(document.createTextNode(text));
      return span.outerHTML;
    };

    // Render a single pass first and measure it. The seamless CSS loop scrolls
    // the track by translateX(-50%), which only looks continuous when each
    // half is at least as wide as the visible bar. For short lists one pass is
    // narrower than the bar, so the animation barely moves and looks static /
    // obviously doubled. Fix: repeat the items until one half fills the bar,
    // then mirror that half — the ticker always runs smoothly.
    track.style.animation = '';
    track.innerHTML = items.map(renderItem).join('');
    const containerW = (ticker && ticker.clientWidth) || track.clientWidth || 0;
    const oneSetW = track.scrollWidth || 0;
    let reps = 1;
    if (oneSetW > 0 && containerW > 0) reps = Math.max(1, Math.ceil(containerW / oneSetW));
    const half = [];
    for (let i = 0; i < reps; i++) half.push(...items);
    track.innerHTML = [...half, ...half].map(renderItem).join('');
  }

  function readLocalFallback() {
    const safeJson = (key) => {
      try { return JSON.parse(localStorage.getItem(key)) || {}; }
      catch { return {}; }
    };
    return {
      content:    (safeJson('fii_tile_content')[pageKey])    || {},
      visibility: (safeJson('fii_tile_visibility')[pageKey]) || {},
      ticker:     (() => {
        try { const v = JSON.parse(localStorage.getItem('fii_ticker_items')); return Array.isArray(v) ? v : []; }
        catch { return []; }
      })(),
    };
  }

  // Let the visual editor know the page is fully populated and ready to be
  // decorated with click-to-edit handlers.
  function signalReady() {
    try { document.dispatchEvent(new CustomEvent('fii:applied')); } catch (e) { /* noop */ }
  }

  const fetchOverrides = (key) =>
    fetch(`${apiBase}/api/public/overrides?page_key=${encodeURIComponent(key)}`, { credentials: 'omit' });

  // Append admin-created pages to the site navigation (header + mobile sidebar)
  // so they're reachable from every page. Best-effort: failures are ignored.
  function appendNavPages(pages) {
    if (!Array.isArray(pages) || !pages.length) return;
    const navList = document.querySelector('.header__nav-list');
    const sideMenu = document.querySelector('.sidebar__menu');
    pages.forEach((p) => {
      const href = `/p/${encodeURIComponent(p.key)}`;
      if (navList && !navList.querySelector(`[data-fii-page="${p.key}"]`)) {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.className = 'header__nav-link';
        a.href = href; a.textContent = p.title; a.dataset.fiiPage = p.key;
        if (p.key === pageKey) a.setAttribute('aria-current', 'page');
        li.appendChild(a); navList.appendChild(li);
      }
      if (sideMenu && !sideMenu.querySelector(`[data-fii-page="${p.key}"]`)) {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.className = 'sidebar__link';
        a.href = href; a.textContent = p.title; a.dataset.fiiPage = p.key;
        li.appendChild(a); sideMenu.appendChild(li);
      }
    });
  }

  async function loadNav() {
    try {
      const res = await fetch(`${apiBase}/api/public/pages`, { credentials: 'omit' });
      if (res.ok) appendNavPages(await res.json());
    } catch (e) { /* nav is best-effort */ }
  }

  async function load() {
    loadNav();
    if (apiBase) {
      try {
        // Page overrides + global (footer) overrides in parallel; the footer
        // lives under `_shared` so a single edit there applies to every page.
        const [pageRes, sharedRes] = await Promise.all([
          pageKey ? fetchOverrides(pageKey) : Promise.resolve(null),
          fetchOverrides(SHARED_KEY),
        ]);
        const pageOk = pageRes && pageRes.ok;
        const sharedOk = sharedRes && sharedRes.ok;
        if (pageOk || sharedOk) {
          const data = pageOk ? await pageRes.json() : { content: {}, visibility: {}, ticker: [] };
          const shared = sharedOk ? await sharedRes.json() : { content: {}, visibility: {} };
          applyOverrides(mergePayload(data, shared));
          applyTicker(data.ticker || [], true);
          signalReady();
          return;
        }
      } catch (e) {
        console.warn('[FII] API недоступен, использую localStorage:', e.message);
      }
    }
    const fallback = readLocalFallback();
    applyOverrides(fallback);
    applyTicker(fallback.ticker, false);
    signalReady();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load, { once: true });
  } else {
    load();
  }
})();

// ===== ANALYTICS — log a page view =====
// Pings /api/public/track once per page load. Session id lives in
// sessionStorage so views from the same tab count as a single visitor; clearing
// the tab or browser starts a new one. Admin previews are skipped.
(function trackPageView() {
  if (window.__FII_PREVIEW__ === true) return;
  const metaEl = document.querySelector('meta[name="fii-api-base"]');
  const apiBase = (window.FII_API_BASE || (metaEl && metaEl.content) || '').replace(/\/$/, '');
  if (!apiBase) return;

  let sid = null;
  try { sid = sessionStorage.getItem('fii_sid'); } catch (e) { /* private mode */ }
  if (!sid) {
    sid = (window.crypto && window.crypto.randomUUID)
      ? window.crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
    try { sessionStorage.setItem('fii_sid', sid); } catch (e) { /* noop */ }
  }

  const pageKey = (document.body && document.body.dataset && document.body.dataset.page)
    || window.__FII_PAGE_KEY__ || null;

  try {
    fetch(`${apiBase}/api/public/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'omit',
      keepalive: true,
      body: JSON.stringify({
        page_key: pageKey,
        path: location.pathname + location.search,
        referrer: document.referrer || null,
        session_id: sid,
      }),
    }).catch(() => { /* best-effort */ });
  } catch (e) { /* noop */ }
})();

// ===== CAROUSEL NAVIGATION =====
(function initCarousels() {
  const SCROLL_AMOUNT = 300;

  document.querySelectorAll('.carousel-btn').forEach((btn) => {
    const carouselId = btn.dataset.carousel;
    const carousel = document.getElementById(carouselId + 'Carousel');
    if (!carousel) return;

    btn.addEventListener('click', () => {
      const dir = btn.classList.contains('carousel-btn--prev') ? -1 : 1;
      carousel.scrollBy({ left: dir * SCROLL_AMOUNT, behavior: 'smooth' });
    });
  });
})();

