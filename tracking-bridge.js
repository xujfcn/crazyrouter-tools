(function () {
  'use strict';

  var GTM_ID = 'GTM-TPRLTKZJ';
  var ATTR_COOKIE = 'cr_attribution';
  var COOKIE_MAX_AGE = 60 * 60 * 24 * 90;
  var PARAM_KEYS = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_content',
    'utm_term',
    'gclid',
    'gbraid',
    'wbraid',
    'ref_source'
  ];
  var MAIN_HOST = 'crazyrouter.com';
  var MAIN_PATHS = [
    '/',
    '/register',
    '/console',
    '/console/token',
    '/console/topup',
    '/models',
    '/pricing'
  ];

  function loadGtm() {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    var firstScript = document.getElementsByTagName('script')[0];
    var tag = document.createElement('script');
    tag.async = true;
    tag.src = 'https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(GTM_ID);
    firstScript.parentNode.insertBefore(tag, firstScript);
  }

  function getCookie(name) {
    var prefix = name + '=';
    var parts = document.cookie ? document.cookie.split(';') : [];
    for (var i = 0; i < parts.length; i += 1) {
      var part = parts[i].trim();
      if (part.indexOf(prefix) === 0) {
        return decodeURIComponent(part.slice(prefix.length));
      }
    }
    return '';
  }

  function setCookie(name, value) {
    var cookie = [
      name + '=' + encodeURIComponent(value),
      'Max-Age=' + COOKIE_MAX_AGE,
      'Path=/',
      'Domain=.crazyrouter.com',
      'SameSite=Lax'
    ];
    if (window.location.protocol === 'https:') {
      cookie.push('Secure');
    }
    document.cookie = cookie.join('; ');
  }

  function parseJson(value) {
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch (err) {
      return null;
    }
  }

  function getParams(searchParams) {
    var params = {};
    PARAM_KEYS.forEach(function (key) {
      var value = searchParams.get(key);
      if (value) {
        params[key] = value;
      }
    });
    return params;
  }

  function hasAdParams(params) {
    return PARAM_KEYS.some(function (key) {
      return Boolean(params[key]);
    });
  }

  function inferTool(pathname) {
    if (pathname.indexOf('/pricing-calculator') !== -1) return 'pricing_calculator';
    if (pathname.indexOf('/model-comparison') !== -1) return 'model_comparison';
    if (pathname.indexOf('/model-timeline') !== -1) return 'model_timeline';
    if (pathname.indexOf('/model-radar') !== -1) return 'model_radar';
    if (pathname.indexOf('/background-agent-worktree-launcher') !== -1) return 'background_agent_worktree_launcher';
    return 'tools_index';
  }

  function buildTouch(params) {
    var pathname = window.location.pathname || '/tools/';
    var search = window.location.search || '';
    return Object.assign({}, params, {
      source_site: 'crazyrouter_tools',
      landing_page: pathname + search,
      landing_referrer: document.referrer || '',
      entry_host: window.location.hostname,
      entry_path: pathname,
      entry_tool: inferTool(pathname),
      timestamp: new Date().toISOString()
    });
  }

  function storeAttribution(params) {
    var existing = parseJson(getCookie(ATTR_COOKIE)) || {};
    var touch = buildTouch(params);
    var next = Object.assign({}, existing, {
      first_touch: existing.first_touch || touch,
      last_touch: touch,
      source_site: 'crazyrouter_tools',
      updated_at: touch.timestamp
    });
    setCookie(ATTR_COOKIE, JSON.stringify(next));
    return next;
  }

  function isMainSiteUrl(url) {
    if (url.hostname !== MAIN_HOST) return false;
    if (url.pathname.indexOf('/tools') === 0) return false;
    return MAIN_PATHS.some(function (path) {
      return url.pathname === path || url.pathname.indexOf(path + '/') === 0;
    });
  }

  function mergeTrackingParams(url, params) {
    var hasIncomingCampaign = ['utm_source', 'utm_medium', 'utm_campaign'].some(function (key) {
      return Boolean(params[key]);
    });

    PARAM_KEYS.forEach(function (key) {
      if (!params[key]) return;
      if (key.indexOf('utm_') === 0 && !hasIncomingCampaign && url.searchParams.has(key)) return;
      url.searchParams.set(key, params[key]);
    });

    if (!url.searchParams.has('ref_source')) {
      url.searchParams.set('ref_source', 'tools');
    }
    url.searchParams.set('entry_host', window.location.hostname);
    url.searchParams.set('entry_path', window.location.pathname || '/tools/');
    url.searchParams.set('entry_tool', inferTool(window.location.pathname || '/tools/'));
  }

  function rewriteMainSiteLinks(params) {
    var links = document.querySelectorAll('a[href]');
    links.forEach(function (link) {
      var url;
      try {
        url = new URL(link.getAttribute('href'), window.location.href);
      } catch (err) {
        return;
      }
      if (!isMainSiteUrl(url)) return;

      mergeTrackingParams(url, params);
      link.href = url.toString();

      link.addEventListener('click', function () {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: 'tools_cta_clicked',
          link_url: url.toString(),
          link_text: (link.textContent || '').trim().slice(0, 120),
          entry_tool: inferTool(window.location.pathname || '/tools/')
        });
      });
    });
  }

  var currentParams = getParams(new URLSearchParams(window.location.search));
  var attribution = hasAdParams(currentParams)
    ? storeAttribution(currentParams)
    : parseJson(getCookie(ATTR_COOKIE));
  var lastTouch = attribution && attribution.last_touch ? attribution.last_touch : buildTouch(currentParams);
  var paramsForLinks = Object.assign({}, lastTouch, currentParams);

  loadGtm();

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'tools_page_viewed',
    source_site: 'crazyrouter_tools',
    entry_tool: inferTool(window.location.pathname || '/tools/'),
    entry_path: window.location.pathname || '/tools/',
    has_gclid: Boolean(paramsForLinks.gclid),
    has_wbraid: Boolean(paramsForLinks.wbraid),
    has_gbraid: Boolean(paramsForLinks.gbraid)
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      rewriteMainSiteLinks(paramsForLinks);
    });
  } else {
    rewriteMainSiteLinks(paramsForLinks);
  }
}());
