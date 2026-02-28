/// GET /api/auth/redirect — Serves a bare HTML page that meta-refreshes
/// to the Fyers OAuth URL. This strips all referrer headers and avoids
/// Cloudflare blocking because:
///   1. No JavaScript navigation (pure HTTP meta refresh)
///   2. `<meta name="referrer" content="no-referrer">` strips referrer
///   3. Looks identical to a user typing a URL — no detectable origin
///   4. No fetch/XHR/server-side redirect involved

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const target = url.searchParams.get('url');

  if (!target || !target.startsWith('https://api-t1.fyers.in/')) {
    return new NextResponse('Invalid redirect target', { status: 400 });
  }

  // Serve a bare HTML page — no scripts, no frameworks.
  // The meta refresh will navigate the browser cleanly.
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="referrer" content="no-referrer">
  <meta http-equiv="refresh" content="0;url=${escapeHtml(target)}">
  <title>Redirecting to Fyers...</title>
  <style>
    body { background: #0b0d11; color: #8a8fa8; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: system-ui; }
    a { color: #4a9eff; }
  </style>
</head>
<body>
  <div style="text-align:center">
    <p>Redirecting to Fyers login...</p>
    <p style="font-size:12px">If not redirected, <a href="${escapeHtml(target)}" rel="noreferrer noopener">click here</a></p>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Referrer-Policy': 'no-referrer',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
