const N8N_FALLBACK_URL =
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

    // healthcheck
    if (request.method === "GET" && url.pathname === "/health") {
      return new Response(
        JSON.stringify({ ok: true, runner: "cloudflare-worker" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...cors },
        }
      );
    }

    // pega o body
    const body = await request.json().catch(() => ({}));

    // usa a env se existir, senão usa o fallback
    const webhook = env.N8N_WEBHOOK_URL || N8N_FALLBACK_URL;

    const upstream = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
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
