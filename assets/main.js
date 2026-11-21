/* Keona Ngai — small, dependency-free site script */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const here = location.pathname.split('/').pop() || 'index.html';

  /* ---------- SITE SETTINGS — edit before launch ---------- */
  const SITE = {
    email: 'keonangai@gmail.com',
    instagram: 'https://instagram.com/',   // placeholder
    nav: [['Work', 'work.html'], ['Services', 'services.html'], ['About', 'about.html'], ['Contact', 'contact.html']],
  };

  /* ---------- header, menu, footer ---------- */
  const links = SITE.nav.map(([t, h]) => `<a class="link${h === here ? ' is-active' : ''}" href="${h}">${t}</a>`).join('');
  document.body.insertAdjacentHTML('afterbegin', `
    <header class="hdr">
      <a class="hdr__logo" href="index.html">Keona Ngai</a>
      <nav class="hdr__nav" aria-label="Primary">${links}</nav>
      <button class="hdr__burger" aria-expanded="false" aria-controls="menu">Menu</button>
    </header>
    <div class="menu" id="menu"><a href="index.html">Home</a>${SITE.nav.map(([t, h]) => `<a href="${h}">${t}</a>`).join('')}</div>`);
  const foot = $('[data-footer]');
  if (foot) foot.innerHTML = `
    <footer class="ftr">
      <a class="ftr__mail link" href="mailto:${SITE.email}">${SITE.email}</a>
      <nav class="label" aria-label="Footer">${links}<a class="link" href="${SITE.instagram}" target="_blank" rel="noopener">Instagram</a></nav>
      <span class="label">© ${new Date().getFullYear()} Keona Ngai · Vancouver, BC</span>
    </footer>`;

  const hdr = $('.hdr'), burger = $('.hdr__burger'), menu = $('.menu');
  let solid = false;
  const onScroll = () => { const s = scrollY > 24; if (s !== solid) { solid = s; hdr.classList.toggle('is-solid', s); } };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  burger.addEventListener('click', () => {
    const open = menu.classList.toggle('is-open');
    burger.textContent = open ? 'Close' : 'Menu'; burger.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  /* ---------- reveal on scroll ---------- */
  const rev = $$('[data-reveal]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    rev.forEach((el) => io.observe(el));
  } else rev.forEach((el) => el.classList.add('in'));

  /* ---------- make page changes instant: prerender / prefetch on hover ---------- */
  if (HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules')) {
    const s = document.createElement('script'); s.type = 'speculationrules';
    s.textContent = JSON.stringify({ prerender: [{ where: { selector_matches: "a[href*='.html']" }, eagerness: 'moderate' }] });
    document.head.appendChild(s);
  } else {
    const done = new Set();
    const warm = (e) => {
      const a = e.target.closest && e.target.closest("a[href*='.html']"); if (!a) return;
      const u = a.href.split('#')[0]; if (done.has(u)) return; done.add(u);
      const l = document.createElement('link'); l.rel = 'prefetch'; l.href = u; document.head.appendChild(l);
    };
    document.addEventListener('pointerover', warm, { passive: true });
    document.addEventListener('touchstart', warm, { passive: true });
  }

  /* ---------- package tabs ---------- */
  const tabs = $$('[data-tab]');
  if (tabs.length) {
    const set = (id) => { tabs.forEach((b) => b.classList.toggle('is-on', b.dataset.tab === id)); $$('.pkgs').forEach((p) => p.classList.toggle('is-on', p.id === id)); };
    tabs.forEach((b) => b.addEventListener('click', () => set(b.dataset.tab)));
    const want = location.hash.slice(1);
    if (tabs.some((b) => b.dataset.tab === want)) { set(want); $('#packages').scrollIntoView(); }
  }

  /* ---------- work grid, filters, lightbox ---------- */
  const grid = $('[data-grid]');
  if (grid && window.WORK) {
    const W = window.WORK, cats = ['All', ...new Set(W.map((w) => w.cat))];
    const src = (w, h) => `https://picsum.photos/seed/${w.seed}/${Math.round(h * 0.8)}/${h}`;
    grid.innerHTML = W.map((w, i) => `
      <a class="tile" href="#" data-i="${i}" data-cat="${w.cat}">
        <figure><div class="ph r-45"><img loading="lazy" decoding="async" src="${src(w, 800)}" alt="${w.title} — ${w.cat} photography by Keona Ngai"></div>
        <figcaption><h3>${w.title}</h3><span class="label">${w.cat}</span></figcaption></figure>
      </a>`).join('');
    const fl = $('[data-filters]');
    fl.innerHTML = cats.map((c, i) => `<button class="chip${i ? '' : ' is-on'}" data-f="${c}">${c}</button>`).join('');
    fl.addEventListener('click', (e) => {
      const b = e.target.closest('.chip'); if (!b) return;
      $$('.chip', fl).forEach((x) => x.classList.toggle('is-on', x === b));
      $$('.tile', grid).forEach((t) => { t.hidden = b.dataset.f !== 'All' && t.dataset.cat !== b.dataset.f; });
    });

    document.body.insertAdjacentHTML('beforeend', `
      <div class="lb" role="dialog" aria-modal="true" aria-label="Image viewer">
        <div class="lb__bar"><span class="label" data-lb-n></span><button class="label" data-lb-x>Close ✕</button></div>
        <div class="lb__stage"><img alt=""></div>
        <div class="lb__bar"><div><h3 data-lb-t></h3><span class="label" data-lb-c></span></div>
          <div class="lb__nav"><button data-lb-p aria-label="Previous">←</button><button data-lb-nx aria-label="Next">→</button></div></div>
      </div>`);
    const lb = $('.lb'), img = $('.lb__stage img'); let cur = 0;
    const vis = () => $$('.tile:not([hidden])', grid).map((t) => +t.dataset.i);
    const show = (i) => {
      cur = i; const w = W[i], v = vis();
      img.src = src(w, 1400); img.alt = w.title;
      $('[data-lb-t]').textContent = w.title; $('[data-lb-c]').textContent = w.cat;
      $('[data-lb-n]').textContent = `${v.indexOf(i) + 1} / ${v.length}`;
    };
    const step = (d) => { const v = vis(); show(v[(v.indexOf(cur) + d + v.length) % v.length]); };
    const close = () => { lb.classList.remove('is-open'); document.body.style.overflow = ''; };
    grid.addEventListener('click', (e) => { const t = e.target.closest('.tile'); if (!t) return; e.preventDefault(); show(+t.dataset.i); lb.classList.add('is-open'); document.body.style.overflow = 'hidden'; });
    $('[data-lb-x]').addEventListener('click', close);
    $('[data-lb-p]').addEventListener('click', () => step(-1));
    $('[data-lb-nx]').addEventListener('click', () => step(1));
    lb.addEventListener('click', (e) => { if (e.target.classList.contains('lb__stage')) close(); });
    addEventListener('keydown', (e) => { if (!lb.classList.contains('is-open')) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') step(-1); if (e.key === 'ArrowRight') step(1); });
  }

  /* ---------- contact form (placeholder — not wired to a backend) ---------- */
  const form = $('[data-form]');
  if (form) form.addEventListener('submit', (e) => {
    e.preventDefault();
    $('[data-form-name]').textContent = (form.elements.name.value || '').trim().split(' ')[0] || 'there';
    form.parentElement.classList.add('is-sent');
  });
})();
