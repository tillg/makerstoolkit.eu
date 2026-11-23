// Themen-Tapete: zeichnet den Graph aus den Daten, die scripts/build-site.mjs aus dem Frontmatter erzeugt.
(function () {
  const D = JSON.parse(document.getElementById('tapete-data').textContent);
  const T = D.topics, PARTS = D.parts, OPT = D.opt;
  const kc = k => `var(--k-${k})`;
  const icon = (name, size = 22) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${D.icons[name]}</svg>`;
  // Trennstrich vor Kleinbuchstabe = Silbentrennung (weg), vor Großbuchstabe = Bindestrich (bleibt)
  const clean = s => s.replace(/-\|(?=[a-zäöüß])/g, '').replace('-|', '-').replace('|', ' ');
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

  // ---------- Layout ----------
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.getElementById('svg');
  const el = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); (parent || svg).appendChild(e); return e; };
  const TW = 158, TH = 66, PX = 176, PY = 108, BAND_PAD = 22, BAND_GAP = 14;
  const X0 = 150, COLS = 4, PART_W = COLS * PX, OPT_X = X0 + PART_W + 40, W = OPT_X + TW + 44;
  const bandH = p => p.rows.length * PY - (PY - TH) + 2 * BAND_PAD;
  const totalH = PARTS.reduce((s, p) => s + bandH(p) + BAND_GAP, 0) + 44;
  svg.setAttribute('viewBox', `0 0 ${W} ${totalH}`);

  const pos = {};
  let yBottom = totalH - 10;
  const bandRows = [];
  PARTS.forEach((p, pi) => {
    const h = bandH(p), y0 = yBottom - h;
    const g = el('g', { class: 'band' });
    el('rect', { x: 10, y: y0, width: X0 + PART_W - 4, height: h, rx: 10 }, g);
    el('text', { class: 'roman', x: 26, y: y0 + 44 }, g).textContent = p.id;
    el('text', { class: 'bt', x: 26, y: y0 + 66 }, g).textContent = p.title;
    el('text', { class: 'bs', x: 26, y: y0 + 82 }, g).textContent = p.sub.length > 22 ? p.sub.split(' · ').slice(0, 2).join(' · ') : p.sub;
    p.rows.forEach((row, ri) => {
      const cy = yBottom - BAND_PAD - TH / 2 - ri * PY;
      bandRows.push({ pi, ri, cy });
      const offset = (COLS - row.length) * PX / 2;
      row.forEach((id, ci) => { pos[id] = { x: X0 + offset + ci * PX + PX / 2, y: cy }; });
    });
    yBottom = y0 - BAND_GAP;
  });
  if (OPT) {
    const ys = Object.entries(OPT.place).map(([id, [pi, ri]]) => {
      const r = bandRows.find(b => b.pi === pi && b.ri === ri);
      pos[id] = { x: OPT_X + TW / 2, y: r.cy };
      return r.cy;
    });
    const top = Math.min(...ys) - TH / 2 - 52, bottom = Math.max(...ys) + TH / 2 + 16;
    const g = el('g', { class: 'band opt' });
    el('rect', { x: OPT_X - 14, y: top, width: TW + 28, height: bottom - top, rx: 10 }, g);
    el('text', { class: 'bt', x: OPT_X, y: top + 22 }, g).textContent = OPT.title;
    el('text', { class: 'bs', x: OPT_X, y: top + 38 }, g).textContent = OPT.sub;
  }

  // ---------- Kanten (Voraussetzung unten → Thema oben) ----------
  const edgeLayer = el('g', {});
  const edgeEls = [];
  for (const id in T) for (const a of T[id].pre) {
    const A = pos[a], B = pos[id];
    let d;
    if (Math.abs(A.y - B.y) < 1) {
      const y = A.y - TH / 2, lift = 26 + Math.min(14, Math.abs(B.x - A.x) / 40);
      d = `M${A.x},${y} C${A.x},${y - lift} ${B.x},${y - lift} ${B.x},${y}`;
    } else {
      const y1 = A.y - TH / 2, y2 = B.y + TH / 2, m = (y1 - y2) * 0.5;
      d = `M${A.x},${y1} C${A.x},${y1 - m} ${B.x},${y2 + m} ${B.x},${y2}`;
    }
    edgeEls.push({ a, b: id, e: el('path', { class: 'edge', d }, edgeLayer) });
  }

  // ---------- Kacheln ----------
  const tiles = {};
  for (const id in T) {
    const n = T[id], p = pos[id], x0 = p.x - TW / 2, y0 = p.y - TH / 2;
    const g = el('g', { class: 'tile' + (n.opt ? ' opt' : ''), tabindex: 0, role: 'button', 'aria-label': clean(n.t) });
    el('rect', { class: 'bg', x: x0, y: y0, width: TW, height: TH, rx: 8 }, g);
    el('rect', { x: x0, y: y0 + 8, width: 3, height: TH - 16, rx: 1.5, style: `fill:${kc(n.k)}` }, g);
    const ic = el('g', { transform: `translate(${x0 + 12},${p.y - 14})`, style: `color:${kc(n.k)}` }, g);
    ic.innerHTML = icon(n.i);
    const lines = n.t.split('|');
    lines.forEach((l, i) => { el('text', { class: 'tt', x: x0 + 44, y: p.y + 4 + (i - (lines.length - 1) / 2) * 16 }, g).textContent = l; });
    tiles[id] = g;
    g.addEventListener('mouseenter', () => focus(id));
    g.addEventListener('mouseleave', () => focus(null));
    g.addEventListener('focus', () => focus(id));
    g.addEventListener('blur', () => focus(null));
    g.addEventListener('click', () => jump(id));
    g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); jump(id); } });
  }

  // ---------- Fokus: alle Voraussetzungen hervorheben ----------
  const ancestors = id => { const s = new Set(), st = [...T[id].pre]; while (st.length) { const x = st.pop(); if (!s.has(x)) { s.add(x); st.push(...T[x].pre); } } return s; };
  const children = id => Object.keys(T).filter(k => T[k].pre.includes(id));
  const tip = document.getElementById('tip'), wrap = document.getElementById('wrap');
  function focus(id) {
    svg.classList.toggle('focus', !!id);
    for (const k in tiles) tiles[k].classList.remove('hl', 'pre');
    edgeEls.forEach(e => e.e.classList.remove('pre'));
    if (!id) { tip.style.display = 'none'; return; }
    const anc = ancestors(id);
    tiles[id].classList.add('hl');
    anc.forEach(a => tiles[a].classList.add('pre'));
    edgeEls.forEach(e => { if ((e.b === id || anc.has(e.b)) && anc.has(e.a)) e.e.classList.add('pre'); });
    const n = T[id];
    tip.innerHTML = `<b>${esc(clean(n.t))}</b>${esc(n.tip)}` +
      (n.pre.length ? `<div class="meta"><em>Braucht:</em> ${n.pre.map(p => esc(clean(T[p].t))).join(', ')}</div>` : `<div class="meta">Keine Voraussetzungen – hier kann man starten.</div>`) +
      `<div class="hint">Klick → Details</div>`;
    tip.style.display = 'block';
    const r = tiles[id].getBoundingClientRect(), wr = wrap.getBoundingClientRect();
    let left = r.left - wr.left + wrap.scrollLeft + r.width / 2 - 150;
    left = Math.max(8, Math.min(left, wrap.scrollWidth - 308));
    let top = r.top - wr.top - tip.offsetHeight - 10;
    if (top < 8) top = r.bottom - wr.top + 10;
    tip.style.left = left + 'px'; tip.style.top = top + 'px';
  }

  // ---------- Legende ----------
  document.getElementById('legend').innerHTML =
    Object.entries(D.kinds).map(([k, name]) => `<span><i class="sw" style="background:${kc(k)}"></i>${name}</span>`).join('') +
    `<span><svg width="40" height="10"><line x1="0" y1="5" x2="40" y2="5" style="stroke:var(--amber)" stroke-width="2"/></svg>Weg zum Thema (beim Hovern)</span>` +
    `<span><svg width="30" height="18"><rect x="1" y="1" width="28" height="16" rx="4" fill="none" style="stroke:var(--faint)" stroke-dasharray="4 3"/></svg>optional</span>`;

  // ---------- Kachel-Liste ----------
  const link = id => `<a href="#k-${id}" data-id="${id}">${esc(clean(T[id].t))}</a>`;
  const card = id => {
    const n = T[id], kids = children(id);
    return `<article class="card${n.opt ? ' opt' : ''}" id="k-${id}" style="--k:${kc(n.k)}">
      <h4>${icon(n.i, 22)}${esc(clean(n.t))}</h4>
      <p>${n.d}</p>
      <dl>
        <dt>Braucht</dt><dd>${n.pre.length ? n.pre.map(link).join(' · ') : '–'}</dd>
        <dt>Führt zu</dt><dd>${kids.length ? kids.map(link).join(' · ') : '–'}</dd>
      </dl>
      <div class="links"><a class="mat-btn" href="${n.href}">Zum Thema →</a>${n.teacher ? `<a class="view-btn hidden-teacher" href="${n.teacher}">Lehrer-Ansicht</a>` : ''}<a class="up" href="#graph" data-up="${id}">↑ im Graph zeigen</a></div>
    </article>`;
  };
  const cards = document.getElementById('cards');
  const groups = [...PARTS.map(p => ({ ...p, ids: p.rows.flat() })), ...(OPT ? [{ id: '+', ...OPT, ids: Object.keys(OPT.place) }] : [])];
  for (const p of groups) {
    cards.insertAdjacentHTML('beforeend',
      `<div class="part-h"><span class="r">${p.id}</span><h3>${esc(p.title)}</h3><small>${esc(p.sub)}</small><a href="${p.href}">Teil-Übersicht →</a></div>
       <div class="grid">${p.ids.map(card).join('')}</div>`);
  }

  function jump(id) {
    document.querySelectorAll('.card.target').forEach(c => c.classList.remove('target'));
    const c = document.getElementById('k-' + id);
    c.classList.add('target');
    c.scrollIntoView({ behavior: 'smooth', block: 'center' });
    history.replaceState(null, '', '#k-' + id);
  }
  cards.addEventListener('click', e => {
    const a = e.target.closest('a[data-id]');
    if (a) { e.preventDefault(); jump(a.dataset.id); return; }
    const up = e.target.closest('a[data-up]');
    if (up) {
      e.preventDefault();
      document.getElementById('graph').scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => { tiles[up.dataset.up].focus({ preventScroll: true }); }, 450);
    }
  });
  if (location.hash.startsWith('#k-')) {
    const id = decodeURIComponent(location.hash.slice(3));
    if (T[id]) setTimeout(() => jump(id), 100);
  }
})();
