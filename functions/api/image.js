function placeholderSvg(label) {
  const safe = String(label || '').replace(/[<>&]/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480">
    <rect width="640" height="480" fill="#e5e7e5"/>
    <rect x="0" y="0" width="640" height="480" fill="none" stroke="#111111" stroke-width="4"/>
    <text x="320" y="230" font-family="sans-serif" font-size="22" fill="#333333" text-anchor="middle">画像未登録</text>
    <text x="320" y="264" font-family="monospace" font-size="16" fill="#666666" text-anchor="middle">${safe}</text>
  </svg>`;
  return new Response(svg, { status: 200, headers: { 'content-type': 'image/svg+xml; charset=utf-8', 'cache-control': 'no-store' } });
}

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const key = url.searchParams.get('key') || '';
  if (!key) return placeholderSvg('');

  const obj = await env.PHOTOS.get(key);
  if (!obj) return placeholderSvg(key.split('/').pop());

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('etag', obj.httpEtag);
  headers.set('cache-control', 'public, max-age=31536000, immutable');
  return new Response(obj.body, { headers });
}
