export async function onRequest(context) {
  const { request, params, env } = context;

  // params.path is a string for [[path]] e.g. "devices" or "device/command"
  const suffix = params.path || ""; // "" when URL is exactly /api/astra

  // Build backend URL
  const backendUrl = `https://astra-gw.solaces.me/api/astra/${suffix}`;

  // Clone headers and inject Astra key
  const headers = new Headers(request.headers);
  headers.set("x-astra-key", env.ASTRA_API_KEY);

  // Forward method + body
  const init = {
    method: request.method,
    headers,
    body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
  };

  const backendResp = await fetch(backendUrl, init);

  // Forward response back to browser
  const outHeaders = new Headers(backendResp.headers);
  // CORS (safe even though this is same-origin)
  outHeaders.set("Access-Control-Allow-Origin", "https://solaces.me");
  outHeaders.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  outHeaders.set("Access-Control-Allow-Headers", "content-type");

  return new Response(backendResp.body, {
    status: backendResp.status,
    headers: outHeaders,
  });
}
