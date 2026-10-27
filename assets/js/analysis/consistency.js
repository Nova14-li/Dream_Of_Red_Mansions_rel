/* ==========================================================================
   一致性检查与数据缺口
   基于公理做五项一致性校验，并汇总本体覆盖缺口
   --------------------------------------------------------------------------
   模块：analysis/consistency.js
   ========================================================================== */
(function (api, M, D, S) {
  'use strict';
  /* ---------------- 一致性检查 / 数据缺口 ---------------- */
  const checks = [];
  (function runChecks() {
    // Functional: 出身
    const multiClan = D.persons.filter((n) => (n.rel['出身'] || []).length > 1);
    checks.push({ ok: multiClan.length === 0, t: '函数型 :出身 唯一性', d: multiClan.length === 0 ? '19 位人物均只归属一个门第，符合 owl:FunctionalProperty。' : multiClan.map((n) => n.name).join('、') + ' 拥有多个门第，违反函数型约束。' });
    // Functional: 性别
    const noGender = D.persons.filter((n) => !n.gender);
    checks.push({ ok: noGender.length === 0, t: '函数型 :性别 完整性', d: noGender.length === 0 ? '19 位人物全部填写性别，一人一值。' : noGender.map((n) => n.name).join('、') + ' 缺少性别断言。' });
    // 枚举取值
    const badGender = D.persons.filter((n) => n.gender && ['男', '女'].indexOf(n.gender) < 0);
    checks.push({ ok: badGender.length === 0, t: '枚举值域 {男, 女}', d: badGender.length === 0 ? '所有 :性别 字面量均落在 owl:oneOf 枚举内，无脏值。' : badGender.map((n) => n.name + '(' + n.gender + ')').join('、') + ' 取值越界。' });
    // 互斥属性
    const pairs = [['丈夫', '妻子'], ['父亲', '母亲'], ['儿子', '女儿']];
    let clash = [];
    pairs.forEach((p) => {
      D.edges.forEach((e) => {
        if (e.p === p[0]) {
          D.edges.forEach((e2) => {
            if (e2.p === p[1] && e2.s === e.s && e2.t === e.t) clash.push(e.s + '→' + e.t);
          });
        }
      });
    });
    checks.push({ ok: clash.length === 0, t: '属性互斥 (propertyDisjointWith)', d: clash.length === 0 ? '未发现同一对个体同时满足 :丈夫/:妻子、:父亲/:母亲、:儿子/:女儿。' : '冲突：' + clash.join('、') });
    // 非自反
    const selfLoop = D.edges.filter((e) => e.s === e.t);
    checks.push({ ok: selfLoop.length === 0, t: '非自反 (IrreflexiveProperty)', d: selfLoop.length === 0 ? '无任何实体与自身建立亲属或空间关系。' : selfLoop.map((e) => e.s + '→' + e.s).join('、') });
  })();

  const gaps = (function computeGaps() {
    const out = [];
    const noClan = D.persons.filter((n) => !(n.rel['出身'] || []).length);
    if (noClan.length) out.push({ t: '缺少 :出身', list: noClan.map((n) => n.name) });
    const noHome = D.persons.filter((n) => !(n.rel['住所'] || []).length);
    if (noHome.length) out.push({ t: '缺少 :住所', list: noHome.map((n) => n.name) });
    const noArea = D.persons.filter((n) => !(n.rel['生活地区'] || []).length);
    if (noArea.length) out.push({ t: '缺少 :生活地区', list: noArea.map((n) => n.name) });
    const noMother = D.persons.filter((n) => (n.rel['父亲'] || []).length && !(n.rel['母亲'] || []).length);
    if (noMother.length) out.push({ t: '有父无母（注释提及但未建模）', list: noMother.map((n) => n.name) });
    const orphan = D.nodes.filter((n) => n.deg === 0);
    if (orphan.length) out.push({ t: '孤立实例（无任何关系）', list: orphan.map((n) => n.name) });
    return out;
  })();

  /* ---- 对外导出 ---- */
  Object.assign(D, { checks, gaps });
})(window.DRM.api, window.DRM.meta, window.DRM.data, window.DRM.state);
