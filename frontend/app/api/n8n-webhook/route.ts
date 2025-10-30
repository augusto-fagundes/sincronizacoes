export async function POST(req: Request) {
  const store = (globalThis as any);
  store.__syncResults = store.__syncResults ?? new Map<string, any>();

  try {
    const body = await req.json();
    const { jobId, status, payload } = body;

    if (!jobId) {
      return Response.json({ error: "missing jobId" }, { status: 400 });
    }

    const record = {
      status: status ?? "success",
      payload,
      receivedAt: new Date().toISOString(),
    };

    store.__syncResults.set(jobId, record);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }
}