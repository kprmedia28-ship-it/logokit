/* Logokit — fotorealistische mockups.
   Het logo wordt op blanco productfoto's gezet: met perspectief (kaartjes), cilinderkromming (mok)
   en de licht/schaduw en stofstructuur van de foto door het logo heen, zodat het eruitziet als bedrukt. */
'use strict';

(() => {
  const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('mockupfoto kon niet laden')); i.src = src; });

  // eenheidsvierkant -> vierhoek (TL, TR, BR, BL), projectief (Heckbert)
  function squareToQuad(q) {
    const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
    const sx = x0 - x1 + x2 - x3, sy = y0 - y1 + y2 - y3;
    let a, b, c, d, e, f, g = 0, h = 0;
    if (Math.abs(sx) < 1e-9 && Math.abs(sy) < 1e-9) {
      a = x1 - x0; b = x3 - x0; c = x0; d = y1 - y0; e = y3 - y0; f = y0;
    } else {
      const dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2, den = dx1 * dy2 - dx2 * dy1;
      g = (sx * dy2 - dx2 * sy) / den; h = (dx1 * sy - sx * dy1) / den;
      a = x1 - x0 + g * x1; b = x3 - x0 + h * x3; c = x0; d = y1 - y0 + g * y1; e = y3 - y0 + h * y3; f = y0;
    }
    return [a, b, c, d, e, f, g, h, 1];
  }
  const apply = (m, u, v) => { const w = m[6] * u + m[7] * v + m[8]; return [(m[0] * u + m[1] * v + m[2]) / w, (m[3] * u + m[4] * v + m[5]) / w]; };
  function invert(m) {
    const [a, b, c, d, e, f, g, h, i] = m;
    const A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g, det = a * A + b * B + c * C;
    return [A, -(b * i - c * h), b * f - c * e, B, a * i - c * g, -(a * f - c * d), C, -(a * h - b * g), a * e - b * d].map(v => v / det);
  }
  // deelrechthoek (u0,v0)-(u1,v1) binnen een vierhoek -> nieuwe vierhoek
  const subQuad = (q, u0, v0, u1, v1) => { const m = squareToQuad(q); return [apply(m, u0, v0), apply(m, u1, v0), apply(m, u1, v1), apply(m, u0, v1)]; };

  function logoCanvas(logo, fill, w) {
    const h = w * logo.h / logo.w, cv = document.createElement('canvas');
    cv.width = Math.ceil(w); cv.height = Math.ceil(h);
    LK.drawCtx(cv.getContext('2d'), logo, 0, 0, cv.width, cv.height, fill);
    return cv;
  }

  /* Zet een logo op de foto. map(x,y) geeft [u,v] in 0..1 of null. bbox in fotopixels. */
  function print(ctx, src, bbox, map, { tex = 1, opacity = 0.96 } = {}) {
    const [bx, by, bw, bh] = bbox.map(Math.round);
    const photo = ctx.getImageData(bx, by, bw, bh), P = photo.data;
    const L = src.getContext('2d').getImageData(0, 0, src.width, src.height), S = L.data, sw = src.width, sh = src.height;
    // gemiddelde helderheid onder het logo, als referentie voor de schaduw
    let sum = 0, n = 0;
    const uv = new Float32Array(bw * bh * 2).fill(-1);
    for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
      const m = map(bx + x + 0.5, by + y + 0.5);
      if (!m || m[0] < 0 || m[0] > 1 || m[1] < 0 || m[1] > 1) continue;
      const k = (y * bw + x); uv[k * 2] = m[0]; uv[k * 2 + 1] = m[1];
      const p = k * 4; sum += 0.299 * P[p] + 0.587 * P[p + 1] + 0.114 * P[p + 2]; n++;
    }
    const mean = n ? sum / n : 128;
    // op donkere stof is de relatieve ruis groot: structuur daar minder sterk laten doorwerken
    const texEff = tex * Math.min(1, mean / 150);
    for (let k = 0; k < bw * bh; k++) {
      const u = uv[k * 2]; if (u < 0) continue;
      const fx = u * sw - 0.5, fy = uv[k * 2 + 1] * sh - 0.5, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
      // bilineair, met voorvermenigvuldigde alfa (geen donkere randen)
      let r = 0, g = 0, b = 0, a = 0;
      for (const [dx, dy, wgt] of [[0, 0, (1 - tx) * (1 - ty)], [1, 0, tx * (1 - ty)], [0, 1, (1 - tx) * ty], [1, 1, tx * ty]]) {
        const xx = x0 + dx, yy = y0 + dy; if (xx < 0 || yy < 0 || xx >= sw || yy >= sh) continue;
        const s = (yy * sw + xx) * 4, al = S[s + 3] / 255 * wgt;
        r += S[s] * al; g += S[s + 1] * al; b += S[s + 2] * al; a += al;
      }
      if (a < 0.003) continue;
      r /= a; g /= a; b /= a;
      const p = k * 4, lum = 0.299 * P[p] + 0.587 * P[p + 1] + 0.114 * P[p + 2];
      const shade = Math.min(1.15, Math.max(0.45, 1 + (lum / mean - 1) * texEff));
      const al = a * opacity;
      P[p] = P[p] * (1 - al) + Math.min(255, r * shade) * al;
      P[p + 1] = P[p + 1] * (1 - al) + Math.min(255, g * shade) * al;
      P[p + 2] = P[p + 2] * (1 - al) + Math.min(255, b * shade) * al;
    }
    ctx.putImageData(photo, bx, by);
  }

  // logo op een vierhoek (perspectief)
  function printQuad(ctx, logo, fill, quad, opts) {
    const xs = quad.map(p => p[0]), ys = quad.map(p => p[1]);
    const bbox = [Math.min(...xs) - 2, Math.min(...ys) - 2, Math.max(...xs) - Math.min(...xs) + 4, Math.max(...ys) - Math.min(...ys) + 4];
    const src = logoCanvas(logo, fill, 2 * (Math.max(...xs) - Math.min(...xs)));
    const inv = invert(squareToQuad(quad));
    print(ctx, src, bbox, (x, y) => apply(inv, x, y), opts);
  }
  // logo midden in een rechthoek, met gegeven breedte
  const centered = (logo, cx, cy, w) => { const h = w * logo.h / logo.w; return [[cx - w / 2, cy - h / 2], [cx + w / 2, cy - h / 2], [cx + w / 2, cy + h / 2], [cx - w / 2, cy + h / 2]]; };
  // logo in een deelgebied van een vierhoek, verhouding behouden in vlak-eenheden
  // ratio = breedte/hoogte van het vlak (bv. visitekaartje 1.75)
  function fitInQuad(q, logo, cu, cv, uw, ratio) {
    const vh = uw * ratio * logo.h / logo.w;
    return subQuad(q, cu - uw / 2, cv - vh / 2, cu + uw / 2, cv + vh / 2);
  }
  const avgColor = (ctx, x, y, w, h) => {
    const d = ctx.getImageData(Math.round(x), Math.round(y), Math.round(w), Math.round(h)).data; let r = 0, g = 0, b = 0;
    for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
    const n = d.length / 4; return '#' + [r, g, b].map(v => Math.round(v / n).toString(16).padStart(2, '0')).join('').toUpperCase();
  };

  /* Scènes: coördinaten in fotopixels (1456 × 1088). focus = horizontaal middelpunt voor de uitsnede. */
  const SCENES = {
    tote: { focus: 722, draw(ctx, { pick, primary }) {
      for (const [cx, cy] of [[410, 760], [1045, 770]]) {
        const ld = pick(avgColor(ctx, cx - 120, cy - 60, 240, 120), primary);
        printQuad(ctx, ld.logo, ld.fill, centered(ld.logo, cx, cy, 300), { tex: 1.35, opacity: 0.94 });
      }
    } },
    mug: { focus: 760, draw(ctx, { pick, primary }) {
      const ld = pick(avgColor(ctx, 520, 480, 300, 160), primary);
      const cx = 685, R = 318, w = 330, h = w * ld.logo.h / ld.logo.w, top = 565 - h / 2;
      const src = logoCanvas(ld.logo, ld.fill, w * 2);
      print(ctx, src, [cx - w / 2 - 4, top - 2, w + 8, h + 4], (x, y) => {
        const s = (x - cx) / R; if (Math.abs(s) >= 1) return null;
        return [0.5 + Math.asin(s) * R / w, (y - top) / h];
      }, { tex: 0.8, opacity: 0.97 });
    } },
    cards: { focus: 790, draw(ctx, { pick, primary, mark }) {
      const front = [[473, 507], [1075, 462], [1131, 787], [490, 838]];
      const back = [[482, 281], [1057, 356], [975, 630], [400, 555]];
      const ld = pick('#F2F2F0', primary), lm = pick('#F2F2F0', mark);
      printQuad(ctx, ld.logo, ld.fill, fitInQuad(front, ld.logo, 0.5, 0.5, 0.56, 1.75), { tex: 0.6 });
      printQuad(ctx, lm.logo, lm.fill, fitInQuad(back, lm.logo, 0.5, 0.29, 0.1, 1.98), { tex: 0.6 });
    } },
    folder: { focus: 728, draw(ctx, { pick, primary }) {
      const q = [[375, 59], [1049, 59], [1051, 1013], [375, 1013]];
      const ld = pick('#F2F2F2', primary);
      printQuad(ctx, ld.logo, ld.fill, fitInQuad(q, ld.logo, 0.52, 0.42, 0.52, 674 / 954), { tex: 0.5 });
    } },
    shirt: { focus: 742, draw(ctx, { pick, primary }) {
      const ld = pick('#F4F4F4', primary);
      printQuad(ctx, ld.logo, ld.fill, centered(ld.logo, 752, 340, 270), { tex: 1.25, opacity: 0.95 });
    } }
  };

  /* Bouwt alle mockups en geeft per scène een JPEG (data-URL) met de gevraagde verhouding. */
  LK.composeMockups = async ({ pick, primary, mark, outW = 1010, outH = 800, radius = 16 }) => {
    if (!window.MOCKUP_PHOTOS) return null;
    const out = {};
    for (const [key, scene] of Object.entries(SCENES)) {
      const img = await loadImg(window.MOCKUP_PHOTOS[key]);
      const cv = document.createElement('canvas'); cv.width = img.naturalWidth; cv.height = img.naturalHeight;
      const ctx = cv.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      scene.draw(ctx, { pick, primary, mark });
      // uitsnede op de paginaverhouding, met afgeronde hoeken op wit
      const cropW = Math.min(cv.width, cv.height * outW / outH), cropH = cropW * outH / outW;
      const sx = Math.max(0, Math.min(cv.width - cropW, scene.focus - cropW / 2)), sy = (cv.height - cropH) / 2;
      const o = document.createElement('canvas'); o.width = outW; o.height = outH;
      const oc = o.getContext('2d');
      oc.fillStyle = '#FFFFFF'; oc.fillRect(0, 0, outW, outH);
      oc.save(); oc.beginPath(); oc.roundRect(0, 0, outW, outH, radius); oc.clip();
      oc.imageSmoothingQuality = 'high'; oc.drawImage(cv, sx, sy, cropW, cropH, 0, 0, outW, outH);
      oc.restore();
      out[key] = o.toDataURL('image/jpeg', 0.9);
      cv.width = cv.height = o.width = o.height = 0;
    }
    return out;
  };
})();
