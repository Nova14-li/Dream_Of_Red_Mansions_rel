/* ==========================================================================
   力学模拟
   斥力、碰撞、弹簧与轨道回归，逐帧推进节点位置
   --------------------------------------------------------------------------
   模块：graph/simulation.js
   ========================================================================== */
(function (api, M, D, S) {
  'use strict';
  /* ---------------- 力学模拟 ---------------- */
  function step() {
    if (S.simAlpha <= 0.004 && !S.dragNode) return;
    const alpha = S.simAlpha;
    const vis = D.nodes;

    // 斥力
    for (let i = 0; i < vis.length; i++) {
      const a = vis[i];
      for (let j = i + 1; j < vis.length; j++) {
        const b = vis[j];
        let dx = a.x - b.x, dy = a.y - b.y;
        let d2 = dx * dx + dy * dy;
        if (d2 < 1) { dx = (api.rnd() - .5); dy = (api.rnd() - .5); d2 = 1; }
        if (d2 > 160000) continue;
        const d = Math.sqrt(d2);
        const f = ((S.freeMode ? 10500 : 1500) * alpha) / d2;
        const fx = (dx / d) * f, fy = (dy / d) * f;
        a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
      }
    }
    // 弹簧
    const allEdges = S.showInfer ? D.edges.concat(D.inference.edges) : D.edges;
    for (let i = 0; i < allEdges.length; i++) {
      const e = allEdges[i];
      const a = D.byId.get(e.s), b = D.byId.get(e.t);
      if (!a || !b) continue;
      let dx = b.x - a.x, dy = b.y - a.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const rest = e.inferred ? 165 : (M.GRP[e.g] || M.GRP.place).rest;
      let k = e.inferred ? 0.004 : (S.freeMode ? 0.017 : 0.0055);
      if (!e.inferred && (e.g === 'clan' || e.g === 'place' || e.g === 'rank')) k *= 0.7;
      const f = (d - rest) * k * alpha;
      const fx = (dx / d) * f, fy = (dy / d) * f;
      a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
    }
    // 回归力：规整布局下节点被拉回各自轨道；自由布局下仅保留轻微向心
    vis.forEach((n) => {
      if (S.freeMode) {
        n.vx += (0 - n.x) * 0.0016 * alpha;
        n.vy += (0 - n.y) * 0.0016 * alpha;
      } else {
        const hx = n.hx || 0, hy = n.hy || 0;
        n.vx += (hx - n.x) * 0.12 * alpha;
        n.vy += (hy - n.y) * 0.12 * alpha;
      }
      n.vx *= 0.82; n.vy *= 0.82;
      if (n === S.dragNode) { n.vx = 0; n.vy = 0; return; }
      n.x += Math.max(-22, Math.min(22, n.vx));
      n.y += Math.max(-22, Math.min(22, n.vy));
    });
    // 碰撞消解：保证节点与标签不重叠
    for (let i = 0; i < vis.length; i++) {
      const a = vis[i];
      for (let j = i + 1; j < vis.length; j++) {
        const b = vis[j];
        const minD = api.nodeRadius(a) + api.nodeRadius(b) + 24;
        let dx = b.x - a.x, dy = b.y - a.y;
        let d = Math.sqrt(dx * dx + dy * dy);
        if (d < 0.01) { dx = api.rnd() - .5; dy = api.rnd() - .5; d = 0.01; }
        if (d < minD) {
          const push = (minD - d) * 0.42;
          const ux = dx / d, uy = dy / d;
          if (a !== S.dragNode) { a.x -= ux * push; a.y -= uy * push; }
          if (b !== S.dragNode) { b.x += ux * push; b.y += uy * push; }
        }
      }
    }
    S.simAlpha *= 0.986;
  }

  /* ---- 对外导出 ---- */
  Object.assign(api, { step });
})(window.DRM.api, window.DRM.meta, window.DRM.data, window.DRM.state);
