/* ==========================================================================
   详情面板
   概览卡片、个体详情渲染、选中与面板开合
   --------------------------------------------------------------------------
   模块：views/panel.js
   ========================================================================== */
(function (api, M, D, S) {
  'use strict';
  const { $, esc, meta, initial, shade, hexA, isPerson } = api;

  /* ---------------- 面板渲染 ---------------- */

  function buildOverview() {
    const grid = $('#overview');
    const items = [
      [String(D.nodes.length), '个体 Individuals'],
      [String(D.DATA.classes.length), '类 Classes'],
      [String(D.DATA.objectProps.length), '对象属性'],
      [String(D.edges.length), '关系断言'],
      [String(D.tripleCount), '三元组 Triples'],
      [String(D.inference.fresh), '推理增量']
    ];
    grid.innerHTML = items.map((it) => '<div class="stat-card"><b>' + it[0] + '</b><span>' + it[1] + '</span></div>').join('');
    grid.insertAdjacentHTML('afterend',
      '<div style="margin-top:16px;font-size:11px;letter-spacing:2px;color:var(--ink-3)">快速进入</div>' +
      '<div class="insts" style="margin-top:8px">' + ['贾宝玉', '林黛玉', '王熙凤', '贾母（史太君）', '贾政', '大观园', '荣国府'].map((n) => '<span class="inst" data-quick="' + n + '">' + n.replace('（史太君）', '') + '</span>').join('') + '</div>' +
      '<div class="ghost-note" style="margin-top:14px">图谱中：拖拽改变布局，滚轮缩放，双击聚焦。左侧可按类型、性别、居所筛选，也可查找两人之间的最短关系链。</div>');
    $('#panel-empty').querySelectorAll('[data-quick]').forEach((el) => {
      el.addEventListener('click', () => { api.switchView('graph'); selectNode(el.getAttribute('data-quick'), { focus: true }); });
    });
  }

  function showPanelDefault() {
    S.selectedId = null;
    S.panelEmpty.style.display = '';
    S.panelBody.style.display = 'none';
    S.panel.classList.remove('open');
    document.body.classList.add('panel-off');
    requestAnimationFrame(api.resize);
  }

  function selectNode(id, opts) {
    opts = opts || {};
    const n = D.byId.get(id);
    if (!n) return;
    S.selectedId = id;
    renderPanel(n);
    document.body.classList.remove('panel-off');
    if (window.innerWidth <= 760) S.panel.classList.add('open');
    requestAnimationFrame(api.resize);
    $('#st-hint').textContent = '已选择：' + n.name;
    if (opts.focus) api.focusNode(n);
    api.drawTreeHighlight(null);
  }
  window.__select = selectNode;

  function renderPanel(n) {
    const m = meta(n);
    const isP = isPerson(n);
    let html = '';
    html += '<div class="p-head">';
    html += '<div class="p-avatar" style="background:linear-gradient(150deg,' + m.color + ',' + shade(m.color, -22) + ')">' + esc(initial(n.name)) + '</div>';
    html += '<div class="p-title"><h2>' + esc(n.name) + '</h2><p class="p-meta">';
    html += '<span class="tag" style="border-color:' + hexA(m.color, .4) + ';color:' + m.color + ';background:' + hexA(m.color, .07) + '">' + esc(n.cls) + '</span>';
    if (n.gender) html += '<span class="tag">' + n.gender + '</span>';
    if ((n.rel['出身'] || []).length) html += '<span class="tag gold">' + esc(n.rel['出身'].join(' / ')) + '</span>';
    html += '</p></div></div>';

    if (n.comment) html += '<div class="p-comment">' + esc(n.comment) + '</div>';

    // 关系
    const props = Object.keys(n.rel);
    if (props.length) {
      html += '<div class="p-sec"><h4>对象属性断言</h4>';
      props.forEach((p) => {
        n.rel[p].forEach((v) => {
          html += '<div class="rel-row"><span class="rel-p">' + esc(p) + '</span><span class="rel-v" data-goto="' + esc(v) + '">' + esc(v) + '</span></div>';
        });
      });
      html += '</div>';
    }
    // 数据属性
    if (Object.keys(n.data).length) {
      html += '<div class="p-sec"><h4>数据属性</h4>';
      Object.keys(n.data).forEach((k) => {
        html += '<div class="rel-row"><span class="rel-p">' + esc(k) + '</span><span class="rel-v static">' + esc(n.data[k]) + '</span></div>';
      });
      html += '</div>';
    }
    // 被引用
    if (n.inc.length) {
      const groups = new Map();
      n.inc.forEach((e) => {
        if (!groups.has(e.p)) groups.set(e.p, []);
        groups.get(e.p).push(e.s);
      });
      html += '<div class="p-sec"><h4>反向引用 · 谁指向我</h4>';
      groups.forEach((arr, p) => {
        html += '<div class="rel-row"><span class="rel-p">' + esc(p) + ' ←</span><span class="rel-v static">';
        html += arr.map((s) => '<a data-goto="' + esc(s) + '" style="cursor:pointer;border-bottom:1px dashed rgba(158,43,37,.35);margin-right:6px;color:var(--ink)">' + esc(s) + '</a>').join(' ');
        html += '</span></div>';
      });
      html += '</div>';
    }
    // 类说明
    html += '<div class="p-sec"><h4>所属类</h4><div class="rel-row"><span class="rel-p">rdf:type</span><span class="rel-v" data-class="' + esc(n.cls) + '">' + esc(n.cls) + '<span style="color:var(--ink-3);font-size:11px"> · ' + (D.typeCount[n.cls] || 0) + ' 个实例</span></span></div>';
    if (M.CLASS_DESC[n.cls]) html += '<div class="ghost-note">' + esc(M.CLASS_DESC[n.cls]) + '</div>';
    html += '</div>';

    html += '<div class="p-actions"><button class="btn solid" data-act="focus">在图谱中聚焦</button>';
    if (isP) html += '<button class="btn ghost" data-act="path-from">设为路径起点</button>';
    html += '</div>';
    html += '<div class="ghost-note">IRI：<span style="word-break:break-all">' + esc(D.DATA.namespace + n.name) + '</span></div>';

    S.panelEmpty.style.display = 'none';
    S.panelBody.style.display = '';
    S.panelBody.innerHTML = html;

    S.panelBody.querySelectorAll('[data-goto]').forEach((el) => {
      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const id2 = el.getAttribute('data-goto');
        selectNode(id2, { focus: true });
      });
    });
    const clsEl = S.panelBody.querySelector('[data-class]');
    if (clsEl) clsEl.addEventListener('click', () => api.switchView('onto'));
    S.panelBody.querySelectorAll('[data-act]').forEach((el) => {
      el.addEventListener('click', () => {
        const a = el.getAttribute('data-act');
        if (a === 'focus') { api.switchView('graph'); api.focusNode(n); }
        if (a === 'path-from') { $('#path-from').value = n.name; api.switchView('graph'); }
      });
    });
  }

  /* ---- 对外导出 ---- */
  Object.assign(api, { buildOverview, showPanelDefault, selectNode, renderPanel });
})(window.DRM.api, window.DRM.meta, window.DRM.data, window.DRM.state);
