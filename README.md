这个网页是在做红楼梦本体知识库中途生成的，觉得可能还有意义就留了下来，希望还能回来进一步完善和修改。


# 红楼梦人物本体 · 交互式知识图谱

由 `dream_of_red_mansions.rdf` 解析生成的可视化前端。纯静态、零依赖、零构建即可打开；
代码按职责拆分为若干模块，便于阅读与二次开发。

数据规模：8 个类 · 14 个对象属性 · 2 个数据属性 · 38 个个体 · 118 条关系断言 ·
193 条三元组 · 61 条推理增量。

---

## 目录结构

```
dream_of_red_mensions_html/
├── index.html                 结构骨架：只引用资源，不含业务代码
├── assets/
│   ├── css/
│   │   ├── tokens.css         设计变量与全局重置（色板、字体栈、纸感底色）
│   │   ├── layout.css         骨架布局（顶栏、标签导航、搜索框、筛选侧栏）
│   │   ├── graph.css          图谱舞台（画布、工具栏、提示气泡、关系链、详情面板）
│   │   ├── views.css          内容视图（世系图、卡片、本体结构、推理页、三元组表）
│   │   └── responsive.css     1180 / 1000 / 760 三档断点
│   ├── data/
│   │   └── ontology.js        数据集：window.__DATA__（由 RDF 解析导出）
│   └── js/
│       ├── core/
│       │   ├── namespace.js   命名空间：DRM.{meta,data,state,api}
│       │   ├── meta.js        本体元信息：类元信息、关系分组、公理映射、类释义
│       │   ├── utils.js       通用工具：选择器、转义、颜色、姓名缩写
│       │   ├── data.js        数据装配：nodes / byId / edges 与索引
│       │   └── state.js       运行时状态：相机、筛选、选中、临时开关
│       ├── analysis/
│       │   ├── inference.js   OWL 闭包推理（子属性 / 逆属性 / 对称）
│       │   └── consistency.js 一致性检查与数据缺口
│       ├── graph/
│       │   ├── layout.js      空间布局：辈分推导、人物环与属性带、竖屏转置
│       │   ├── simulation.js  力学模拟：斥力、碰撞、弹簧、轨道回归
│       │   ├── renderer.js    画布渲染与相机：坐标变换、曲线、标签、适配
│       │   └── interaction.js 交互：拖拽、平移、缩放、悬停提示
│       ├── views/
│       │   ├── panel.js       详情面板
│       │   ├── tree.js        家族世系图（SVG）
│       │   ├── ontology.js    本体结构页
│       │   ├── reasoning.js   推理页
│       │   └── triples.js     三元组页
│       ├── ui/
│       │   ├── sidebar.js     筛选侧栏
│       │   ├── path.js        关系链查找（最短路径 + 浮层）
│       │   ├── search.js      全局搜索
│       │   ├── tour.js        自动巡游
│       │   └── router.js      视图路由（哈希同步）
│       └── main.js            入口装配：事件绑定、首次布局预演、启动
├── tools/
│   └── bundle.py              可选：把模块化源码打包成单文件 HTML
└── dist/                      单文件产物（执行 tools/bundle.py 后生成）
```

## 模块约定

全部使用传统 `<script>`（非 ES Module），因此 **双击 `index.html` 通过 `file://` 即可运行**，
无需本地服务器。为避免拆分后作用域断裂，统一采用依赖注入 + 显式导出的写法：

```js
(function (api, M, D, S) {
  'use strict';
  const { $, esc, isPerson } = api;   // 头部声明本模块用到的公共工具

  function myFeature() { /* ... */ }

  Object.assign(api, { myFeature });  // 文件末尾挂载导出
})(window.DRM.api, window.DRM.meta, window.DRM.data, window.DRM.state);
```

四个容器各司其职：

| 容器 | 含义 | 写入时机 |
|---|---|---|
| `M` = `DRM.meta` | 只读常量：类元信息、关系分组、公理映射 | `core/meta.js` 加载时 |
| `D` = `DRM.data` | 数据模型：节点、边、索引、推理结果 | `core/data.js` 等装配后只读 |
| `S` = `DRM.state` | 可写状态：相机、筛选、选中、临时开关 | 运行期随时读写 |
| `api` = `DRM.api` | 跨模块函数 | 各模块加载结束时挂载 |

跨模块引用一律写成 `api.xxx()` / `S.xxx` / `D.xxx` / `M.xxx`，
既方便检索依赖，也让「谁依赖谁」一眼可见。加载顺序见 `index.html` 末尾的 script 列表：
命名空间 → 元信息 → 工具 → 数据 → 分析 → 状态 → 图谱 → 视图 → 交互 → 入口。

## 运行

- 直接双击 `index.html`（推荐，`file://` 可用）
- 或起一个静态服务器：`python -m http.server 8000`，访问 `http://localhost:8000`

## 打包单文件

需要发给别人一份单文件时：

```bash
python tools/bundle.py
# 产出 dist/single-file.html，CSS 与 JS 全部内联
```

## 深链接

`index.html#tree`、`#onto`、`#reason`、`#triple` 直接进入对应视图；
`index.html#graph/林黛玉` 进入图谱并选中该实体。

## 数据再生成

`assets/data/ontology.js` 由 `dream_of_red_mansions.rdf` 解析得到，结构为：

```js
{ namespace, classes[], objectProps[], dataProps[], individuals[] }
```

其中每个个体含 `name / cls / gender / comment / data / rel`，`rel` 为「谓词 → 宾语数组」。
替换数据后无需改动任何逻辑代码——布局、推理、统计均由数据驱动。
