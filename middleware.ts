import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const host = req.headers.get("host") || "";

  // If the request is coming from oracle.solaces.me root,
  // redirect to /oracle
  if (
    host.startsWith("oracle.solaces.me") &&
    (url.pathname === "/" || url.pathname === "")
  ) {
    url.pathname = "/oracle";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Optional: narrow middleware to relevant paths only
export const config = {
  matcher: ["/", "/oracle"],
};
