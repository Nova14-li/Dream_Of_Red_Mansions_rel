/* ==========================================================================
   通用工具
   选择器、HTML 转义、类元信息读取、姓名缩写、颜色深浅与透明度
   --------------------------------------------------------------------------
   模块：core/utils.js
   ========================================================================== */
(function (api, M, D, S) {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.prototype.slice.call(document.querySelectorAll(s));
  const SVGNS = 'http://www.w3.org/2000/svg';
  /* ---------------- 通用工具 ---------------- */
  function initial(name) {
    if (name.indexOf('贾') === 0 && name.length > 2) return name.charAt(1);
    if (name.indexOf('世袭') === 0) return '爵';
    if (name.length > 3) return name.charAt(1);
    return name.charAt(0);
  }
  function meta(n) { return M.CLS_META[n.cls] || M.CLS_META['人物']; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function relName(p) { return p; }

  function shade(hex, amt) {
    const c = hex.replace('#', '');
    let r = parseInt(c.substr(0, 2), 16), g = parseInt(c.substr(2, 2), 16), b = parseInt(c.substr(4, 2), 16);
    r = Math.max(0, Math.min(255, r + amt)); g = Math.max(0, Math.min(255, g + amt)); b = Math.max(0, Math.min(255, b + amt));
    return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
  }
  function hexA(hex, a) {
    const c = hex.replace('#', '');
    return 'rgba(' + parseInt(c.substr(0, 2), 16) + ',' + parseInt(c.substr(2, 2), 16) + ',' + parseInt(c.substr(4, 2), 16) + ',' + a + ')';
  }

  /* ---- 对外导出 ---- */
  Object.assign(api, { $, $$, SVGNS, initial, meta, esc, relName, shade, hexA });
})(window.DRM.api, window.DRM.meta, window.DRM.data, window.DRM.state);
