(function () {
  'use strict';

  var LANGS = [
    { code: 'en', label: 'EN' },
    { code: 'zh', label: '中文' },
    { code: 'ru', label: 'RU' },
    { code: 'ja', label: '日本語' }
  ];

  function getCurrentLang() {
    var match = window.location.pathname.match(/^\/tools\/(zh|ru|ja)(\/|$)/);
    return match ? match[1] : 'en';
  }

  function getPagePathWithoutLang() {
    var path = window.location.pathname.replace(/^\/tools\/?/, '');
    path = path.replace(/^(zh|ru|ja)\/?/, '');
    return path;
  }

  function buildUrl(lang) {
    var pagePath = getPagePathWithoutLang();
    var base = lang === 'en' ? '/tools/' : '/tools/' + lang + '/';
    return base + pagePath + window.location.search + window.location.hash;
  }

  function injectStyles() {
    if (document.getElementById('cr-lang-switcher-styles')) return;
    var style = document.createElement('style');
    style.id = 'cr-lang-switcher-styles';
    style.textContent = [
      '.cr-lang-switcher{display:flex;gap:6px;padding:5px;border:1px solid #e5e7eb;border-radius:9999px;background:rgba(255,255,255,.92);box-shadow:0 8px 24px rgba(15,23,42,.08);backdrop-filter:blur(10px)}',
      '.cr-lang-switcher a{display:inline-flex;align-items:center;justify-content:center;min-width:34px;height:30px;padding:0 10px;border-radius:9999px;color:#4b5563;text-decoration:none;font-size:12px;font-weight:700;line-height:1;border:0;background:transparent;white-space:nowrap}',
      '.cr-lang-switcher a:hover{background:#eff6ff;color:#2563eb}',
      '.cr-lang-switcher a.active{background:#111827;color:#fff}',
      '.cr-lang-switcher.floating{position:fixed;right:18px;bottom:18px;z-index:1000}',
      '.cr-lang-switcher.inline{box-shadow:none;background:#fff;flex:none}',
      '.navbar-inner.cr-has-lang-switcher{gap:14px}',
      '.navbar-inner.cr-has-lang-switcher>.cr-lang-switcher.inline{margin-left:auto}',
      '@media(max-width:900px){.navbar-inner.cr-has-lang-switcher{height:auto;min-height:64px;align-items:flex-start;flex-wrap:wrap;padding-top:12px;padding-bottom:12px}.navbar-inner.cr-has-lang-switcher>.nav-left{order:1;flex-wrap:wrap;gap:12px 18px}.navbar-inner.cr-has-lang-switcher>.btn,.navbar-inner.cr-has-lang-switcher>.btn-signup{order:2}.navbar-inner.cr-has-lang-switcher>.cr-lang-switcher.inline{order:3;width:100%;margin:0;justify-content:flex-start}}',
      '@media(max-width:640px){.cr-lang-switcher.floating{right:10px;bottom:10px}.cr-lang-switcher a{min-width:30px;padding:0 8px;font-size:11px}}'
    ].join('');
    document.head.appendChild(style);
  }

  function createSwitcher(className) {
    var current = getCurrentLang();
    var nav = document.createElement('nav');
    nav.className = 'cr-lang-switcher ' + className;
    nav.setAttribute('aria-label', 'Language');

    LANGS.forEach(function (lang) {
      var link = document.createElement('a');
      link.href = buildUrl(lang.code);
      link.textContent = lang.label;
      if (lang.code === current) {
        link.className = 'active';
        link.setAttribute('aria-current', 'page');
      }
      nav.appendChild(link);
    });

    return nav;
  }

  function render() {
    var inlineTarget = document.querySelector('.navbar-inner');
    if (inlineTarget) {
      if (!inlineTarget.querySelector('.cr-lang-switcher.inline')) {
        var inlineSwitcher = createSwitcher('inline');
        var signupButton = inlineTarget.querySelector('.btn-signup, .btn.primary, .btn');
        inlineTarget.classList.add('cr-has-lang-switcher');
        if (signupButton) {
          inlineTarget.insertBefore(inlineSwitcher, signupButton);
        } else {
          inlineTarget.appendChild(inlineSwitcher);
        }
      }
      return;
    }
    if (!document.querySelector('.cr-lang-switcher.floating')) {
      document.body.appendChild(createSwitcher('floating'));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      injectStyles();
      render();
    });
  } else {
    injectStyles();
    render();
  }
}());
