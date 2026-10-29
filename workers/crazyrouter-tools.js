async function handleRequest(request) {
  const url = new URL(request.url);
  const GITHUB_BASE = 'https://xujfcn.github.io/crazyrouter-tools';
  let stripped = url.pathname.replace(/^\/tools\/?/, '').replace(/\/$/, '');
  const deduped = [];
  for (const part of stripped.split('/').filter(Boolean)) {
    if (deduped[deduped.length - 1] !== part) deduped.push(part);
  }
  stripped = deduped.join('/');

  // Retired calculator: stop before static asset handling or the hub fallback.
  if (/^(?:(?:zh|ja|ru)\/)?pricing-calculator(?:\/|$)/.test(stripped)) {
    return new Response(request.method === 'HEAD' ? null : 'This pricing calculator has been removed.', {
      status: 410,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Robots-Tag': 'noindex, follow',
      },
    });
  }

  const timeline = /^(?:(?:zh|zh-TW|es|ja|ru)\/)?model-timeline(?:\/|$)/.test(stripped);
  const timelinePage = /^(?:(?:zh|zh-TW|es|ja|ru)\/)?model-timeline(?:\/index\.html)?$/.test(stripped);
  const revalidate = 'no-cache, max-age=0, must-revalidate';
  const upstreamOptions = {
    headers: { 'User-Agent': 'Cloudflare-Worker' },
    ...(timeline ? { cf: { cacheTtl: -1 } } : {}),
  };

  if (/\.\w+$/.test(stripped)) {
    const target = new URL(GITHUB_BASE + '/' + stripped);
    // Preserve asset versions instead of serving every build from one cache key.
    if (timeline && !timelinePage && url.searchParams.has('v')) {
      target.searchParams.set('v', url.searchParams.get('v'));
    }
    const resp = await fetch(target.href, upstreamOptions);
    return new Response(resp.body, {
      status: resp.status,
      headers: {
        'Content-Type': resp.headers.get('Content-Type') || 'application/octet-stream',
        'Cache-Control': timeline && (timelinePage || !target.search) ? revalidate : 'public, max-age=86400',
        ...(timelinePage ? { 'X-Robots-Tag': 'index, follow' } : {}),
      },
    });
  }

  const targetPath = stripped ? '/' + stripped + '/index.html' : '/index.html';
  const resp = await fetch(GITHUB_BASE + targetPath, upstreamOptions);
  if (resp.ok) {
    return new Response(resp.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': timelinePage ? revalidate : 'public, max-age=3600',
        'X-Robots-Tag': 'index, follow',
      },
    });
  }

  const fallback = await fetch(GITHUB_BASE + '/index.html', {
    headers: { 'User-Agent': 'Cloudflare-Worker' },
  });
  return new Response(fallback.body, {
    status: fallback.status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': timelinePage ? revalidate : 'public, max-age=3600',
    },
  });
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});
