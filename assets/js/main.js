/* ==========================================================================
   入口装配
   事件绑定、首次布局预演、深链接解析与启动
   --------------------------------------------------------------------------
   模块：main.js
   ========================================================================== */
(function (api, M, D, S) {
  'use strict';
  const { $ } = api;

  /* ---------------- 绑定 ---------------- */
  function bind() {
    $('#tabs').addEventListener('click', (ev) => {
      const b = ev.target.closest('button[data-view]');
      if (b) api.switchView(b.getAttribute('data-view'));
    });
    $('#btn-relayout').addEventListener('click', () => {
      S.freeMode = false;
      $('#btn-cluster').classList.remove('on');
      api.layoutEllipse(true);
      S.simAlpha = 1;
      setTimeout(api.fitView, 600);
    });
    $('#btn-cluster').addEventListener('click', () => {
      S.freeMode = !S.freeMode;
      $('#btn-cluster').classList.toggle('on', S.freeMode);
      S.simAlpha = 1;
      if (!S.freeMode) {
        api.layoutEllipse(false);
        setTimeout(api.fitView, 600);
      }
      $('#st-hint').textContent = S.freeMode ? '自由力学布局：拖拽节点可任意排布' : '规整星环布局';
    });
    $('#btn-infer').addEventListener('click', () => {
      S.showInfer = !S.showInfer;
      $('#btn-infer').classList.toggle('on', S.showInfer);
      S.simAlpha = Math.max(S.simAlpha, 0.45);
      $('#st-hint').textContent = S.showInfer ? '已叠加 ' + D.inference.fresh + ' 条推理边（金色虚线）' : '仅显示显式断言';
    });
    $('#btn-tour').addEventListener('click', api.startTour);
    $('#btn-tour-stop').addEventListener('click', api.stopTour);
    $('#btn-fit').addEventListener('click', () => { S.highlightProp = null; S.pathNodes = null; S.pathEdgeKeys = null; api.fitView(); });
    $('#btn-path').addEventListener('click', api.runPath);
    $('#btn-path-clear').addEventListener('click', () => {
      S.pathNodes = null; S.pathEdgeKeys = null;
      $('#path-out').textContent = '选择两位人物，查看推理可达的关系链。';
    });
    $('#btn-filters').addEventListener('click', () => $('#sidebar').classList.toggle('open'));
    $('#btn-tree-sib').addEventListener('click', () => {
      S.showSib = !S.showSib;
      $('#btn-tree-sib').classList.toggle('on', S.showSib);
      const l = document.getElementById('sib-layer');
      if (l) l.style.display = S.showSib ? '' : 'none';
    });
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') {
        S.pathNodes = null; S.pathEdgeKeys = null; S.highlightProp = null;
        api.showPanelDefault();
        api.stopTour();
      }
    });
    window.addEventListener('resize', () => {
      api.resize();
      const pv = window.innerWidth < window.innerHeight * 1.02;
      if (pv !== S.portraitLayout) { S.portraitLayout = pv; api.layoutEllipse(false); S.simAlpha = 0.6; api.fitInstant(); }
      if (!S.treeState.rendered && $('#view-tree').classList.contains('active')) { api.renderTree(); S.treeState.rendered = true; }
    });
    S.canvas.addEventListener('click', () => {
      if (S.highlightProp && !S.hoverId) S.highlightProp = null;
    });
  }

  /* ---------------- 启动 ---------------- */
  function init() {
    api.resize();
    api.buildSidebar();
    api.buildOverview();
    api.initSearch();
    bind();
    api.renderOntology();
    api.renderReasoning();
    api.renderTriples();
    $('#st-count').textContent = D.nodes.length + ' 个个体 · ' + D.edges.length + ' 条关系断言 · ' + D.inference.fresh + ' 条推理增量';
    $('#st-ns').textContent = D.DATA.namespace;
    // 初始布局：先离线预演，保证首帧即稳定
    S.simAlpha = 1;
    for (let i = 0; i < 300; i++) api.step();
    api.fitInstant();
    const raw = (location.hash || '').replace('#', '');
    const parts = raw.split('/');
    const hv = parts[0];
    if (['graph', 'tree', 'onto', 'reason', 'triple'].indexOf(hv) >= 0 && hv !== 'graph') api.switchView(hv);
    if (parts[1]) {
      const nm = decodeURIComponent(parts[1]);
      if (D.byId.has(nm)) setTimeout(() => { api.switchView('graph'); api.selectNode(nm, { focus: true }); }, 60);
    }
    requestAnimationFrame(api.loop);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  /* ---- 对外导出 ---- */
  Object.assign(api, { bind, init });
})(window.DRM.api, window.DRM.meta, window.DRM.data, window.DRM.state);
