/* ==========================================================================
   数据模型装配
   读取 window.__DATA__，构建 nodes / byId / edges 与索引，并统计规模
   --------------------------------------------------------------------------
   模块：core/data.js
   ========================================================================== */
(function (api, M, D, S) {
  'use strict';
  const DATA = window.__DATA__;
  /* ---------------- 数据模型 ---------------- */
  const nodes = [];
  const byId = new Map();
  const edges = [];

  DATA.individuals.forEach((ind, idx) => {
    const cls = ind.types[0] || '人物';
    const n = {
      id: ind.name,
      name: ind.name,
      cls: cls,
      gender: ind.data['性别'] || null,
      data: ind.data,
      comment: ind.comment || '',
      rel: ind.relations,
      out: [],
      inc: [],
      deg: 0,
      idx: idx,
      x: 0, y: 0, vx: 0, vy: 0,
      fx: null, fy: null
    };
    nodes.push(n);
    byId.set(n.id, n);
  });

  nodes.forEach((n) => {
    Object.keys(n.rel).forEach((p) => {
      n.rel[p].forEach((t) => {
        if (!byId.has(t)) return;
        edges.push({ s: n.id, t: t, p: p, g: M.PROP_GROUP[p] || 'place', inferred: false });
      });
    });
  });
  edges.forEach((e) => {
    byId.get(e.s).out.push(e);
    byId.get(e.t).inc.push(e);
    byId.get(e.s).deg++;
    byId.get(e.t).deg++;
  });

  function isPerson(n) { return n.cls === '人物'; }
  const persons = nodes.filter(isPerson);
  const typeCount = {};
  nodes.forEach((n) => { typeCount[n.cls] = (typeCount[n.cls] || 0) + 1; });
  const tripleCount = edges.length + nodes.reduce((a, n) => a + Object.keys(n.data).length, 0) + nodes.length;
  const commentCount = nodes.filter((n) => n.comment).length;

  /* ---- 对外导出 ---- */
  Object.assign(D, { DATA, nodes, byId, edges, isPerson, persons, typeCount, tripleCount, commentCount });
  api.isPerson = isPerson;
})(window.DRM.api, window.DRM.meta, window.DRM.data, window.DRM.state);
