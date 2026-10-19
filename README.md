# Logokit

Persoonlijke logopack-generator. Zet SVG-logo's om naar een geordende ZIP met SVG, PNG, JPG, WebP, CMYK-EPS/PDF, favicons en een PDF-logoguide.

**Gebruik:** open `logokit/index.html` in je browser (dubbelklik). Geen installatie, geen account, geen internet nodig.

## Veiligheid
- Alles draait lokaal; er wordt niets geüpload. De CSP (`connect-src 'none'`) blokkeert elk netwerkverzoek.
- Geüploade SVG's worden eerst gesaneerd: scripts, event-handlers, externe links/`url()`, `@import` en `<image>` worden verwijderd; `<use>` wordt lokaal uitgepakt.
- Libraries staan lokaal in `logokit/vendor/` (JSZip 3.10.1, jsPDF 2.5.1; sha512 gelijk aan cdnjs). Geen externe fonts of scripts; het lettertype Silka (Regular + Italic, eigen webfontlicentie) staat in `logokit/fonts/`.
- Het opgeslagen concept (localStorage) wordt bij het terugladen gevalideerd.

## Lettertype (Silka) — niet in de repository
De Silka-bestanden vallen onder een eigen licentie en staan daarom niet in git (`logokit/fonts/` is genegeerd). Zonder deze map werkt de app gewoon, met systeemlettertypen en Helvetica in de PDF. Silka toevoegen:

```bash
mkdir -p logokit/fonts
K="pad/naar/Silka-Regular-&-Italic-Webfont"
cp "$K"/silka-regular-webfont.woff2 "$K"/silka-regular-webfont.woff "$K"/silka-regularitalic-webfont.woff2 "$K"/silka-regularitalic-webfont.woff logokit/fonts/
{ printf "window.SILKA_TTF = '"; base64 -i "$K/silka-regular-webfont.ttf" | tr -d '\n'; echo "';"; } > logokit/fonts/silka-pdf.js
```

## Bestanden
- `engine.js` SVG-analyse en export (raster, EPS, PDF, ico)
- `guide.js` PDF-logoguide
- `app.js` interface en pakketplanning
- `Logopack_Logo_Guidelines.pdf` voorbeeldguide van het origineel, ter referentie
