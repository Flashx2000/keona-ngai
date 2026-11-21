/* Keona Ngai — motion & interaction engine (vanilla, no build step) */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const root = document.documentElement;
  const page = document.body.dataset.page || 'Keona Ngai';
  const here = location.pathname.split('/').pop() || 'index.html';

  /* ------------------------------------------------------------------ *
   * SITE SETTINGS — edit these before launch
   * ------------------------------------------------------------------ */
  const SITE = {
    email: 'keonangai@gmail.com',
    instagram: 'https://instagram.com/',   // placeholder
    instagramHandle: '@keonangai',         // placeholder
    nav: [['Work', 'work.html'], ['Services', 'services.html'], ['About', 'about.html'], ['Contact', 'contact.html']],
  };

  /* ---------- chrome: curtain, header, menu, cursor, footer ---------- */
  const navLinks = SITE.nav.map(([t, h]) => `<a class="link${h === here ? ' is-active' : ''}" href="${h}">${t}</a>`).join('');
  document.body.insertAdjacentHTML('afterbegin', `
    <div class="curtain" aria-hidden="true">
      <div class="curtain__in"><span class="curtain__label"></span></div>
      <span class="curtain__meta">Keona Ngai — Photographer, Vancouver</span>
      <span class="curtain__count"></span>
    </div>
    <div class="progress" aria-hidden="true"></div>
    <header class="hdr">
      <a class="hdr__logo" href="index.html" aria-label="Keona Ngai — home">Keona Ngai<small>Photographer</small></a>
      <nav class="hdr__nav" aria-label="Primary">${navLinks}</nav>
      <button class="hdr__burger" aria-expanded="false" aria-controls="menu">Menu</button>
    </header>
    <div class="menu" id="menu" aria-hidden="true">
      <a class="menu__l" style="--i:0" href="index.html"><span>Home</span></a>
      ${SITE.nav.map(([t, h], i) => `<a class="menu__l" style="--i:${i + 1}" href="${h}"><span>${t}</span></a>`).join('')}
      <div class="menu__foot label"><a href="mailto:${SITE.email}">${SITE.email}</a><span>Vancouver, BC</span></div>
    </div>
    <div class="cursor" aria-hidden="true"><span></span></div>`);

  const footerHost = $('[data-footer]');
  if (footerHost) footerHost.innerHTML = `
    <footer class="ftr">
      <div class="ftr__top">
        <div>
          <h4>New enquiries</h4>
          <a class="ftr__mail link" href="mailto:${SITE.email}">${SITE.email}</a>
          <p class="label" style="margin-top:22px"><i class="dot"></i>Now booking 2027 — events &amp; weddings</p>
        </div>
        <div><h4>Sitemap</h4><ul><li><a class="link" href="index.html">Home</a></li>${SITE.nav.map(([t, h]) => `<li><a class="link" href="${h}">${t}</a></li>`).join('')}</ul></div>
        <div><h4>Follow</h4><ul>
          <li><a class="link" href="${SITE.instagram}" target="_blank" rel="noopener">Instagram ${SITE.instagramHandle}</a></li>
          <li><a class="link" href="#">LinkedIn</a></li><li><a class="link" href="#">TikTok</a></li></ul></div>
        <div><h4>Studio</h4><ul><li>Vancouver, BC</li><li>Serving Metro Vancouver</li><li>Available for travel</li><li style="margin-top:12px">Local time <span data-clock>—</span></li></ul></div>
      </div>
      <div class="ftr__big" aria-hidden="true" data-split="chars">Keona Ngai</div>
      <div class="ftr__bot label"><span>© ${new Date().getFullYear()} Keona Ngai Photography</span><span>Brand events · Corporate · Activations · Weddings</span><a class="link" href="#" data-top>Back to top ↑</a></div>
    </footer>`;

  /* ---------- smooth scroll (Lenis, optional) ---------- */
  // loaded asynchronously so a slow CDN never holds up the page; native scroll is the fallback
  let lenis = null;
  if (!reduce) {
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/lenis@1.1.14/dist/lenis.min.js'; s.async = true;
    s.onload = () => { try { lenis = new window.Lenis({ lerp: 0.085, wheelMultiplier: 1 }); } catch (e) { lenis = null; } };
    document.head.appendChild(s);
  }
  const lock = (on) => { if (lenis) on ? lenis.stop() : lenis.start(); document.body.style.overflow = on ? 'hidden' : ''; };

  /* ---------- text splitting ---------- */
  function split(el, mode) {
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          const parts = mode === 'chars' ? [...n.textContent] : n.textContent.split(/(\s+)/);
          parts.forEach((p) => {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w';
            const wi = document.createElement('span'); wi.className = 'wi'; wi.style.setProperty('--i', i++); wi.textContent = p;
            w.appendChild(wi); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    };
    el.setAttribute('aria-label', el.textContent.trim());
    walk(el);
  }
  $$('[data-split]').forEach((el) => split(el, el.dataset.split));
  $$('[data-scrub]').forEach((el) => {
    el.innerHTML = el.textContent.trim().split(/\s+/).map((w) => `<span class="sw">${w}</span>`).join(' ');
  });

  /* ---------- marquee duplication ---------- */
  $$('.marquee').forEach((m) => { const t = $('.marquee__t', m); for (let k = 0; k < 2; k++) { const c = t.cloneNode(true); c.setAttribute('aria-hidden', 'true'); m.appendChild(c); } });

  /* ---------- reveals ---------- */
  // rect-based rather than IntersectionObserver: clip-path reveals report a zero intersection ratio
  let pending = [];
  function checkReveals() {
    if (!pending.length) return;
    const vh = innerHeight;
    pending = pending.filter((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.93 && r.bottom > -40) { el.classList.add('in'); return false; }
      return true;
    });
  }
  function startReveals() {
    pending = $$('[data-reveal],[data-split],[data-img]');
    checkReveals();
    // counters
    const cio = new IntersectionObserver((ents) => ents.forEach((e) => {
      if (!e.isIntersecting) return; cio.unobserve(e.target);
      const el = e.target, to = +el.dataset.count, suf = el.dataset.suffix || '', t0 = performance.now(), dur = 1900;
      const step = (t) => { const p = clamp((t - t0) / dur); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 4))) + suf; if (p < 1) requestAnimationFrame(step); };
      reduce ? (el.textContent = to + suf) : requestAnimationFrame(step);
    }), { threshold: 0.4 });
    $$('[data-count]').forEach((e) => cio.observe(e));
  }

  /* ---------- curtain: preloader + page transitions ---------- */
  const curtain = $('.curtain'), cLabel = $('.curtain__label'), cCount = $('.curtain__count');
  const firstVisit = (() => { try { if (sessionStorage.getItem('kn-seen')) return false; sessionStorage.setItem('kn-seen', '1'); return true; } catch (e) { return false; } })();
  const lift = () => { curtain.classList.add('is-up'); root.classList.add('loaded'); setTimeout(startReveals, 250); };
  root.classList.add('ready');
  if (reduce) { curtain.style.display = 'none'; root.classList.add('loaded'); startReveals(); }
  else if (firstVisit && here === 'index.html') {
    cLabel.textContent = 'Keona Ngai';
    requestAnimationFrame(() => curtain.classList.add('is-show'));
    const t0 = performance.now(), dur = 1900;
    const tick = (t) => { const p = clamp((t - t0) / dur); cCount.textContent = String(Math.round(p * p * (3 - 2 * p) * 100)).padStart(3, '0'); p < 1 ? requestAnimationFrame(tick) : setTimeout(lift, 250); };
    requestAnimationFrame(tick);
  } else {
    cLabel.textContent = page;
    setTimeout(() => curtain.classList.add('is-show'), 30);
    setTimeout(lift, 520);
  }
  // leave
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]'); if (!a) return;
    if (a.dataset.top !== undefined) { e.preventDefault(); lenis ? lenis.scrollTo(0, { duration: 1.6 }) : scrollTo({ top: 0, behavior: 'smooth' }); return; }
    const href = a.getAttribute('href');
    if (reduce || a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || !/\.html([?#]|$)/.test(href) || /^https?:/.test(href)) return;
    e.preventDefault();
    const file = href.split(/[?#]/)[0];
    if (file === here) { closeMenu(); return; }
    const name = file === 'index.html' ? 'Keona Ngai' : (SITE.nav.find(([, h]) => h === file) || [a.dataset.name || ''])[0];
    cCount.textContent = ''; cLabel.textContent = name;
    curtain.classList.remove('is-up', 'is-show'); curtain.classList.add('is-below');
    void curtain.offsetHeight;
    curtain.classList.remove('is-below'); curtain.classList.add('is-show');
    setTimeout(() => { location.href = href; }, 950);
  });
  addEventListener('pageshow', (e) => { if (e.persisted) { curtain.classList.add('is-up'); } });

  /* ---------- menu ---------- */
  const burger = $('.hdr__burger'), menu = $('.menu');
  function closeMenu() { menu.classList.remove('is-open'); menu.setAttribute('aria-hidden', 'true'); burger.setAttribute('aria-expanded', 'false'); burger.textContent = 'Menu'; lock(false); }
  burger.addEventListener('click', () => {
    if (menu.classList.contains('is-open')) return closeMenu();
    hdr.classList.remove('is-hidden'); menu.classList.add('is-open'); menu.setAttribute('aria-hidden', 'false'); burger.setAttribute('aria-expanded', 'true'); burger.textContent = 'Close'; lock(true);
  });

  /* ---------- cursor + magnetic ---------- */
  const cursor = $('.cursor'); let mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my, fx = mx, fy = my;
  if (fine && !reduce) {
    addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; cursor.classList.add('is-on'); }, { passive: true });
    document.addEventListener('mouseleave', () => cursor.classList.remove('is-on'));
    document.addEventListener('mouseover', (e) => {
      const lab = e.target.closest('[data-cursor]'), lnk = e.target.closest('a,button,label,.chip,input,select,textarea');
      cursor.classList.toggle('is-label', !!lab); cursor.classList.toggle('is-link', !lab && !!lnk);
      if (lab) cursor.firstElementChild.textContent = lab.dataset.cursor;
    });
    $$('.btn').forEach((b) => {
      b.addEventListener('mousemove', (e) => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.22}px,${(e.clientY - r.top - r.height / 2) * 0.32}px)`; });
      b.addEventListener('mouseleave', () => { b.style.transition = 'transform .8s cubic-bezier(.16,1,.3,1),color .5s,border-color .5s'; b.style.transform = ''; setTimeout(() => (b.style.transition = ''), 800); });
    });
  } else cursor.remove();

  /* ---------- services hover image ---------- */
  const svcList = $('.svc-list'); let float = null;
  if (svcList && fine) {
    float = document.createElement('div'); float.className = 'svc-float';
    const rows = $$('.svc', svcList);
    float.innerHTML = rows.map((r) => `<img src="${r.dataset.hover}" alt="">`).join('');
    document.body.appendChild(float);
    rows.forEach((r, i) => r.addEventListener('mouseenter', () => { $$('img', float).forEach((im, j) => im.classList.toggle('is-on', i === j)); float.classList.add('is-on'); }));
    svcList.addEventListener('mouseleave', () => float.classList.remove('is-on'));
  }

  /* ---------- hero slideshow ---------- */
  const slides = $$('.hero__media img');
  if (slides.length > 1) {
    let cur = 0; const num = $('[data-slide-n]');
    setInterval(() => {
      if (document.hidden) return;
      slides.forEach((s) => s.classList.remove('is-prev'));
      slides[cur].classList.remove('is-on'); slides[cur].classList.add('is-prev');
      cur = (cur + 1) % slides.length; slides[cur].classList.add('is-on');
      if (num) num.textContent = String(cur + 1).padStart(2, '0');
    }, 4800);
  }

  /* ---------- quotes ---------- */
  const quotes = $$('.quote');
  if (quotes.length) {
    let q = 0, timer;
    const show = (n) => { q = (n + quotes.length) % quotes.length; quotes.forEach((el, i) => el.classList.toggle('is-on', i === q)); const c = $('[data-quote-n]'); if (c) c.textContent = String(q + 1).padStart(2, '0'); clearInterval(timer); timer = setInterval(() => show(q + 1), 6500); };
    $('[data-quote-prev]')?.addEventListener('click', () => show(q - 1));
    $('[data-quote-next]')?.addEventListener('click', () => show(q + 1));
    show(0);
  }

  /* ---------- tabs (packages) ---------- */
  $$('.tabs').forEach((tabs) => {
    const btns = $$('button', tabs), pill = $('.tabs__pill', tabs);
    const set = (b) => {
      btns.forEach((x) => x.classList.toggle('is-on', x === b));
      pill.style.width = b.offsetWidth + 'px'; pill.style.transform = `translateX(${b.offsetLeft}px)`;
      $$('.pkgs').forEach((p) => p.classList.toggle('is-on', p.id === b.dataset.tab));
    };
    btns.forEach((b) => b.addEventListener('click', () => set(b)));
    const init = () => set(btns.find((b) => b.dataset.tab === location.hash.slice(1)) || $('button.is-on', tabs) || btns[0]);
    init(); addEventListener('resize', init); document.fonts?.ready.then(init);
    if (btns.some((b) => b.dataset.tab === location.hash.slice(1))) setTimeout(() => $('#packages')?.scrollIntoView(), 700);
  });

  /* ---------- faq ---------- */
  $$('.faq__q').forEach((q) => q.addEventListener('click', () => {
    const it = q.parentElement, open = it.classList.contains('is-open');
    $$('.faq__i.is-open').forEach((o) => { o.classList.remove('is-open'); $('.faq__q', o).setAttribute('aria-expanded', 'false'); });
    if (!open) { it.classList.add('is-open'); q.setAttribute('aria-expanded', 'true'); }
  }));

  /* ---------- work grid, filters, lightbox ---------- */
  const grid = $('[data-grid]');
  if (grid && window.WORK) {
    const W = window.WORK, cats = ['All', ...new Set(W.map((w) => w.cat))];
    const src = (w, s) => `https://picsum.photos/seed/${w.seed}/${s === 'lg' ? Math.round(w.r * 1600) + '/1600' : Math.round(w.r * 900) + '/900'}`;
    grid.innerHTML = W.map((w, i) => `
      <a class="tile" href="#" data-i="${i}" data-cat="${w.cat}" data-cursor="Open" style="--i:${i}">
        <figure class="ph" style="aspect-ratio:${w.r}"><img loading="lazy" src="${src(w)}" alt="${w.title} — ${w.cat} photography by Keona Ngai"></figure>
        <div class="tile__cap"><h3>${w.title}</h3><span class="label" style="color:#fff">${w.cat}</span></div>
      </a>`).join('');
    const fl = $('[data-filters]');
    fl.innerHTML = cats.map((c, i) => `<button class="chip${i ? '' : ' is-on'}" data-f="${c}">${c}<sup>${c === 'All' ? W.length : W.filter((w) => w.cat === c).length}</sup></button>`).join('');
    const applyFilter = (f) => {
      $$('.chip', fl).forEach((x) => x.classList.toggle('is-on', x.dataset.f === f));
      let n = 0;
      $$('.tile', grid).forEach((t) => {
        const on = f === 'All' || t.dataset.cat === f; t.classList.toggle('is-hidden', !on);
        if (on) { t.style.animation = 'none'; void t.offsetHeight; t.style.setProperty('--i', n++); t.style.animation = ''; }
      });
      lenis?.resize?.();
    };
    fl.addEventListener('click', (e) => { const b = e.target.closest('.chip'); if (b) applyFilter(b.dataset.f); });
    const want = decodeURIComponent(location.hash.slice(1)); if (cats.includes(want)) applyFilter(want);

    document.body.insertAdjacentHTML('beforeend', `
      <div class="lb" role="dialog" aria-modal="true" aria-label="Image viewer">
        <div class="lb__bar"><span class="label" data-lb-n></span><button class="label link" data-lb-x>Close ✕</button></div>
        <div class="lb__stage"><img alt=""></div>
        <div class="lb__bar"><div><h3 data-lb-t></h3><span class="label" data-lb-c></span></div>
          <div class="quotes__nav" style="margin:0"><button data-lb-p aria-label="Previous">←</button><button data-lb-nx aria-label="Next">→</button></div></div>
      </div>`);
    const lb = $('.lb'), lbImg = $('.lb__stage img'); let li = 0;
    const visible = () => $$('.tile:not(.is-hidden)', grid).map((t) => +t.dataset.i);
    const showLb = (i) => {
      li = i; const w = W[i], v = visible();
      lbImg.classList.remove('is-in');
      setTimeout(() => { lbImg.onload = () => lbImg.classList.add('is-in'); lbImg.src = src(w, 'lg'); lbImg.alt = w.title; }, 180);
      $('[data-lb-t]').textContent = w.title; $('[data-lb-c]').textContent = `${w.cat} — ${w.place}`;
      $('[data-lb-n]').textContent = `${String(v.indexOf(i) + 1).padStart(2, '0')} / ${String(v.length).padStart(2, '0')}`;
    };
    const stepLb = (d) => { const v = visible(); showLb(v[(v.indexOf(li) + d + v.length) % v.length]); };
    const closeLb = () => { lb.classList.remove('is-open'); lock(false); };
    grid.addEventListener('click', (e) => { const t = e.target.closest('.tile'); if (!t) return; e.preventDefault(); lb.classList.add('is-open'); lock(true); showLb(+t.dataset.i); });
    $('[data-lb-x]').addEventListener('click', closeLb);
    $('[data-lb-p]').addEventListener('click', () => stepLb(-1));
    $('[data-lb-nx]').addEventListener('click', () => stepLb(1));
    lb.addEventListener('click', (e) => { if (e.target.classList.contains('lb__stage')) closeLb(); });
    addEventListener('keydown', (e) => { if (!lb.classList.contains('is-open')) return; if (e.key === 'Escape') closeLb(); if (e.key === 'ArrowLeft') stepLb(-1); if (e.key === 'ArrowRight') stepLb(1); });
  }

  /* ---------- contact form (placeholder — not wired to a backend) ---------- */
  const form = $('[data-form]');
  if (form) form.addEventListener('submit', (e) => {
    e.preventDefault();
    const b = $('button[type=submit]', form); b.firstChild.textContent = 'Sending… ';
    setTimeout(() => { form.closest('.contact__form').classList.add('is-sent'); const n = $('[data-form-name]'); if (n) n.textContent = (form.elements.name.value || '').split(' ')[0] || 'there'; }, 900);
  });

  /* ---------- clock ---------- */
  const clock = $('[data-clock]');
  if (clock) { const f = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Vancouver', hour: 'numeric', minute: '2-digit' }); const t = () => (clock.textContent = f.format(new Date()) + ' PT'); t(); setInterval(t, 20000); }

  /* ---------- scroll-driven: header, progress, parallax, scrub, horizontal ---------- */
  const hdr = $('.hdr'), bar = $('.progress'), par = $$('[data-parallax]'), scrubs = $$('[data-scrub]');
  const hs = $('.hscroll'), track = hs && $('.hscroll__track', hs); let hsMax = 0, lastY = -1, prevY = 0;
  const size = () => {
    if (hs) { if (innerWidth <= 820) { hsMax = 0; hs.style.height = ''; track.style.transform = ''; } else { hsMax = Math.max(0, track.scrollWidth - innerWidth); hs.style.height = hsMax + innerHeight + 'px'; } }
    lastY = -1;
  };
  size(); addEventListener('resize', size); addEventListener('load', size); document.fonts?.ready.then(size);

  function onScroll(y) {
    const vh = innerHeight, max = document.documentElement.scrollHeight - vh;
    checkReveals();
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    hdr.classList.toggle('is-hidden', y > prevY && y > 300 && !menu.classList.contains('is-open')); prevY = y;
    if (!reduce) par.forEach((f) => {
      const r = f.getBoundingClientRect(); if (r.bottom < -100 || r.top > vh + 100) return;
      const p = (r.top + r.height / 2 - vh / 2) / vh, im = f.firstElementChild;
      im.style.transform = `translate3d(0,${(-p * (+f.dataset.parallax || 8)).toFixed(2)}%,0)`;
    });
    scrubs.forEach((el) => {
      const r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > vh) return;
      const p = clamp((vh * 0.88 - r.top) / (r.height + vh * 0.42)), ws = el.children, n = Math.round(p * ws.length);
      for (let i = 0; i < ws.length; i++) ws[i].classList.toggle('on', i < n);
    });
    if (hs && hsMax) { const p = clamp(-hs.getBoundingClientRect().top / hsMax); track.style.transform = `translate3d(${(-p * hsMax).toFixed(1)}px,0,0)`; }
  }
  function frame(t) {
    if (lenis) lenis.raf(t);
    const y = scrollY; if (y !== lastY) { onScroll(y); lastY = y; }
    if (fine && !reduce) {
      cx += (mx - cx) * 0.22; cy += (my - cy) * 0.22; cursor.style.transform = `translate3d(${cx}px,${cy}px,0)`;
      if (float) { fx += (mx - fx) * 0.1; fy += (my - fy) * 0.1; float.style.left = fx + 'px'; float.style.top = fy + 'px'; }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
