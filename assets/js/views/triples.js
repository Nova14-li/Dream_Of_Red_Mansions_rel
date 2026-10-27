/* ==========================================================================
   三元组页
   三元组展开、谓词分布与检索过滤
   --------------------------------------------------------------------------
   模块：views/triples.js
   ========================================================================== */
(function (api, M, D, S) {
  'use strict';
  const { $, esc } = api;

  /* ---------------- 三元组页 ---------------- */
  let tripleQuery = '';
  let tripleFilter = '';
  function allTriples() {
    const list = [];
    D.nodes.forEach((n) => {
      list.push({ s: n.name, p: 'rdf:type', o: n.cls, kind: 'type' });
      Object.keys(n.rel).forEach((p) => n.rel[p].forEach((o) => list.push({ s: n.name, p: p, o: o, kind: 'obj' })));
      Object.keys(n.data).forEach((p) => list.push({ s: n.name, p: p, o: n.data[p], kind: 'data' }));
      if (n.comment) list.push({ s: n.name, p: 'rdfs:comment', o: n.comment, kind: 'comment' });
    });
    return list;
  }
  const TRIPLES = allTriples();

  function renderTriples() {
    const body = $('#triple-body');
    const predCount = {};
    TRIPLES.forEach((t) => { predCount[t.p] = (predCount[t.p] || 0) + 1; });
    const preds = Object.keys(predCount).sort((a, b) => predCount[b] - predCount[a]);
    const maxC = Math.max.apply(null, preds.map((p) => predCount[p]));

    const shown = TRIPLES.filter((t) => {
      if (tripleFilter && t.p !== tripleFilter) return false;
      if (tripleQuery) {
        const q = tripleQuery.toLowerCase();
        return (t.s + t.p + t.o).toLowerCase().indexOf(q) >= 0;
      }
      return true;
    });

    body.innerHTML =
      '<div class="page-title"><h2>底层三元组</h2><p>共 ' + TRIPLES.length + ' 条（含 ' + D.nodes.length + ' 条类型断言、' + D.edges.length + ' 条关系断言）</p></div>' +
      '<p class="lead">这是 <em>dream_of_red_mansions.rdf</em> 展开后的主语–谓词–宾语清单，也是上面所有视图的唯一数据来源。可按谓词过滤或直接搜索。</p>' +
      '<div class="grid-2">' +
        '<div class="card"><h3>谓词分布 <span class="badge">' + preds.length + ' 种谓词</span></h3><div class="bars">' +
          preds.map((p) => '<div class="bar-row"><span style="color:' + (p.indexOf('rdf:') === 0 || p.indexOf('rdfs:') === 0 ? 'var(--ink-3)' : 'var(--gold)') + '">' + esc(p) + '</span><div class="bar-track"><div class="bar-fill" data-w="' + Math.round(predCount[p] / maxC * 100) + '"></div></div><span style="text-align:right">' + predCount[p] + '</span></div>').join('') +
        '</div></div>' +
        '<div class="card"><h3>断言概况</h3>' +
          '<div class="stat-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:8px">' +
            '<div class="stat-card"><b>' + D.edges.length + '</b><span>对象属性断言</span></div>' +
            '<div class="stat-card"><b>' + D.nodes.filter((n) => n.gender).length + '</b><span>性别数据属性</span></div>' +
            '<div class="stat-card"><b>' + D.commentCount + '</b><span>rdfs:comment</span></div>' +
            '<div class="stat-card"><b>' + D.inference.fresh + '</b><span>可推理增量</span></div>' +
          '</div>' +
          '<div class="ghost-note" style="margin-top:12px">样本三元组：<br><code style="font-size:11px;color:var(--gold)">贾宝玉&nbsp;&nbsp;父亲&nbsp;&nbsp;贾政</code><br><code style="font-size:11px;color:var(--gold)">林黛玉&nbsp;&nbsp;出身&nbsp;&nbsp;姑苏林家</code></div>' +
        '</div>' +
      '</div>' +
      '<div class="card" style="margin-top:16px"><h3>三元组清单 <span class="badge">' + shown.length + ' / ' + TRIPLES.length + '</span></h3>' +
        '<div class="triple-tools"><input id="tq" placeholder="搜索主语 / 谓词 / 宾语…" value="' + esc(tripleQuery) + '"><select id="tp"><option value="">全部谓词</option>' + preds.map((p) => '<option value="' + esc(p) + '"' + (tripleFilter === p ? ' selected' : '') + '>' + esc(p) + ' (' + predCount[p] + ')</option>').join('') + '</select></div>' +
        '<div style="max-height:min(520px,52vh);overflow-y:auto" class="scroll"><table class="tbl"><thead><tr><th>主语</th><th>谓词</th><th>宾语</th><th style="width:60px">类型</th></tr></thead><tbody>' +
          shown.slice(0, 400).map((t) => '<tr><td class="s" data-n="' + esc(t.s) + '">' + esc(t.s) + '</td><td class="p">' + esc(t.p) + '</td><td class="o" data-n="' + esc(t.o) + '">' + esc(t.o) + '</td><td style="font-size:10.5px;color:var(--ink-3)">' + (t.kind === 'type' ? '类型' : t.kind === 'data' ? '数据' : t.kind === 'comment' ? '注释' : '关系') + '</td></tr>').join('') +
        '</tbody></table></div></div>';

    requestAnimationFrame(() => {
      body.querySelectorAll('.bar-fill').forEach((el) => { el.style.width = el.getAttribute('data-w') + '%'; });
    });

    const tq = $('#tq'), tp = $('#tp');
    tq.addEventListener('input', () => { tripleQuery = tq.value; const pos = tq.selectionStart; renderTriples(); const n2 = $('#tq'); n2.focus(); try { n2.setSelectionRange(pos, pos); } catch (e) {} });
    tp.addEventListener('change', () => { tripleFilter = tp.value; renderTriples(); });
    body.querySelectorAll('[data-n]').forEach((el) => {
      el.addEventListener('click', () => {
        const nm = el.getAttribute('data-n');
        if (D.byId.has(nm)) { api.switchView('graph'); api.selectNode(nm, { focus: true }); }
      });
    });
  }

  /* ---- 对外导出 ---- */
  Object.assign(api, { tripleQuery, tripleFilter, allTriples, TRIPLES, renderTriples });
})(window.DRM.api, window.DRM.meta, window.DRM.data, window.DRM.state);
