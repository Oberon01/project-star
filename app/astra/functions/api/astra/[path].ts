export const onRequest = async (context:any) => {
  const { request, params, env } = context;

  // the dynamic part after /api/astra/
  const path = params.path || "";
  
  // Build the backend URL
  const backendUrl = `https://astra-gw.solaces.me/api/astra/${path}`;
  
  // Clone request headers so we can modify them
  const headers = new Headers(request.headers);
  
  // Set Astra key (secret stored in Pages project)
  headers.set("x-astra-key", env.ASTRA_API_KEY);
  
  // Forward method + body
  const init: RequestInit = {
    method: request.method,
    headers,
    body: request.method === "GET" ? undefined : request.body,
  };
  
  // Make request to your gateway API
  const backendResp = await fetch(backendUrl, init);

  // Build response
  const outHeaders = new Headers(backendResp.headers);
  // Allow your UI to read the response (optional, but safe)
  outHeaders.set("Access-Control-Allow-Origin", "https://solaces.me");

  return new Response(backendResp.body, {
    status: backendResp.status,
    headers: outHeaders,
  });
};
