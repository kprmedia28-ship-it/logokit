/* Logokit — PDF logoguide (A4 liggend, volledig vector via jsPDF). */
'use strict';

const GT = {
  en: {
    guidelines: 'Logo guidelines', version: 'Version 1.0',
    pages: ['Cover', 'Your logo package', 'Brand colors', 'Primary logo', 'Clear space', 'Color variations', 'Background usage', 'Incorrect usage', 'Additional logo versions', 'Brand applications', 'Tote bags', 'Drinkware', 'Business cards', 'Presentation folders', 'Apparel', 'Closing'],
    pkgIntro: 'This package contains every approved version of the {brand} logo, prepared for screen and print. Use the files exactly as supplied.',
    digital: 'Digital (RGB)', print: 'Print (CMYK)', digitalTxt: 'SVG, PNG, JPG and WebP for websites, apps, presentations and social media.', printTxt: 'EPS and PDF vector files in CMYK for printers, signage and merchandise.',
    folder: 'Folder structure', versions: 'versions',
    colorsIntro: 'Consistent color use makes the brand instantly recognizable. Use HEX and RGB on screen and CMYK in print.',
    primaryIntro: 'The primary logo is the main signature of {brand}. Use it whenever possible, preferably on a light, calm background.',
    primaryRules: ['Always use the supplied artwork files.', 'Keep the proportions locked when scaling.', 'Give the logo enough room to breathe.', 'Prefer the full-color version on light backgrounds.'],
    clearIntro: 'Clear space keeps the logo legible and gives it presence. Keep the area around the logo free of text, images and other graphic elements.',
    clearRule: 'The minimum clear space on every side is {pct}% of the logo width (marked as X).',
    minSize: 'Minimum size', minDigital: 'Digital: 120 px wide', minPrint: 'Print: 30 mm wide',
    varIntro: 'Each version is available in all approved brand colors. Choose the version with the best contrast for the background.',
    original: 'Original', black: 'Black', white: 'White',
    bgIntro: 'Place the logo only on backgrounds with sufficient contrast. The combinations marked as recommended are included as JPG files.',
    recommended: 'Recommended', avoid: 'Avoid',
    wrongIntro: 'The logo is a fixed piece of artwork. Never modify, redraw or decorate it.',
    wrong: ['Do not stretch or distort', 'Do not rotate', 'Do not change the colors', 'Do not add shadows or effects', 'Do not use outlines', 'Do not use low-contrast backgrounds'],
    addIntro: 'Alongside the primary logo, these versions are available for specific situations and formats.',
    appsTitle: 'Brand applications', appsIntro: 'Examples of how the {brand} logo comes to life on everyday touchpoints. Use them as inspiration for consistent, recognizable brand expressions.',
    toteTxt: 'Large, centered placement on a calm surface. Use the light or dark version depending on the fabric color.',
    drinkTxt: 'On curved surfaces, keep the logo compact and centered so it stays legible from every angle.',
    cardTxt: 'Use the logo with generous clear space. The back can carry the logo mark or a bold brand color.',
    folderTxt: 'Folders and stationery work best with the logo placed small and confident in a corner, or large on the cover.',
    apparelTxt: 'On clothing, place the logo on the chest or centered on the back. Check the contrast against the fabric color.',
    cardName: 'Alex Morgan', cardRole: 'Creative Director',
    thanks: 'Thank you', closeTxt: 'Questions about using the {brand} logo? Contact KPR Media before producing new materials.',
    madeWith: 'Made by KPR Media'
  },
  nl: {
    guidelines: 'Logorichtlijnen', version: 'Versie 1.0',
    pages: ['Cover', 'Je logopakket', 'Merkkleuren', 'Primair logo', 'Vrije ruimte', 'Kleurvarianten', 'Gebruik op achtergronden', 'Onjuist gebruik', 'Aanvullende logoversies', 'Merktoepassingen', 'Tassen', 'Drinkwaar', 'Visitekaartjes', 'Presentatiemappen', 'Kleding', 'Afsluiting'],
    pkgIntro: 'Dit pakket bevat alle goedgekeurde versies van het {brand}-logo, voorbereid voor scherm en druk. Gebruik de bestanden precies zoals aangeleverd.',
    digital: 'Digitaal (RGB)', print: 'Druk (CMYK)', digitalTxt: 'SVG, PNG, JPG en WebP voor websites, apps, presentaties en social media.', printTxt: 'EPS- en PDF-vectorbestanden in CMYK voor drukkers, signing en merchandise.',
    folder: 'Mappenstructuur', versions: 'versies',
    colorsIntro: 'Consistent kleurgebruik maakt het merk direct herkenbaar. Gebruik HEX en RGB op schermen en CMYK in drukwerk.',
    primaryIntro: 'Het primaire logo is de belangrijkste handtekening van {brand}. Gebruik het waar mogelijk, bij voorkeur op een lichte, rustige achtergrond.',
    primaryRules: ['Gebruik altijd de aangeleverde bestanden.', 'Behoud de verhoudingen bij het schalen.', 'Geef het logo voldoende ademruimte.', 'Kies op lichte achtergronden de full-color versie.'],
    clearIntro: 'Vrije ruimte houdt het logo leesbaar en geeft het uitstraling. Houd het gebied rond het logo vrij van tekst, beeld en andere grafische elementen.',
    clearRule: 'De minimale vrije ruimte aan elke kant is {pct}% van de logobreedte (aangegeven als X).',
    minSize: 'Minimale grootte', minDigital: 'Digitaal: 120 px breed', minPrint: 'Druk: 30 mm breed',
    varIntro: 'Elke versie is beschikbaar in alle goedgekeurde merkkleuren. Kies de versie met het beste contrast voor de achtergrond.',
    original: 'Origineel', black: 'Zwart', white: 'Wit',
    bgIntro: 'Plaats het logo alleen op achtergronden met voldoende contrast. De aanbevolen combinaties zijn als JPG-bestanden meegeleverd.',
    recommended: 'Aanbevolen', avoid: 'Vermijden',
    wrongIntro: 'Het logo is een vast beeldmerk. Pas het nooit aan, teken het niet na en voeg geen decoratie toe.',
    wrong: ['Niet uitrekken of vervormen', 'Niet draaien', 'Kleuren niet aanpassen', 'Geen schaduwen of effecten', 'Geen contourlijnen gebruiken', 'Geen achtergronden met weinig contrast'],
    addIntro: 'Naast het primaire logo zijn deze versies beschikbaar voor specifieke situaties en formaten.',
    appsTitle: 'Merktoepassingen', appsIntro: 'Voorbeelden van hoe het {brand}-logo tot leven komt op alledaagse contactmomenten. Gebruik ze als inspiratie voor consistente, herkenbare merkuitingen.',
    toteTxt: 'Groot en gecentreerd op een rustig vlak. Kies de lichte of donkere versie afhankelijk van de stofkleur.',
    drinkTxt: 'Houd het logo op gebogen oppervlakken compact en gecentreerd, zodat het vanuit elke hoek leesbaar blijft.',
    cardTxt: 'Gebruik het logo met royale vrije ruimte. De achterkant kan het beeldmerk of een krachtige merkkleur dragen.',
    folderTxt: 'Mappen en briefpapier werken het best met het logo klein en zelfverzekerd in een hoek, of groot op de voorkant.',
    apparelTxt: 'Plaats het logo op kleding op de borst of gecentreerd op de rug. Controleer het contrast met de stofkleur.',
    cardName: 'Sam de Vries', cardRole: 'Creatief directeur',
    thanks: 'Dank je wel', closeTxt: 'Vragen over het gebruik van het {brand}-logo? Neem contact op met KPR Media voordat je nieuwe materialen produceert.',
    madeWith: 'Gemaakt door KPR Media'
  }
};

window.buildGuide = async function buildGuide(ctx) {
  const { jsPDF } = window.jspdf;
  const L = GT[ctx.lang] || GT.en;
  const tr = s => s.replace(/\{brand\}/g, ctx.brand).replace(/\{pct\}/g, ctx.clearPct);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4', compress: true });
  const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), M = 48;
  doc.setProperties({ title: `${ctx.brand} — ${L.guidelines}`, creator: 'Logokit' });
  // Silka als huisletter; zonder fontbestand valt de guide terug op Helvetica
  let FONT = 'helvetica';
  if (window.SILKA_TTF) {
    try { doc.addFileToVFS('Silka-Regular.ttf', window.SILKA_TTF); doc.addFont('Silka-Regular.ttf', 'Silka', 'normal'); FONT = 'Silka'; } catch (e) { console.warn('Silka niet geladen', e); }
  }

  const ink = ctx.ink, accent = ctx.accent, paper = '#FFFFFF', soft = '#F3F3F1', grey = '#6B6B6B', line = '#E2E2DE';
  const primary = ctx.primary.logo;

  /* --- tekenhulpen --- */
  const text = (s, x, y, o = {}) => {
    const size = o.size || 10, color = o.color || ink;
    doc.setFont(FONT, FONT === 'Silka' || !o.bold ? 'normal' : 'bold'); doc.setFontSize(size); doc.setTextColor(color);
    const lines = o.maxW ? doc.splitTextToSize(String(s), o.maxW) : String(s);
    // Silka heeft alleen Regular: vet wordt opgebouwd met een dunne contour in dezelfde kleur
    const fauxBold = o.bold && FONT === 'Silka';
    if (fauxBold) { doc.setDrawColor(color); doc.setLineWidth(size * 0.035); }
    doc.text(lines, x, y, { align: o.align || 'left', lineHeightFactor: o.lh || 1.35, baseline: 'top', renderingMode: fauxBold ? 'fillThenStroke' : 'fill' });
    return (Array.isArray(lines) ? lines.length : 1) * (o.size || 10) * (o.lh || 1.35);
  };
  const rect = (x, y, w, h, fill, r = 0) => { doc.setFillColor(fill); r ? doc.roundedRect(x, y, w, h, r, r, 'F') : doc.rect(x, y, w, h, 'F'); };
  const strokeRect = (x, y, w, h, color, r = 0, lw = 0.6) => { doc.setDrawColor(color); doc.setLineWidth(lw); r ? doc.roundedRect(x, y, w, h, r, r, 'S') : doc.rect(x, y, w, h, 'S'); };
  const drawLogo = (logo, x, y, w, h, o = {}) => {
    let sx, sy;
    if (o.stretch) { sx = w / logo.w; sy = h / logo.h; } else { sx = sy = Math.min(w / logo.w, h / logo.h); }
    const ox = x + (w - logo.w * sx) / 2, oy = y + (h - logo.h * sy) / 2;
    const rot = (o.rotate || 0) * Math.PI / 180, cos = Math.cos(rot), sin = Math.sin(rot), cx = logo.w / 2, cy = logo.h / 2;
    const tf = (px, py) => { const dx = px - cx, dy = py - cy; return [ox + (dx * cos - dy * sin + cx) * sx, oy + (dx * sin + dy * cos + cy) * sy]; };
    logo.paths.forEach((p, k) => {
      const ops = [];
      for (const g of p.segs) {
        if (g[0] === 'M') ops.push({ op: 'm', c: tf(g[1], g[2]) });
        else if (g[0] === 'L') ops.push({ op: 'l', c: tf(g[1], g[2]) });
        else if (g[0] === 'C') ops.push({ op: 'c', c: [...tf(g[1], g[2]), ...tf(g[3], g[4]), ...tf(g[5], g[6])] });
        else ops.push({ op: 'h', c: [] });
      }
      if (!ops.length) return;
      if (o.stroke) { doc.setDrawColor(o.stroke); doc.setLineWidth(o.lw || 0.8); doc.path(ops); doc.stroke(); return; }
      const fill = o.fills ? o.fills[k % o.fills.length] : (o.fill || p.fill);
      doc.setFillColor(fill); doc.path(ops);
      if (p.rule === 'evenodd') doc.fillEvenOdd(); else doc.fill();
    });
    return { x: ox, y: oy, w: logo.w * sx, h: logo.h * sy };
  };
  // kies de beste logoversie voor een achtergrond
  const logoOn = (bg, asset = ctx.primary) => {
    const ok = cols => Math.min(...cols.map(c => LK.contrast(c, bg))) >= LK.MIN_CONTRAST;
    if (ok(asset.logo.colors)) return { logo: asset.logo };
    if (asset === ctx.primary && ctx.dark && ok(ctx.dark.logo.colors)) return { logo: ctx.dark.logo };
    // voorkeur: een merkkleur met goed contrast, dan wit, dan zwart
    const brand = ctx.logoColors.filter(c => LK.contrast(c, bg) >= 4.5).sort((a, b) => LK.contrast(b, bg) - LK.contrast(a, bg))[0];
    const best = brand || (LK.contrast('#FFFFFF', bg) >= 3 ? '#FFFFFF' : '#000000');
    return { logo: asset.logo, fill: best };
  };
  const checkIcon = (x, y, ok) => {
    doc.setFillColor(ok ? '#1F9D55' : '#D92D20'); doc.circle(x, y, 7, 'F');
    doc.setDrawColor('#FFFFFF'); doc.setLineWidth(1.6);
    if (ok) { doc.lines([[2.5, 2.8], [5, -5.6]], x - 3.6, y + 0.2); }
    else { doc.line(x - 2.8, y - 2.8, x + 2.8, y + 2.8); doc.line(x + 2.8, y - 2.8, x - 2.8, y + 2.8); }
  };

  let pageNo = 0;
  const pageTitles = L.pages;
  const newPage = (idx, opts = {}) => {
    if (pageNo > 0) doc.addPage();
    pageNo++;
    rect(0, 0, W, H, opts.bg || paper);
    if (!opts.bare) {
      const c = opts.dark ? '#FFFFFF' : grey;
      text(ctx.brand.toUpperCase(), M, 26, { size: 7.5, bold: true, color: c });
      text(`${LK.pad(idx)} — ${pageTitles[idx - 1].toUpperCase()}`, W - M, 26, { size: 7.5, bold: true, color: c, align: 'right' });
      text(String(pageNo), W - M, H - 30, { size: 7.5, color: c, align: 'right' });
      text(L.guidelines, M, H - 30, { size: 7.5, color: c });
    }
  };
  const heading = (s, intro, o = {}) => {
    const y0 = o.y || 70, w = o.w || 330;
    let size = 28; doc.setFont(FONT, FONT === 'Silka' ? 'normal' : 'bold');
    // verklein tot het langste woord past (lange samenstellingen breken anders midden in het woord)
    const longest = s.split(/\s+/).sort((a, b) => b.length - a.length)[0];
    while (size > 16 && doc.setFontSize(size).getTextWidth(longest) > w) size -= 1;
    const th = text(s, M, y0, { size, bold: true, color: o.color || ink, maxW: w, lh: 1.1 });
    if (intro) text(intro, M, y0 + th + 14, { size: 10.5, color: o.introColor || grey, maxW: w, lh: 1.5 });
  };

  /* 1 — Cover */
  newPage(1, { bare: true, bg: soft });
  drawLogo(primary, M + 60, 120, W - 2 * M - 120, 220);
  rect(0, H - 150, W, 150, accent);
  const coverTxt = LK.lum(accent) > 0.45 ? ink : '#FFFFFF';
  text(L.guidelines, M, H - 118, { size: 34, bold: true, color: coverTxt });
  text(`${ctx.brand}  ·  ${L.version}  ·  ${ctx.date}`, M, H - 70, { size: 10, color: coverTxt });

  /* 2 — Logo package */
  newPage(2);
  heading(pageTitles[1], tr(L.pkgIntro));
  {
    let y = 210;
    [[L.digital, L.digitalTxt], [L.print, L.printTxt]].forEach(([h, t]) => {
      text(h, M, y, { size: 11, bold: true }); y += 17;
      y += text(t, M, y, { size: 9.5, color: grey, maxW: 280, lh: 1.45 }) + 16;
    });
    const gx = 400, gw = W - gx - M, n = Math.min(ctx.assets.length, 8), cols = n > 4 ? 4 : Math.max(2, n), cw = (gw - (cols - 1) * 12) / cols, ch = 118;
    ctx.assets.slice(0, 8).forEach((a, k) => {
      const x = gx + (k % cols) * (cw + 12), y2 = 70 + Math.floor(k / cols) * (ch + 34);
      const bg = a.type === 'primary-dark' ? ink : soft;
      rect(x, y2, cw, ch, bg, 6);
      const ld = a.type === 'primary-dark' ? { logo: a.logo } : logoOn(bg, a);
      drawLogo(ld.logo, x + 16, y2 + 16, cw - 32, ch - 32, { fill: ld.fill });
      text(a.name, x, y2 + ch + 7, { size: 8.5, bold: true, maxW: cw });
      text(`${a.variantCount} ${L.versions}`, x, y2 + ch + 19, { size: 7.5, color: grey });
    });
    // mappen
    const ty = 70 + Math.ceil(n / cols) * (ch + 34) + 6;
    if (ty < H - 120) {
      text(L.folder, gx, ty, { size: 9, bold: true });
      const lines = ctx.tree.slice(0, Math.floor((H - 70 - ty - 18) / 11));
      doc.setFont('courier', 'normal'); doc.setFontSize(7.5); doc.setTextColor(grey);
      doc.text(lines, gx, ty + 16, { baseline: 'top', lineHeightFactor: 1.45 });
    }
  }

  /* 3 — Brand colors */
  newPage(3);
  heading(pageTitles[2], L.colorsIntro, { w: 520 });
  {
    const cols = ctx.colors.length > 6 ? Math.min(8, ctx.colors.length) : Math.max(3, ctx.colors.length);
    const per = Math.min(cols, 8), gw = W - 2 * M, cw = (gw - (per - 1) * 12) / per;
    const rows = Math.ceil(ctx.colors.length / per), sh = rows > 1 ? 120 : 210;
    ctx.colors.forEach((c, k) => {
      const x = M + (k % per) * (cw + 12), y = 190 + Math.floor(k / per) * (sh + 92);
      rect(x, y, cw, sh, c.hex, 6);
      if (LK.contrast(c.hex, '#FFFFFF') < 1.25) strokeRect(x, y, cw, sh, line, 6);
      const [r, g, b] = LK.hexToRgb(c.hex), cm = c.cmyk;
      text(c.name, x, y + sh + 10, { size: 10, bold: true, maxW: cw });
      text(`HEX  ${c.hex}\nRGB  ${r} ${g} ${b}\nCMYK  ${cm.join(' ')}`, x, y + sh + 27, { size: 8, color: grey, lh: 1.5 });
    });
  }

  /* 4 — Primary logo */
  newPage(4);
  heading(pageTitles[3], tr(L.primaryIntro), { w: 250 });
  {
    let y = 230;
    L.primaryRules.forEach(r => { rect(M, y + 4, 4, 4, accent); y += text(r, M + 14, y, { size: 9.5, maxW: 230 }) + 8; });
    const px = 330, pw = W - px - M;
    rect(px, 70, pw, H - 140, soft, 8);
    drawLogo(primary, px + 50, 110, pw - 100, H - 220);
  }

  /* 5 — Clear space */
  newPage(5);
  heading(pageTitles[4], L.clearIntro, { w: 250 });
  {
    text(tr(L.clearRule), M, 240, { size: 9.5, maxW: 240, lh: 1.5 });
    text(L.minSize, M, 320, { size: 11, bold: true });
    text(`${L.minDigital}\n${L.minPrint}`, M, 338, { size: 9.5, color: grey, lh: 1.6 });
    const px = 330, pw = W - px - M, ph = H - 140;
    rect(px, 70, pw, ph, soft, 8);
    const pct = ctx.clearPct / 100;
    const maxW = Math.min((pw - 80) / (1 + 2 * pct), ((ph - 80) / (1 + 2 * pct * primary.w / primary.h)) * primary.w / primary.h);
    const lw = maxW, lh = lw * primary.h / primary.w, cs = lw * pct;
    const lx = px + (pw - lw) / 2, ly = 70 + (ph - lh) / 2;
    rect(lx - cs, ly - cs, lw + 2 * cs, lh + 2 * cs, '#FFFFFF');
    doc.setLineDashPattern([4, 3], 0); strokeRect(lx - cs, ly - cs, lw + 2 * cs, lh + 2 * cs, accent, 0, 0.8); strokeRect(lx, ly, lw, lh, '#B8B8B2', 0, 0.5); doc.setLineDashPattern([], 0);
    drawLogo(primary, lx, ly, lw, lh);
    if (cs > 8) {
      doc.setFillColor(accent);
      [[lx - cs, ly + lh / 2 - 7, cs, 14], [lx + lw, ly + lh / 2 - 7, cs, 14]].forEach(([x, y, w, h]) => { doc.setGState(new doc.GState({ opacity: 0.18 })); rect(x, y, w, h, accent); doc.setGState(new doc.GState({ opacity: 1 })); text('X', x + w / 2, y + 2.5, { size: 8, bold: true, color: accent, align: 'center' }); });
      [[lx + lw / 2 - 7, ly - cs, 14, cs], [lx + lw / 2 - 7, ly + lh, 14, cs]].forEach(([x, y, w, h]) => { doc.setGState(new doc.GState({ opacity: 0.18 })); rect(x, y, w, h, accent); doc.setGState(new doc.GState({ opacity: 1 })); text('X', x + w / 2, y + h / 2 - 4, { size: 8, bold: true, color: accent, align: 'center' }); });
    }
  }

  /* 6 — Color variations */
  newPage(6);
  heading(pageTitles[5], L.varIntro, { w: 600 });
  {
    const vs = ctx.primaryVariants;
    const per = vs.length <= 4 ? vs.length : Math.ceil(vs.length / 2), rows = Math.ceil(vs.length / per);
    const gw = W - 2 * M, cw = (gw - (per - 1) * 12) / per, ch = rows > 1 ? 130 : 220;
    vs.forEach((v, k) => {
      const x = M + (k % per) * (cw + 12), y = 175 + Math.floor(k / per) * (ch + 32);
      const fills = v.fill ? [v.fill] : primary.colors;
      const bgs = ['#FFFFFF', soft, ...ctx.bgColors, '#000000', ink].filter(b => !v.fill || b.toUpperCase() !== v.fill.toUpperCase());
      const bg = bgs.sort((a, b) => Math.min(...fills.map(f => LK.contrast(f, b))) > Math.min(...fills.map(f => LK.contrast(f, a))) ? 1 : -1)[0];
      const bgUse = v.fill ? bg : soft;
      rect(x, y, cw, ch, bgUse, 6);
      if (bgUse === '#FFFFFF') strokeRect(x, y, cw, ch, line, 6);
      drawLogo(primary, x + cw * 0.14, y + ch * 0.2, cw * 0.72, ch * 0.6, { fill: v.fill });
      text(v.label, x, y + ch + 8, { size: 8.5, bold: true });
    });
  }

  /* 7 — Background usage */
  newPage(7);
  heading(pageTitles[6], L.bgIntro, { w: 600 });
  {
    const combos = ctx.bgCombos; // {fill,bg,ok}
    const good = combos.filter(c => c.ok).slice(0, 6), bad = combos.filter(c => !c.ok).slice(0, 6);
    const row = (list, y, label) => {
      text(label.toUpperCase(), M, y, { size: 8, bold: true, color: grey });
      const per = 6, cw = (W - 2 * M - 5 * 10) / per, ch = 92;
      list.forEach((c, k) => {
        const x = M + k * (cw + 10);
        rect(x, y + 16, cw, ch, c.bg, 5);
        if (LK.contrast(c.bg, '#FFFFFF') < 1.2) strokeRect(x, y + 16, cw, ch, line, 5);
        drawLogo(c.logo || primary, x + 14, y + 36, cw - 28, ch - 40, { fill: c.fill });
        checkIcon(x + cw - 12, y + 28, c.ok);
      });
    };
    row(good, 170, L.recommended);
    if (bad.length) row(bad, 320, L.avoid);
  }

  /* 8 — Incorrect usage */
  newPage(8);
  heading(pageTitles[7], L.wrongIntro, { w: 600 });
  {
    const per = 3, gw = W - 2 * M, cw = (gw - 2 * 14) / per, ch = 118;
    const main = primary.colors[0] || ink;
    const lighten = (hex, t) => '#' + LK.hexToRgb(hex).map(v => Math.round(v + (255 - v) * t).toString(16).padStart(2, '0')).join('');
    L.wrong.forEach((label, k) => {
      const x = M + (k % per) * (cw + 14), y = 160 + Math.floor(k / per) * (ch + 42);
      const bg = k === 5 ? lighten(main, 0.35) : soft;
      rect(x, y, cw, ch, bg, 6);
      const bx = x + cw * 0.18, by = y + ch * 0.22, bw = cw * 0.64, bh = ch * 0.56;
      if (k === 0) drawLogo(primary, bx + bw * 0.12, by - 8, bw * 0.76, bh + 16, { stretch: true });
      if (k === 1) drawLogo(primary, bx, by, bw, bh, { rotate: -14 });
      if (k === 2) drawLogo(primary, bx, by, bw, bh, { fills: ['#7ED957', '#C13CFF', '#00B7EB'] });
      if (k === 3) { drawLogo(primary, bx + 3, by + 4, bw, bh, { fill: '#BDBDB8' }); drawLogo(primary, bx, by, bw, bh); }
      if (k === 4) drawLogo(primary, bx, by, bw, bh, { stroke: ink, lw: 0.7 });
      if (k === 5) drawLogo(primary, bx, by, bw, bh, { fill: lighten(main, 0.12) });
      checkIcon(x + cw - 14, y + 14, false);
      text(label, x, y + ch + 8, { size: 8.5, bold: true, maxW: cw });
    });
  }

  /* 9 — Additional logo versions */
  newPage(9);
  heading(pageTitles[8], L.addIntro, { w: 600 });
  {
    const extra = ctx.assets.filter(a => a.type !== 'primary');
    const list = extra.length ? extra : [ctx.primary];
    const per = Math.min(Math.max(list.length, 2), 4), gw = W - 2 * M, cw = (gw - (per - 1) * 14) / per, ch = list.length > 4 ? 130 : 230;
    list.slice(0, 8).forEach((a, k) => {
      const x = M + (k % per) * (cw + 14), y = 165 + Math.floor(k / per) * (ch + 36);
      const bg = a.type === 'primary-dark' ? ink : soft;
      rect(x, y, cw, ch, bg, 6);
      const ld = a.type === 'primary-dark' ? { logo: a.logo } : logoOn(bg, a);
      drawLogo(ld.logo, x + cw * 0.15, y + ch * 0.18, cw * 0.7, ch * 0.64, { fill: ld.fill });
      text(a.name, x, y + ch + 8, { size: 9, bold: true });
    });
  }

  if (ctx.apps) {
    const mark = (ctx.assets.find(a => a.type === 'mark' || a.type === 'monogram') || ctx.primary).logo;
    const accTxt = LK.lum(accent) > 0.45 ? ink : '#FFFFFF';
    const logoOnFill = (bg) => logoOn(bg);
    const appPage = (idx, txt, draw) => {
      newPage(idx);
      heading(pageTitles[idx - 1], txt, { w: 220 });
      rect(300, 60, W - 300 - M, H - 120, soft, 8);
      draw(300, 60, W - 300 - M, H - 120);
    };

    /* 10 — Brand applications */
    newPage(10, { bg: accent, dark: accTxt === '#FFFFFF' });
    text(L.appsTitle, M, 150, { size: 44, bold: true, color: accTxt, maxW: 460, lh: 1.05 });
    text(tr(L.appsIntro), M, 270, { size: 12, color: accTxt, maxW: 380, lh: 1.5 });
    { const ld = logoOnFill(accent); drawLogo(ld.logo, W - M - 280, 150, 260, 260, { fill: ld.fill || (LK.contrast(accent, '#FFFFFF') > 2.4 ? '#FFFFFF' : ink) }); }

    /* 11 — Tote bags */
    appPage(11, L.toteTxt, (x, y, w, h) => {
      const bag = (bx, by, bw, bh, color) => {
        doc.setDrawColor(color); doc.setLineWidth(9);
        doc.path([{ op: 'm', c: [bx + bw * 0.28, by + 4] }, { op: 'c', c: [bx + bw * 0.28, by - bh * 0.42, bx + bw * 0.72, by - bh * 0.42, bx + bw * 0.72, by + 4] }]); doc.stroke();
        doc.setFillColor(color);
        doc.path([{ op: 'm', c: [bx, by] }, { op: 'l', c: [bx + bw, by] }, { op: 'l', c: [bx + bw * 1.03, by + bh] }, { op: 'l', c: [bx - bw * 0.03, by + bh] }, { op: 'h', c: [] }]); doc.fill();
        const ld = logoOn(color); drawLogo(ld.logo, bx + bw * 0.18, by + bh * 0.3, bw * 0.64, bh * 0.4, { fill: ld.fill });
      };
      const bw = w * 0.3, bh = bw * 1.15;
      bag(x + w * 0.12, y + h * 0.3, bw, bh, ctx.light);
      bag(x + w * 0.56, y + h * 0.3, bw, bh, accent);
    });

    /* 12 — Drinkware */
    appPage(12, L.drinkTxt, (x, y, w, h) => {
      // mok
      const mx = x + w * 0.1, my = y + h * 0.32, mw = w * 0.32, mh = mw * 1.05;
      doc.setDrawColor(ctx.light === '#FFFFFF' ? '#E4E4E0' : ctx.light); doc.setLineWidth(14); doc.circle(mx + mw, my + mh * 0.48, mh * 0.22, 'S');
      rect(mx, my, mw, mh, ctx.light === '#FFFFFF' ? '#FFFFFF' : ctx.light, 14);
      { const ld = logoOn(ctx.light); drawLogo(ld.logo, mx + mw * 0.15, my + mh * 0.3, mw * 0.7, mh * 0.4, { fill: ld.fill }); }
      // fles
      const bx = x + w * 0.62, by = y + h * 0.14, bw = w * 0.2, bh = h * 0.74;
      rect(bx + bw * 0.3, by, bw * 0.4, bh * 0.08, '#2B2B2B', 3);
      rect(bx + bw * 0.2, by + bh * 0.07, bw * 0.6, bh * 0.07, ink, 4);
      rect(bx, by + bh * 0.12, bw, bh * 0.88, accent, bw * 0.3);
      { const ld = logoOn(accent, ctx.assets.find(a => a.logo === mark) || ctx.primary); drawLogo(ld.logo, bx + bw * 0.18, by + bh * 0.42, bw * 0.64, bh * 0.3, { fill: ld.fill }); }
    });

    /* 13 — Business cards */
    appPage(13, L.cardTxt, (x, y, w, h) => {
      const cw = w * 0.4, ch = cw * 0.6;
      const c1x = x + w * 0.07, c1y = y + h * 0.18, c2x = x + w * 0.53, c2y = y + h * 0.46;
      rect(c1x + 4, c1y + 6, cw, ch, '#D9D9D4', 4); rect(c1x, c1y, cw, ch, accent, 4);
      { const ld = logoOn(accent, ctx.assets.find(a => a.logo === mark) || ctx.primary); drawLogo(ld.logo, c1x + cw * 0.3, c1y + ch * 0.25, cw * 0.4, ch * 0.5, { fill: ld.fill }); }
      rect(c2x + 4, c2y + 6, cw, ch, '#D9D9D4', 4); rect(c2x, c2y, cw, ch, '#FFFFFF', 4);
      drawLogo(primary, c2x + 16, c2y + 16, cw * 0.45, ch * 0.22);
      text(L.cardName, c2x + 16, c2y + ch - 52, { size: 8.5, bold: true });
      text(`${L.cardRole}\nhello@${LK.slug(ctx.brand) || 'brand'}.com`, c2x + 16, c2y + ch - 39, { size: 7, color: grey, lh: 1.45 });
      rect(c2x + cw - 6, c2y, 6, ch, accent);
    });

    /* 14 — Presentation folders */
    appPage(14, L.folderTxt, (x, y, w, h) => {
      const fw = w * 0.36, fh = fw * 1.3;
      const f1x = x + w * 0.1, f1y = y + (h - fh) / 2, f2x = x + w * 0.54, f2y = f1y + 18;
      rect(f1x + 5, f1y + 7, fw, fh, '#D9D9D4', 3); rect(f1x, f1y, fw, fh, ink, 3);
      { const ld = logoOn(ink); drawLogo(ld.logo, f1x + fw * 0.15, f1y + fh * 0.36, fw * 0.7, fh * 0.28, { fill: ld.fill }); }
      rect(f2x + 5, f2y + 7, fw, fh, '#D9D9D4', 3); rect(f2x, f2y, fw, fh, '#FFFFFF', 3);
      rect(f2x, f2y + fh * 0.72, fw, fh * 0.28, accent);
      drawLogo(primary, f2x + 18, f2y + 20, fw * 0.42, fh * 0.1);
    });

    /* 15 — Apparel */
    appPage(15, L.apparelTxt, (x, y, w, h) => {
      const shirt = (sx, sy, s, color) => {
        const P = [[0.32, 0], [0.42, 0.05], [0.58, 0.05], [0.68, 0], [1, 0.16], [0.9, 0.36], [0.78, 0.3], [0.78, 1], [0.22, 1], [0.22, 0.3], [0.1, 0.36], [0, 0.16]];
        const ops = P.map((p, k) => ({ op: k ? 'l' : 'm', c: [sx + p[0] * s, sy + p[1] * s] })); ops.push({ op: 'h', c: [] });
        doc.setFillColor(color); doc.path(ops); doc.fill();
        if (LK.contrast(color, soft) < 1.2) { doc.setDrawColor('#CFCFCA'); doc.setLineWidth(0.8); doc.path(ops); doc.stroke(); }
        const ld = logoOn(color); drawLogo(ld.logo, sx + s * 0.32, sy + s * 0.22, s * 0.36, s * 0.22, { fill: ld.fill });
      };
      const s = Math.min(w * 0.4, h * 0.75);
      shirt(x + w * 0.06, y + (h - s) / 2, s, ink);
      shirt(x + w * 0.52, y + (h - s) / 2, s, ctx.light === soft ? '#FFFFFF' : ctx.light);
    });
  }

  /* 16 — Closing */
  newPage(16, { bare: true, bg: ink });
  {
    const ld = logoOn(ink);
    drawLogo(ld.logo, W / 2 - 160, 150, 320, 150, { fill: ld.fill });
    text(L.thanks, W / 2, 350, { size: 30, bold: true, color: '#FFFFFF', align: 'center' });
    text(tr(L.closeTxt), W / 2, 395, { size: 11, color: '#C9C9C9', align: 'center', maxW: 420, lh: 1.5 });
    text(L.madeWith, W / 2, H - 40, { size: 7.5, color: '#8A8A8A', align: 'center' });
  }

  return doc.output('blob');
};
