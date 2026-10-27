/* ==========================================================================
   本体结构页
   类层级、属性树、OWL 特性说明与实例索引
   --------------------------------------------------------------------------
   模块：views/ontology.js
   ========================================================================== */
(function (api, M, D, S) {
  'use strict';
  const { $, esc, hexA } = api;

  /* ---------------- 本体结构页 ---------------- */
  function renderOntology() {
    const body = $('#onto-body');
    const clsTree = D.DATA.classes;
    const roots = clsTree.filter((c) => !c.super.length);
    function clsBlock(c, depth) {
      const insts = D.nodes.filter((n) => n.cls === c.name);
      let html = '<div class="klass" style="margin-left:' + depth * 14 + 'px;border-left-color:' + (depth > 0 ? hexA('#b08d57', .5) : '#b08d57') + '">';
      html += '<div class="k-head"><span class="k-name">' + esc(c.name) + '</span>';
      html += insts.length ? '<span class="tag">' + insts.length + ' 个实例</span>' : '<span class="tag">抽象类</span>';
      html += '</div>';
      html += '<div class="k-desc">' + esc(M.CLASS_DESC[c.name] || '') + '</div>';
      if (insts.length) {
        html += '<div class="insts">' + insts.map((n) => '<span class="inst" data-node="' + esc(n.name) + '">' + esc(n.name) + '</span>').join('') + '</div>';
      }
      html += '</div>';
      clsTree.filter((k) => k.super.indexOf(c.name) >= 0).forEach((k) => { html += clsBlock(k, depth + 1); });
      return html;
    }

    const propBySuper = {};
    D.DATA.objectProps.forEach((p) => {
      const sup = (p.super || []).filter((s) => s.indexOf('owl:') !== 0)[0];
      const k = sup || '__root';
      (propBySuper[k] = propBySuper[k] || []).push(p);
    });

    function badge(p) {
      const map = { functional: ['函数型', 'func'], symmetric: ['对称', 'sym'], asymmetric: ['非对称', ''], irreflexive: ['非自反', ''] };
      let s = (p.characteristics || []).map((c) => {
        const mm = map[c];
        return mm ? '<span class="badge-s ' + mm[1] + '">' + mm[0] + '</span>' : '';
      }).join('');
      if ((p.disjointWith || []).length) s += '<span class="badge-s dis">互斥</span>';
      if ((p.inverseOf || []).length) s += '<span class="badge-s">逆：' + p.inverseOf.map((x) => x.replace('owl:', '')).join('/') + '</span>';
      return s;
    }
    function propRows(list) {
      return list.map((p) => {
        const cnt = D.edges.filter((e) => e.p === p.name).length;
        const dom = (p.domain || []).join('/') || '（略）';
        const rng = (p.range || []).join('/') || '（略）';
        return '<div class="prop" data-prop="' + esc(p.name) + '">' +
          '<div class="pn">' + esc(p.name) + '</div>' +
          '<div class="pr"><span>' + dom + '</span><span class="arrow">→</span><span>' + rng + '</span>' + badge(p) + '</div>' +
          '<div style="font-size:11px;color:var(--ink-3)">' + cnt + ' 条</div>' +
          '</div>';
      }).join('');
    }

    function propRow(p, indent) {
      const cnt = D.edges.filter((e) => e.p === p.name).length;
      const dom = (p.domain || []).join('/') || '（略）';
      const rng = (p.range || []).join('/') || '（略）';
      const kids = propBySuper[p.name] || [];
      return '<div class="prop" data-prop="' + esc(p.name) + '" style="padding-left:' + indent + 'px">' +
        '<div class="pn">' + (indent ? '<span style="color:var(--gold);font-size:10px">└ </span>' : '') + esc(p.name) + '</div>' +
        '<div class="pr"><span>' + dom + '</span><span class="arrow">→</span><span>' + rng + '</span>' + badge(p) + '</div>' +
        '<div style="font-size:11px;color:var(--ink-3)">' + cnt + ' 条</div>' +
        '</div>' + kids.map((k) => propRow(k, indent + 16)).join('');
    }

    let propHtml = '';
    propHtml += '<div style="font-size:11px;color:var(--ink-3);margin-bottom:6px;letter-spacing:1px">owl:topObjectProperty</div>';
    const PROP_ORDER = ['夫妻', '父母', '子女', '兄弟姐妹', '出身', '住所', '生活地区', '官职爵位'];
    const rootProps = (propBySuper['__root'] || []).slice().sort((a, b) => {
      const ia = PROP_ORDER.indexOf(a.name), ib = PROP_ORDER.indexOf(b.name);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
    rootProps.forEach((p) => { propHtml += propRow(p, 0); });

    let dataHtml = D.DATA.dataProps.map((p) => {
      const isEnum = p.rangeKind === 'enum';
      return '<div class="prop"><div class="pn">' + esc(p.name) + '</div><div class="pr"><span>' + (p.domain || []).join('/') + '</span><span class="arrow">→</span><span>' + (isEnum ? '枚举 { ' + p.range.join(' / ') + ' }' : p.range.join('/')) + '</span>' +
        (p.characteristics || []).map((c) => '<span class="badge-s func">' + (c === 'functional' ? '函数型' : c) + '</span>').join('') + '</div><div style="font-size:11px;color:var(--ink-3)">' + (isEnum ? 'owl:oneOf' : '整数') + '</div></div>';
    }).join('');

    body.innerHTML =
      '<div class="page-title"><h2>本体结构</h2><p>' + D.DATA.classes.length + ' 个类 · ' + D.DATA.objectProps.length + ' 个对象属性 · ' + D.DATA.dataProps.length + ' 个数据属性 · ' + D.nodes.length + ' 个个体 · ' + D.edges.length + ' 条关系断言</p></div>' +
      '<p class="lead">本体以 <em>人物</em> 为唯一主体类，用 <em>夫妻 / 父母 / 子女</em> 三条主链搭出血缘与婚姻骨架，再用 <em>出身 / 住所 / 生活地区 / 官职爵位</em> 四条外围关系把人物挂到门第、宅院、地域与爵位上。点击类名下的实例可跳到图谱中查看其全部断言。</p>' +
      '<div class="grid-2">' +
        '<div class="card"><h3>类层级 <span class="badge">owl:Thing 下 8 个类</span></h3>' + roots.map((c) => clsBlock(c, 0)).join('') + '</div>' +
        '<div class="card"><h3>对象属性 <span class="badge">14 个 · 点击可在图谱中高亮</span></h3>' + propHtml +
          '<div style="margin-top:14px;padding-top:10px;border-top:1px solid var(--line-2)"><div style="font-size:11px;letter-spacing:1px;color:var(--ink-3);margin-bottom:6px">数据属性（2 个）</div>' + dataHtml + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="grid-2" style="margin-top:16px">' +
        '<div class="card"><h3>五条反复使用的 OWL 特性</h3><div class="gloss">' +
          '<div><b>owl:AsymmetricProperty</b><span>若 p(a,b) 成立，则 p(b,a) 必不成立。OWL 2 中非对称已自动蕴含非自反。</span></div>' +
          '<div><b>owl:SymmetricProperty</b><span>双向成立，只需录一次。本体的「兄弟姐妹」是唯一对称属性。</span></div>' +
          '<div><b>owl:FunctionalProperty</b><span>值唯一。「出身」「性别」用它约束一人一门第一性别。</span></div>' +
          '<div><b>owl:inverseOf</b><span>互为逆属性。夫妻、父母–子女两条链都靠它自动补全方向。</span></div>' +
          '<div><b>owl:propertyDisjointWith</b><span>两个属性不会同时成立于同一对个体，等于内置了三条查错规则。</span></div>' +
        '</div></div>' +
        '<div class="card"><h3>设计取舍与已知局限</h3><ul class="note-list">' +
          '<li><b>抽象类不实例化</b>：「地点」「出身」只做分类层，让「人物去过的所有地点」这类跨类查询一次命中。</li>' +
          '<li><b>爵位建模为个体</b>：荣国公先后由贾源、贾代善承袭，可查「谁承袭了同一爵位」；代价是无法表达爵位等级高低。</li>' +
          '<li><b>表亲关系未建模</b>：黛玉与宝玉的「表兄妹」需靠 黛玉—母亲→贾敏—兄弟姐妹→贾政—儿子→宝玉 三段路径推出。</li>' +
          '<li><b>建筑无层级</b>：大观园属于荣国府这一事实未建模，无法查询「某建筑属于哪一府」。</li>' +
          '<li><b>注释中的悬空引用</b>：王夫人、赵姨娘、薛宝钗被注释提及，但并非本体实例。</li>' +
        '</ul></div>' +
      '</div>';

    body.querySelectorAll('[data-node]').forEach((el) => {
      el.addEventListener('click', () => { api.switchView('graph'); api.selectNode(el.getAttribute('data-node'), { focus: true }); });
    });
    body.querySelectorAll('[data-prop]').forEach((el) => {
      el.style.cursor = 'pointer';
      el.addEventListener('click', () => {
        S.highlightProp = el.getAttribute('data-prop');
        api.switchView('graph');
        S.simAlpha = Math.max(S.simAlpha, 0.2);
        $('#st-hint').textContent = '高亮属性：' + S.highlightProp + '（再次点击空白处取消）';
      });
    });
  }

  /* ---- 对外导出 ---- */
  Object.assign(api, { renderOntology });
})(window.DRM.api, window.DRM.meta, window.DRM.data, window.DRM.state);
