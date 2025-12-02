export const dynamic = "force-dynamic";
export const runtime = "edge";

const GATEWAY_BASE =
  process.env.ASTRA_GATEWAY_BASE_URL || "https://astra-gw.solaces.me";

export async function POST(req: Request) {
  const body = await req.json();

  const backendResp = await fetch(
    `${GATEWAY_BASE}/api/astra/device/command`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-astra-key": process.env.ASTRA_API_KEY || "",
      },
      body: JSON.stringify(body),
    }
  );

  // Pass through status + body
  return new Response(backendResp.body, {
    status: backendResp.status,
    headers: {
      "Content-Type":
        backendResp.headers.get("content-type") ?? "application/json",
    },
  });
}
