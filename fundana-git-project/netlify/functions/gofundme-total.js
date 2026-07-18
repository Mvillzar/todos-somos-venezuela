// ============================================================================
// gofundme-total.js  ·  LECTURA (rápida, la llama la landing)
// ----------------------------------------------------------------------------
// Devuelve el último total guardado por update-total en Netlify Blobs.
// CORS abierto para que funcione también embebido en Wix.
// Si todavía no hay dato guardado (primer deploy), responde ok:false y la
// landing usa su número de respaldo hasta que la función programada corra.
// ============================================================================

import { getStore } from "@netlify/blobs";

export default async () => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "public, max-age=60"
  };
  try {
    const store = getStore("fundana");
    const data = await store.get("total", { type: "json" });
    if (data && data.raised) {
      return new Response(JSON.stringify({ ok: true, ...data }), { status: 200, headers });
    }
    return new Response(JSON.stringify({ ok: false, reason: "empty" }), { status: 200, headers });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 200, headers });
  }
};
