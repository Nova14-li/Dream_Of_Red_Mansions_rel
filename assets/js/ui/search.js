/* ==========================================================================
   全局搜索
   输入联想、键盘导航与实体跳转
   --------------------------------------------------------------------------
   模块：ui/search.js
   ========================================================================== */
(function (api, M, D, S) {
  'use strict';
  const { $, esc } = api;

  /* ---------------- 搜索 ---------------- */
  function initSearch() {
    const input = $('#search');
    const box = $('#suggest');
    let items = [], hl = -1;
    function update() {
      const q = input.value.trim();
      if (!q) { box.classList.remove('show'); items = []; return; }
      items = D.nodes.filter((n) => n.name.indexOf(q) >= 0 || (n.comment || '').indexOf(q) >= 0 || n.cls.indexOf(q) >= 0).slice(0, 8);
      if (!items.length) { box.classList.remove('show'); return; }
      hl = 0;
      box.innerHTML = items.map((n, i) => '<div data-i="' + i + '" class="' + (i === 0 ? 'hl' : '') + '"><span>' + esc(n.name) + '</span><span class="t">' + esc(n.cls) + (n.gender ? ' · ' + n.gender : '') + '</span></div>').join('');
      box.classList.add('show');
      box.querySelectorAll('div').forEach((d) => {
        d.addEventListener('mousedown', (ev) => { ev.preventDefault(); pick(parseInt(d.getAttribute('data-i'), 10)); });
      });
    }
    function pick(i) {
      const n = items[i];
      if (!n) return;
      api.switchView('graph');
      api.selectNode(n.id, { focus: true });
      input.value = n.name;
      box.classList.remove('show');
    }
    input.addEventListener('input', update);
    input.addEventListener('focus', update);
    input.addEventListener('blur', () => setTimeout(() => box.classList.remove('show'), 120));
    input.addEventListener('keydown', (ev) => {
      if (!items.length) return;
      if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
        ev.preventDefault();
        hl = (hl + (ev.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length;
        box.querySelectorAll('div').forEach((d, i) => d.classList.toggle('hl', i === hl));
      } else if (ev.key === 'Enter') {
        ev.preventDefault(); pick(hl);
      } else if (ev.key === 'Escape') { box.classList.remove('show'); input.blur(); }
    });
  }

  /* ---- 对外导出 ---- */
  Object.assign(api, { initSearch });
})(window.DRM.api, window.DRM.meta, window.DRM.data, window.DRM.state);
