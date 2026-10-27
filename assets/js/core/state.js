/* ==========================================================================
   运行时状态
   集中存放会被多个模块读写的可变状态，避免闭包拆分后各持一份副本。
   数据本身（nodes/edges）不在此处，它们属于 DRM.data，装配后只读。
   --------------------------------------------------------------------------
   分组：画布与相机 / 筛选 / 选中与面板 / 路径高亮 / 图谱开关 / 世系图 / 各页局部
   文件：assets/js/core/state.js
   ========================================================================== */
(function (api, M, D, S) {
  'use strict';

  /* ---- 画布与相机 ---- */
  S.canvas = document.querySelector('#cv');
  S.ctx = S.canvas.getContext('2d');
  S.W = 0;                                         // 逻辑宽高，resize() 时写入
  S.H = 0;
  S.DPR = Math.min(window.devicePixelRatio || 1, 2);
  S.view = { x: 0, y: 0, k: 1 };                   // 世界坐标 → 屏幕坐标
  S.camAnim = null;                                // 相机补间任务

  /* ---- 筛选 ---- */
  S.filters = {
    types: new Set(Object.keys(D.typeCount)),
    gender: '全部',
    places: new Set()
  };

  /* ---- 选中与面板 ---- */
  S.panel = document.querySelector('#panel');
  S.panelEmpty = document.querySelector('#panel-empty');
  S.panelBody = document.querySelector('#panel-body');
  S.selectedId = null;
  S.hoverId = null;                                // 悬停节点 id

  /* ---- 路径与属性高亮 ---- */
  S.pathNodes = null;                              // 关系链命中的节点 id 数组
  S.pathEdgeKeys = null;
  S.highlightProp = null;                          // 本体页点选属性后的高亮

  /* ---- 图谱开关 ---- */
  S.showInfer = false;
  S.freeMode = false;
  S.simAlpha = 1;
  S.dragNode = null;
  S.panning = false;
  S.portraitLayout = window.innerWidth < window.innerHeight * 1.02;
  S.bandInfo = [];                                 // 属性带的落点，布局时重建

  /* ---- 世系图 ---- */
  S.showSib = false;
  S.treeState = { positions: {}, gens: {}, rendered: false };
})(window.DRM.api, window.DRM.meta, window.DRM.data, window.DRM.state);
