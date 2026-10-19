/* Logokit — interface, pakketplanning en ZIP-generatie. */
'use strict';

const { esc, slug } = LK;
const $ = (s, r = document) => r.querySelector(s);
const STORE_KEY = 'logokit-draft-v1';

const TYPES = {
  'primary': { label: 'Primair logo', en: 'Primary Logo', desc: 'Je belangrijkste full-color logo voor lichte achtergronden. Wordt gebruikt voor de cover, de logoregels en de toepassingen in de guide.' },
  'primary-dark': { label: 'Primair logo (donker)', en: 'Primary Logo (Dark)', desc: 'De inverse versie voor donkere achtergronden. De originele kleuren blijven behouden in exports en guide.' },
  'horizontal': { label: 'Horizontaal logo', en: 'Horizontal Logo' },
  'vertical': { label: 'Verticaal logo', en: 'Vertical Logo' },
  'mark': { label: 'Beeldmerk', en: 'Logo Mark' },
  'monogram': { label: 'Monogram', en: 'Monogram' },
  'wordmark': { label: 'Woordmerk', en: 'Wordmark' },
  'app-icon': { label: 'Bron voor app-icoon', en: 'App Icon Source', desc: 'Wordt alleen gebruikt voor favicons en app-iconen, niet als losse logomap.' },
  'custom': { label: 'Aangepast', en: 'Custom' }
};
const SIZES = [[512, '01_Small', 'S'], [1024, '02_Medium', 'M'], [2048, '03_Large', 'L'], [4096, '04_Extra_Large', 'XL']];
const CHECKS = [['transparency', 'Transparantie', 'onzichtbare of (half)transparante vormen'], ['lines', 'Lijnen', 'lijnen/contouren — zet om naar gevulde vormen'], ['fonts', 'Fonts', 'live tekst — zet om naar contouren'], ['background', 'Achtergrond', 'een achtergrondvlak achter het logo'], ['images', 'Afbeeldingen', 'ingesloten rasterafbeeldingen'], ['links', 'Links', 'gekoppelde symbolen die niet te vinden waren'], ['clips', 'Maskers', 'clip-paths of maskers — worden genegeerd; zet om naar gevulde vormen']];

/* ---------- demo (eigen artwork) ---------- */
const DEMO_LETTERS = (fill) => `<g fill="${fill}" transform="translate(84 16)"><path d="M0 0H13L35 37V0H48V60H35L13 23V60H0Z"/><path transform="translate(60 0)" fill-rule="evenodd" d="M30 0A30 30 0 1 1 30 60A30 30 0 1 1 30 0ZM30 13A17 17 0 1 0 30 47A17 17 0 1 0 30 13Z"/><path transform="translate(132 0)" d="M0 0H13.5L26 41L38.5 0H52L33 60H19Z"/><path transform="translate(194 0)" fill-rule="evenodd" d="M19 0H33L52 60H38.5L34.6 47H17.4L13.5 60H0ZM21 35H31L26 18.5Z"/></g>`;
const DEMO_MARK = (bars) => `<circle cx="30" cy="30" r="30" fill="#FF5A36"/><rect x="0" y="66" width="60" height="10" rx="5" fill="${bars}"/><rect x="12" y="82" width="36" height="10" rx="5" fill="${bars}"/>`;
const DEMO = [
  ['nova_logo.svg', 'primary', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 330 92">${DEMO_MARK('#1F2340')}${DEMO_LETTERS('#1F2340')}</svg>`],
  ['nova_logo_dark.svg', 'primary-dark', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 330 92">${DEMO_MARK('#FFFFFF')}${DEMO_LETTERS('#FFFFFF')}</svg>`],
  ['nova_mark.svg', 'mark', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 92">${DEMO_MARK('#1F2340')}</svg>`]
];
const DEMO_COLORS = [['Coral', '#FF5A36'], ['Midnight', '#1F2340'], ['Cream', '#F6F1E7']];

/* ---------- state ---------- */
const defaults = () => ({
  step: 1, brand: '', assets: [], colors: [],
  bw: true, otherOriginals: true,
  formats: { svg: true, png: true, jpg: true, webp: true, eps: true, pdf: true },
  sizes: { 512: true, 1024: true, 2048: true, 4096: true }, customSize: '',
  jpgWidth: 2048, jpgMargin: 10, combos: {},
  guide: true, guideLang: 'nl', guideApps: true,
  icons: { on: true, source: '', art: 'original', bg: 'white', opaque: true, favPad: 4, appPad: 14, avatarPad: 20, upload: null }
});
let S = defaults();
const logos = new Map(); // assetId -> {logo, issues}
let iconUpload = null;   // genormaliseerd logo van losse icoon-upload

const save = () => {
  try {
    const data = { ...S, assets: S.assets.map(({ id, fileName, size, svg, type, customName }) => ({ id, fileName, size, svg, type, customName })) };
    localStorage.setItem(STORE_KEY, JSON.stringify(data));
    setSaved('Concept opgeslagen in deze browser');
  } catch (e) { setSaved('Concept kon niet worden opgeslagen (te groot)'); }
};
let saveTimer; const saveSoon = () => { clearTimeout(saveTimer); saveTimer = setTimeout(save, 300); };
const setSaved = t => { const el = $('#saved'); if (el) el.textContent = t; };

/* ---------- afgeleide data ---------- */
const brandSlug = () => slug(S.brand) || 'brand';
const brandFolder = () => LK.folder(S.brand) || 'Brand';
const cmykOf = c => c.cmykAuto ? LK.autoCmyk(c.hex) : c.cmyk.map(v => Math.max(0, Math.min(100, +v || 0)));
const assetName = a => a.type === 'custom' ? (a.customName || a.fileName.replace(/\.svg$/i, '') || 'Custom') : TYPES[a.type].en;
const readyAssets = () => S.assets.filter(a => logos.get(a.id));
const exportAssets = () => {
  const order = { 'primary': 0, 'primary-dark': 1 };
  return readyAssets().filter(a => a.type !== 'app-icon').map((a, i) => ({ a, i })).sort((x, y) => ((order[x.a.type] ?? 2) - (order[y.a.type] ?? 2)) || x.i - y.i).map(x => x.a);
};
const logoColors = () => S.colors.filter(c => c.logo);
const backgrounds = () => {
  const out = [{ slug: 'white', hex: '#FFFFFF', label: 'Wit' }, { slug: 'black', hex: '#000000', label: 'Zwart' }];
  S.colors.filter(c => c.bg).forEach(c => { if (!out.some(o => o.hex === c.hex)) out.push({ slug: slug(c.name) || c.hex.slice(1).toLowerCase(), hex: c.hex, label: c.name || c.hex }); });
  return out;
};
const variants = a => {
  const v = [];
  if (a.type === 'primary-dark') return [{ slug: 'original-on-black', label: 'Origineel', fill: null }];
  if (a.type === 'primary') v.push({ slug: 'original-on-white', label: 'Origineel', fill: null });
  else if (S.otherOriginals) v.push({ slug: 'original', label: 'Origineel', fill: null });
  logoColors().forEach(c => v.push({ slug: slug(c.name) || c.hex.slice(1).toLowerCase(), label: c.name || c.hex, fill: c.hex, cmyk: cmykOf(c) }));
  if (S.bw) { v.push({ slug: 'black', label: 'Zwart', fill: '#000000', cmyk: [0, 0, 0, 100] }); v.push({ slug: 'white', label: 'Wit', fill: '#FFFFFF', cmyk: [0, 0, 0, 0] }); }
  const seen = {}; v.forEach(x => { if (seen[x.slug]) x.slug += '-' + (++seen[x.slug]); else seen[x.slug] = 1; });
  return v;
};
const comboContrast = (logo, v, bg) => Math.min(...(v.fill ? [v.fill] : logo.colors).map(c => LK.contrast(c, bg.hex)));
const combos = a => {
  const logo = logos.get(a.id).logo, out = [];
  for (const v of variants(a)) for (const bg of backgrounds()) {
    if (v.fill && v.fill.toUpperCase() === bg.hex.toUpperCase()) continue;
    const ratio = comboContrast(logo, v, bg), auto = ratio >= LK.MIN_CONTRAST, key = `${a.id}|${v.slug}|${bg.slug}`;
    out.push({ key, v, bg, ratio, auto, on: key in S.combos ? S.combos[key] : auto });
  }
  return out;
};
const sizes = () => {
  const out = SIZES.filter(([w]) => S.sizes[w]).map(([w, dir]) => ({ w, dir }));
  const c = parseInt(S.customSize, 10);
  if (c >= 16 && c <= 8192 && !out.some(s => s.w === c)) out.push({ w: c, dir: `05_Custom_${c}px` });
  return out;
};
const pathCmyk = (p) => { const c = S.colors.find(c => c.hex === p.fill); return c ? cmykOf(c) : LK.autoCmyk(p.fill); };
const iconSource = () => {
  if (S.icons.source === 'upload') return iconUpload;
  const a = S.assets.find(x => x.id === S.icons.source && logos.get(x.id));
  if (a) return logos.get(a.id).logo;
  const fall = readyAssets().find(x => x.type === 'app-icon') || readyAssets().find(x => x.type === 'mark' || x.type === 'monogram') || readyAssets().find(x => x.type === 'primary');
  return fall ? logos.get(fall.id).logo : null;
};
const iconFill = () => S.icons.art === 'original' ? null : S.icons.art;
const iconBg = () => S.icons.bg === 'white' ? '#FFFFFF' : S.icons.bg === 'black' ? '#000000' : S.icons.bg;

/* ---------- planning van alle bestanden ---------- */
function plan() {
  const files = [], f = S.formats, b = brandSlug(), sz = sizes();
  let n = 0;
  for (const a of exportAssets()) {
    const logo = logos.get(a.id).logo, aslug = slug(assetName(a)) || 'logo';
    const dir = `${LK.pad(++n)}_${LK.folder(assetName(a)) || 'Logo'}`;
    const vs = variants(a);
    for (const v of vs) {
      const base = `${b}-${aslug}-rgb-${v.slug}`;
      if (f.svg) files.push({ path: `${dir}/01_RGB_Digital/01_SVG/${base}.svg`, make: () => LK.svgString(logo, v.fill) });
      if (f.png) sz.forEach(s => files.push({ path: `${dir}/01_RGB_Digital/02_PNG_Transparent/${s.dir}/${base}-transparent-${s.w}.png`, store: true, heavy: s.w, make: () => LK.raster(logo, v.fill, s.w, 'image/png') }));
      if (f.webp) sz.forEach(s => files.push({ path: `${dir}/01_RGB_Digital/04_WEBP/${s.dir}/${base}-transparent-${s.w}.webp`, store: true, heavy: s.w, make: () => LK.raster(logo, v.fill, s.w, 'image/webp') }));
    }
    if (f.jpg) combos(a).filter(c => c.on).forEach(c => files.push({ path: `${dir}/01_RGB_Digital/03_JPG/${b}-${aslug}-rgb-${c.v.slug}-${c.bg.slug}-bg.jpg`, store: true, heavy: S.jpgWidth, make: () => LK.raster(logo, c.v.fill, S.jpgWidth, 'image/jpeg', c.bg.hex, S.jpgMargin / 100) }));
    for (const v of vs) {
      const base = `${b}-${aslug}-cmyk-${v.slug}`, cm = p => v.fill ? v.cmyk : pathCmyk(p), title = `${S.brand} ${assetName(a)} CMYK ${v.slug}`;
      if (f.eps) files.push({ path: `${dir}/02_CMYK_Print/01_EPS/${base}.eps`, make: () => LK.eps(logo, cm, title) });
      if (f.pdf) files.push({ path: `${dir}/02_CMYK_Print/02_PDF/${base}.pdf`, make: () => LK.pdf(logo, cm, title) });
    }
  }
  const src = S.icons.on && iconSource();
  if (src) {
    const dir = `${LK.pad(++n)}_Favicon_and_App_Icons`, fill = iconFill(), bg = S.icons.opaque ? iconBg() : null;
    const fav = { pad: S.icons.favPad, fill }, app = { pad: S.icons.appPad, fill, bg };
    files.push({ path: `${dir}/favicon.svg`, make: () => LK.iconSvg(src, fav) });
    files.push({ path: `${dir}/favicon.ico`, make: async () => LK.ico(await Promise.all([16, 32, 48].map(async s => ({ size: s, blob: await LK.iconBlob(src, s, fav) })))) });
    files.push({ path: `${dir}/favicon-96.png`, store: true, make: () => LK.iconBlob(src, 96, fav) });
    files.push({ path: `${dir}/apple-touch-icon.png`, store: true, make: () => LK.iconBlob(src, 180, { ...app, bg: iconBg() }) });
    files.push({ path: `${dir}/icon-1024.png`, store: true, make: () => LK.iconBlob(src, 1024, app) });
    files.push({ path: `${dir}/setup.html`, make: () => LK.setupHtml(S.brand) });
  }
  if (S.guide && readyAssets().some(a => a.type === 'primary')) files.push({ path: `${brandFolder()}_Logo_Guide.pdf`, heavy: 3000, make: () => buildGuide(guideCtx(files)) });
  return files;
}

function treeLines(paths, max = 60) {
  const root = {};
  paths.forEach(p => { let n = root; p.split('/').forEach((part, i, arr) => { n[part] = n[part] || (i === arr.length - 1 ? null : {}); n = n[part] || {}; }); });
  const lines = [], walk = (node, depth) => {
    const keys = Object.keys(node).sort((a, b) => (node[a] === null) - (node[b] === null) || a.localeCompare(b));
    for (const k of keys) {
      if (node[k] === null) continue;
      lines.push('  '.repeat(depth) + k + '/'); if (depth < 2) walk(node[k], depth + 1);
    }
    keys.filter(k => node[k] === null).forEach(k => lines.push('  '.repeat(depth) + k));
  };
  walk(root, 0);
  return lines.slice(0, max);
}

function guideCtx(files) {
  const assets = exportAssets().map(a => ({ type: a.type, name: assetName(a), logo: logos.get(a.id).logo, variantCount: variants(a).length }));
  const primary = assets.find(a => a.type === 'primary');
  const dark = assets.find(a => a.type === 'primary-dark');
  const cols = S.colors.map(c => ({ name: c.name || c.hex, hex: c.hex, cmyk: cmykOf(c) }));
  const sat = h => { const [r, g, b] = LK.hexToRgb(h); const mx = Math.max(r, g, b), mn = Math.min(r, g, b); return mx ? (mx - mn) / mx : 0; };
  const all = [...cols.map(c => c.hex), ...primary.logo.colors];
  const accent = [...all].sort((a, b) => sat(b) - sat(a))[0] || '#333333';
  const ink = [...all].filter(h => LK.lum(h) < 0.08).sort((a, b) => LK.lum(a) - LK.lum(b))[0] || '#1A1A1A';
  const light = [...all].filter(h => LK.lum(h) > 0.75).sort((a, b) => LK.lum(b) - LK.lum(a))[0] || '#F3F3F1';
  const pa = exportAssets().find(a => a.type === 'primary');
  const vs = variants(pa);
  const bgCombos = [];
  combos(pa).forEach(c => bgCombos.push({ fill: c.v.fill, bg: c.bg.hex, ok: c.ratio >= LK.MIN_CONTRAST }));
  if (dark) bgCombos.unshift({ logo: dark.logo, fill: null, bg: '#000000', ok: true });
  return {
    lang: S.guideLang, brand: S.brand || 'Brand', date: new Date().toLocaleDateString(S.guideLang === 'nl' ? 'nl-NL' : 'en-GB', { year: 'numeric', month: 'long' }),
    clearPct: S.jpgMargin, assets, primary, dark, colors: cols, accent, ink, light,
    logoColors: logoColors().map(c => c.hex), bgColors: backgrounds().slice(2).map(b => b.hex),
    primaryVariants: vs.map(v => ({ label: v.slug.startsWith('original') ? (S.guideLang === 'nl' ? 'Origineel' : 'Original') : v.slug === 'black' ? (S.guideLang === 'nl' ? 'Zwart' : 'Black') : v.slug === 'white' ? (S.guideLang === 'nl' ? 'Wit' : 'White') : v.label, fill: v.fill })),
    bgCombos, apps: S.guideApps,
    tree: treeLines(files.map(f => f.path), 40)
  };
}

/* ---------- bestanden inlezen ---------- */
async function addSvgFiles(fileList) {
  const files = [...fileList].filter(f => /\.svg$/i.test(f.name) || f.type === 'image/svg+xml');
  if (!files.length) return toast('Kies één of meer SVG-bestanden.');
  const skipped = [];
  for (const file of files) {
    if (S.assets.length >= 10) { toast('Maximaal 10 logobestanden per pakket.'); break; }
    const svg = await file.text();
    await addAsset(file.name, svg, file.size, null, skipped);
  }
  if (skipped.length) toast(skipped.join('\n'));
  if (!S.brand) { const p = S.assets.find(a => a.type === 'primary'); if (p) S.brand = p.fileName.replace(/[_-]?(logo|primary|main)?\.svg$/i, '').replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }
  autoColors(); render(); saveSoon();
}
function guessType(name) {
  const n = name.toLowerCase(), has = t => S.assets.some(a => a.type === t);
  if (!has('primary')) return 'primary';
  if (/(dark|white|negative|neg|inverse|reversed|wit)/.test(n) && !has('primary-dark')) return 'primary-dark';
  if (/(mark|sign|symbol|icon|beeld)/.test(n)) return 'mark';
  if (/monogram/.test(n)) return 'monogram';
  if (/(word|type|text)/.test(n)) return 'wordmark';
  if (/(horizontal|horizontaal|landscape)/.test(n)) return 'horizontal';
  if (/(vertical|verticaal|stacked)/.test(n)) return 'vertical';
  return 'custom';
}
async function addAsset(fileName, svg, size, type, skipped = []) {
  try {
    const res = await LK.analyzeSvg(svg);
    if (res.issues.images) { skipped.push(`${fileName}: bevat ingesloten rasterafbeeldingen en is overgeslagen.`); return; }
    const a = { id: LK.uid(), fileName, size: size || svg.length, svg, type: type || guessType(fileName), customName: '' };
    if (a.type === 'custom') a.customName = fileName.replace(/\.svg$/i, '').replace(/[_-]+/g, ' ');
    logos.set(a.id, res); S.assets.push(a);
  } catch (e) { skipped.push(`${fileName}: ${e.message}`); }
}
function autoColors() {
  if (S.colors.length) return;
  const seen = new Set(), out = [];
  readyAssets().forEach(a => logos.get(a.id).logo.colors.forEach(h => { if (!seen.has(h) && h !== '#FFFFFF' && h !== '#000000') { seen.add(h); out.push(h); } }));
  S.colors = out.slice(0, 8).map(h => newColor(LK.colorName(h), h));
}
const newColor = (name, hex) => ({ id: LK.uid(), name, hex, cmykAuto: true, cmyk: LK.autoCmyk(hex), logo: true, bg: true });

async function loadDemo() {
  S.assets = []; logos.clear(); S.combos = {};
  for (const [name, type, svg] of DEMO) await addAsset(name, svg, svg.length, type);
  S.brand = S.brand || 'Nova';
  S.colors = DEMO_COLORS.map(([n, h]) => newColor(n, h));
  render(); saveSoon();
}

/* ---------- UI ---------- */
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 4200);
}
const checker = 'checker';
const thumb = (logo, fill, cls = '') => `<img class="thumb-img ${cls}" alt="" src="${LK.svgDataUrl(logo, fill)}">`;

function stepNav() {
  return ['Merk & bestanden', 'Kleuren', 'Exporteren'].map((t, i) => {
    const n = i + 1, st = S.step === n ? 'is-active' : S.step > n ? 'is-done' : '';
    return `<button class="stepper-item ${st}" data-act="goto" data-step="${n}"><span class="stepper-num">${S.step > n ? '✓' : n}</span>${t}</button>`;
  }).join('<span class="stepper-line"></span>');
}

function viewStep1() {
  const list = S.assets.map((a, i) => {
    const r = logos.get(a.id), t = TYPES[a.type];
    const badges = r ? CHECKS.map(([k, label, tip]) => { const c = r.issues[k] || 0; if ((k === 'links' || k === 'clips') && !c) return ''; return `<span class="badge ${c ? 'badge-warn' : 'badge-ok'}" title="${c ? esc(`${c}× ${tip}`) : 'In orde'}">${c ? '!' : '✓'} ${label}${c ? ` (${c})` : ''}</span>`; }).join('') : '';
    const warn = r && (r.issues.lines || r.issues.fonts || r.issues.links || r.issues.clips) ? `<p class="hint hint-warn">Lijnen, live tekst, maskers en ontbrekende symbolen worden niet meegenomen in de export. Zet ze om naar gevulde vormen.</p>` : r && (r.issues.background || r.issues.transparency) ? `<p class="hint hint-warn">Controleer dit bestand: ${r.issues.background ? 'er lijkt een achtergrondvlak in te zitten' : 'er zitten onzichtbare of transparante vormen in'}.</p>` : '';
    return `<div class="asset ${a.type === 'primary-dark' ? 'asset-dark' : ''}">
      <div class="asset-thumb ${a.type === 'primary-dark' ? 'on-dark' : checker}">${r ? thumb(r.logo) : ''}</div>
      <div class="asset-body">
        <div class="asset-top"><span class="mono">${esc(a.fileName)}</span><span class="tag">SVG</span><span class="muted small">${(a.size / 1024).toFixed(1)} KB</span>
          <span class="asset-actions">
            <button class="icon-btn" data-act="move" data-id="${a.id}" data-dir="-1" title="Omhoog" ${i === 0 ? 'disabled' : ''}>↑</button>
            <button class="icon-btn" data-act="move" data-id="${a.id}" data-dir="1" title="Omlaag" ${i === S.assets.length - 1 ? 'disabled' : ''}>↓</button>
            <button class="icon-btn" data-act="remove" data-id="${a.id}" title="Verwijderen">✕</button>
          </span></div>
        <div class="row gap-s">
          <select data-act="type" data-id="${a.id}">${Object.entries(TYPES).map(([k, v]) => `<option value="${k}" ${k === a.type ? 'selected' : ''}>${v.label}</option>`).join('')}</select>
          ${a.type === 'custom' ? `<input class="grow" data-act="customName" data-id="${a.id}" value="${esc(a.customName)}" placeholder="Naam, bv. Badge">` : ''}
        </div>
        ${t.desc ? `<p class="hint">${t.desc}</p>` : ''}
        <div class="badges">${badges}</div>${warn}
      </div></div>`;
  }).join('');
  return `<h1>Merk & bestanden</h1>
  <label class="field"><span class="label">Merknaam</span><input id="brand" data-act="brand" value="${esc(S.brand)}" placeholder="bv. Nova Studio" autocomplete="off"><span class="hint">Wordt gebruikt in alle bestands- en mapnamen.</span></label>
  <div class="field"><span class="label">Logobestanden</span><span class="hint">Upload één of meer SVG-bestanden (max. 10). Elk bestand krijgt een eigen complete map in de ZIP.</span></div>
  <div class="callout"><b>Belangrijk:</b> gebruik schone SVG's — geen achtergrondvlakken, geen ingesloten afbeeldingen, geen live tekst, geen lijnen (alleen gevulde vormen) en geen onzichtbare kaders rond het logo. <button class="link" data-act="examples">Bekijk voorbeelden</button></div>
  ${list ? `<div class="assets">${list}</div>` : ''}
  <label class="drop" id="drop"><input type="file" id="file" accept=".svg,image/svg+xml" multiple hidden>
    <span class="drop-icon">↥</span><b>Sleep SVG-bestanden hierheen</b><span class="muted">of klik om te bladeren</span></label>
  ${S.assets.length ? '' : `<div class="demo-row"><span class="muted">Geen SVG bij de hand?</span><button class="btn btn-ghost" data-act="demo">Probeer met demologo</button></div>`}`;
}

function viewStep2() {
  const pa = readyAssets().find(a => a.type === 'primary') || readyAssets()[0];
  const rows = S.colors.map((c, i) => {
    const cm = cmykOf(c), [r, g, b] = LK.hexToRgb(c.hex);
    return `<div class="color">
      <label class="swatch" style="background:${c.hex}"><input type="color" value="${c.hex.toLowerCase()}" data-act="cpick" data-id="${c.id}"></label>
      <div class="color-body">
        <div class="row gap-s wrap">
          <input class="grow" value="${esc(c.name)}" data-act="cname" data-id="${c.id}" placeholder="Kleurnaam, bv. Brand Blue">
          <input class="mono w-hex" value="${c.hex}" data-act="chex" data-id="${c.id}" maxlength="7">
          <button class="icon-btn" data-act="cdup" data-id="${c.id}" title="Dupliceren">⧉</button>
          <button class="icon-btn" data-act="cdel" data-id="${c.id}" title="Verwijderen">✕</button>
        </div>
        <div class="row gap-m wrap small">
          <span class="muted mono">RGB ${r} ${g} ${b}</span>
          <span class="cmyk">CMYK ${c.cmykAuto ? `<span class="mono">${cm.join(' ')}</span>` : ['C', 'M', 'Y', 'K'].map((l, k) => `<label class="cm">${l}<input type="number" min="0" max="100" value="${cm[k]}" data-act="cmyk" data-id="${c.id}" data-k="${k}"></label>`).join('')}
            <label class="switch-s"><input type="checkbox" data-act="cauto" data-id="${c.id}" ${c.cmykAuto ? '' : 'checked'}> handmatig</label></span>
        </div>
        <div class="row gap-m wrap small">
          <label class="chk"><input type="checkbox" data-act="clogo" data-id="${c.id}" ${c.logo ? 'checked' : ''}> Gebruik als logokleur</label>
          <label class="chk"><input type="checkbox" data-act="cbg" data-id="${c.id}" ${c.bg ? 'checked' : ''}> Gebruik als achtergrond</label>
        </div>
      </div></div>`;
  }).join('');
  let preview = '';
  if (pa) {
    const logo = logos.get(pa.id).logo;
    preview = `<div class="card-sub"><div class="label">Voorbeeld: ${esc(assetName(pa))} in alle varianten</div><div class="preview-grid">${variants(pa).map(v => {
      const bg = (v.fill ? backgrounds().filter(b => b.hex !== v.fill).sort((x, y) => LK.contrast(v.fill, y.hex) - LK.contrast(v.fill, x.hex))[0].hex : '#FFFFFF');
      return `<figure><div class="pv" style="background:${bg}">${thumb(logo, v.fill)}</div><figcaption>${esc(v.label)}</figcaption></figure>`;
    }).join('')}</div></div>`;
  }
  return `<h1>Kleuren</h1>
  <p class="lead">Voeg je merkkleuren toe. Logokit maakt van elk logo een versie in elke logokleur en gebruikt de achtergrondkleuren voor de JPG-combinaties. CMYK wordt automatisch berekend uit HEX, of vul je eigen drukwaarden in.</p>
  <div class="colors">${rows || '<p class="muted">Nog geen kleuren.</p>'}</div>
  <div class="row gap-s wrap add-color">
    <input type="color" id="newPick" value="#3b82f6"><input class="mono w-hex" id="newHex" placeholder="#3B82F6" maxlength="7"><input class="grow" id="newName" placeholder="Kleurnaam (optioneel)">
    <button class="btn btn-ghost" data-act="cadd" ${S.colors.length >= 24 ? 'disabled' : ''}>+ Kleur toevoegen</button>
  </div>
  ${S.colors.length >= 24 ? '<p class="hint hint-warn">Maximaal 24 merkkleuren.</p>' : ''}
  <div class="toggles">
    <label class="toggle"><input type="checkbox" data-act="bw" ${S.bw ? 'checked' : ''}><span><b>Zwart-wit logoversies</b><br><span class="muted small">Voegt volledig zwarte en witte versies toe van het primaire en de overige logo's. Het donkere logo houdt zijn originele kleuren.</span></span></label>
    <label class="toggle"><input type="checkbox" data-act="origs" ${S.otherOriginals ? 'checked' : ''}><span><b>Originele kleuren voor overige logo's</b><br><span class="muted small">Het primaire en donkere origineel zitten er altijd in. Deze schakelaar regelt de originele versie van je overige logo's.</span></span></label>
  </div>
  ${preview}`;
}

function viewStep3() {
  const f = S.formats, files = plan(), assets = exportAssets();
  const jpgBlocks = S.formats.jpg ? assets.map(a => {
    const cs = combos(a), bgs = backgrounds().filter(bg => cs.some(c => c.bg.slug === bg.slug)), vs = variants(a), logo = logos.get(a.id).logo;
    return `<details class="combo" ${assets.length === 1 ? 'open' : ''}><summary><b>${esc(assetName(a))}</b> <span class="muted small">${cs.filter(c => c.on).length} van ${cs.length} combinaties</span></summary>
      <div class="combo-scroll"><table class="combo-table"><thead><tr><th></th>${bgs.map(bg => `<th><span class="dot" style="background:${bg.hex}"></span>${esc(bg.label)}</th>`).join('')}</tr></thead><tbody>
      ${vs.map(v => `<tr><th>${esc(v.label)}</th>${bgs.map(bg => { const c = cs.find(x => x.v.slug === v.slug && x.bg.slug === bg.slug); if (!c) return '<td class="na">—</td>'; return `<td><label class="cell ${c.auto ? '' : 'low'}" style="background:${bg.hex}" title="Contrast ${c.ratio.toFixed(1)}:1${c.auto ? '' : ' — laag contrast'}"><img alt="" src="${LK.svgDataUrl(logo, v.fill)}"><input type="checkbox" data-act="combo" data-key="${c.key}" ${c.on ? 'checked' : ''}></label></td>`; }).join('')}</tr>`).join('')}
      </tbody></table></div></details>`;
  }).join('') : '';
  const lowNote = S.formats.jpg && assets.some(a => combos(a).some(c => !c.auto)) ? '<p class="hint">Combinaties met te weinig contrast staan standaard uit (gemarkeerd). Je kunt elke keuze aanpassen.</p>' : '';
  const ic = S.icons, src = iconSource();
  const iconOpts = readyAssets().map(a => `<option value="${a.id}" ${ic.source === a.id ? 'selected' : ''}>${esc(assetName(a))}</option>`).join('');
  const colorOpts = (sel, extra) => extra + S.colors.map(c => `<option value="${c.hex}" ${sel === c.hex ? 'selected' : ''}>${esc(c.name || c.hex)}</option>`).join('');
  const prev = src ? (() => {
    const fill = iconFill(), bg = iconBg();
    const fav = s => { const cv = LK.iconCanvas(src, s * 2, { pad: ic.favPad, fill }); return cv.toDataURL(); };
    const big = LK.iconCanvas(src, 360, { pad: ic.appPad, fill, bg: ic.opaque ? bg : null }).toDataURL();
    const av = LK.iconCanvas(src, 200, { pad: ic.avatarPad, fill, bg, round: true }).toDataURL();
    const f16 = fav(16), f32 = fav(32), f48 = fav(48);
    return `<div class="icon-prev">
      <div><div class="label small">Favicon op ware grootte</div><div class="fav-row"><div class="fav-surface light"><img src="${f16}" width="16" height="16"><img src="${f32}" width="32" height="32"><img src="${f48}" width="48" height="48"></div><div class="fav-surface dark"><img src="${f16}" width="16" height="16"><img src="${f32}" width="32" height="32"><img src="${f48}" width="48" height="48"></div></div>
        <div class="tab-mock"><img src="${f16}" width="16" height="16"><span>${esc(S.brand || 'Je website')}</span></div></div>
      <div><div class="label small">App-icoon</div><img class="app-ic ${ic.opaque ? '' : checker}" src="${big}" width="120" height="120"></div>
      <div><div class="label small">Avatar (voorbeeld)</div><img class="av-ic" src="${av}" width="120" height="120"></div>
    </div>`;
  })() : '<p class="muted">Kies een bron-SVG om favicons en app-iconen te maken.</p>';

  return `<h1>Exporteren</h1>
  <p class="lead">Kies wat er in je archief komt, controleer de mappenstructuur en genereer je complete logopakket.</p>
  <section class="card-sub"><div class="label">Exportformaten</div>
    <div class="fmt-grid"><div><div class="small muted upper">Digitaal / RGB</div>${[['svg', 'SVG'], ['png', 'PNG (transparant)'], ['jpg', 'JPEG'], ['webp', 'WebP (transparant)']].map(([k, l]) => `<label class="chk"><input type="checkbox" data-act="fmt" data-k="${k}" ${f[k] ? 'checked' : ''}> ${l}</label>`).join('')}</div>
    <div><div class="small muted upper">Druk / CMYK</div>${[['eps', 'EPS (vector)'], ['pdf', 'PDF (vector)']].map(([k, l]) => `<label class="chk"><input type="checkbox" data-act="fmt" data-k="${k}" ${f[k] ? 'checked' : ''}> ${l}</label>`).join('')}</div></div>
  </section>
  ${f.png || f.webp ? `<section class="card-sub"><div class="label">Exportformaten PNG & WebP (breedte)</div>
    <div class="row gap-s wrap">${SIZES.map(([w, , l]) => `<label class="pill ${S.sizes[w] ? 'on' : ''}"><input type="checkbox" data-act="size" data-w="${w}" ${S.sizes[w] ? 'checked' : ''}>${l} · ${w}px</label>`).join('')}
    <label class="pill pill-input">Eigen <input type="number" min="16" max="8192" placeholder="bv. 256" value="${esc(S.customSize)}" data-act="customSize"> px</label></div>
    <p class="hint">Breedte in pixels (16–8192). De hoogte schaalt mee met de verhouding.</p></section>` : ''}
  ${f.jpg ? `<section class="card-sub"><div class="label">JPEG-combinaties</div>
    <div class="row gap-m wrap"><label class="field-inline">Breedte <select data-act="jpgWidth">${[1024, 2048, 4096].map(w => `<option ${S.jpgWidth == w ? 'selected' : ''}>${w}</option>`).join('')}</select> px</label>
    <label class="field-inline grow">Marge & vrije ruimte <input type="range" min="0" max="30" value="${S.jpgMargin}" data-act="jpgMargin"><b id="mval">${S.jpgMargin}%</b></label></div>
    <p class="hint">Marge aan elke kant als percentage van de logobreedte. Wordt ook gebruikt als vrije ruimte in de guide.</p>
    ${lowNote}${jpgBlocks}</section>` : ''}
  <section class="card-sub"><label class="toggle"><input type="checkbox" data-act="guide" ${S.guide ? 'checked' : ''}><span><b>PDF-logoguide</b><br><span class="muted small">Logo, vrije ruimte, merkkleuren, gebruiksregels en toepassingen in één PDF (16 pagina's).</span></span></label>
    ${S.guide ? `<div class="row gap-m wrap indent"><label class="field-inline">Taal <select data-act="guideLang"><option value="nl" ${S.guideLang === 'nl' ? 'selected' : ''}>Nederlands</option><option value="en" ${S.guideLang === 'en' ? 'selected' : ''}>English</option></select></label>
    <label class="chk"><input type="checkbox" data-act="guideApps" ${S.guideApps ? 'checked' : ''}> Merktoepassingen (tassen, drinkwaar, visitekaartjes, mappen, kleding)</label>
    <button class="btn btn-ghost btn-s" data-act="previewGuide">Bekijk guide</button></div>` : ''}
  </section>
  <section class="card-sub"><label class="toggle"><input type="checkbox" data-act="icons" ${ic.on ? 'checked' : ''}><span><b>Favicon & app-iconen</b><br><span class="muted small">favicon.svg, favicon.ico (16/32/48), favicon-96.png, apple-touch-icon.png (180), icon-1024.png en setup.html.</span></span></label>
    ${ic.on ? `<div class="icon-grid indent">
      <label class="field-inline">Bron <select data-act="iconSource"><option value="">Automatisch</option>${iconOpts}<option value="upload" ${ic.source === 'upload' ? 'selected' : ''}>Losse SVG uploaden…</option></select></label>
      ${ic.source === 'upload' ? `<label class="btn btn-ghost btn-s">${iconUpload ? 'Andere SVG kiezen' : 'Icoon-SVG kiezen'}<input type="file" accept=".svg" hidden data-act="iconFile"></label>` : ''}
      <label class="field-inline">Kleur ontwerp <select data-act="iconArt">${colorOpts(ic.art, `<option value="original" ${ic.art === 'original' ? 'selected' : ''}>Originele kleuren</option><option value="#000000" ${ic.art === '#000000' ? 'selected' : ''}>Zwart</option><option value="#FFFFFF" ${ic.art === '#FFFFFF' ? 'selected' : ''}>Wit</option>`)}</select></label>
      <label class="field-inline">Achtergrond app & avatar <select data-act="iconBg">${colorOpts(ic.bg, `<option value="white" ${ic.bg === 'white' ? 'selected' : ''}>Wit</option><option value="black" ${ic.bg === 'black' ? 'selected' : ''}>Zwart</option>`)}</select></label>
      <label class="chk"><input type="checkbox" data-act="iconOpaque" ${ic.opaque ? 'checked' : ''}> Ondoorzichtig voor app-iconen</label>
      ${[['favPad', 'Marge favicon', 0, 25], ['appPad', 'Marge app-icoon', 0, 35], ['avatarPad', 'Marge avatar', 0, 35]].map(([k, l, mn, mx]) => `<label class="field-inline">${l} <input type="range" min="${mn}" max="${mx}" value="${ic[k]}" data-act="iconPad" data-k="${k}"><b>${ic[k]}%</b></label>`).join('')}
    </div>${prev}` : ''}
  </section>
  <section class="card-sub"><div class="label">ZIP-mappenstructuur <span class="muted small">· ${files.length} bestanden in ${esc(brandFolder())}_Logo_Asset_Pack.zip</span></div>
    ${treeHtml(files.map(f => f.path))}</section>`;
}

function treeHtml(paths) {
  const root = {};
  paths.forEach(p => { let n = root; const parts = p.split('/'); parts.forEach((part, i) => { if (i === parts.length - 1) { (n.__files = n.__files || []).push(part); } else { n[part] = n[part] || {}; n = n[part]; } }); });
  const count = n => (n.__files || []).length + Object.keys(n).filter(k => k !== '__files').reduce((s, k) => s + count(n[k]), 0);
  const walk = (n, depth) => Object.keys(n).filter(k => k !== '__files').sort().map(k => `<details ${depth === 0 ? 'open' : ''}><summary>📁 ${esc(k)} <span class="muted">(${count(n[k])})</span></summary><div class="tree-in">${walk(n[k], depth + 1)}${(n[k].__files || []).map(f => `<div class="tree-file">${esc(f)}</div>`).join('')}</div></details>`).join('');
  return `<div class="tree mono">${walk(root, 0)}${(root.__files || []).map(f => `<div class="tree-file">📄 ${esc(f)}</div>`).join('')}</div>`;
}

function viewSummary() {
  const files = S.step === 3 ? plan().length : null;
  return `<div class="label">Overzicht</div>
  <dl class="sum"><dt>Merk</dt><dd>${esc(S.brand) || '<span class="muted">—</span>'}</dd><dt>Logobestanden</dt><dd>${S.assets.length}</dd><dt>Merkkleuren</dt><dd>${S.colors.length}</dd>${files !== null ? `<dt>Bestanden in ZIP</dt><dd>${files}</dd>` : ''}</dl>
  ${S.colors.length ? `<div class="sum-sw">${S.colors.map(c => `<span style="background:${c.hex}" title="${esc(c.name)} ${c.hex}"></span>`).join('')}</div>` : ''}
  ${S.assets.length ? `<ol class="sum-list">${S.assets.map(a => `<li>${esc(a.type === 'custom' ? assetName(a) : TYPES[a.type].label)}</li>`).join('')}</ol>` : ''}
  <p id="saved" class="muted small"></p>`;
}

function render() {
  $('#stepper').innerHTML = stepNav();
  $('#step').innerHTML = S.step === 1 ? viewStep1() : S.step === 2 ? viewStep2() : viewStep3();
  $('#summary').innerHTML = viewSummary();
  $('#back').style.visibility = S.step === 1 ? 'hidden' : 'visible';
  $('#next').textContent = S.step === 3 ? 'Genereer logopakket' : 'Verder →';
  $('#next').classList.toggle('btn-generate', S.step === 3);
  bindDrop();
}
const rerenderKeep = () => { const y = window.scrollY; render(); window.scrollTo(0, y); };

function validateStep1() {
  if (!S.brand.trim()) { toast('Vul een merknaam in.'); $('#brand')?.focus(); return false; }
  if (!readyAssets().length) { toast('Upload minimaal één logobestand.'); return false; }
  if (!readyAssets().some(a => a.type === 'primary')) { toast('Wijs één bestand aan als Primair logo.'); return false; }
  return true;
}

function bindDrop() {
  const d = $('#drop'); if (!d) return;
  const fi = $('#file');
  fi.onchange = () => { addSvgFiles(fi.files); fi.value = ''; };
  d.ondragover = e => { e.preventDefault(); d.classList.add('over'); };
  d.ondragleave = () => d.classList.remove('over');
  d.ondrop = e => { e.preventDefault(); d.classList.remove('over'); addSvgFiles(e.dataTransfer.files); };
}

const byId = id => S.assets.find(a => a.id === id);
const colorById = id => S.colors.find(c => c.id === id);

document.addEventListener('click', async e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const act = el.dataset.act, id = el.dataset.id;
  if (el.tagName === 'INPUT' || el.tagName === 'SELECT') return;
  if (act === 'goto') { const n = +el.dataset.step; if (n > 1 && S.step === 1 && !validateStep1()) return; S.step = n; render(); window.scrollTo(0, 0); saveSoon(); }
  if (act === 'demo') await loadDemo();
  if (act === 'remove') { S.assets = S.assets.filter(a => a.id !== id); logos.delete(id); if (!S.assets.some(a => a.type === 'primary') && S.assets[0]) S.assets[0].type = 'primary'; rerenderKeep(); saveSoon(); }
  if (act === 'move') { const i = S.assets.findIndex(a => a.id === id), j = i + (+el.dataset.dir); [S.assets[i], S.assets[j]] = [S.assets[j], S.assets[i]]; rerenderKeep(); saveSoon(); }
  if (act === 'examples') $('#examples').showModal();
  if (act === 'cdup') { const c = colorById(id); if (S.colors.length < 24) { S.colors.splice(S.colors.indexOf(c) + 1, 0, { ...c, id: LK.uid(), name: c.name + ' 2', cmyk: [...c.cmyk] }); rerenderKeep(); saveSoon(); } }
  if (act === 'cdel') { S.colors = S.colors.filter(c => c.id !== id); rerenderKeep(); saveSoon(); }
  if (act === 'cadd') {
    const hex = LK.fixHex($('#newHex').value) || LK.fixHex($('#newPick').value);
    if (!hex) return toast('Ongeldige HEX-kleur.');
    S.colors.push(newColor($('#newName').value.trim() || LK.colorName(hex), hex)); rerenderKeep(); saveSoon();
  }
  if (act === 'previewGuide') previewGuide();
});

document.addEventListener('input', e => {
  const el = e.target, act = el.dataset.act, id = el.dataset.id; if (!act) return;
  if (act === 'brand') { S.brand = el.value; $('#summary').innerHTML = viewSummary(); saveSoon(); }
  if (act === 'customName') { byId(id).customName = el.value; saveSoon(); }
  if (act === 'cname') { colorById(id).name = el.value; saveSoon(); }
  if (act === 'cpick') { const c = colorById(id); c.hex = el.value.toUpperCase(); el.parentElement.style.background = c.hex; const hx = el.closest('.color').querySelector('[data-act=chex]'); hx.value = c.hex; saveSoon(); }
  if (act === 'cmyk') { const c = colorById(id); c.cmyk[+el.dataset.k] = Math.max(0, Math.min(100, +el.value || 0)); saveSoon(); }
  if (act === 'jpgMargin') { S.jpgMargin = +el.value; $('#mval').textContent = S.jpgMargin + '%'; saveSoon(); }
  if (act === 'iconPad') { S.icons[el.dataset.k] = +el.value; el.nextElementSibling.textContent = el.value + '%'; }
  if (act === 'customSize') { S.customSize = el.value; saveSoon(); }
});
document.addEventListener('change', async e => {
  const el = e.target, act = el.dataset.act, id = el.dataset.id; if (!act) return;
  const chk = el.checked;
  switch (act) {
    case 'type': {
      const a = byId(id), nt = el.value;
      if (a.type === 'primary' && nt !== 'primary' && !S.assets.some(x => x !== a && x.type === 'primary')) { toast('Er is altijd een primair logo nodig. Maak eerst een ander bestand primair.'); el.value = a.type; return; }
      if (nt === 'primary' || nt === 'primary-dark') S.assets.forEach(x => { if (x !== a && x.type === nt) { x.type = nt === 'primary' ? (a.type === 'primary-dark' ? 'primary-dark' : 'custom') : 'custom'; if (x.type === 'custom' && !x.customName) x.customName = x.fileName.replace(/\.svg$/i, ''); } });
      a.type = nt; if (nt === 'custom' && !a.customName) a.customName = a.fileName.replace(/\.svg$/i, '');
      break;
    }
    case 'customName': case 'cname': case 'brand': break;
    case 'chex': { const c = colorById(id), h = LK.fixHex(el.value); if (h) { c.hex = h; } else toast('Ongeldige HEX-kleur.'); break; }
    case 'cpick': break;
    case 'cauto': { const c = colorById(id); c.cmykAuto = !chk; if (chk) c.cmyk = LK.autoCmyk(c.hex); break; }
    case 'clogo': colorById(id).logo = chk; break;
    case 'cbg': colorById(id).bg = chk; break;
    case 'bw': S.bw = chk; break;
    case 'origs': S.otherOriginals = chk; break;
    case 'fmt': S.formats[el.dataset.k] = chk; break;
    case 'size': S.sizes[el.dataset.w] = chk; break;
    case 'customSize': S.customSize = el.value; break;
    case 'jpgWidth': S.jpgWidth = +el.value; break;
    case 'jpgMargin': break;
    case 'combo': S.combos[el.dataset.key] = chk; break;
    case 'guide': S.guide = chk; break;
    case 'guideLang': S.guideLang = el.value; break;
    case 'guideApps': S.guideApps = chk; break;
    case 'icons': S.icons.on = chk; break;
    case 'iconSource': S.icons.source = el.value; break;
    case 'iconArt': S.icons.art = el.value; break;
    case 'iconBg': S.icons.bg = el.value; break;
    case 'iconOpaque': S.icons.opaque = chk; break;
    case 'iconPad': break;
    case 'cmyk': break;
    case 'iconFile': {
      const file = el.files[0]; if (!file) return;
      try { const r = await LK.analyzeSvg(await file.text()); iconUpload = r.logo; } catch (err) { toast(err.message); }
      break;
    }
  }
  if (['customName', 'cname', 'cmyk', 'brand'].includes(act) && S.step !== 3) { $('#summary').innerHTML = viewSummary(); saveSoon(); return; }
  rerenderKeep(); saveSoon();
});

/* ---------- guide preview & generatie ---------- */
async function previewGuide() {
  if (!readyAssets().some(a => a.type === 'primary')) return toast('Een primair logo is nodig voor de guide.');
  const dlg = $('#guideDlg'), frame = $('#guideFrame');
  frame.removeAttribute('src'); $('#guideStatus').textContent = 'Guide wordt opgebouwd…'; dlg.showModal();
  try {
    const blob = await buildGuide(guideCtx(plan()));
    if (frame._url) URL.revokeObjectURL(frame._url);
    frame._url = URL.createObjectURL(blob); frame.src = frame._url; $('#guideStatus').textContent = '';
    $('#guideDownload').onclick = () => download(blob, `${brandFolder()}_Logo_Guide.pdf`);
  } catch (err) { console.error(err); $('#guideStatus').textContent = 'Er ging iets mis: ' + err.message; }
}

function download(blob, name) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 60000);
}

async function generate() {
  if (!validateStep1()) { S.step = 1; render(); return; }
  if (S.colors.length > 24) return toast('Beperk de merkkleuren tot 24.');
  const files = plan();
  if (!files.length) return toast('Kies een exportformaat, de logoguide of favicons & app-iconen.');
  const dlg = $('#genDlg'), bar = $('#genBar'), st = $('#genStatus'), done = $('#genDone');
  done.hidden = true; $('#genWarn').textContent = ''; dlg.showModal();
  const zip = new JSZip(), warnings = [];
  const total = files.reduce((s, f) => s + (f.heavy ? Math.max(1, (f.heavy / 1024) ** 1.6) : 0.15), 0);
  let prog = 0;
  for (const f of files) {
    st.textContent = f.path.split('/').pop();
    try { const data = await f.make(); zip.file(f.path, data, { compression: f.store ? 'STORE' : 'DEFLATE' }); }
    catch (err) { console.warn(f.path, err); warnings.push(`${f.path.split('/').pop()}: ${err.message}`); }
    prog += f.heavy ? Math.max(1, (f.heavy / 1024) ** 1.6) : 0.15;
    bar.style.width = (prog / total * 85).toFixed(1) + '%';
    await LK.tick();
  }
  st.textContent = 'ZIP wordt samengesteld…';
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } }, m => { bar.style.width = (85 + m.percent * 0.15).toFixed(1) + '%'; });
  const name = `${brandFolder()}_Logo_Asset_Pack.zip`;
  download(blob, name);
  bar.style.width = '100%';
  st.textContent = `${name} · ${files.length - warnings.length} bestanden · ${(blob.size / 1048576).toFixed(1)} MB`;
  if (warnings.length) $('#genWarn').textContent = `${warnings.length} bestand(en) overgeslagen:\n` + warnings.slice(0, 6).join('\n');
  done.hidden = false;
  $('#genAgain').onclick = () => download(blob, name);
}

/* ---------- start ---------- */
$('#next').onclick = () => {
  if (S.step === 1 && !validateStep1()) return;
  if (S.step < 3) { S.step++; render(); window.scrollTo(0, 0); saveSoon(); } else generate();
};
$('#back').onclick = () => { if (S.step > 1) { S.step--; render(); window.scrollTo(0, 0); saveSoon(); } };
$('#newPack').onclick = () => { if (S.assets.length && !confirm('Een nieuw pakket starten? Je huidige concept wordt gewist.')) return; S = defaults(); logos.clear(); iconUpload = null; try { localStorage.removeItem(STORE_KEY); } catch (e) { } render(); };

(async function init() {
  let data = null;
  try { data = JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch (e) { }
  if (data) {
    const d = defaults();
    S = { ...d, ...data, formats: { ...d.formats, ...data.formats }, sizes: { ...d.sizes, ...data.sizes }, icons: { ...d.icons, ...data.icons }, assets: [] };
    if (S.icons.source === 'upload') S.icons.source = '';
    // een opgeslagen concept is invoer: valideer alles wat later in markup of bestanden terechtkomt
    const num = (v, lo, hi, def) => Number.isFinite(+v) ? Math.min(hi, Math.max(lo, +v)) : def;
    S.step = num(S.step, 1, 3, 1); S.brand = String(S.brand || '').slice(0, 80);
    S.colors = (Array.isArray(S.colors) ? S.colors : []).slice(0, 24).map(c => { const hex = LK.fixHex(c && c.hex); return hex ? { id: LK.uid(), name: String(c.name || '').slice(0, 60), hex, cmykAuto: c.cmykAuto !== false, cmyk: Array.isArray(c.cmyk) && c.cmyk.length === 4 ? c.cmyk.map(v => num(v, 0, 100, 0)) : LK.autoCmyk(hex), logo: c.logo !== false, bg: c.bg !== false } : null; }).filter(Boolean);
    S.jpgWidth = [1024, 2048, 4096].includes(+S.jpgWidth) ? +S.jpgWidth : 2048; S.jpgMargin = num(S.jpgMargin, 0, 30, 10);
    S.customSize = /^\d{2,4}$/.test(String(S.customSize)) ? String(S.customSize) : ''; S.guideLang = S.guideLang === 'en' ? 'en' : 'nl';
    const I = S.icons; I.favPad = num(I.favPad, 0, 25, 4); I.appPad = num(I.appPad, 0, 35, 14); I.avatarPad = num(I.avatarPad, 0, 35, 20);
    if (!['original', '#000000', '#FFFFFF'].includes(I.art) && !S.colors.some(c => c.hex === I.art)) I.art = 'original';
    if (!['white', 'black'].includes(I.bg) && !S.colors.some(c => c.hex === I.bg)) I.bg = 'white';
    for (const a of data.assets || []) {
      try { const r = await LK.analyzeSvg(a.svg); logos.set(a.id, r); S.assets.push(a); } catch (e) { }
    }
    if (S.step > 1 && !readyAssets().some(a => a.type === 'primary')) S.step = 1;
  }
  render();
  if (data) setSaved('Concept hersteld');
})();

/* sluit-knoppen in dialogen (geen inline handlers vanwege de CSP) */
document.addEventListener('click', e => { const b = e.target.closest('[data-close]'); if (b) b.closest('dialog').close(); });
