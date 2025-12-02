export const runtime = "edge";

const GATEWAY_BASE =
  process.env.ASTRA_GATEWAY_BASE_URL || "https://astra-gw.solaces.me";

export async function GET() {
  const backendResp = await fetch(`${GATEWAY_BASE}/api/astra/devices`, {
    headers: {
      "x-astra-key": process.env.ASTRA_API_KEY || "",
    },
  });

  return new Response(backendResp.body, {
    status: backendResp.status,
    headers: {
      "Content-Type":
        backendResp.headers.get("content-type") ?? "application/json",
    },
  });
}
