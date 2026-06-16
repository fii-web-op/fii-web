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

// ===== CHAT WIDGET =====
const chatWidget = document.getElementById('chatWidget');
const chatToggle = document.getElementById('chatToggle');
const chatInput = document.getElementById('chatInput');
const chatSend = document.getElementById('chatSend');
const chatMessages = document.getElementById('chatMessages');

function openChat() {
  if (!chatWidget) return;
  chatWidget.classList.add('is-open');
  chatInput.focus();
}

function closeChat() {
  if (!chatWidget) return;
  chatWidget.classList.remove('is-open');
}

if (chatToggle) {
  chatToggle.addEventListener('click', () => {
    if (chatWidget.classList.contains('is-open')) {
      closeChat();
    } else {
      openChat();
    }
  });
}

// Send message
function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  const userMsg = document.createElement('div');
  userMsg.className = 'chat-widget__msg chat-widget__msg--user';
  userMsg.textContent = text;
  chatMessages.appendChild(userMsg);
  chatInput.value = '';
  chatMessages.scrollTop = chatMessages.scrollHeight;

  setTimeout(() => {
    const botMsg = document.createElement('div');
    botMsg.className = 'chat-widget__msg chat-widget__msg--bot';
    botMsg.textContent = 'Спасибо за вопрос! Сейчас я работаю в демо-режиме. Скоро здесь будет настоящий ИИ-ассистент. А пока напишите нам на admission@ai-faculty.ru 😊';
    chatMessages.appendChild(botMsg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }, 800);
}

if (chatSend) chatSend.addEventListener('click', sendMessage);
if (chatInput) chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendMessage();
});

// ===== SIDEBAR NAV =====
const burger = document.getElementById('burger');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const sidebarClose = document.getElementById('sidebarClose');

function openSidebar() {
  sidebar.classList.add('is-open');
  sidebarOverlay.classList.add('is-visible');
  burger.classList.add('is-active');
  document.body.style.overflow = 'hidden';
}

function closeSidebar() {
  sidebar.classList.remove('is-open');
  sidebarOverlay.classList.remove('is-visible');
  burger.classList.remove('is-active');
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

  const pageKey = document.body?.dataset?.page || null;
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

  // Merge a page payload with the shared (global) payload. Page-level keys win
  // on the (unexpected) chance of a collision.
  function mergePayload(page, shared) {
    return {
      content:    { ...(shared.content || {}),    ...(page.content || {}) },
      visibility: { ...(shared.visibility || {}), ...(page.visibility || {}) },
    };
  }

  // True when the page is rendered inside the admin visual editor's iframe.
  // In that case hidden tiles are kept on screen (just flagged) so the editor
  // can show them dimmed and let the admin toggle them back on.
  const editMode = window.__FII_PREVIEW__ === true;

  function applyOverrides(payload) {
    const registry = window.PAGE_REGISTRY || [];
    const pageDef = registry.find(p => p.key === pageKey);
    const sharedDef = registry.find(p => p.key === SHARED_KEY);
    // Include both the current page's tiles and the global/shared tiles so the
    // footer (present on every page) is recognised and overridden everywhere.
    const fieldMap = { ...buildFieldMap(pageDef), ...buildFieldMap(sharedDef) };

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
      if (!overrides || !fieldMap[tileId]) return;
      Object.entries(overrides).forEach(([fieldId, value]) => {
        const descriptor = fieldMap[tileId][fieldId];
        if (!descriptor) return;
        const target = tileEl.querySelector(descriptor.selector);
        if (!target) return;
        if (descriptor.type === 'image') applyImage(target, value);
        else if (descriptor.type === 'html') target.innerHTML = value;
        else target.textContent = value;
      });
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

    // Render a single pass first and measure it. The seamless CSS loop
    // (translateX(-50%)) needs the items duplicated — but duplicating a short
    // list that already fits the bar makes it look obviously doubled. So we
    // only duplicate when one pass overflows the visible bar; otherwise the
    // items are shown once, static.
    track.style.animation = '';
    track.innerHTML = items.map(renderItem).join('');
    const containerW = (ticker && ticker.clientWidth) || track.clientWidth || 0;
    const oneSetW = track.scrollWidth || 0;
    if (oneSetW > containerW + 1) {
      track.innerHTML = [...items, ...items].map(renderItem).join('');
    } else {
      track.style.animation = 'none'; // fits on screen → no scroll, no copy
    }
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

  async function load() {
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

