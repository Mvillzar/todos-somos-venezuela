// ============================================================================
// update-total.js  ·  FUNCIÓN PROGRAMADA (cada 15 min)
// ----------------------------------------------------------------------------
// Abre la página de la campaña con un navegador headless (corre el JavaScript
// de GoFundMe, igual que un visitante real), lee el total YA CALCULADO y lo
// guarda en Netlify Blobs. La landing lee ese valor guardado.
//
// También se puede invocar a mano (abriendo su URL) para poblar el dato al
// instante y para depurar:
//   https://TU-SITIO.netlify.app/.netlify/functions/update-total
// ============================================================================

import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import { getStore } from "@netlify/blobs";

const CAMPAIGN_URL =
  "https://www.gofundme.com/f/fundana-emergencia-venezuela?lang=en_US";

function parseAbbrev(str) {
  if (!str) return null;
  str = String(str).replace(/,/g, "").trim();
  const m = str.match(/^([\d.]+)\s*([KMB])?$/i);
  if (!m) return null;
  let n = parseFloat(m[1]);
  const s = (m[2] || "").toUpperCase();
  if (s === "K") n *= 1e3;
  else if (s === "M") n *= 1e6;
  else if (s === "B") n *= 1e9;
  return Math.round(n);
}

async function scrape() {
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
    defaultViewport: { width: 1280, height: 900 }
  });
  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36"
    );
    await page.goto(CAMPAIGN_URL, { waitUntil: "networkidle2", timeout: 45000 });

    // Esperar a que el JS pinte el texto "raised of" (el número ya renderizado)
    await page
      .waitForFunction(() => /raised of/i.test(document.body.innerText), { timeout: 20000 })
      .catch(() => {});

    const text = await page.evaluate(() =>
      document.body.innerText.replace(/\s+/g, " ")
    );

    let raised = null, goal = null, donors = null;

    const m = text.match(/\$([\d,]+)\s+raised\s+of\s+\$([\d.,]+\s*[KMB]?)/i);
    if (m) { raised = parseInt(m[1].replace(/,/g, ""), 10); goal = parseAbbrev(m[2]); }

    let d = text.match(/([\d,]+)\s+donors/i) || text.match(/([\d.,]+\s*[KMB]?)\s+donations/i);
    if (d) donors = parseInt(String(d[1]).replace(/,/g, ""), 10) || parseAbbrev(d[1]);

    return { raised, goal, donors };
  } finally {
    await browser.close();
  }
}

export default async () => {
  const headers = { "Content-Type": "application/json; charset=utf-8" };
  try {
    const data = await scrape();
    if (data.raised) {
      const store = getStore("fundana");
      await store.setJSON("total", { ...data, ts: Date.now() });
      return new Response(JSON.stringify({ ok: true, ...data, saved: true }), { status: 200, headers });
    }
    return new Response(JSON.stringify({ ok: false, reason: "no-data" }), { status: 200, headers });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 200, headers });
  }
};

// Programación (cada 15 minutos). También está en netlify.toml; con una alcanza.
export const config = { schedule: "*/15 * * * *" };
