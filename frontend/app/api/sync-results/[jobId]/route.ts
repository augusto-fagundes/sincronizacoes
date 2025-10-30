export async function GET(_req: Request, { params }: { params: { jobId: string } }) {
  const store = (globalThis as any).__syncResults;
  const data = store?.get(params.jobId);
  if (!data) return Response.json({ status: "pending" });
  return Response.json(data);
}

export async function POST(req: Request, { params }: { params: { jobId: string } }) {
  const storeHolder = (globalThis as any);
  storeHolder.__syncResults = storeHolder.__syncResults ?? new Map<string, any>();
  const store = storeHolder.__syncResults as Map<string, any>;
  try {
    const body = await req.json().catch(() => ({}));
    const record = {
      status: "pending" as const,
      payload: body?.payload,
      startedAt: new Date().toISOString(),
    };
    store.set(params.jobId, record);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }
}