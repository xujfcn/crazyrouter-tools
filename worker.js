// Cloudflare Worker: crazyrouter.com/tools/* → GitHub Pages
// Deploy once, handles all future tool pages automatically

const GITHUB_PAGES_HOST = 'xujfcn.github.io';
const GITHUB_REPO = 'crazyrouter-tools';

export default {
  async fetch(request) {
    const url = new URL(request.url);
    
    // Only handle /tools/* paths
    if (!url.pathname.startsWith('/tools')) {
      return fetch(request);
    }

    // Map paths:
    // /tools → /crazyrouter-tools/
    // /tools/ → /crazyrouter-tools/
    // /tools/pricing-calculator → /crazyrouter-tools/pricing-calculator/
    let path = url.pathname.replace(/^\/tools/, '');
    if (!path || path === '/') {
      path = '/';
    } else if (!path.endsWith('/') && !path.includes('.')) {
      path += '/';
    }

    const ghUrl = `https://${GITHUB_PAGES_HOST}/${GITHUB_REPO}${path}`;

    const response = await fetch(ghUrl, {
      headers: {
        'User-Agent': 'Cloudflare-Worker',
        'Accept': request.headers.get('Accept') || '*/*',
      },
    });

    // Clone response with custom headers
    const newResponse = new Response(response.body, response);
    newResponse.headers.set('X-Powered-By', 'Crazyrouter');
    newResponse.headers.set('Cache-Control', 'public, max-age=300');
    // Remove GitHub Pages headers that leak origin
    newResponse.headers.delete('x-github-request-id');
    newResponse.headers.delete('x-served-by');
    newResponse.headers.delete('x-timer');
    newResponse.headers.delete('x-fastly-request-id');
    
    return newResponse;
  },
};
