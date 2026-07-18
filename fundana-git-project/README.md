# Fundana · Todos Somos Venezuela — landing + total automático

Landing de donación con **nuestro diseño**, y el monto recaudado **actualizado
solo** desde GoFundMe. Como GoFundMe calcula el número con JavaScript en el
navegador, un robot programado (headless Chromium) abre la página, lee el número
ya calculado y lo guarda; la landing lo consume.

## Cómo funciona (3 piezas)

1. `netlify/functions/update-total.js` — **programada** (cada 15 min). Abre
   GoFundMe con Chromium headless, lee recaudado / meta / donaciones y lo guarda
   en **Netlify Blobs**.
2. `netlify/functions/gofundme-total.js` — **lectura** rápida (con CORS). Le
   devuelve a la landing el último valor guardado.
3. `index.html` — la landing. Llama a `gofundme-total` y pinta el número con
   nuestro diseño. Si aún no hay dato, muestra el valor de respaldo del código.

## Deploy (por Git — necesario, no sirve arrastrar zip)

1. Subí esta carpeta a un repo de **GitHub** (todos los archivos, sin
   `node_modules`).
2. En Netlify: **Add new site → Import an existing project → GitHub** y elegí el
   repo. Dejá el build command vacío; publish directory `.`.
3. Netlify instala las dependencias y publica las funciones solo.

## Encenderlo y verificar

1. Después del primer deploy, poblá el dato al instante abriendo una vez:
   `https://TU-SITIO.netlify.app/.netlify/functions/update-total`
   Debe responder `{"ok":true,"raised":...,"saved":true}`.
2. Luego probá la lectura:
   `https://TU-SITIO.netlify.app/.netlify/functions/gofundme-total`
   Debe responder `{"ok":true,"raised":...}`.
3. Abrí la home y refrescá fuerte (Cmd/Ctrl+Shift+R). El número queda al día y
   se refresca solo cada 15 min.
4. Si tu sitio no se llama `todos-somos-venezuela`, ajustá la 2ª URL de
   `CAMPAIGN.liveUrls` dentro de `index.html` (la 1ª, relativa, ya funciona sola
   cuando se sirve desde Netlify).

## Si Chromium da problemas (plan B sin navegador headless)

Chromium en funciones puede ser sensible a versiones. Si `update-total` falla
con error de Chromium:

- Alineá versiones en `package.json`: `@sparticuz/chromium` y `puppeteer-core`
  deben ser de la misma generación de Chromium (este proyecto usa chromium 123 +
  puppeteer-core 22).
- Alternativa más robusta: en vez del navegador headless, usar un servicio de
  render (ScrapingBee, ScraperAPI, Browserless — tienen plan gratis). Se cambia
  solo el interior de `update-total.js`: en lugar de lanzar Chromium, hace un
  `fetch` al servicio de render con la URL de GoFundMe (que devuelve el HTML ya
  renderizado) y se parsea igual. Avisame y te lo dejo montado así.

## Nota honesta

Esto es scraping con render: funciona, pero si GoFundMe cambia su página hay que
ajustar el lector. El respaldo del código evita que la landing quede vacía si
algo falla.
