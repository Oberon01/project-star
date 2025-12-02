export async function onRequest(context:any) {
  const { request, params, env } = context;

  // params.path is an array for [[path]] (multi-segment)
  // Example: /api/astra/device/command -> ["device", "command"]
  const segments = Array.isArray(params.path) ? params.path : [params.path].filter(Boolean);
  const suffix = segments.join("/"); // "device/command", or "devices", etc.

  // Build backend URL keeping the same structure after /api/astra
  const backendUrl = `https://astra-gw.solaces.me/api/astra/${suffix}`;

  // Clone headers and inject Astra key
  const headers = new Headers(request.headers);
  headers.set("x-astra-key", env.ASTRA_API_KEY);

  // Prepare init for fetch
  const init = {
    method: request.method,
    headers,
    body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
  };

  const backendResp = await fetch(backendUrl, init);

  // Forward response, and (optionally) add ACAO for safety
  const outHeaders = new Headers(backendResp.headers);
  outHeaders.set("Access-Control-Allow-Origin", "https://solaces.me");
  outHeaders.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  outHeaders.set("Access-Control-Allow-Headers", "content-type");

  return new Response(backendResp.body, {
    status: backendResp.status,
    headers: outHeaders,
  });
}
