const FALLBACK_N8N =
  "https://augusto-fagundes.app.n8n.cloud/webhook/6952d587-fa8a-41ae-9cee-b280006d8fa5/chat";

export default {
  async fetch(request, env, ctx) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    // pré-flight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);

    // health
    if (request.method === "GET" && url.pathname === "/health") {
      return new Response(JSON.stringify({ ok: true, worker: "api-sinc" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...cors },
      });
    }

    // body do front
    const payload = await request.json().catch(() => ({}));

    // pega do env ou usa fallback
    const webhook = env.N8N_WEBHOOK_URL || FALLBACK_N8N;

    const upstream = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await upstream.text();

    return new Response(text, {
      status: upstream.status,
      headers: {
        "Content-Type":
          upstream.headers.get("Content-Type") || "application/json",
        ...cors,
      },
    });
  },
};
