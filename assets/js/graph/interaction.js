/* ==========================================================================
   图谱交互
   拖拽、平移、滚轮缩放、悬停高亮与提示气泡
   --------------------------------------------------------------------------
   模块：graph/interaction.js
   ========================================================================== */
(function (api, M, D, S) {
  'use strict';
  const { $, esc, meta } = api;

  /* ---------------- 图谱交互 ---------------- */
  let pointerDown = null, moved = false;

  S.canvas.addEventListener('pointerdown', (ev) => {
    S.canvas.setPointerCapture(ev.pointerId);
    const p = canvasPoint(ev);
    const w = api.worldOf(p.x, p.y);
    const hit = hitNode(w.x, w.y);
    moved = false;
    pointerDown = { x: p.x, y: p.y, node: hit, startView: { x: S.view.x, y: S.view.y } };
    if (hit) {
      S.dragNode = hit;
      S.simAlpha = Math.max(S.simAlpha, 0.28);
      hit.fx = hit.x; hit.fy = hit.y;
    } else {
      S.panning = true;
      S.canvas.classList.add('grabbing');
    }
  });

  S.canvas.addEventListener('pointermove', (ev) => {
    const p = canvasPoint(ev);
    if (pointerDown) {
      const dx = p.x - pointerDown.x, dy = p.y - pointerDown.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
      if (S.dragNode) {
        const w = api.worldOf(p.x, p.y);
        S.dragNode.x = w.x; S.dragNode.y = w.y;
        S.dragNode.vx = 0; S.dragNode.vy = 0;
      } else if (S.panning) {
        S.view.x = pointerDown.startView.x + dx;
        S.view.y = pointerDown.startView.y + dy;
      }
      return;
    }
    const w = api.worldOf(p.x, p.y);
    const hit = hitNode(w.x, w.y);
    S.hoverId = hit ? hit.id : null;
    S.canvas.style.cursor = hit ? 'pointer' : 'grab';
    showTip(hit, p);
  });

  S.canvas.addEventListener('pointerup', (ev) => {
    const p = canvasPoint(ev);
    if (pointerDown && !moved) {
      const w = api.worldOf(p.x, p.y);
      const hit = hitNode(w.x, w.y);
      if (hit) api.selectNode(hit.id);
      else { S.pathNodes = null; S.pathEdgeKeys = null; api.showPanelDefault(); }
    }
    if (S.dragNode) { S.dragNode.fx = null; S.dragNode.fy = null; S.simAlpha = Math.max(S.simAlpha, 0.3); }
    S.dragNode = null; S.panning = false; pointerDown = null;
    S.canvas.classList.remove('grabbing');
  });

  S.canvas.addEventListener('wheel', (ev) => {
    ev.preventDefault();
    const p = canvasPoint(ev);
    const before = api.worldOf(p.x, p.y);
    const factor = Math.exp(-ev.deltaY * 0.0016);
    const k = Math.max(0.32, Math.min(3.2, S.view.k * factor));
    S.view.k = k;
    S.view.x = p.x - before.x * k;
    S.view.y = p.y - before.y * k;
  }, { passive: false });

  S.canvas.addEventListener('dblclick', (ev) => {
    const p = canvasPoint(ev);
    const w = api.worldOf(p.x, p.y);
    const hit = hitNode(w.x, w.y);
    if (hit) api.focusNode(hit);
  });

  function canvasPoint(ev) {
    const rect = S.canvas.getBoundingClientRect();
    return { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
  }
  function hitNode(wx, wy) {
    let best = null, bd = 1e9;
    for (let i = D.nodes.length - 1; i >= 0; i--) {
      const n = D.nodes[i];
      if (!api.visible(n)) continue;
      const r = api.nodeRadius(n) + 6;
      const dx = n.x - wx, dy = n.y - wy;
      const d = dx * dx + dy * dy;
      if (d < r * r && d < bd) { bd = d; best = n; }
    }
    return best;
  }

  const tip = $('#tip');
  function showTip(n, p) {
    if (!n) { tip.classList.remove('show'); return; }
    const m = meta(n);
    tip.innerHTML = '<b>' + esc(n.name) + '</b><div class="tt-type">' + esc(n.cls) + (n.gender ? ' · ' + n.gender : '') + ' · ' + n.deg + ' 条关系</div>' + (n.comment ? '<div>' + esc(n.comment) + '</div>' : '');
    tip.style.left = Math.min(S.W - 240, p.x + 14) + 'px';
    tip.style.top = Math.max(8, p.y - 10) + 'px';
    tip.classList.add('show');
  }

  /* ---- 对外导出 ---- */
  Object.assign(api, { pointerDown, canvasPoint, hitNode, tip, showTip });
})(window.DRM.api, window.DRM.meta, window.DRM.data, window.DRM.state);
