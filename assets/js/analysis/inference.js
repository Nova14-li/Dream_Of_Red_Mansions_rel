/* ==========================================================================
   OWL 闭包推理
   子属性回推、逆属性补全、对称补全，产出推理增量与规则归因
   --------------------------------------------------------------------------
   模块：analysis/inference.js
   ========================================================================== */
(function (api, M, D, S) {
  'use strict';
  /* ---------------- 推理引擎 ---------------- */
  const inference = { items: [], edges: [], byRule: { sub: 0, inv: 0, sym: 0 }, dup: 0, fresh: 0 };
  (function runReasoner() {
    const key = (s, p, t) => s + '|' + p + '|' + t;
    const work = D.edges.slice();
    const seen = new Set(D.edges.map((e) => key(e.s, e.p, e.t)));
    const dupSeen = new Set();
    const virtual = [];

    function addEdge(rule, s, p, t, from) {
      const k = key(s, p, t);
      if (seen.has(k)) {
        if (!dupSeen.has(k)) {
          dupSeen.add(k);
          inference.items.push({ rule: rule, s: s, p: p, t: t, from: from, dup: true });
        }
        return;
      }
      seen.add(k);
      const e = { s: s, t: t, p: p, g: M.PROP_GROUP[p] || 'place', inferred: true, rule: rule, from: from };
      work.push(e);
      virtual.push(e);
      inference.items.push({ rule: rule, s: s, p: p, t: t, from: from, dup: false });
      inference.byRule[rule] = (inference.byRule[rule] || 0) + 1;
    }

    // 1. 子属性回推
    D.edges.forEach((e) => {
      (M.SUPER[e.p] || []).forEach((sp) => addEdge('sub', e.s, sp, e.t, ':' + e.p + ' ⊑ :' + sp));
    });
    // 2. 逆属性补全（对已回推的闭包集合执行）
    work.slice().forEach((e) => {
      const inv = M.INVERSE[e.p];
      if (inv) addEdge('inv', e.t, inv, e.s, ':' + e.p + ' owl:inverseOf :' + inv);
    });
    // 3. 对称补全
    work.slice().forEach((e) => {
      if (e.p === '兄弟姐妹') addEdge('sym', e.t, e.s, e.p, ':兄弟姐妹 owl:SymmetricProperty');
    });

    inference.edges = virtual;
    inference.fresh = inference.items.filter((i) => !i.dup).length;
    inference.dup = inference.items.filter((i) => i.dup).length;
  })();

  /* ---- 对外导出 ---- */
  Object.assign(D, { inference });
})(window.DRM.api, window.DRM.meta, window.DRM.data, window.DRM.state);
