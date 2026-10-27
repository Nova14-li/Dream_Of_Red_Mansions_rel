/* ==========================================================================
   自动巡游
   按人物序号定时巡览，可随时中止
   --------------------------------------------------------------------------
   模块：ui/tour.js
   ========================================================================== */
(function (api, M, D, S) {
  'use strict';
  const { $ } = api;

  /* ---------------- 自动巡游 ---------------- */
  let tourTimer = null, tourIdx = 0;
  function startTour() {
    if (tourTimer) return;
    $('#btn-tour').classList.add('on');
    $('#tourbar').classList.add('show');
    const seq = D.persons.slice().sort((a, b) => a.idx - b.idx);
    const tick = () => {
      const n = seq[tourIdx % seq.length];
      api.selectNode(n.id, { focus: true });
      $('#tour-name').textContent = n.name;
      tourIdx++;
    };
    tick();
    tourTimer = setInterval(tick, 2400);
  }
  function stopTour() {
    clearInterval(tourTimer); tourTimer = null;
    $('#btn-tour').classList.remove('on');
    $('#tourbar').classList.remove('show');
    tourIdx = 0;
  }

  /* ---- 对外导出 ---- */
  Object.assign(api, { tourTimer, startTour, stopTour });
})(window.DRM.api, window.DRM.meta, window.DRM.data, window.DRM.state);
