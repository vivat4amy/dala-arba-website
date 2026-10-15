
const navbar = document.getElementById('navbar');
const hero = document.getElementById('hero');
const heroPhoto = document.getElementById('heroPhoto');
// Legacy elements (no longer in DOM) — keep refs as null for safe checks
const heroSky = document.getElementById('heroSky');
const heroMtn = document.getElementById('heroMountains');
const heroTagline = document.getElementById('heroTagline');
const heroHeading = document.getElementById('heroHeading');

// Smooth ease so transitions feel fluid even at low scroll speeds
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

let ticking = false;
let lastScrollY = 0;
const NAV_HIDE_THRESHOLD = 10;      // hide almost as soon as scrolling starts
const NAV_DELTA = 2;                // tiny jitter threshold
function updateParallax() {
  const y = window.scrollY;
  // nav background
  if (navbar) {
    if (y > 60) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');

    // Auto-hide nav on scroll down, reveal on scroll up
    const dy = y - lastScrollY;
    if (Math.abs(dy) > NAV_DELTA) {
      if (dy > 0 && y > NAV_HIDE_THRESHOLD) {
        navbar.classList.add('nav-hidden');
      } else if (dy < 0) {
        navbar.classList.remove('nav-hidden');
      }
      lastScrollY = y;
    }
    if (y <= 0) navbar.classList.remove('nav-hidden');
  }

  // hero-photo slow zoom — only on home page, only desktop
  if (!hero || !heroPhoto) {
    ticking = false;
    return;
  }
  if (window.innerWidth <= 768) {
    ticking = false;
    return;
  }
  const h = hero.offsetHeight;
  if (y < h * 1.3) {
    const p = Math.min(1, Math.max(0, y / h));   // 0 → 1 across the hero
    const e = easeOutCubic(p);
    // Slow zoom-out as user scrolls: scale starts at 1.12 and eases to 1.00
    const scale = (1.12 - e * 0.12).toFixed(3);
    heroPhoto.style.setProperty('--hero-scale', scale);
  }
  ticking = false;
}
window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(updateParallax);
    ticking = true;
  }
}, { passive: true });
updateParallax();

// Mobile menu toggle
const menuToggle = document.getElementById('menuToggle');
const mobileMenu = document.getElementById('mobileMenu');
if (menuToggle && mobileMenu) {
  const closeMenu = () => {
    menuToggle.classList.remove('open');
    mobileMenu.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };
  menuToggle.addEventListener('click', () => {
    const isOpen = menuToggle.classList.toggle('open');
    mobileMenu.classList.toggle('open', isOpen);
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    mobileMenu.setAttribute('aria-hidden', String(!isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });
  mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  window.addEventListener('resize', () => {
    if (window.innerWidth > 1100) closeMenu();
  });
}

// ── Language switcher: inject widget, load dictionary, translate on demand ──
(function initI18N() {
  // Resolve relative path to assets / i18n.js depending on page depth
  const path = window.location.pathname.replace(/\\/g, '/');
  const depth = (path.match(/\/(destinations|journeys|ru)\//) ? '../' : '');

  // 1. Ensure the widget exists in every navbar's right cluster
  const navRight = document.querySelector('#navbar .nav-right');
  if (navRight && !document.getElementById('langSwitch')) {
    const widget = document.createElement('div');
    widget.className = 'lang-switch';
    widget.id = 'langSwitch';
    widget.innerHTML = `
      <button type="button" class="lang-current" id="langCurrent" aria-haspopup="listbox" aria-expanded="false" aria-label="Change language">
        <span class="flag flag-en" id="langFlag" aria-hidden="true"></span>
        <span id="langCode">EN</span>
        <span class="lang-chevron" aria-hidden="true"></span>
      </button>
      <div class="lang-menu" role="listbox" aria-label="Language">
        <button type="button" class="lang-item active" data-lang="en" data-label="English" data-code="EN" role="option" aria-selected="true">
          <span class="flag flag-en" aria-hidden="true"></span>English
        </button>
        <button type="button" class="lang-item" data-lang="de" data-label="Deutsch" data-code="DE" role="option">
          <span class="flag flag-de" aria-hidden="true"></span>Deutsch
        </button>
        <button type="button" class="lang-item" data-lang="fr" data-label="Français" data-code="FR" role="option">
          <span class="flag flag-fr" aria-hidden="true"></span>Français
        </button>
        <button type="button" class="lang-item" data-lang="es" data-label="Español" data-code="ES" role="option">
          <span class="flag flag-es" aria-hidden="true"></span>Español
        </button>
        <button type="button" class="lang-item" data-lang="it" data-label="Italiano" data-code="IT" role="option">
          <span class="flag flag-it" aria-hidden="true"></span>Italiano
        </button>
        <button type="button" class="lang-item" data-lang="ja" data-label="日本語" data-code="JA" role="option">
          <span class="flag flag-ja" aria-hidden="true"></span>日本語
        </button>
        <button type="button" class="lang-item" data-lang="ko" data-label="한국어" data-code="KO" role="option">
          <span class="flag flag-ko" aria-hidden="true"></span>한국어
        </button>
        <button type="button" class="lang-item" data-lang="zh" data-label="中文" data-code="ZH" role="option">
          <span class="flag flag-zh" aria-hidden="true"></span>中文
        </button>
        <button type="button" class="lang-item" data-lang="ar" data-label="العربية" data-code="AR" role="option">
          <span class="flag flag-ar" aria-hidden="true"></span>العربية
        </button>
        <button type="button" class="lang-item" data-lang="ru" data-label="Русский" data-code="RU" role="option">
          <span class="flag flag-ru" aria-hidden="true"></span>Русский
        </button>
        <button type="button" class="lang-item" data-lang="kk" data-label="Қазақша" data-code="KK" role="option">
          <span class="flag flag-kk" aria-hidden="true"></span>Қазақша
        </button>
      </div>`;
    navRight.insertBefore(widget, navRight.firstChild);
  }

  // 2. Make sure the dictionary is loaded
  function ensureI18N(cb) {
    if (window.I18N && window.I18N.ru) return cb();
    const s = document.createElement('script');
    s.src = depth + 'i18n.js';
    s.onload = () => cb();
    s.onerror = () => cb(); // proceed even if missing — falls back to EN
    document.head.appendChild(s);
  }

  // 3. Translation engine — walks text nodes inside text-bearing elements
  //    and swaps their content individually. This way an element like
  //    <a>Experiences <span class="caret"></span></a> still gets its
  //    leading text translated, and an <h2>Foo<br>Bar</h2> translates
  //    each text-node fragment independently. Originals are cached on
  //    each text node / element so we can switch back to EN cleanly.
  const SELECTOR = 'h1,h2,h3,h4,h5,p,span,a,button,em,strong,small,blockquote,li,option,label,input[placeholder],textarea[placeholder]';
  const ORIGINAL_TEXT = new WeakMap(); // text-node  → originalValue
  const ORIGINAL_PH   = new WeakMap(); // element    → originalPlaceholder

  function translateTextNode(node, dict, lang) {
    let orig = ORIGINAL_TEXT.get(node);
    if (orig === undefined) {
      orig = node.nodeValue;
      ORIGINAL_TEXT.set(node, orig);
    }
    const trimmed = orig.trim();
    if (!trimmed) return;
    if (lang === 'en' || !dict) {
      node.nodeValue = orig;
    } else if (dict[trimmed]) {
      const lead = orig.match(/^\s*/)[0];
      const tail = orig.match(/\s*$/)[0];
      node.nodeValue = lead + dict[trimmed] + tail;
    } else {
      node.nodeValue = orig; // no translation found — keep English
    }
  }

  function applyLang(lang) {
    const dict = (window.I18N && window.I18N[lang]) || null;
    document.documentElement.lang = lang;
    document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';

    document.querySelectorAll(SELECTOR).forEach(el => {
      // Never translate the language switcher's own labels (English stays "English", etc.)
      if (el.closest && el.closest('.lang-switch')) return;
      // Walk all descendant text nodes (handles <p>…<a>…</a>…</p>, <span><strong>…</strong></span>, etc.)
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        translateTextNode(node, dict, lang);
      }

      // placeholder attribute
      if (el.placeholder !== undefined && el.placeholder) {
        let origPh = ORIGINAL_PH.get(el);
        if (origPh === undefined) {
          origPh = el.placeholder;
          ORIGINAL_PH.set(el, origPh);
        }
        if (lang === 'en' || !dict) el.placeholder = origPh;
        else el.placeholder = dict[origPh.trim()] || origPh;
      }
    });
  }

  function initialLang() {
    var SUPPORTED = ['en','de','fr','es','it','ja','ko','zh','ar','ru','kk'];
    try {
      var saved = localStorage.getItem('dalaarba.lang');
      if (saved && SUPPORTED.indexOf(saved) !== -1) return saved;
    } catch (_) {}
    var langs = (navigator.languages && navigator.languages.length)
      ? navigator.languages
      : [navigator.language || navigator.userLanguage || 'en'];
    for (var i = 0; i < langs.length; i++) {
      var code = String(langs[i] || '').toLowerCase().split('-')[0];
      if (SUPPORTED.indexOf(code) !== -1) return code;
    }
    return 'en';
  }

  // 4. Wire up the switcher (whether injected by us or pre-existing)
  function bindSwitcher() {
    const langSwitch = document.getElementById('langSwitch');
    const langCurrent = document.getElementById('langCurrent');
    const langFlag = document.getElementById('langFlag');
    const langCode = document.getElementById('langCode');
    const langItems = document.querySelectorAll('.lang-item');
    if (!langSwitch || !langCurrent) return;

    function setActive(lang) {
      langItems.forEach(i => {
        const on = i.dataset.lang === lang;
        i.classList.toggle('active', on);
        i.setAttribute('aria-selected', String(on));
      });
      const active = document.querySelector(`.lang-item[data-lang="${lang}"]`);
      if (active && langCode && langFlag) {
        langCode.textContent = active.dataset.code;
        langFlag.className = 'flag flag-' + lang;
      }
    }

    langCurrent.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = langSwitch.classList.toggle('open');
      langCurrent.setAttribute('aria-expanded', String(isOpen));
    });
    langItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const lang = item.dataset.lang;
        setActive(lang);
        try { localStorage.setItem('dalaarba.lang', lang); } catch (_) {}
        applyLang(lang);
        langSwitch.classList.remove('open');
        langCurrent.setAttribute('aria-expanded', 'false');
      });
    });
    document.addEventListener('click', (e) => {
      if (!langSwitch.contains(e.target)) {
        langSwitch.classList.remove('open');
        langCurrent.setAttribute('aria-expanded', 'false');
      }
    });

    // Apply saved or browser language on load
    const saved = initialLang();
    setActive(saved);
    applyLang(saved);
  }

  ensureI18N(bindSwitcher);
})();

// Reveal-on-scroll (used by any .reveal element on the page)
const reveals = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in-view');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
  reveals.forEach(el => io.observe(el));
} else {
  reveals.forEach(el => el.classList.add('in-view'));
}

/* ── Sticky scrollytelling: Trust / Team / Sustainability ─────────────── */
(function initScrolly() {
  const scrolly = document.querySelector('.scrolly');
  if (!scrolly) return;

  const figures  = scrolly.querySelectorAll('.img-stack figure');
  const images   = scrolly.querySelectorAll('.img-stack img');
  const slides   = scrolly.querySelectorAll('.text-slide');
  const triggers = scrolly.querySelectorAll('.scrolly-trigger');
  const counter  = scrolly.querySelector('.hud-counter .curr');
  const segments = scrolly.querySelectorAll('.progress-line .seg');

  if (!triggers.length) return;

  let activeStep = 0;

  function setStep(step) {
    if (step === activeStep) return;
    activeStep = step;

    figures.forEach(f => {
      f.classList.toggle('active', parseInt(f.dataset.step, 10) === step);
    });
    slides.forEach(s => {
      s.classList.toggle('active', parseInt(s.dataset.step, 10) === step);
    });

    if (counter) counter.textContent = String(step + 1).padStart(2, '0');

    segments.forEach((seg, i) => {
      seg.classList.remove('done', 'active');
      if (i < step) seg.classList.add('done');
      else if (i === step) seg.classList.add('active');
    });
  }

  // 1. Step switching — IntersectionObserver fires when the middle of
  //    the viewport crosses each invisible trigger.
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const step = parseInt(entry.target.dataset.step, 10);
          if (!Number.isNaN(step)) setStep(step);
        }
      });
    }, {
      threshold: 0,
      rootMargin: '-50% 0px -50% 0px'
    });
    triggers.forEach(t => observer.observe(t));
  }

  // 2. Parallax drift + Ken Burns zoom — each image translates vertically
  //    AND slowly scales up as its step's portion of the section scrolls past.
  const SHIFT = 48;   // ± px parallax drift
  const ZOOM  = 0.08; // scale grows from 1.00 → 1 + ZOOM across one step
  let rafId = null;

  function updateParallax() {
    rafId = null;
    const rect = scrolly.getBoundingClientRect();
    const sectionH = scrolly.offsetHeight;
    const vh = window.innerHeight;
    const totalScroll = Math.max(1, sectionH - vh);
    // how far we've scrolled into the section, clamped to [0, totalScroll]
    const y = Math.max(0, Math.min(totalScroll, -rect.top));
    const stepCount = images.length;
    const stepLen = totalScroll / stepCount;

    images.forEach((img, i) => {
      const stepStart = i * stepLen;
      const stepEnd   = (i + 1) * stepLen;
      let local;
      if (y <= stepStart)      local = 0;   // step hasn't started yet
      else if (y >= stepEnd)   local = 1;   // step is already past
      else local = (y - stepStart) / stepLen;

      // Parallax: local 0 → +SHIFT (image lower);  local 1 → −SHIFT (image higher)
      const ty = (0.5 - local) * 2 * SHIFT;
      // Ken Burns: image starts at scale 1, slowly grows to 1 + ZOOM
      const scale = 1 + local * ZOOM;

      img.style.transform =
        `translate3d(0, ${ty.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
    });
  }

  function onScroll() {
    if (rafId === null) rafId = requestAnimationFrame(updateParallax);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  // initial paint (so images aren't all stacked at +SHIFT before the first scroll)
  updateParallax();
})();

/* ── Structured data (JSON-LD) injected at runtime — formatter-safe ── */
(function injectSchema(){
  var ORIGIN = "https://dalaarba.com";
  function add(obj){
    var s = document.createElement("script");
    s.type = "application/ld+json";
    s.text = JSON.stringify(obj);
    document.head.appendChild(s);
  }
  function meta(sel){ var m = document.querySelector(sel); return m ? (m.getAttribute("content") || m.getAttribute("href") || "") : ""; }
  // Organization — every page
  add({
    "@context":"https://schema.org","@type":"TravelAgency","@id":ORIGIN+"/#organization",
    "name":"DALA ARBA Expeditions","url":ORIGIN,"logo":ORIGIN+"/assets/branding/logo.png",
    "image":ORIGIN+"/assets/journeys/aral-sea-shore.jpg",
    "description":"Premium private cultural and nature expeditions across Kazakhstan and Central Asia.",
    "email":"nomad@dalaarba.com","telephone":"+77788844668","priceRange":"$$$",
    "address":{"@type":"PostalAddress","addressLocality":"Almaty","addressCountry":"KZ"},
    "areaServed":["Kazakhstan","Kyrgyzstan","Uzbekistan","Tajikistan","Central Asia"],
    "knowsLanguage":["en","ru"],
    "sameAs":["https://www.instagram.com/dalaarbaexpeditions/","https://www.youtube.com/@dalaarbaexpeditions","https://www.facebook.com/share/1CeAjBQpoS/","https://www.linkedin.com/in/baur-jan-nigmetullin-21007257"]
  });
  var canon = (document.querySelector("link[rel=canonical]")||{}).href || location.href;
  var title = (document.title||"").replace(/\s*[|·]\s*DALA ARBA[\s\S]*$/i,"").replace(/\s*—\s*DALA ARBA[\s\S]*$/i,"").trim();
  var desc  = meta('meta[name="description"]');
  var img   = meta('meta[property="og:image"]');
  var p = location.pathname;
  if (/^\/(journeys|escapes)\/[^/]+\/?$/.test(p) || /^\/expeditions\/long\/?$/.test(p)) {
    add({"@context":"https://schema.org","@type":"TouristTrip","name":title,"description":desc,"url":canon,"image":img,
      "touristType":["Adventure travel","Cultural travel"],"provider":{"@id":ORIGIN+"/#organization"}});
  } else if (/^\/destinations\/[^/]+\/?$/.test(p)) {
    add({"@context":"https://schema.org","@type":"TouristAttraction","name":title,"description":desc,"url":canon,"image":img,
      "address":{"@type":"PostalAddress","addressCountry":"KZ"}});
  } else if (/^\/field-notes\/[^/]+\/?$/.test(p)) {
    add({"@context":"https://schema.org","@type":"BlogPosting","headline":title,"description":desc,"url":canon,"image":img,
      "mainEntityOfPage":canon,"author":{"@id":ORIGIN+"/#organization"},"publisher":{"@id":ORIGIN+"/#organization"}});
  }
})();
