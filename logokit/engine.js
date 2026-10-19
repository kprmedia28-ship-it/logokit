/* Logokit engine — SVG analyse, normalisatie en alle exportformaten.
   Alles draait lokaal in de browser; er wordt niets geüpload. */
'use strict';

const LK = {};

/* ---------- kleine helpers ---------- */
LK.uid = () => Math.random().toString(36).slice(2, 10);
LK.esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
LK.slug = s => String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
LK.folder = s => String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
LK.pad = n => String(n).padStart(2, '0');
LK.tick = () => new Promise(r => setTimeout(r, 0));

/* ---------- kleur ---------- */
const _cctx = document.createElement('canvas').getContext('2d');
LK.normColor = str => {
  if (!str) return null;
  _cctx.fillStyle = '#010203';
  _cctx.fillStyle = str;
  const v = _cctx.fillStyle;
  if (v === '#010203' && !/^#?010203$/i.test(str.trim()) && !/rgb\(\s*1,\s*2,\s*3\s*\)/.test(str)) return null;
  if (v[0] === '#') return v.toUpperCase();
  const m = v.match(/[\d.]+/g);
  if (!m) return null;
  return '#' + m.slice(0, 3).map(x => (+x | 0).toString(16).padStart(2, '0')).join('').toUpperCase();
};
LK.hexToRgb = h => { h = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16)); };
LK.validHex = h => /^#?[0-9a-f]{6}$/i.test(h || '');
LK.fixHex = h => { h = String(h || '').trim(); if (/^#?[0-9a-f]{3}$/i.test(h)) h = h.replace('#', '').split('').map(c => c + c).join(''); h = h.replace('#', ''); return /^[0-9a-f]{6}$/i.test(h) ? '#' + h.toUpperCase() : null; };
LK.autoCmyk = hex => {
  const [r, g, b] = LK.hexToRgb(hex).map(v => v / 255);
  const k = 1 - Math.max(r, g, b);
  if (k >= 0.9999) return [0, 0, 0, 100];
  const c = (1 - r - k) / (1 - k), m = (1 - g - k) / (1 - k), y = (1 - b - k) / (1 - k);
  return [c, m, y, k].map(v => Math.round(v * 100));
};
LK.lum = hex => {
  const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const [r, g, b] = LK.hexToRgb(hex);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
LK.contrast = (a, b) => { const x = LK.lum(a), y = LK.lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
LK.MIN_CONTRAST = 2.4;

const NAMED = [
  ['Black', '#000000'], ['Onyx', '#242424'], ['Charcoal', '#36454F'], ['Graphite', '#4B4F54'], ['Slate', '#708090'], ['Gray', '#8E8E8E'],
  ['Silver', '#C0C0C0'], ['Mist', '#DDE3E8'], ['Off-White', '#F4F2EE'], ['Cream', '#F6F1E7'], ['White', '#FFFFFF'], ['Ivory', '#FFFFF0'],
  ['Red', '#E02424'], ['Crimson', '#B0102E'], ['Burgundy', '#7A1530'], ['Coral', '#FF5A36'], ['Salmon', '#F59482'], ['Orange', '#FF7A00'],
  ['Pumpkin', '#FF6A00'], ['Amber', '#FFB000'], ['Gold', '#D4A017'], ['Yellow', '#FFD60A'], ['Lime', '#9ACD32'], ['Green', '#1F9D55'],
  ['Emerald', '#0F7B5F'], ['Forest', '#1F4D2B'], ['Olive', '#6B7036'], ['Mint', '#98E2C6'], ['Teal', '#0F8C8C'], ['Turquoise', '#30D5C8'],
  ['Cyan', '#00B7EB'], ['Sky', '#5BB8F5'], ['Blue', '#1E63F0'], ['Cobalt', '#0047AB'], ['Navy', '#14213D'], ['Midnight', '#1F2340'],
  ['Indigo', '#4B3FD1'], ['Violet', '#7F4FE0'], ['Purple', '#6A1B9A'], ['Lavender', '#C6B8F0'], ['Magenta', '#D6127A'], ['Pink', '#FF6FA8'],
  ['Rose', '#F4C2C9'], ['Brown', '#6F4E37'], ['Terracotta', '#C8613F'], ['Sand', '#D8C3A0'], ['Beige', '#E8DCC4'], ['Taupe', '#8B7D6B']
];
LK.colorName = hex => {
  const [r, g, b] = LK.hexToRgb(hex);
  let best = null, bd = 1e9;
  for (const [n, h] of NAMED) {
    const [R, G, B] = LK.hexToRgb(h);
    const rm = (r + R) / 2, d = (2 + rm / 256) * (r - R) ** 2 + 4 * (g - G) ** 2 + (2 + (255 - rm) / 256) * (b - B) ** 2;
    if (d < bd) { bd = d; best = n; }
  }
  return best;
};

/* ---------- SVG path parser → absolute M/L/C/Z ---------- */
function arcToCubic(x1, y1, rx, ry, angle, fa, fs, x2, y2) {
  if (x1 === x2 && y1 === y2) return [];
  if (!rx || !ry) return [[x1, y1, x2, y2, x2, y2]];
  const phi = angle * Math.PI / 180, cos = Math.cos(phi), sin = Math.sin(phi);
  rx = Math.abs(rx); ry = Math.abs(ry);
  const dx = (x1 - x2) / 2, dy = (y1 - y2) / 2;
  const x1p = cos * dx + sin * dy, y1p = -sin * dx + cos * dy;
  const lam = x1p * x1p / (rx * rx) + y1p * y1p / (ry * ry);
  if (lam > 1) { const s = Math.sqrt(lam); rx *= s; ry *= s; }
  const rx2 = rx * rx, ry2 = ry * ry;
  let num = rx2 * ry2 - rx2 * y1p * y1p - ry2 * x1p * x1p; if (num < 0) num = 0;
  let coef = Math.sqrt(num / (rx2 * y1p * y1p + ry2 * x1p * x1p)); if (fa === fs) coef = -coef;
  const cxp = coef * rx * y1p / ry, cyp = -coef * ry * x1p / rx;
  const cx = cos * cxp - sin * cyp + (x1 + x2) / 2, cy = sin * cxp + cos * cyp + (y1 + y2) / 2;
  const ang = (ux, uy, vx, vy) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
  const ux = (x1p - cxp) / rx, uy = (y1p - cyp) / ry, vx = (-x1p - cxp) / rx, vy = (-y1p - cyp) / ry;
  const th1 = ang(1, 0, ux, uy); let dth = ang(ux, uy, vx, vy);
  if (!fs && dth > 0) dth -= 2 * Math.PI; else if (fs && dth < 0) dth += 2 * Math.PI;
  const segs = Math.max(1, Math.ceil(Math.abs(dth) / (Math.PI / 2))), d = dth / segs, t = 4 / 3 * Math.tan(d / 4), out = [];
  const map = (px, py) => [cx + rx * px * cos - ry * py * sin, cy + rx * px * sin + ry * py * cos];
  for (let k = 0; k < segs; k++) {
    const a1 = th1 + k * d, a2 = a1 + d, c1 = Math.cos(a1), s1 = Math.sin(a1), c2 = Math.cos(a2), s2 = Math.sin(a2);
    out.push([...map(c1 - t * s1, s1 + t * c1), ...map(c2 + t * s2, s2 - t * c2), ...map(c2, s2)]);
  }
  return out;
}

LK.parsePath = d => {
  const out = []; let i = 0; const n = d.length;
  const ws = c => c === ' ' || c === ',' || c === '\n' || c === '\t' || c === '\r' || c === '\f';
  const skip = () => { while (i < n && ws(d[i])) i++; };
  const numRe = /[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/y;
  const num = () => { skip(); numRe.lastIndex = i; const m = numRe.exec(d); if (!m) throw new Error('path'); i = numRe.lastIndex; return parseFloat(m[0]); };
  const flag = () => { skip(); const c = d[i]; if (c !== '0' && c !== '1') throw new Error('path'); i++; return c === '1' ? 1 : 0; };
  let cx = 0, cy = 0, sx = 0, sy = 0, prev = null, cmd = null;
  while (true) {
    skip(); if (i >= n) break;
    const ch = d[i];
    if (/[A-Za-z]/.test(ch)) { cmd = ch; i++; }
    else if (cmd === null || cmd === 'Z' || cmd === 'z') throw new Error('path');
    else if (cmd === 'M') cmd = 'L'; else if (cmd === 'm') cmd = 'l';
    const rel = cmd !== cmd.toUpperCase(), C = cmd.toUpperCase();
    const ax = v => rel ? v + cx : v, ay = v => rel ? v + cy : v;
    let np = null;
    switch (C) {
      case 'Z': out.push(['Z']); cx = sx; cy = sy; break;
      case 'M': { const x = ax(num()), y = ay(num()); out.push(['M', x, y]); cx = sx = x; cy = sy = y; break; }
      case 'L': { const x = ax(num()), y = ay(num()); out.push(['L', x, y]); cx = x; cy = y; break; }
      case 'H': { const x = ax(num()); out.push(['L', x, cy]); cx = x; break; }
      case 'V': { const y = ay(num()); out.push(['L', cx, y]); cy = y; break; }
      case 'C': { const x1 = ax(num()), y1 = ay(num()), x2 = ax(num()), y2 = ay(num()), x = ax(num()), y = ay(num()); out.push(['C', x1, y1, x2, y2, x, y]); np = { t: 'C', x: x2, y: y2 }; cx = x; cy = y; break; }
      case 'S': { const x2 = ax(num()), y2 = ay(num()), x = ax(num()), y = ay(num()); const x1 = prev && prev.t === 'C' ? 2 * cx - prev.x : cx, y1 = prev && prev.t === 'C' ? 2 * cy - prev.y : cy; out.push(['C', x1, y1, x2, y2, x, y]); np = { t: 'C', x: x2, y: y2 }; cx = x; cy = y; break; }
      case 'Q': { const qx = ax(num()), qy = ay(num()), x = ax(num()), y = ay(num()); out.push(['C', cx + 2 / 3 * (qx - cx), cy + 2 / 3 * (qy - cy), x + 2 / 3 * (qx - x), y + 2 / 3 * (qy - y), x, y]); np = { t: 'Q', x: qx, y: qy }; cx = x; cy = y; break; }
      case 'T': { const x = ax(num()), y = ay(num()); const qx = prev && prev.t === 'Q' ? 2 * cx - prev.x : cx, qy = prev && prev.t === 'Q' ? 2 * cy - prev.y : cy; out.push(['C', cx + 2 / 3 * (qx - cx), cy + 2 / 3 * (qy - cy), x + 2 / 3 * (qx - x), y + 2 / 3 * (qy - y), x, y]); np = { t: 'Q', x: qx, y: qy }; cx = x; cy = y; break; }
      case 'A': { const rx = num(), ry = num(), rot = num(), fa = flag(), fs = flag(), x = ax(num()), y = ay(num()); for (const c of arcToCubic(cx, cy, rx, ry, rot, fa, fs, x, y)) out.push(['C', ...c]); cx = x; cy = y; break; }
      default: throw new Error('path');
    }
    prev = np;
  }
  return out;
};

function shapeToD(el) {
  const tag = el.localName, v = a => { try { return el[a].baseVal.value; } catch (e) { return parseFloat(el.getAttribute(a)) || 0; } };
  if (tag === 'path') return el.getAttribute('d') || '';
  if (tag === 'rect') {
    const x = v('x'), y = v('y'), w = v('width'), h = v('height');
    if (w <= 0 || h <= 0) return '';
    let rx = el.hasAttribute('rx') ? v('rx') : null, ry = el.hasAttribute('ry') ? v('ry') : null;
    if (rx === null) rx = ry || 0; if (ry === null) ry = rx;
    rx = Math.min(rx, w / 2); ry = Math.min(ry, h / 2);
    if (!rx || !ry) return `M${x} ${y}H${x + w}V${y + h}H${x}Z`;
    return `M${x + rx} ${y}H${x + w - rx}A${rx} ${ry} 0 0 1 ${x + w} ${y + ry}V${y + h - ry}A${rx} ${ry} 0 0 1 ${x + w - rx} ${y + h}H${x + rx}A${rx} ${ry} 0 0 1 ${x} ${y + h - ry}V${y + ry}A${rx} ${ry} 0 0 1 ${x + rx} ${y}Z`;
  }
  if (tag === 'circle' || tag === 'ellipse') {
    const cx = v('cx'), cy = v('cy'); const rx = tag === 'circle' ? v('r') : v('rx'), ry = tag === 'circle' ? v('r') : v('ry');
    if (rx <= 0 || ry <= 0) return '';
    return `M${cx - rx} ${cy}A${rx} ${ry} 0 1 0 ${cx + rx} ${cy}A${rx} ${ry} 0 1 0 ${cx - rx} ${cy}Z`;
  }
  if (tag === 'polygon' || tag === 'polyline') {
    const p = (el.getAttribute('points') || '').trim().split(/[\s,]+/).map(Number);
    if (p.length < 4) return '';
    let d = `M${p[0]} ${p[1]}`; for (let k = 2; k + 1 < p.length; k += 2) d += `L${p[k]} ${p[k + 1]}`;
    return d + (tag === 'polygon' ? 'Z' : '');
  }
  if (tag === 'line') return `M${v('x1')} ${v('y1')}L${v('x2')} ${v('y2')}`;
  return '';
}

const fmt = n => { const r = Math.round(n * 1000) / 1000; return Object.is(r, -0) ? '0' : String(r); };
LK.segsToD = segs => segs.map(s => s[0] === 'Z' ? 'Z' : s[0] + s.slice(1).map(fmt).join(' ')).join('');

/* ---------- SVG-sanering ----------
   Een geüploade SVG wordt tijdelijk in de pagina geplaatst om stijlen en transformaties te meten.
   Daarom wordt eerst alles verwijderd dat code kan uitvoeren of iets van internet kan laden. */
const SVGNS = 'http://www.w3.org/2000/svg', XLINK = 'http://www.w3.org/1999/xlink';
const ALLOWED = new Set(['svg', 'g', 'defs', 'symbol', 'use', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'text', 'tspan', 'textPath',
  'linearGradient', 'radialGradient', 'stop', 'clipPath', 'mask', 'pattern', 'marker', 'style', 'title', 'desc', 'metadata', 'switch', 'a']);
const hrefOf = el => (el.getAttribute('href') || el.getAttributeNS(XLINK, 'href') || '').trim();
const stripUrls = v => v.replace(/@import[^;]*;?/gi, '').replace(/@font-face\s*\{[^}]*\}/gi, '')
  .replace(/url\(\s*(['"]?)\s*(?!#)[^)]*\)/gi, 'none').replace(/(javascript|vbscript|data)\s*:/gi, '');

function expandUses(doc, root) {
  let unresolved = 0;
  for (let pass = 0; pass < 6; pass++) {
    const uses = [...root.querySelectorAll('use')].filter(u => !u.closest('defs, symbol, clipPath, mask, pattern, marker'));
    if (!uses.length) break;
    for (const u of uses) {
      const ref = hrefOf(u);
      const target = ref.startsWith('#') ? root.querySelector(`[id="${CSS.escape(ref.slice(1))}"]`) : null;
      if (!target || target.contains(u) || target === root) { unresolved++; u.remove(); continue; }
      const g = doc.createElementNS(SVGNS, 'g');
      for (const a of [...u.attributes]) if (!/^(x|y|width|height|href|xlink:href)$/i.test(a.name)) g.setAttribute(a.name, a.value);
      let tf = `${u.getAttribute('transform') || ''} translate(${parseFloat(u.getAttribute('x')) || 0} ${parseFloat(u.getAttribute('y')) || 0})`;
      if (target.localName === 'symbol') {
        const vb = (target.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number), w = parseFloat(u.getAttribute('width')), h = parseFloat(u.getAttribute('height'));
        if (vb.length === 4 && vb[2] > 0 && vb[3] > 0 && w > 0 && h > 0) {
          const s = Math.min(w / vb[2], h / vb[3]);
          tf += ` translate(${(w - vb[2] * s) / 2} ${(h - vb[3] * s) / 2}) scale(${s}) translate(${-vb[0]} ${-vb[1]})`;
        }
        for (const c of target.childNodes) g.appendChild(c.cloneNode(true));
      } else {
        const c = target.cloneNode(true); c.removeAttribute('id'); g.appendChild(c);
      }
      g.setAttribute('transform', tf.trim());
      u.replaceWith(g);
    }
  }
  return unresolved;
}

function sanitizeSvg(doc, root) {
  const found = { images: 0, links: 0 };
  // elementen die niet in een statisch logo horen
  for (const el of [...root.querySelectorAll('*')]) {
    if (!el.isConnected) continue;
    if (el.namespaceURI !== SVGNS || !ALLOWED.has(el.localName)) {
      if (el.localName === 'image' || el.localName === 'img') found.images++;
      el.remove();
    }
  }
  found.links += expandUses(doc, root);
  // attributen: event-handlers, externe links en externe url()'s weg
  for (const el of [root, ...root.querySelectorAll('*')]) {
    for (const a of [...el.attributes]) {
      const n = a.name.toLowerCase(), v = a.value;
      if (n.startsWith('on')) el.removeAttribute(a.name);
      else if (n === 'href' || n === 'xlink:href' || n === 'src') { if (!v.trim().startsWith('#')) el.removeAttribute(a.name); }
      else if (/url\(|javascript:|@import/i.test(v)) el.setAttribute(a.name, stripUrls(v));
    }
  }
  for (const st of root.querySelectorAll('style')) st.textContent = stripUrls(st.textContent);
  return found;
}

/* ---------- SVG analyse + normalisatie ---------- */
LK.analyzeSvg = async (text) => {
  if (text.length > 2 * 1024 * 1024) throw new Error('SVG is te groot. Gebruik een bestand kleiner dan 2 MB.');
  if (/<!(ENTITY|DOCTYPE[^>]*\[)/i.test(text)) throw new Error('Exporteer een gewone SVG zonder XML-entities.');
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  const root = doc.documentElement;
  if (doc.querySelector('parsererror') || !root || root.localName !== 'svg' || root.namespaceURI !== SVGNS) throw new Error('Dit is geen geldig SVG-bestand.');
  if (root.querySelectorAll('*').length > 3000) throw new Error('Deze SVG is te complex (meer dan 3.000 elementen). Vereenvoudig het ontwerp.');
  if (root.querySelector('script, foreignObject, animate, animateTransform, animateMotion, set')) throw new Error('Upload een statische vector-SVG zonder scripts of animaties.');
  const found = sanitizeSvg(doc, root);
  if (root.querySelectorAll('*').length > 6000) throw new Error('Deze SVG is te complex na het uitpakken van gekoppelde symbolen.');

  const host = document.getElementById('svg-host');
  const node = document.importNode(root, true);
  if (!node.getAttribute('viewBox')) {
    const w = parseFloat(node.getAttribute('width')) || 1000, h = parseFloat(node.getAttribute('height')) || 1000;
    node.setAttribute('viewBox', `0 0 ${w} ${h}`);
  }
  node.setAttribute('width', '800'); node.setAttribute('height', '800');
  node.removeAttribute('style');
  host.appendChild(node);
  const issues = { transparency: 0, lines: 0, fonts: 0, background: 0, images: found.images, links: found.links, clips: 0 };
  const shapes = [];
  try {
    const rootInv = node.getScreenCTM().inverse();
    const els = node.querySelectorAll('path, rect, circle, ellipse, line, polyline, polygon, text, image, use');
    let points = 0;
    for (const el of els) {
      if (el.closest('defs, clipPath, mask, symbol, pattern, marker')) continue;
      const tag = el.localName;
      if (tag === 'text') { issues.fonts++; continue; }
      if (tag === 'image') { issues.images++; continue; }
      if (tag === 'use') { issues.links++; continue; }
      const cs = getComputedStyle(el);
      if ((cs.clipPath && cs.clipPath !== 'none') || (cs.mask && cs.mask !== 'none' && cs.mask !== 'match-source') || el.closest('[clip-path],[mask]')) issues.clips++;
      let op = 1; for (let p = el; p && p !== node; p = p.parentElement) { const o = parseFloat(getComputedStyle(p).opacity); if (!isNaN(o)) op *= o; }
      const hidden = cs.display === 'none' || cs.visibility === 'hidden' || op <= 0.001;
      const fillOp = parseFloat(cs.fillOpacity), strokeW = parseFloat(cs.strokeWidth) || 0, strokeOp = parseFloat(cs.strokeOpacity);
      const hasFill = !hidden && cs.fill !== 'none' && fillOp > 0.001 && tag !== 'line';
      const hasStroke = !hidden && cs.stroke !== 'none' && strokeW > 0 && strokeOp > 0.001;
      if (hasStroke) issues.lines++;
      if (!hasFill && !hasStroke) { issues.transparency++; continue; }
      if (hasFill && (fillOp < 0.99 || op < 0.99)) issues.transparency++;
      if (!hasFill) continue;
      let color = null;
      if (cs.fill.startsWith('url')) {
        const id = (cs.fill.match(/#([^"')]+)/) || [])[1];
        const g = id && node.querySelector(`[id="${CSS.escape(id)}"]`);
        const stop = g && g.querySelector('stop');
        color = stop ? LK.normColor(getComputedStyle(stop).stopColor) : null;
      } else color = LK.normColor(cs.fill);
      if (!color) color = '#000000';
      const d = shapeToD(el); if (!d) continue;
      let segs; try { segs = LK.parsePath(d); } catch (e) { continue; }
      const m = rootInv.multiply(el.getScreenCTM());
      const tf = (x, y) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f];
      segs = segs.map(s => {
        if (s[0] === 'Z') return s;
        const o = [s[0]]; for (let k = 1; k < s.length; k += 2) o.push(...tf(s[k], s[k + 1])); return o;
      });
      points += segs.length;
      if (points > 250000) throw new Error('Deze SVG bevat te veel punten. Vereenvoudig de paden.');
      shapes.push({ tag, segs, fill: color, rule: cs.fillRule === 'evenodd' ? 'evenodd' : 'nonzero' });
    }
  } finally { host.removeChild(node); }

  if (!shapes.length) throw new Error('Geen zichtbare gevulde vormen gevonden in deze SVG.');
  // bounding box (bezier-curves gesampled)
  const bb = segs => {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, px = 0, py = 0;
    const add = (x, y) => { if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; };
    for (const s of segs) {
      if (s[0] === 'M' || s[0] === 'L') { add(s[1], s[2]); px = s[1]; py = s[2]; }
      else if (s[0] === 'C') {
        for (let t = 0.0625; t <= 1.0001; t += 0.0625) { const u = 1 - t; add(u * u * u * px + 3 * u * u * t * s[1] + 3 * u * t * t * s[3] + t * t * t * s[5], u * u * u * py + 3 * u * u * t * s[2] + 3 * u * t * t * s[4] + t * t * t * s[6]); }
        px = s[5]; py = s[6];
      }
    }
    return [x0, y0, x1, y1];
  };
  let X0 = Infinity, Y0 = Infinity, X1 = -Infinity, Y1 = -Infinity;
  shapes.forEach(s => { s.bb = bb(s.segs); X0 = Math.min(X0, s.bb[0]); Y0 = Math.min(Y0, s.bb[1]); X1 = Math.max(X1, s.bb[2]); Y1 = Math.max(Y1, s.bb[3]); });
  // achtergrondvlak: een vorm die (vrijwel) het hele ontwerp bedekt terwijl er nog andere vormen zijn
  if (shapes.length > 1) {
    const A = (X1 - X0) * (Y1 - Y0);
    const first = shapes[0];
    if ((first.tag === 'rect' || first.segs.length <= 6) && (first.bb[2] - first.bb[0]) * (first.bb[3] - first.bb[1]) >= A * 0.92) issues.background++;
  }
  const w = X1 - X0, h = Y1 - Y0;
  if (!(w > 0 && h > 0)) throw new Error('De SVG heeft geen meetbare afmetingen.');
  const paths = shapes.map(s => {
    const segs = s.segs.map(g => g[0] === 'Z' ? g : [g[0], ...g.slice(1).map((v, k) => k % 2 ? v - Y0 : v - X0)]);
    return { segs, d: LK.segsToD(segs), fill: s.fill, rule: s.rule };
  });
  // kleuren gesorteerd op oppervlak
  const area = {};
  paths.forEach((p, k) => { const b = shapes[k].bb; area[p.fill] = (area[p.fill] || 0) + (b[2] - b[0]) * (b[3] - b[1]); });
  const colors = Object.keys(area).sort((a, b) => area[b] - area[a]);
  return { logo: { w, h, paths, colors }, issues };
};

/* ---------- SVG-uitvoer ---------- */
LK.svgString = (logo, fill) => {
  const body = logo.paths.map(p => `<path d="${p.d}" fill="${fill || p.fill}"${p.rule === 'evenodd' ? ' fill-rule="evenodd"' : ''}/>`).join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${fmt(logo.w)}" height="${fmt(logo.h)}" viewBox="0 0 ${fmt(logo.w)} ${fmt(logo.h)}">\n${body}\n</svg>\n`;
};
LK.svgDataUrl = (logo, fill) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(LK.svgString(logo, fill));

/* ---------- raster ---------- */
const p2dCache = new WeakMap();
LK.p2d = logo => { let c = p2dCache.get(logo); if (!c) { c = logo.paths.map(p => ({ path: new Path2D(p.d), fill: p.fill, rule: p.rule })); p2dCache.set(logo, c); } return c; };
LK.drawCtx = (ctx, logo, x, y, w, h, fill) => {
  const s = Math.min(w / logo.w, h / logo.h), dx = x + (w - logo.w * s) / 2, dy = y + (h - logo.h * s) / 2;
  ctx.save(); ctx.translate(dx, dy); ctx.scale(s, s);
  for (const p of LK.p2d(logo)) { ctx.fillStyle = fill || p.fill; ctx.fill(p.path, p.rule); }
  ctx.restore();
};
LK.toBlob = (cv, type, q) => new Promise((res, rej) => cv.toBlob(b => {
  if (!b) return rej(new Error('afbeelding te groot voor deze browser'));
  if (b.type !== type) return rej(new Error(`${type.split('/')[1].toUpperCase()} wordt niet ondersteund door deze browser`));
  res(b);
}, type, q));
LK.raster = async (logo, fill, width, type, bg, margin = 0) => {
  let cw, ch, lx = 0, ly = 0, lw, lh;
  if (bg) { lw = width / (1 + 2 * margin); lh = lw * logo.h / logo.w; const m = lw * margin; cw = width; ch = Math.max(1, Math.round(lh + 2 * m)); lx = m; ly = m; }
  else { cw = width; ch = Math.max(1, Math.round(width * logo.h / logo.w)); lw = cw; lh = ch; }
  const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
  const ctx = cv.getContext('2d');
  if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, cw, ch); }
  LK.drawCtx(ctx, logo, lx, ly, lw, lh, fill);
  try { return await LK.toBlob(cv, type, type === 'image/png' ? undefined : 0.92); }
  finally { cv.width = cv.height = 0; }
};

/* ---------- CMYK print: EPS + PDF (vector) ---------- */
const ascii = s => String(s).replace(/[^\x20-\x7E]/g, '?').replace(/[()\\]/g, '');
LK.eps = (logo, cmykOf, title) => {
  const f = fmt;
  let s = `%!PS-Adobe-3.0 EPSF-3.0\n%%BoundingBox: 0 0 ${Math.ceil(logo.w)} ${Math.ceil(logo.h)}\n%%HiResBoundingBox: 0 0 ${f(logo.w)} ${f(logo.h)}\n%%Title: ${ascii(title)}\n%%Creator: Logokit\n%%LanguageLevel: 2\n%%Pages: 1\n%%EndComments\n%%Page: 1 1\ngsave\n0 ${f(logo.h)} translate 1 -1 scale\n`;
  for (const p of logo.paths) {
    s += cmykOf(p).map(v => f(v / 100)).join(' ') + ' setcmykcolor\nnewpath\n';
    for (const g of p.segs) {
      if (g[0] === 'M') s += `${f(g[1])} ${f(g[2])} moveto\n`;
      else if (g[0] === 'L') s += `${f(g[1])} ${f(g[2])} lineto\n`;
      else if (g[0] === 'C') s += g.slice(1).map(f).join(' ') + ' curveto\n';
      else s += 'closepath\n';
    }
    s += p.rule === 'evenodd' ? 'eofill\n' : 'fill\n';
  }
  return s + 'grestore\nshowpage\n%%EOF\n';
};
LK.pdf = (logo, cmykOf, title) => {
  const f = fmt;
  let c = `1 0 0 -1 0 ${f(logo.h)} cm\n`;
  for (const p of logo.paths) {
    c += cmykOf(p).map(v => f(v / 100)).join(' ') + ' k\n';
    for (const g of p.segs) {
      if (g[0] === 'M') c += `${f(g[1])} ${f(g[2])} m\n`;
      else if (g[0] === 'L') c += `${f(g[1])} ${f(g[2])} l\n`;
      else if (g[0] === 'C') c += g.slice(1).map(f).join(' ') + ' c\n';
      else c += 'h\n';
    }
    c += p.rule === 'evenodd' ? 'f*\n' : 'f\n';
  }
  const objs = [null,
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${f(logo.w)} ${f(logo.h)}] /TrimBox [0 0 ${f(logo.w)} ${f(logo.h)}] /Contents 4 0 R /Resources << >> >>`,
    `<< /Length ${c.length} >>\nstream\n${c}endstream`,
    `<< /Title (${ascii(title)}) /Producer (Logokit) /Creator (Logokit) >>`];
  let out = '%PDF-1.4\n'; const offs = [];
  for (let k = 1; k < objs.length; k++) { offs[k] = out.length; out += `${k} 0 obj\n${objs[k]}\nendobj\n`; }
  const xref = out.length;
  out += `xref\n0 ${objs.length}\n0000000000 65535 f \n` + offs.slice(1).map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('');
  out += `trailer\n<< /Size ${objs.length} /Root 1 0 R /Info 5 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new Blob([out], { type: 'application/pdf' });
};

/* ---------- favicons + app-iconen ---------- */
LK.iconCanvas = (logo, size, { bg, pad, fill, round }) => {
  const cv = document.createElement('canvas'); cv.width = cv.height = size;
  const ctx = cv.getContext('2d');
  if (bg) { ctx.fillStyle = bg; if (round) { ctx.beginPath(); ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2); ctx.fill(); } else ctx.fillRect(0, 0, size, size); }
  const inner = size * (1 - 2 * pad / 100), o = (size - inner) / 2;
  LK.drawCtx(ctx, logo, o, o, inner, inner, fill);
  return cv;
};
LK.iconBlob = async (logo, size, opts) => { const cv = LK.iconCanvas(logo, size, opts); try { return await LK.toBlob(cv, 'image/png'); } finally { cv.width = cv.height = 0; } };
LK.ico = async (entries) => {
  const bufs = await Promise.all(entries.map(e => e.blob.arrayBuffer()));
  const head = 6 + 16 * entries.length, total = head + bufs.reduce((a, b) => a + b.byteLength, 0);
  const out = new Uint8Array(total), dv = new DataView(out.buffer);
  dv.setUint16(0, 0, true); dv.setUint16(2, 1, true); dv.setUint16(4, entries.length, true);
  let off = head;
  entries.forEach((e, k) => {
    const p = 6 + 16 * k; out[p] = e.size >= 256 ? 0 : e.size; out[p + 1] = e.size >= 256 ? 0 : e.size;
    dv.setUint16(p + 4, 1, true); dv.setUint16(p + 6, 32, true); dv.setUint32(p + 8, bufs[k].byteLength, true); dv.setUint32(p + 12, off, true);
    out.set(new Uint8Array(bufs[k]), off); off += bufs[k].byteLength;
  });
  return new Blob([out], { type: 'image/x-icon' });
};
LK.iconSvg = (logo, { pad, fill }) => {
  const S = 1024, inner = S * (1 - 2 * pad / 100), s = Math.min(inner / logo.w, inner / logo.h);
  const tx = (S - logo.w * s) / 2, ty = (S - logo.h * s) / 2;
  const body = logo.paths.map(p => `<path d="${p.d}" fill="${fill || p.fill}"${p.rule === 'evenodd' ? ' fill-rule="evenodd"' : ''}/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}"><g transform="translate(${fmt(tx)} ${fmt(ty)}) scale(${fmt(s * 1000) / 1000})">${body}</g></svg>\n`;
};
LK.setupHtml = (brand) => `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Set up your website icons</title>
<body style="max-width:760px;margin:40px auto;padding:0 20px;font:16px/1.6 system-ui;color:#1d1d1f">
<h1>Set up your website icons${brand ? ' — ' + LK.esc(brand) : ''}</h1>
<p>Copy the image files to the public root of your website and add these tags inside <code>&lt;head&gt;</code>. If you use another folder, update the paths.</p>
<pre style="white-space:pre-wrap;overflow-wrap:anywhere;background:#f4f4f5;padding:16px;border-radius:8px">&lt;link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48"&gt;
&lt;link rel="icon" href="/favicon-96.png" type="image/png" sizes="96x96"&gt;
&lt;link rel="icon" href="/favicon.svg" type="image/svg+xml" sizes="any"&gt;
&lt;link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180"&gt;</pre>
<ul><li><b>favicon.ico</b> contains 16, 32 and 48 px images.</li><li><b>favicon-96.png</b> is a 96 × 96 px PNG fallback.</li><li><b>favicon.svg</b> is scalable icon artwork for modern browsers.</li><li><b>apple-touch-icon.png</b> is 180 × 180 px with an opaque background.</li><li><b>icon-1024.png</b> is 1024 × 1024 px for app stores, social avatars or further preparation.</li></ul>
</body></html>
`;

window.LK = LK;
