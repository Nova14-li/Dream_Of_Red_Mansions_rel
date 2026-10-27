/* ==========================================================================
   视图路由
   五个视图的切换、哈希同步与状态条文案
   --------------------------------------------------------------------------
   模块：ui/router.js
   ========================================================================== */
(function (api, M, D, S) {
  'use strict';
  const { $ } = api;

  /* ---------------- 视图切换 ---------------- */
  function switchView(v) {
    $('#tabs').querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.getAttribute('data-view') === v));
    ['graph', 'tree', 'onto', 'reason', 'triple'].forEach((k) => {
      const el = $('#view-' + k);
      if (el) el.classList.toggle('active', k === v);
    });
    if (v === 'graph') {
      requestAnimationFrame(() => { api.resize(); S.simAlpha = Math.max(S.simAlpha, 0.12); });
    }
    if (v === 'tree' && !S.treeState.rendered) { api.renderTree(); S.treeState.rendered = true; }
    if (window.history && history.replaceState) { try { history.replaceState(null, '', '#' + v); } catch (e) {} }
    $('#st-hint').textContent = { graph: '点击节点查看详情', tree: '悬停人物可高亮其血缘链', onto: '点击属性行可在图谱中高亮', reason: '推理在浏览器内实时计算', triple: '共 ' + api.TRIPLES.length + ' 条三元组' }[v];
    if (window.innerWidth <= 1000) $('#sidebar').classList.remove('open');
  }

  /* ---- 对外导出 ---- */
  Object.assign(api, { switchView });
})(window.DRM.api, window.DRM.meta, window.DRM.data, window.DRM.state);
