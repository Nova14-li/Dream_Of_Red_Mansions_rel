/* ==========================================================================
   本体元信息常量
   类元信息、关系视觉分组、属性分组、逆属性与子属性映射、推理规则说明、类释义
   --------------------------------------------------------------------------
   模块：core/meta.js
   ========================================================================== */
(function (api, M, D, S) {
  'use strict';
  /* ---------------- 元数据 ---------------- */
  const CLS_META = {
    '人物': { color: '#a9332c', light: '#f0ded9', shape: 'circle', desc: '本体唯一的主体类，19 个实例，无子类。所有亲属、居所、门第关系都以它为主语。' },
    '地点': { color: '#8a7f70', light: '#ece5d8', shape: 'circle', desc: '抽象分类层，本身不实例化，用于把「地区」与「建筑」归到同一上位概念下。' },
    '地区': { color: '#4e6f8a', light: '#dde5eb', shape: 'diamond', desc: '地理区域，:生活地区 的值域。实例：金陵、京城、姑苏、苏州。' },
    '建筑': { color: '#6b7f5b', light: '#e2e8db', shape: 'square', desc: '宅院宫观，:住所 的值域，并承载数据属性 :人数。实例：荣国府、宁国府、大观园、玄真观、皇宫。' },
    '出身': { color: '#b08d57', light: '#f0e6d4', shape: 'hex', desc: '门第 / 家族归属的抽象类，不直接实例化。' },
    '贵族出身': { color: '#b08d57', light: '#f0e6d4', shape: 'hex', desc: '贵族门第。实例：贾家、史家、王家、薛家、姑苏林家（四大家族 + 林家）。' },
    '平民出身': { color: '#9c8b74', light: '#eae4d9', shape: 'hex', desc: '非贵族门第。贾演、贾源两位国公标为「平民」，表达白手起家、以军功封公的设定。' },
    '官职爵位': { color: '#7d5a8a', light: '#e7dfec', shape: 'tri', desc: '爵位与官职的统一类，建模为独立个体，使「承袭同一爵位」成为可查询事实。' }
  };
  const GRP = {
    kin:   { label: '血缘', color: '#8c3b2e', width: 1.8, dash: [], rest: 128 },
    sib:   { label: '旁系', color: '#b3713c', width: 1.4, dash: [5, 4], rest: 142 },
    mar:   { label: '婚姻', color: '#a8324a', width: 2.0, dash: [], rest: 84 },
    clan:  { label: '门第', color: '#7a8a5f', width: 1.2, dash: [2, 4], rest: 235 },
    place: { label: '空间', color: '#4e6f8a', width: 1.2, dash: [6, 4], rest: 210 },
    rank:  { label: '身份', color: '#7d5a8a', width: 1.2, dash: [8, 3, 2, 3], rest: 200 }
  };
  const PROP_GROUP = {
    '父亲': 'kin', '母亲': 'kin', '儿子': 'kin', '女儿': 'kin', '子女': 'kin', '父母': 'kin',
    '兄弟姐妹': 'sib', '丈夫': 'mar', '妻子': 'mar', '夫妻': 'mar',
    '出身': 'clan', '住所': 'place', '生活地区': 'place', '官职爵位': 'rank'
  };
  const INVERSE = { '丈夫': '妻子', '妻子': '丈夫', '父母': '子女', '子女': '父母' };
  const SUPER = { '父亲': ['父母'], '母亲': ['父母'], '儿子': ['子女'], '女儿': ['子女'], '丈夫': ['夫妻'], '妻子': ['夫妻'] };
  const REV_LABEL = {
    '父亲': '子女', '母亲': '子女', '儿子': '父母', '女儿': '父母', '父母': '子女', '子女': '父母',
    '丈夫': '妻子', '妻子': '丈夫', '兄弟姐妹': '兄弟姐妹',
    '出身': '出自', '住所': '居住着', '生活地区': '亦生活于', '官职爵位': '受封于'
  };
  const RULE_META = {
    sub: { label: '子属性回推', desc: '子属性断言同时成立于其上位属性' },
    inv: { label: '逆属性补全', desc: 'owl:inverseOf 自动生成反向断言' },
    sym: { label: '对称补全', desc: 'owl:SymmetricProperty 双向成立' }
  };
  const CLASS_DESC = {
    '人物': '本体唯一的主体类，19 个实例，无子类。',
    '地点': '抽象类，不实例化；用于跨「地区 / 建筑」的统一查询。',
    '地区': '地理区域，:生活地区 的值域。',
    '建筑': '宅院宫观，:住所 的值域。',
    '出身': '门第归属的抽象类，不实例化。',
    '贵族出身': '贵族门第：贾家、史家、王家、薛家、姑苏林家。',
    '平民出身': '非贵族门第，仅「平民」一个实例。',
    '官职爵位': '爵位与官职的统一类，共 4 个实例。'
  };

  /* ---- 对外导出 ---- */
  Object.assign(M, { CLS_META, GRP, PROP_GROUP, INVERSE, SUPER, REV_LABEL, RULE_META, CLASS_DESC });
})(window.DRM.api, window.DRM.meta, window.DRM.data, window.DRM.state);
