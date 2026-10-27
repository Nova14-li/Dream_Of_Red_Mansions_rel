/* ==========================================================================
   空间布局
   世系辈分推导、人物环与属性带布局、竖屏转置、画布尺寸与可见性
   --------------------------------------------------------------------------
   模块：graph/layout.js
   ========================================================================== */
(function (api, M, D, S) {
  'use strict';
  const { isPerson } = api;

  let seed = 20240426;
  function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }

  function generationMap() {
    const byName = new Map(D.persons.map((n) => [n.name, n]));
    const memo = {};
    function gen(name, stack) {
      if (memo[name] != null) return memo[name];
      if (stack.indexOf(name) >= 0) return 1;
      const nd = byName.get(name);
      const ps = (nd.rel['父亲'] || []).concat(nd.rel['母亲'] || []).filter((x) => byName.has(x));
      let g = 1;
      if (ps.length) { stack.push(name); g = 1 + Math.max.apply(null, ps.map((x) => gen(x, stack))); stack.pop(); }
      memo[name] = g;
      return g;
    }
    D.persons.forEach((nd) => gen(nd.name, []));
    D.persons.forEach((nd) => {
      (nd.rel['丈夫'] || []).concat(nd.rel['妻子'] || []).forEach((sp) => {
        if (byName.has(sp)) { const g = Math.max(memo[nd.name], memo[sp] || 1); memo[nd.name] = g; memo[sp] = g; }
      });
    });
    return memo;
  }

  // 上、下两条属性带：把建筑/地区/门第/爵位放在人物环的外围
  const BANDS = [
    { cls: '建筑', y: -268 },
    { cls: '地区', y: -268 },
    { cls: '官职爵位', y: 268 },
    { cls: '平民出身', y: 268 },
    { cls: '贵族出身', y: 268 }
  ];

  // 按世系 DFS 排序，让同房支的人物在环上相邻，减少跨环长弦
  function personOrder() {
    const byName = new Map(D.persons.map((n) => [n.name, n]));
    const gm = generationMap();
    const children = new Map();
    D.persons.forEach((p) => {
      (p.rel['父亲'] || []).concat(p.rel['母亲'] || []).forEach((par) => {
        if (!byName.has(par)) return;
        if (!children.has(par)) children.set(par, []);
        if (children.get(par).indexOf(p.name) < 0) children.get(par).push(p.name);
      });
    });
    const visited = new Set();
    const out = [];
    function visit(name) {
      if (!byName.has(name) || visited.has(name)) return;
      visited.add(name); out.push(name);
      const p = byName.get(name);
      (p.rel['丈夫'] || []).concat(p.rel['妻子'] || []).forEach((sp) => {
        if (byName.has(sp) && !visited.has(sp)) { visited.add(sp); out.push(sp); }
      });
      (children.get(name) || []).forEach((c) => visit(c));
    }
    D.persons.filter((p) => !(p.rel['父亲'] || []).length && !(p.rel['母亲'] || []).length)
      .sort((a, b) => (gm[a.name] - gm[b.name]) || (a.idx - b.idx))
      .forEach((r) => visit(r.name));
    D.persons.forEach((p) => visit(p.name));
    return out.map((n) => byName.get(n));
  }

  function layoutEllipse(jitter) {
    const ord = personOrder();
    const total = ord.length;
    ord.forEach((nd, i) => {
      const a = -Math.PI / 2 + (i / total) * Math.PI * 2;
      nd.hx = Math.cos(a) * 452; nd.hy = Math.sin(a) * 168;
      nd.x = nd.hx; nd.y = nd.hy; nd.vx = 0; nd.vy = 0;
    });

    const groups = {};
    D.nodes.forEach((nd) => { if (!isPerson(nd)) (groups[nd.cls] = groups[nd.cls] || []).push(nd); });
    S.bandInfo.length = 0;
    const gap = 56, span = 1110;
    ['top', 'bottom'].forEach((side) => {
      const list = BANDS.filter((b) => (side === 'top' ? b.y < 0 : b.y > 0));
      const counts = list.map((b) => (groups[b.cls] || []).length);
      const totalCount = counts.reduce((a, b) => a + b, 0) || 1;
      const usable = span - gap * (list.length - 1);
      const widths = counts.map((c) => usable * (c / totalCount));
      let x = -span / 2;
      list.forEach((b, bi) => {
        const arr = groups[b.cls] || [];
        const w = widths[bi];
        const stepX = arr.length > 1 ? (w - 70) / (arr.length - 1) : 0;
        arr.forEach((nd, i) => {
          const px = arr.length > 1 ? x + 35 + stepX * i : x + w / 2;
          nd.hx = px; nd.hy = b.y;
          nd.x = px; nd.y = b.y; nd.vx = 0; nd.vy = 0;
        });
        if (arr.length) S.bandInfo.push({ cls: b.cls, x: x + w / 2, y: b.y, count: arr.length });
        x += w + gap;
      });
    });
    D.nodes.filter((nd) => !isPerson(nd) && nd.hx == null).forEach((nd, i, arr) => {
      nd.hx = (i - (arr.length - 1) / 2) * 90; nd.hy = 0;
      nd.x = nd.hx; nd.y = nd.hy;
    });
    if (jitter) D.nodes.forEach((nd) => { nd.x += (rnd() - .5) * 26; nd.y += (rnd() - .5) * 26; });
    // 竖屏：整体转置，让属性带竖排两侧，人物环竖置
    if (S.portraitLayout) {
      D.nodes.forEach((nd) => {
        const tx = nd.hx; nd.hx = nd.hy * 1.02; nd.hy = tx;
        const cx2 = nd.x; nd.x = nd.y * 1.02; nd.y = cx2;
      });
      S.bandInfo.forEach((b) => { const tx = b.x; b.x = b.y * 1.02; b.y = tx; });
    }
  }
  layoutEllipse(false);

  function resize() {
    const rect = S.canvas.getBoundingClientRect();
    const nw = Math.max(1, rect.width), nh = Math.max(1, rect.height);
    if (S.W > 1 && S.H > 1) {
      const wx = (S.W / 2 - S.view.x) / S.view.k, wy = (S.H / 2 - S.view.y) / S.view.k;
      S.view.x = nw / 2 - wx * S.view.k;
      S.view.y = nh / 2 - wy * S.view.k;
    }
    S.W = nw; S.H = nh;
    S.DPR = Math.min(window.devicePixelRatio || 1, 2);
    S.canvas.width = Math.round(S.W * S.DPR);
    S.canvas.height = Math.round(S.H * S.DPR);
  }

  function visible(n) {
    if (!S.filters.types.has(n.cls)) return false;
    if (isPerson(n) && S.filters.gender !== '全部' && n.gender !== S.filters.gender) return false;
    if (S.filters.places.size) {
      const homes = (n.rel['住所'] || []).concat(n.rel['生活地区'] || []);
      if (isPerson(n)) return homes.some((p) => S.filters.places.has(p));
      return S.filters.places.has(n.name);
    }
    return true;
  }
  function nodeRadius(n) { return (isPerson(n) ? 8.5 : 7) + Math.min(16, n.deg) * 0.62; }

  /* ---- 对外导出 ---- */
  Object.assign(api, { seed, rnd, generationMap, BANDS, personOrder, layoutEllipse, resize, visible, nodeRadius });
})(window.DRM.api, window.DRM.meta, window.DRM.data, window.DRM.state);
