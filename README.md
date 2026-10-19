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

## Fotorealistische mockups
De merktoepassingen in de guide (pagina 11–15) gebruiken blanco productfoto's uit `mockups/` (AI-gegenereerd via Canva). Het logo wordt in de browser op de foto gezet, met perspectief, kromming en de licht/schaduw van de foto. De foto's staan als base64 in `logokit/mockups-data.js`, zodat het ook offline werkt. Na het vervangen van een foto opnieuw genereren:

```bash
python3 -c "import base64;m={'tote':'draagtassen','mug':'mok','cards':'visitekaartjes','folder':'map','shirt':'t-shirt'};open('logokit/mockups-data.js','w').write('window.MOCKUP_PHOTOS = {\n'+''.join(f\"  {k}: 'data:image/jpeg;base64,{base64.b64encode(open(f'mockups/{v}.jpg','rb').read()).decode()}',\n\" for k,v in m.items())+'};\n')"
```
Let op: de plaatsing van het logo is afgestemd op deze vijf foto's (`SCENES` in `logokit/mockup.js`).

## Bestanden
- `engine.js` SVG-analyse en export (raster, EPS, PDF, ico)
- `guide.js` PDF-logoguide
- `mockup.js` logo op de mockupfoto's plaatsen
- `app.js` interface en pakketplanning
- `Logopack_Logo_Guidelines.pdf` voorbeeldguide van het origineel, ter referentie
