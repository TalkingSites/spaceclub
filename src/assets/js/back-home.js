/* Drop <script src="/assets/js/back-home.js" defer></script> into any standalone
   page under /misc/ and it grows a way home. Self contained: own styles, own
   markup, no dependencies, no clashes with whatever the host page is doing. */
(function () {
  var HOME = '/octopus/';
  var LABEL = 'back to sophie.tech';

  var css = document.createElement('style');
  css.textContent = [
    '@keyframes sc-orbit{to{transform:rotate(360deg)}}',
    '@keyframes sc-breathe{0%,100%{filter:drop-shadow(0 0 6px rgba(168,85,247,.55))}50%{filter:drop-shadow(0 0 16px rgba(59,199,246,.75))}}',
    '.sc-home{position:fixed;right:20px;bottom:20px;z-index:2147483000;display:flex;align-items:center;gap:0;',
      'padding:9px;border-radius:999px;text-decoration:none;color:#fff;',
      'font:600 12px/1 ui-monospace,"Space Mono",Consolas,monospace;letter-spacing:.14em;text-transform:lowercase;',
      'background:rgba(20,0,42,.86);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);',
      'border:1px solid transparent;background-clip:padding-box;',
      'box-shadow:0 10px 34px -12px rgba(0,0,0,.7);transition:gap .45s cubic-bezier(.23,1,.32,1),padding .45s cubic-bezier(.23,1,.32,1),transform .3s ease}',
    '.sc-home::before{content:"";position:absolute;inset:-1px;border-radius:999px;padding:1px;z-index:-1;',
      'background:linear-gradient(135deg,#3BC7F6 0%,#A855F7 29.8%,#CC4D9E 69.3%,#EF4444 100%);',
      '-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;',
      'mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);mask-composite:exclude}',
    '.sc-home:hover,.sc-home:focus-visible{gap:11px;padding:9px 18px 9px 9px;transform:translateY(-2px);outline:none}',
    '.sc-home svg{width:30px;height:30px;flex:none;animation:sc-breathe 5s ease-in-out infinite}',
    '.sc-home .sc-ring{transform-origin:24px 24px;animation:sc-orbit 14s linear infinite}',
    '.sc-home .sc-label{max-width:0;overflow:hidden;white-space:nowrap;opacity:0;',
      'transition:max-width .45s cubic-bezier(.23,1,.32,1),opacity .3s ease}',
    '.sc-home:hover .sc-label,.sc-home:focus-visible .sc-label{max-width:220px;opacity:1}',
    '@media (prefers-reduced-motion:reduce){.sc-home svg,.sc-home .sc-ring{animation:none}}'
  ].join('');

  var a = document.createElement('a');
  a.className = 'sc-home';
  a.href = HOME;
  a.setAttribute('aria-label', LABEL);
  a.innerHTML =
    '<svg viewBox="0 0 48 48" fill="none" aria-hidden="true">' +
      '<defs><linearGradient id="scHomeG" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">' +
        '<stop stop-color="#3BC7F6"/><stop offset=".298" stop-color="#A855F7"/>' +
        '<stop offset=".693" stop-color="#CC4D9E"/><stop offset="1" stop-color="#EF4444"/></linearGradient>' +
        '<radialGradient id="scHomeP" cx=".36" cy=".32" r=".78">' +
        '<stop stop-color="#c9a2ff"/><stop offset="1" stop-color="#3a1070"/></radialGradient></defs>' +
      '<circle cx="24" cy="24" r="9.5" fill="url(#scHomeP)"/>' +
      '<g class="sc-ring"><ellipse cx="24" cy="24" rx="20" ry="6.6" fill="none" ' +
        'stroke="url(#scHomeG)" stroke-width="2.6" transform="rotate(-18 24 24)"/></g>' +
    '</svg><span class="sc-label">' + LABEL + '</span>';

  function mount() {
    document.head.appendChild(css);
    document.body.appendChild(a);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
