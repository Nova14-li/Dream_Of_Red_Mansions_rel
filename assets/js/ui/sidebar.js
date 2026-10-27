/* ==========================================================================
   筛选侧栏
   类型、性别、居所三类筛选器与其联动
   --------------------------------------------------------------------------
   模块：ui/sidebar.js
   ========================================================================== */
(function (api, M, D, S) {
  'use strict';
  const { $, esc } = api;

  /* ---------------- 侧栏 ---------------- */
  function buildSidebar() {
    // 类型
    const order = ['人物', '建筑', '地区', '贵族出身', '平民出身', '官职爵位'];
    const box = $('#f-types');
    box.innerHTML = '';
    order.forEach((t) => {
      const el = document.createElement('div');
      el.className = 'check on';
      el.dataset.type = t;
      el.innerHTML = '<span class="box">✓</span><span class="dot" style="background:' + (M.CLS_META[t] || {}).color + '"></span><span>' + t + '</span><span class="num">' + (D.typeCount[t] || 0) + '</span>';
      el.addEventListener('click', () => {
        if (S.filters.types.has(t)) { S.filters.types.delete(t); el.classList.remove('on'); el.querySelector('.box').textContent = ''; }
        else { S.filters.types.add(t); el.classList.add('on'); el.querySelector('.box').textContent = '✓'; }
        S.simAlpha = Math.max(S.simAlpha, 0.1);
      });
      box.appendChild(el);
    });

    // 性别
    const gb = $('#f-gender');
    ['全部', '男', '女'].forEach((g, i) => {
      const b = document.createElement('button');
      b.className = 'chip' + (i === 0 ? ' on' : '');
      b.textContent = g;
      b.addEventListener('click', () => {
        S.filters.gender = g;
        Array.prototype.forEach.call(gb.children, (c) => c.classList.remove('on'));
        b.classList.add('on');
      });
      gb.appendChild(b);
    });

    // 地点
    const pb = $('#f-places');
    const places = ['荣国府', '宁国府', '大观园', '玄真观', '皇宫', '金陵', '姑苏', '京城'];
    places.forEach((p) => {
      const b = document.createElement('button');
      b.className = 'chip';
      b.textContent = p;
      b.addEventListener('click', () => {
        if (S.filters.places.has(p)) { S.filters.places.delete(p); b.classList.remove('on'); }
        else { S.filters.places.add(p); b.classList.add('on'); }
      });
      pb.appendChild(b);
    });

    // 图例
    const lb = $('#legend');
    lb.innerHTML = Object.keys(M.GRP).map((k) => {
      const g = M.GRP[k];
      return '<div><i style="border-top-color:' + g.color + ';border-top-style:' + (g.dash.length ? 'dashed' : 'solid') + '"></i><span>' + g.label + '</span>' +
        '<span style="margin-left:auto;font-size:11px;color:var(--ink-3)">' + (k === 'kin' ? '父/母/子/女' : k === 'sib' ? '兄弟姐妹' : k === 'mar' ? '丈夫/妻子' : k === 'clan' ? '出身' : k === 'place' ? '住所/地区' : '官职爵位') + '</span></div>';
    }).join('') + '<div><i style="border-top:1px dashed #b08d57"></i><span>推理边</span><span style="margin-left:auto;font-size:11px;color:var(--ink-3)">OWL 推导</span></div>' +
      '<div><span class="node" style="background:#a9332c"></span><span style="font-size:11.5px">人物</span><span class="node" style="background:#6b7f5b;border-radius:3px;margin-left:8px"></span><span style="font-size:11.5px">建筑</span><span class="node" style="background:#4e6f8a;transform:rotate(45deg);width:10px;height:10px;margin-left:8px"></span><span style="font-size:11.5px">地区</span></div>';

    // 路径选择
    const from = $('#path-from'), to = $('#path-to');
    const opts = D.persons.map((n) => '<option value="' + esc(n.name) + '">' + esc(n.name) + '</option>').join('');
    from.innerHTML = opts; to.innerHTML = opts;
    from.value = '林黛玉'; to.value = '贾宝玉';
  }

  /* ---- 对外导出 ---- */
  Object.assign(api, { buildSidebar });
})(window.DRM.api, window.DRM.meta, window.DRM.data, window.DRM.state);
