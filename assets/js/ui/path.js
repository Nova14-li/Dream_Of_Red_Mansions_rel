/* ==========================================================================
   关系链查找
   邻接表构建与最短路径搜索，亲属链优先，结果浮层渲染
   --------------------------------------------------------------------------
   模块：ui/path.js
   ========================================================================== */
(function (api, M, D, S) {
  'use strict';
  const { $, esc, isPerson } = api;

  /* ---------------- 关系链查找 ---------------- */
  function buildAdjacency(onlyKinship) {
    const adj = new Map();
    D.nodes.forEach((n) => adj.set(n.id, []));
    const all = D.edges.concat(S.showInfer ? D.inference.edges : []);
    all.forEach((e) => {
      if (onlyKinship) {
        if (!(e.g === 'kin' || e.g === 'sib' || e.g === 'mar')) return;
        if (!isPerson(D.byId.get(e.s)) || !isPerson(D.byId.get(e.t))) return;
      }
      adj.get(e.s).push({ to: e.t, p: e.p, e: e });
      adj.get(e.t).push({ to: e.s, p: M.REV_LABEL[e.p] || e.p, e: e, rev: true });
    });
    return adj;
  }
  function findPath(a, b, onlyKinship) {
    if (a === b) return [a];
    const adj = buildAdjacency(onlyKinship);
    const prev = new Map();
    const q = [a];
    const seen = new Set([a]);
    while (q.length) {
      const cur = q.shift();
      const list = adj.get(cur) || [];
      for (let i = 0; i < list.length; i++) {
        const nx = list[i];
        if (seen.has(nx.to)) continue;
        seen.add(nx.to);
        prev.set(nx.to, { from: cur, p: nx.p, e: nx.e });
        if (nx.to === b) {
          const chain = [{ id: b, p: null }];
          let c = b;
          while (prev.has(c)) {
            const pr = prev.get(c);
            chain.unshift({ id: pr.from, p: pr.p, e: pr.e });
            c = pr.from;
          }
          return chain;
        }
        q.push(nx.to);
      }
    }
    return null;
  }

  function runPath() {
    const a = $('#path-from').value, b = $('#path-to').value;
    let chain = findPath(a, b, true);
    let viaPlace = false;
    if (!chain) { chain = findPath(a, b, false); viaPlace = !!chain; }
    const out = $('#path-out');
    if (!chain) {
      out.innerHTML = '未找到可达路径。';
      S.pathNodes = null; S.pathEdgeKeys = null;
      $('#pathbar').classList.remove('show');
      return;
    }
    if (chain.length === 1) {
      out.innerHTML = '同一个实体。';
      return;
    }
    S.pathNodes = chain.map((c) => c.id);
    S.pathEdgeKeys = new Set();
    for (let i = 1; i < chain.length; i++) {
      const e = chain[i].e;
      if (e) S.pathEdgeKeys.add(e.s + '|' + e.p + '|' + e.t);
    }
    let html = '';
    chain.forEach((c, i) => {
      // 每个节点记录的是它指向下一个节点的谓词，故边标签取前一个节点
      if (i > 0) html += '<span class="via">—' + esc(chain[i - 1].p) + '→</span>';
      html += '<b>' + esc(c.id) + '</b>';
    });
    html += '<div style="margin-top:6px;color:var(--ink-3);font-size:11px">共 ' + (chain.length - 1) + ' 跳 · ' + (S.showInfer ? '含推理边' : '仅显式断言') + '</div>';
    out.innerHTML = html;
    const pb = $('#pathbar');
    pb.innerHTML = '<span class="pb-tag">关系链 · ' + (chain.length - 1) + ' 跳' + (viaPlace ? '（含地点中转）' : '') + '</span>' +
      chain.map((c, i) => (i ? '<span class="pb-via">—' + esc(chain[i - 1].p) + '→</span>' : '') + '<span class="pb-name" data-pn="' + esc(c.id) + '">' + esc(c.id) + '</span>').join('') +
      '<button class="pb-close" id="pb-close">×</button>';
    pb.classList.add('show');
    pb.querySelectorAll('[data-pn]').forEach((el) => {
      el.addEventListener('click', () => api.selectNode(el.getAttribute('data-pn'), { focus: true }));
    });
    pb.querySelector('#pb-close').addEventListener('click', () => {
      S.pathNodes = null; S.pathEdgeKeys = null;
      pb.classList.remove('show');
    });
    api.switchView('graph');
    const ids = S.pathNodes;
    // 自动缩放至路径
    const ns = ids.map((id) => D.byId.get(id));
    const xs = ns.map((n) => n.x), ys = ns.map((n) => n.y);
    const minX = Math.min.apply(null, xs) - 80, maxX = Math.max.apply(null, xs) + 80;
    const minY = Math.min.apply(null, ys) - 60, maxY = Math.max.apply(null, ys) + 80;
    const k = Math.min(S.W / (maxX - minX), S.H / (maxY - minY), 1.7) * 0.9;
    S.camAnim = { t0: performance.now(), dur: 520, k0: S.view.k, k1: k, x0: S.view.x, x1: S.W / 2 - ((minX + maxX) / 2) * k, y0: S.view.y, y1: S.H / 2 - ((minY + maxY) / 2) * k };
  }

  /* ---- 对外导出 ---- */
  Object.assign(api, { buildAdjacency, findPath, runPath });
})(window.DRM.api, window.DRM.meta, window.DRM.data, window.DRM.state);
