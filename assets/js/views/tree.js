/* ==========================================================================
   家族世系图
   由父母断言推导辈分、SVG 世系排布、血缘链高亮
   --------------------------------------------------------------------------
   模块：views/tree.js
   ========================================================================== */
(function (api, M, D, S) {
  'use strict';
  const { $, SVGNS, meta, hexA } = api;

  /* ---------------- 世系图 ---------------- */

  function buildTree() {
    const ps = D.persons;
    const byName = new Map(ps.map((n) => [n.name, n]));
    function parents(n) {
      return (n.rel['父亲'] || []).concat(n.rel['母亲'] || []).filter((x) => byName.has(x));
    }
    const memo = {};
    function genOf(name, stack) {
      if (memo[name] != null) return memo[name];
      if (stack.indexOf(name) >= 0) return 1;
      const n = byName.get(name);
      const ps2 = parents(n);
      let g = 1;
      if (ps2.length) {
        stack.push(name);
        g = 1 + Math.max.apply(null, ps2.map((p) => genOf(p, stack)));
        stack.pop();
      }
      memo[name] = g;
      return g;
    }
    ps.forEach((n) => genOf(n.name, []));

    // 配偶辈分对齐
    const spousePairs = [];
    ps.forEach((n) => {
      (n.rel['丈夫'] || []).concat(n.rel['妻子'] || []).forEach((s) => {
        if (byName.has(s)) spousePairs.push([n.name, s]);
      });
    });
    for (let it = 0; it < 4; it++) {
      spousePairs.forEach((p) => {
        const g = Math.max(memo[p[0]] || 1, memo[p[1]] || 1);
        memo[p[0]] = g; memo[p[1]] = g;
      });
    }

    // 分组 + 排序
    const gens = {};
    ps.forEach((n) => {
      const g = memo[n.name] || 1;
      (gens[g] = gens[g] || []).push(n);
    });
    S.treeState.gens = gens;

    const nodeW = 78, nodeH = 38, gap = 22, coupleGap = 16;
    const positions = {};
    let prevCenter = {};
    const genKeys = Object.keys(gens).map(Number).sort((a, b) => a - b);

    genKeys.forEach((g) => {
      const list = gens[g].slice();
      list.forEach((n) => {
        const ps2 = parents(n).map((x) => prevCenter[x]).filter((x) => x != null);
        n._bary = ps2.length ? ps2.reduce((a, b) => a + b, 0) / ps2.length : 9999;
      });
      list.sort((a, b) => (a._bary - b._bary) || (a.idx - b.idx));

      // 组对（夫妻相邻）
      const units = [];
      const used = new Set();
      list.forEach((n) => {
        if (used.has(n.name)) return;
        used.add(n.name);
        const sp = (n.rel['丈夫'] || []).concat(n.rel['妻子'] || []).find((s) => byName.has(s) && (memo[s] === g) && !used.has(s));
        if (sp) { used.add(sp); units.push([n, byName.get(sp)]); }
        else units.push([n]);
      });

      let cursor = 0;
      const centers = {};
      units.forEach((u) => {
        if (u.length === 2) {
          positions[u[0].name] = cursor + nodeW / 2;
          positions[u[1].name] = cursor + nodeW + coupleGap + nodeW / 2;
          centers[u[0].name] = positions[u[0].name];
          centers[u[1].name] = positions[u[1].name];
          cursor += nodeW * 2 + coupleGap + gap + 10;
        } else {
          positions[u[0].name] = cursor + nodeW / 2;
          centers[u[0].name] = positions[u[0].name];
          cursor += nodeW + gap;
        }
      });
      // 居中
      const total = cursor - gap;
      const shift = -total / 2;
      Object.keys(centers).forEach((k) => { positions[k] += shift; centers[k] += shift; });
      prevCenter = centers;
    });

    // 归一化到正坐标
    const xs = Object.keys(positions).map((k) => positions[k]);
    const minX = Math.min.apply(null, xs);
    Object.keys(positions).forEach((k) => { positions[k] = positions[k] - minX + 120; });
    const maxX = Math.max.apply(null, Object.keys(positions).map((k) => positions[k])) + 80;

    S.treeState.positions = positions;
    S.treeState.width = Math.max(900, maxX);
    S.treeState.genKeys = genKeys;
    return { positions, gens, genKeys, width: S.treeState.width, nodeW, nodeH, parents };
  }

  function renderTree() {
    const t = buildTree();
    const svg = $('#tree-svg');
    svg.innerHTML = '';
    const rowH = 122, top = 54;
    const W2 = t.width, H2 = top + t.genKeys.length * rowH + 40;
    svg.setAttribute('viewBox', '0 0 ' + W2 + ' ' + H2);
    svg.setAttribute('width', W2);
    svg.setAttribute('height', H2);
    svg.style.width = W2 + 'px';
    svg.style.height = H2 + 'px';

    const defs = document.createElementNS(SVGNS, 'defs');
    defs.innerHTML = '<filter id="tnShadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#5a3a20" flood-opacity="0.16"/></filter>';
    svg.appendChild(defs);

    const genLabels = ['', '第一代', '第二代', '第三代', '第四代', '第五代'];
    const genSub = ['', '军功封公', '承袭祖爵', '分房立派', '大观园一代', ''];

    t.genKeys.forEach((g, gi) => {
      const y = top + gi * rowH;
      const label = document.createElementNS(SVGNS, 'text');
      label.setAttribute('x', 10);
      label.setAttribute('y', y - 26);
      label.setAttribute('class', 'gen-label');
      label.textContent = (genLabels[g] || '第' + g + '代');
      svg.appendChild(label);
      if (genSub[g]) {
        const sub = document.createElementNS(SVGNS, 'text');
        sub.setAttribute('x', 10); sub.setAttribute('y', y - 10);
        sub.setAttribute('font-size', '10');
        sub.setAttribute('fill', 'rgba(139,127,111,.8)');
        sub.textContent = genSub[g];
        svg.appendChild(sub);
      }
      const line = document.createElementNS(SVGNS, 'line');
      line.setAttribute('x1', 96); line.setAttribute('y1', y - 30);
      line.setAttribute('x2', W2 - 20); line.setAttribute('y2', y - 30);
      line.setAttribute('class', 'gen-line');
      svg.appendChild(line);
    });

    const nodeY = (g) => top + t.genKeys.indexOf(g) * rowH + 12;
    const nodeH = t.nodeH, nodeW = t.nodeW;
    const centerY = (g) => nodeY(g) + nodeH / 2 - 6;

    // 亲代连线
    const edgeLayer = document.createElementNS(SVGNS, 'g');
    svg.appendChild(edgeLayer);
    const treeEdges = [];
    D.persons.forEach((n) => {
      const cg = t.genKeys.find((k) => (t.gens[k] || []).indexOf(n) >= 0);
      const cx = t.positions[n.name];
      const cy = centerY(cg) + nodeH / 2;
      t.parents(n).forEach((pn) => {
        if (t.positions[pn] == null) return;
        const pg = t.genKeys.find((k) => (t.gens[k] || []).some((x) => x.name === pn));
        const px = t.positions[pn];
        const py = centerY(pg) + nodeH / 2;
        const my = (py + centerY(cg) - nodeH / 2) / 2;
        const p = document.createElementNS(SVGNS, 'path');
        p.setAttribute('d', 'M' + px + ' ' + py + ' V' + my + ' H' + cx + ' V' + cy);
        p.setAttribute('fill', 'none');
        p.setAttribute('stroke', 'rgba(140,59,46,.42)');
        p.setAttribute('stroke-width', '1.4');
        p.setAttribute('data-parent', pn);
        p.setAttribute('data-child', n.name);
        edgeLayer.appendChild(p);
        treeEdges.push({ el: p, parent: pn, child: n.name });
      });
    });

    // 夫妻连线
    const spouseSeen = new Set();
    D.persons.forEach((n) => {
      (n.rel['丈夫'] || []).concat(n.rel['妻子'] || []).forEach((s) => {
        const k = [n.name, s].sort().join('~');
        if (spouseSeen.has(k) || t.positions[s] == null) return;
        spouseSeen.add(k);
        const g = t.genKeys.find((k2) => (t.gens[k2] || []).some((x) => x.name === n.name));
        const y = centerY(g);
        const x1 = Math.min(t.positions[n.name], t.positions[s]) + nodeW / 2;
        const x2 = Math.max(t.positions[n.name], t.positions[s]) - nodeW / 2;
        for (let i = 0; i < 2; i++) {
          const l = document.createElementNS(SVGNS, 'line');
          l.setAttribute('x1', x1); l.setAttribute('y1', y - 2 + i * 4);
          l.setAttribute('x2', x2); l.setAttribute('y2', y - 2 + i * 4);
          l.setAttribute('stroke', '#a8324a');
          l.setAttribute('stroke-width', '1.3');
          edgeLayer.appendChild(l);
        }
        const mark = document.createElementNS(SVGNS, 'circle');
        mark.setAttribute('cx', (x1 + x2) / 2); mark.setAttribute('cy', y);
        mark.setAttribute('r', '3');
        mark.setAttribute('fill', '#a8324a');
        mark.setAttribute('opacity', '.8');
        edgeLayer.appendChild(mark);
      });
    });

    // 兄弟姐妹
    const sibLayer = document.createElementNS(SVGNS, 'g');
    sibLayer.setAttribute('id', 'sib-layer');
    sibLayer.style.display = S.showSib ? '' : 'none';
    svg.appendChild(sibLayer);
    const sibSeen = new Set();
    D.edges.forEach((e) => {
      if (e.p !== '兄弟姐妹') return;
      const k = [e.s, e.t].sort().join('~');
      if (sibSeen.has(k) || t.positions[e.s] == null || t.positions[e.t] == null) return;
      sibSeen.add(k);
      const g = t.genKeys.find((k2) => (t.gens[k2] || []).some((x) => x.name === e.s));
      const y = centerY(g) - nodeH / 2 - 3;
      const x1 = t.positions[e.s], x2 = t.positions[e.t];
      const p = document.createElementNS(SVGNS, 'path');
      const mid = (x1 + x2) / 2;
      p.setAttribute('d', 'M' + x1 + ' ' + y + ' Q' + mid + ' ' + (y - 24) + ' ' + x2 + ' ' + y);
      p.setAttribute('fill', 'none');
      p.setAttribute('stroke', 'rgba(179,113,60,.55)');
      p.setAttribute('stroke-width', '1.2');
      p.setAttribute('stroke-dasharray', '4 4');
      sibLayer.appendChild(p);
    });

    // 节点
    const nodeLayer = document.createElementNS(SVGNS, 'g');
    svg.appendChild(nodeLayer);
    const nodeEls = {};
    D.persons.forEach((n) => {
      if (t.positions[n.name] == null) return;
      const g = t.genKeys.find((k) => (t.gens[k] || []).some((x) => x.name === n.name));
      const cx = t.positions[n.name], cy = centerY(g);
      const m = meta(n);
      const grp = document.createElementNS(SVGNS, 'g');
      grp.setAttribute('class', 't-node');
      grp.setAttribute('filter', 'url(#tnShadow)');
      grp.dataset.name = n.name;
      const rect = document.createElementNS(SVGNS, 'rect');
      rect.setAttribute('x', cx - nodeW / 2); rect.setAttribute('y', cy - nodeH / 2);
      rect.setAttribute('width', nodeW); rect.setAttribute('height', nodeH);
      rect.setAttribute('rx', 9);
      rect.setAttribute('fill', '#fffdf7');
      rect.setAttribute('stroke', hexA(m.color, .45));
      rect.setAttribute('stroke-width', n.gender === '女' ? '1' : '1.6');
      grp.appendChild(rect);
      const bar = document.createElementNS(SVGNS, 'rect');
      bar.setAttribute('x', cx - nodeW / 2); bar.setAttribute('y', cy - nodeH / 2);
      bar.setAttribute('width', 4); bar.setAttribute('height', nodeH);
      bar.setAttribute('rx', 2);
      bar.setAttribute('fill', m.color);
      grp.appendChild(bar);
      const txt = document.createElementNS(SVGNS, 'text');
      txt.setAttribute('x', cx + 2); txt.setAttribute('y', cy + 5);
      txt.setAttribute('text-anchor', 'middle');
      txt.setAttribute('font-family', '"Songti SC","STSong","SimSun",serif');
      txt.setAttribute('font-size', n.name.length > 5 ? '12' : '13.5');
      txt.setAttribute('font-weight', '600');
      txt.setAttribute('fill', '#2b241d');
      txt.textContent = n.name.replace('（史太君）', '');
      grp.appendChild(txt);
      const sub = document.createElementNS(SVGNS, 'text');
      sub.setAttribute('x', cx + 2); sub.setAttribute('y', cy + nodeH / 2 + 13);
      sub.setAttribute('text-anchor', 'middle');
      sub.setAttribute('font-size', '9.5');
      sub.setAttribute('fill', 'rgba(139,127,111,.9)');
      const parts = [];
      if (n.rel['住所']) parts.push(n.rel['住所'][0]);
      if (n.rel['出身']) parts.push(n.rel['出身'][0]);
      sub.textContent = parts.join(' · ');
      grp.appendChild(sub);
      const ttl = document.createElementNS(SVGNS, 'title');
      ttl.textContent = n.name + (n.comment ? '｜' + n.comment : '');
      grp.appendChild(ttl);

      grp.addEventListener('click', () => api.selectNode(n.name));
      grp.addEventListener('mouseenter', () => highlightLineage(n.name, t));
      grp.addEventListener('mouseleave', () => clearTreeHighlight());
      nodeLayer.appendChild(grp);
      nodeEls[n.name] = grp;
    });

    // 图例脚注
    const note = document.createElementNS(SVGNS, 'text');
    note.setAttribute('x', 120); note.setAttribute('y', H2 - 8);
    note.setAttribute('font-size', '10.5');
    note.setAttribute('fill', 'rgba(139,127,111,.85)');
    note.textContent = '注：连线为「父亲 / 母亲」断言还原的血缘路径；双线为夫妻。未入本体的人物（王夫人、赵姨娘、薛宝钗等）不会出现。';
    svg.appendChild(note);

    S.treeState.nodeEls = nodeEls;
    S.treeState.edgeEls = treeEdges;
  }

  function highlightLineage(name, t) {
    const keep = new Set([name]);
    const up = (n) => {
      const node = D.byId.get(n);
      if (!node) return;
      (node.rel['父亲'] || []).concat(node.rel['母亲'] || []).forEach((p) => {
        if (!keep.has(p) && D.byId.has(p)) { keep.add(p); up(p); }
      });
    };
    up(name);
    // 后代
    const down = (n) => {
      const node = D.byId.get(n);
      if (!node) return;
      D.persons.forEach((p) => {
        if (((p.rel['父亲'] || []).indexOf(n) >= 0 || (p.rel['母亲'] || []).indexOf(n) >= 0) && !keep.has(p.name)) {
          keep.add(p.name); down(p.name);
        }
      });
    };
    down(name);
    Object.keys(t.positions).forEach((k) => {
      const el = S.treeState.nodeEls[k];
      if (el) el.style.opacity = keep.has(k) ? 1 : 0.16;
    });
    S.treeState.edgeEls.forEach((e) => {
      e.el.style.opacity = (keep.has(e.parent) && keep.has(e.child)) ? 0.95 : 0.08;
    });
  }
  function clearTreeHighlight() {
    Object.keys(S.treeState.nodeEls || {}).forEach((k) => { S.treeState.nodeEls[k].style.opacity = 1; });
    (S.treeState.edgeEls || []).forEach((e) => { e.el.style.opacity = 1; });
  }
  function drawTreeHighlight() { /* placeholder for S.panel sync */ }

  /* ---- 对外导出 ---- */
  Object.assign(api, { buildTree, renderTree, highlightLineage, clearTreeHighlight, drawTreeHighlight });
})(window.DRM.api, window.DRM.meta, window.DRM.data, window.DRM.state);
