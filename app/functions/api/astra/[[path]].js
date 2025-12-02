export async function onRequest(context) {
  const { request, params, env } = context;

  // Example:
  // /api/astra/devices           → params.path = "devices"
  // /api/astra/device/command    → params.path = "device/command"
  const suffix = params.path || "";

  const backendUrl = `https://astra-gw.solaces.me/api/astra/${suffix}`;

  // Clone request headers
  const headers = new Headers(request.headers);

  // Inject Astra API key from Cloudflare env vars
  headers.set("x-astra-key", env.ASTRA_API_KEY);

  const init = {
    method: request.method,
    headers,
    body: ["GET", "HEAD"].includes(request.method)
      ? undefined
      : request.body,
  };

  const backendResp = await fetch(backendUrl, init);

  const outHeaders = new Headers(backendResp.headers);
  outHeaders.set("Access-Control-Allow-Origin", "https://solaces.me");

  return new Response(backendResp.body, {
    status: backendResp.status,
    headers: outHeaders,
  });
}