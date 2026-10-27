/* ==========================================================================
   推理页
   规则分流展示、增量统计、一致性结论与缺口清单
   --------------------------------------------------------------------------
   模块：views/reasoning.js
   ========================================================================== */
(function (api, M, D, S) {
  'use strict';
  const { $, esc } = api;

  /* ---------------- 推理页 ---------------- */
  let ruleFilter = 'all';
  function renderReasoning() {
    const body = $('#reason-body');
    const counts = D.inference.byRule;
    const rows = D.inference.items.filter((i) => ruleFilter === 'all' || i.rule === ruleFilter);

    const itemsHtml = rows.slice(0, 400).map((i) => {
      const rm = M.RULE_META[i.rule];
      return '<div class="infer-row">' +
        '<span class="tag ' + (i.rule === 'sub' ? 'moss' : i.rule === 'inv' ? 'red' : 'gold') + '" title="' + esc(rm.desc) + '">' + rm.label + '</span>' +
        '<div><div class="pre">' + esc(i.s) + ' —' + esc(i.p) + '→ ' + esc(i.t) + '<span style="color:var(--gold);margin-left:8px;font-size:10.5px">' + esc(i.from) + '</span></div>' +
        '<div class="con">⇒ ' + esc(i.s) + ' —<b>' + esc(i.p) + '</b>→ ' + esc(i.t) + '</div></div>' +
        '<span class="st ' + (i.dup ? 'dup' : 'new') + '">' + (i.dup ? '已在数据中' : '推理新增') + '</span>' +
        '</div>';
    }).join('');

    const checkHtml = D.checks.map((c) => '<div class="chk"><span class="ic ' + (c.ok ? 'ok' : 'bad') + '">' + (c.ok ? '✓' : '!') + '</span><div><b>' + esc(c.t) + '</b><br><span>' + esc(c.d) + '</span></div></div>').join('');

    const gapHtml = D.gaps.map((g) => '<div class="gap-item" data-gap="' + esc(g.list[0] || '') + '"><span class="g-n">' + esc(g.t) + '</span><span style="color:var(--ink-3);font-size:11px">' + esc(g.list.join('、')) + '</span></div>').join('');

    body.innerHTML =
      '<div class="page-title"><h2>推理引擎</h2><p>在浏览器内模拟 OWL 闭包运算：子属性回推 → 逆属性补全 → 对称补全</p></div>' +
      '<p class="lead">本体真正的价值不在 ' + (D.edges.length + D.persons.length) + ' 条显式断言，而在推理机能从中推出的未写下结论。下面每条推理都标注了触发它的公理与前提断言；点击「在图中显示推理边」可把它们（金色虚线）叠回图谱。</p>' +
      '<div class="grid-2">' +
        '<div class="card"><h3>推理增量 <span class="badge">显式 ' + D.edges.length + ' 条 → 闭包 ' + (D.edges.length + D.inference.fresh) + ' 条</span></h3>' +
          '<div class="stat-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px">' +
            '<div class="stat-card"><b>' + counts.sub + '</b><span>子属性回推</span></div>' +
            '<div class="stat-card"><b>' + counts.inv + '</b><span>逆属性补全</span></div>' +
            '<div class="stat-card"><b>' + counts.sym + '</b><span>对称补全</span></div>' +
          '</div>' +
          '<div style="font-size:12px;color:var(--ink-2);line-height:1.9">' +
            '其中 <b style="color:var(--moss)">' + D.inference.fresh + '</b> 条为数据里没有、由公理推出的新增知识；<b>' + D.inference.dup + '</b> 条与显式断言重合，说明人工录入与推理结果一致（人工冗余，非矛盾）。' +
          '</div>' +
          '<div class="p-actions" style="margin-top:12px"><button class="btn solid" id="btn-apply-infer">在图中显示推理边</button><button class="btn ghost" id="btn-export-infer">复制推理清单</button></div>' +
        '</div>' +
        '<div class="card"><h3>一致性检查 <span class="badge">' + D.checks.filter((c) => c.ok).length + '/' + D.checks.length + ' 通过</span></h3><div class="checks-list">' + checkHtml + '</div></div>' +
      '</div>' +
      '<div class="grid-2" style="margin-top:16px">' +
        '<div class="card"><h3>推理明细 <span class="badge">' + rows.length + ' 条</span></h3>' +
          '<div class="rule-chips" id="rule-chips">' +
            '<button class="chip' + (ruleFilter === 'all' ? ' on' : '') + '" data-rule="all">全部 ' + D.inference.items.length + '</button>' +
            '<button class="chip' + (ruleFilter === 'sub' ? ' on' : '') + '" data-rule="sub">子属性回推 ' + counts.sub + '</button>' +
            '<button class="chip' + (ruleFilter === 'inv' ? ' on' : '') + '" data-rule="inv">逆属性补全 ' + counts.inv + '</button>' +
            '<button class="chip' + (ruleFilter === 'sym' ? ' on' : '') + '" data-rule="sym">对称补全 ' + counts.sym + '</button>' +
          '</div>' +
          '<div style="max-height:420px;overflow-y:auto;padding-right:4px" class="scroll">' + itemsHtml + '</div>' +
        '</div>' +
        '<div class="card"><h3>数据缺口 <span class="badge">由断言统计自动发现</span></h3>' + gapHtml +
          '<div class="ghost-note" style="margin-top:12px;line-height:1.9">这些缺口不是错误，而是建模边界的记录：林如海缺「出身/住所」正说明姻亲尚未建档；贾敬缺「生活地区」与其出家设定一致；薛家与「世袭三品威烈将军」是为薛宝钗与贾赦一支预留的孤立实例。</div>' +
        '</div>' +
      '</div>';

    body.querySelectorAll('[data-rule]').forEach((el) => {
      el.addEventListener('click', () => { ruleFilter = el.getAttribute('data-rule'); renderReasoning(); });
    });
    const applyBtn = $('#btn-apply-infer');
    if (applyBtn) applyBtn.addEventListener('click', () => {
      S.showInfer = true;
      $('#btn-infer').classList.add('on');
      api.switchView('graph');
      S.simAlpha = Math.max(S.simAlpha, 0.5);
    });
    const expBtn = $('#btn-export-infer');
    if (expBtn) expBtn.addEventListener('click', () => {
      const txt = D.inference.items.filter((i) => !i.dup).map((i) => i.s + '\t' + i.p + '\t' + i.t + '\t' + M.RULE_META[i.rule].label).join('\n');
      copyText(txt, expBtn);
    });
    body.querySelectorAll('[data-gap]').forEach((el) => {
      el.addEventListener('click', () => {
        const name = el.getAttribute('data-gap');
        if (name && D.byId.has(name)) { api.switchView('graph'); api.selectNode(name, { focus: true }); }
      });
    });
  }

  function copyText(txt, btn) {
    const done = () => { if (btn) { const old = btn.textContent; btn.textContent = '已复制 ' + txt.split('\n').length + ' 条'; setTimeout(() => { btn.textContent = old; }, 1600); } };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done).catch(done);
    else {
      const ta = document.createElement('textarea');
      ta.value = txt; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta); done();
    }
  }

  /* ---- 对外导出 ---- */
  Object.assign(api, { ruleFilter, renderReasoning, copyText });
})(window.DRM.api, window.DRM.meta, window.DRM.data, window.DRM.state);
