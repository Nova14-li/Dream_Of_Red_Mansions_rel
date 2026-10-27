/* ==========================================================================
   画布渲染与相机
   坐标变换、关系曲线、节点与标签绘制、缩放适配与逐帧循环
   --------------------------------------------------------------------------
   模块：graph/renderer.js
   ========================================================================== */
(function (api, M, D, S) {
  'use strict';
  const { meta, shade, hexA, isPerson } = api;

  function screenOf(n) { return { x: n.x * S.view.k + S.view.x, y: n.y * S.view.k + S.view.y }; }
  function worldOf(px, py) { return { x: (px - S.view.x) / S.view.k, y: (py - S.view.y) / S.view.k }; }

  function edgePath(a, b, curvature) {
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const cx = mx - (dy / len) * curvature, cy = my + (dx / len) * curvature;
    return { cx: cx, cy: cy };
  }

  // 同一对节点间的多条边计数，用于弯曲避让
  const pairIndex = new Map();
  (function computePairIndex() {
    const groups = new Map();
    D.edges.concat(D.inference.edges).forEach((e) => {
      const k = [e.s, e.t].sort().join('~');
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(e);
    });
    groups.forEach((arr) => {
      arr.forEach((e, i) => {
        const k = [e.s, e.t].sort().join('~');
        if (arr.length === 1) { pairIndex.set(e, 0); return; }
        const sign = (i % 2 === 0 ? 1 : -1) * Math.ceil((i + 1) / 2);
        pairIndex.set(e, sign * 22);
      });
    });
  })();

  function draw() {
    S.ctx.setTransform(S.DPR, 0, 0, S.DPR, 0, 0);
    S.ctx.clearRect(0, 0, S.W, S.H);
    S.ctx.save();
    S.ctx.translate(S.view.x, S.view.y);
    S.ctx.scale(S.view.k, S.view.k);

    const sel = S.selectedId ? D.byId.get(S.selectedId) : null;
    const neigh = new Set();
    if (sel) {
      neigh.add(sel.id);
      sel.out.concat(sel.inc).forEach((e) => { neigh.add(e.s); neigh.add(e.t); });
    }
    const pathSet = S.pathNodes ? new Set(S.pathNodes) : null;
    const pathE = S.pathEdgeKeys;

    // 轨道引导线
    if (!S.freeMode) {
      S.ctx.save();
      S.ctx.strokeStyle = 'rgba(176,141,87,.35)';
      S.ctx.setLineDash([2 / S.view.k, 6 / S.view.k]);
      S.ctx.lineWidth = 1 / S.view.k;
      S.ctx.beginPath();
      S.ctx.ellipse(0, 0, 452, 168, 0, 0, Math.PI * 2);
      S.ctx.stroke();
      S.ctx.strokeStyle = 'rgba(139,127,111,.28)';
      [-268, 268].forEach((y) => {
        S.ctx.beginPath();
        S.ctx.moveTo(-556, y); S.ctx.lineTo(556, y);
        S.ctx.stroke();
      });
      S.ctx.setLineDash([]);
      S.ctx.restore();
    }

    // 边
    const drawEdges = S.showInfer ? D.edges.concat(D.inference.edges) : D.edges;
    drawEdges.forEach((e) => {
      const a = D.byId.get(e.s), b = D.byId.get(e.t);
      if (!a || !b) return;
      if (!api.visible(a) || !api.visible(b)) return;
      const g = e.inferred ? { color: '#b08d57', width: 1.1, dash: [3, 4] } : (M.GRP[e.g] || M.GRP.place);
      const curv = pairIndex.get(e) || 0;
      const p = edgePath(a, b, curv);
      const isPath = pathE && pathE.has(e.s + '|' + e.p + '|' + e.t);
      const isProp = S.highlightProp && e.p === S.highlightProp;
      let alpha = e.inferred ? 0.34 : (e.g === 'kin' ? 0.78 : e.g === 'mar' ? 0.85 : e.g === 'sib' ? 0.5 : 0.3);
      if (sel) alpha = (neigh.has(a.id) && neigh.has(b.id) && (a.id === sel.id || b.id === sel.id)) ? 0.95 : 0.08;
      if (pathSet) alpha = isPath ? 1 : 0.06;
      if (S.highlightProp) alpha = isProp ? 1 : 0.06;

      S.ctx.beginPath();
      S.ctx.moveTo(a.x, a.y);
      S.ctx.quadraticCurveTo(p.cx, p.cy, b.x, b.y);
      S.ctx.strokeStyle = isPath ? '#c0443b' : g.color;
      S.ctx.globalAlpha = alpha * (e.inferred ? 0.6 : 1);
      S.ctx.lineWidth = (isPath ? 2.6 : g.width) / Math.max(0.6, Math.min(1.4, S.view.k));
      S.ctx.setLineDash((g.dash || []).map((d) => d / S.view.k));
      S.ctx.stroke();
      S.ctx.setLineDash([]);

      // 箭头（沿二次贝塞尔切线方向）
      if (!e.inferred) {
        const t = 0.62;
        const x1 = (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * p.cx + t * t * b.x;
        const y1 = (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * p.cy + t * t * b.y;
        const tx = 2 * (1 - t) * (p.cx - a.x) + 2 * t * (b.x - p.cx);
        const ty = 2 * (1 - t) * (p.cy - a.y) + 2 * t * (b.y - p.cy);
        const ang = Math.atan2(ty, tx);
        const sz = 5;
        S.ctx.globalAlpha = alpha;
        S.ctx.fillStyle = isPath ? '#c0443b' : g.color;
        S.ctx.beginPath();
        S.ctx.moveTo(x1, y1);
        S.ctx.lineTo(x1 - sz * Math.cos(ang - 0.45), y1 - sz * Math.sin(ang - 0.45));
        S.ctx.lineTo(x1 - sz * Math.cos(ang + 0.45), y1 - sz * Math.sin(ang + 0.45));
        S.ctx.closePath();
        S.ctx.fill();
      }
      S.ctx.globalAlpha = 1;
    });

    // 节点
    D.nodes.forEach((n) => {
      const m = meta(n);
      const r = api.nodeRadius(n);
      const v = api.visible(n);
      const isSel = S.selectedId === n.id;
      const inNeigh = neigh.has(n.id);
      const inPath = pathSet && pathSet.has(n.id);
      let alpha = v ? 1 : 0.12;
      if (sel && v) alpha = inNeigh ? 1 : 0.16;
      if (pathSet) alpha = inPath ? 1 : 0.12;
      if (S.highlightProp) alpha = 0.55;

      S.ctx.globalAlpha = alpha;
      // 光晕
      if (isSel || inPath) {
        S.ctx.beginPath();
        S.ctx.arc(n.x, n.y, r + 7 + Math.sin(performance.now() / 420) * 1.6, 0, Math.PI * 2);
        S.ctx.fillStyle = hexA(m.color, .16);
        S.ctx.fill();
      }
      drawShape(n, r, m, (isSel || inPath) ? m.color : shade(m.color, 8));
      // 内点
      if (isPerson(n)) {
        S.ctx.beginPath();
        S.ctx.arc(n.x, n.y, Math.max(2, r * 0.32), 0, Math.PI * 2);
        S.ctx.fillStyle = 'rgba(255,250,240,.92)';
        S.ctx.fill();
      }
      if (S.hoverId === n.id) {
        S.ctx.beginPath();
        S.ctx.arc(n.x, n.y, r + 4, 0, Math.PI * 2);
        S.ctx.strokeStyle = hexA(m.color, .55);
        S.ctx.lineWidth = 1.4 / S.view.k;
        S.ctx.stroke();
      }
      S.ctx.globalAlpha = 1;
    });
    S.ctx.restore();

    // 属性带标题
    if (S.view.k > 0.42) {
      S.ctx.textAlign = 'center';
      S.ctx.textBaseline = 'middle';
      S.ctx.font = '11px "Songti SC","STSong","Microsoft YaHei",serif';
      S.bandInfo.forEach((b) => {
        const s2 = { x: b.x * S.view.k + S.view.x, y: b.y * S.view.k + S.view.y };
        if (s2.x < 20 || s2.x > S.W - 20) return;
        S.ctx.globalAlpha = 0.75;
        S.ctx.fillStyle = '#8a6a37';
        if (S.portraitLayout) {
          S.ctx.save();
          S.ctx.translate(s2.x + (b.x < 0 ? -34 : 34), s2.y);
          S.ctx.rotate(-Math.PI / 2);
          S.ctx.fillText('· ' + b.cls + ' ·', 0, 0);
          S.ctx.restore();
        } else {
          S.ctx.fillText('· ' + b.cls + ' ·', s2.x, s2.y + (b.y < 0 ? -54 : 54));
        }
      });
      S.ctx.globalAlpha = 1;
    }

    // 标签（屏幕空间，字号恒定；按重要度避让重叠）
    const order = D.nodes.slice().sort((a, b) => (isPerson(b) - isPerson(a)) || (b.deg - a.deg));
    const boxes = [];
    const overlaps = (r) => boxes.some((b) => !(r.x2 < b.x1 || r.x1 > b.x2 || r.y2 < b.y1 || r.y1 > b.y2));
    order.forEach((n) => {
      const v = api.visible(n);
      const sel = S.selectedId ? D.byId.get(S.selectedId) : null;
      let alpha = v ? 1 : 0.1;
      if (sel && v) {
        const inNeigh = n.id === S.selectedId || sel.out.concat(sel.inc).some((e) => e.s === n.id || e.t === n.id);
        alpha = inNeigh ? 1 : 0.14;
      }
      if (S.pathNodes) alpha = S.pathNodes.indexOf(n.id) >= 0 ? 1 : 0.12;
      if (S.highlightProp) alpha = 0.5;
      if (!v) return;
      const forcedLabel = n.id === S.selectedId || n.id === S.hoverId || (S.pathNodes && S.pathNodes.indexOf(n.id) >= 0);
      const s = screenOf(n);
      const r = api.nodeRadius(n) * S.view.k;
      const isP = isPerson(n);
      const size = (isP ? 12 : 11) * (n.name.length > 4 ? 0.88 : 1);
      S.ctx.font = (isP ? '600 ' : '400 ') + size.toFixed(1) + 'px "Songti SC","STSong","Microsoft YaHei",serif';
      S.ctx.textAlign = 'center';
      S.ctx.textBaseline = 'top';
      const label = n.name.replace('（史太君）', '');
      const tw = S.ctx.measureText(label).width;
      const forced = n.id === S.selectedId || n.id === S.hoverId || (S.pathNodes && S.pathNodes.indexOf(n.id) >= 0);
      const cands = [
        { x: s.x, y: s.y + r + 4, align: 'center', bx: s.x - tw / 2 - 3, by: s.y + r + 3 },
        { x: s.x, y: s.y - r - size - 3, align: 'center', bx: s.x - tw / 2 - 3, by: s.y - r - size - 5 },
        { x: s.x + r + 5, y: s.y - size / 2 + 1, align: 'left', bx: s.x + r + 3, by: s.y - size / 2 - 1 },
        { x: s.x - r - 5, y: s.y - size / 2 + 1, align: 'right', bx: s.x - r - tw - 8, by: s.y - size / 2 - 1 },
        { x: s.x, y: s.y - r - size - 16, align: 'center', bx: s.x - tw / 2 - 3, by: s.y - r - size - 18 }
      ];
      let chosen = null;
      for (let ci = 0; ci < cands.length; ci++) {
        const c = cands[ci];
        const rect = { x1: c.bx, y1: c.by, x2: c.bx + tw + 6, y2: c.by + size + 2 };
        if (!overlaps(rect)) { chosen = { c: c, rect: rect }; break; }
        if (forced && ci === 0) { chosen = { c: c, rect: rect }; }
      }
      if (!chosen) return;
      boxes.push(chosen.rect);
      S.ctx.globalAlpha = alpha;
      S.ctx.textAlign = chosen.c.align;
      S.ctx.fillStyle = 'rgba(255,253,246,.82)';
      S.ctx.fillRect(chosen.rect.x1, chosen.rect.y1, chosen.rect.x2 - chosen.rect.x1, chosen.rect.y2 - chosen.rect.y1);
      S.ctx.fillStyle = isP ? '#3a2f26' : '#5c5245';
      S.ctx.fillText(label, chosen.c.x, chosen.c.y);
      S.ctx.globalAlpha = 1;
    });
  }

  function drawShape(n, r, m, fill) {
    S.ctx.save();
    S.ctx.translate(n.x, n.y);
    S.ctx.beginPath();
    if (m.shape === 'square') {
      const s = r * 0.92;
      roundRect(-s, -s, s * 2, s * 2, r * 0.3);
    } else if (m.shape === 'diamond') {
      S.ctx.moveTo(0, -r * 1.12); S.ctx.lineTo(r * 1.05, 0); S.ctx.lineTo(0, r * 1.12); S.ctx.lineTo(-r * 1.05, 0); S.ctx.closePath();
    } else if (m.shape === 'hex') {
      for (let i = 0; i < 6; i++) {
        const a = Math.PI / 6 + i * Math.PI / 3;
        const px = Math.cos(a) * r, py = Math.sin(a) * r;
        i ? S.ctx.lineTo(px, py) : S.ctx.moveTo(px, py);
      }
      S.ctx.closePath();
    } else if (m.shape === 'tri') {
      S.ctx.moveTo(0, -r * 1.1); S.ctx.lineTo(r * 1.05, r * 0.75); S.ctx.lineTo(-r * 1.05, r * 0.75); S.ctx.closePath();
    } else {
      S.ctx.arc(0, 0, r, 0, Math.PI * 2);
    }
    S.ctx.fillStyle = fill;
    S.ctx.shadowColor = hexA(m.color, .3);
    S.ctx.shadowBlur = 7 / S.view.k;
    S.ctx.shadowOffsetY = 2 / S.view.k;
    S.ctx.fill();
    S.ctx.shadowColor = 'transparent';
    S.ctx.shadowBlur = 0;
    S.ctx.strokeStyle = 'rgba(255,251,242,.75)';
    S.ctx.lineWidth = 1.2 / S.view.k;
    S.ctx.stroke();
    S.ctx.restore();
  }

  function roundRect(x, y, w, h, r) {
    S.ctx.moveTo(x + r, y);
    S.ctx.arcTo(x + w, y, x + w, y + h, r);
    S.ctx.arcTo(x + w, y + h, x, y + h, r);
    S.ctx.arcTo(x, y + h, x, y, r);
    S.ctx.arcTo(x, y, x + w, y, r);
    S.ctx.closePath();
  }

  function loop() {
    api.step();
    if (S.camAnim) {
      const now = performance.now();
      const t = Math.min(1, (now - S.camAnim.t0) / S.camAnim.dur);
      const e = 1 - Math.pow(1 - t, 3);
      S.view.k = S.camAnim.k0 + (S.camAnim.k1 - S.camAnim.k0) * e;
      S.view.x = S.camAnim.x0 + (S.camAnim.x1 - S.camAnim.x0) * e;
      S.view.y = S.camAnim.y0 + (S.camAnim.y1 - S.camAnim.y0) * e;
      if (t >= 1) S.camAnim = null;
    }
    draw();
    requestAnimationFrame(loop);
  }

  function focusNode(n) {
    if (!n) return;
    const k = Math.max(1.15, Math.min(1.8, S.view.k));
    S.camAnim = {
      t0: performance.now(), dur: 520,
      k0: S.view.k, k1: k,
      x0: S.view.x, x1: S.W / 2 - n.x * k,
      y0: S.view.y, y1: S.H / 2 - n.y * k
    };
  }
  function fitBounds() {
    const xs = D.nodes.map((n) => n.x).sort((a, b) => a - b);
    const ys = D.nodes.map((n) => n.y).sort((a, b) => a - b);
    const q = (arr, p) => arr[Math.min(arr.length - 1, Math.max(0, Math.round((arr.length - 1) * p)))];
    const minX = q(xs, 0.005) - 58, maxX = q(xs, 0.995) + 58;
    const minY = q(ys, 0.005) - 96, maxY = q(ys, 0.995) + 96;
    const k = Math.min(S.W / (maxX - minX), S.H / (maxY - minY), 1.5) * 0.9;
    return { k: k, x: S.W / 2 - ((minX + maxX) / 2) * k, y: S.H / 2 - ((minY + maxY) / 2) * k };
  }
  function fitView() {
    const b = fitBounds();
    S.camAnim = { t0: performance.now(), dur: 480, k0: S.view.k, k1: b.k, x0: S.view.x, x1: b.x, y0: S.view.y, y1: b.y };
  }
  function fitInstant() {
    const b = fitBounds();
    S.view.k = b.k; S.view.x = b.x; S.view.y = b.y; S.camAnim = null;
  }

  /* ---- 对外导出 ---- */
  Object.assign(api, { screenOf, worldOf, edgePath, pairIndex, draw, drawShape, roundRect, loop, focusNode, fitBounds, fitView, fitInstant });
})(window.DRM.api, window.DRM.meta, window.DRM.data, window.DRM.state);
