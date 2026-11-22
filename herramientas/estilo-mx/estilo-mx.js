/* emx1 · Números del bloque de la tienda que suben contando (solo apariencia). */
(function () {
  if (!window.MutationObserver || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
  function contar(b) {
    var fin = b.textContent, m = /^(\d{1,4})(%?)$/.exec(fin.trim());
    if (!m || b.dataset.emx === fin) return;         // ya contado, o es un paso de nuestra propia cuenta
    var n = +m[1], suf = m[2], ini = performance.now(), dur = 600;
    function poner(t) { b.dataset.emx = t; b.textContent = t; }
    poner('0' + suf);
    (function paso(ahora) {
      if (b.textContent !== b.dataset.emx) return;   // la app cambió el número mientras contaba: se respeta
      var k = Math.min(1, (ahora - ini) / dur);
      if (k >= 1) return poner(fin);
      poner(Math.round(n * (1 - Math.pow(1 - k, 3))) + suf);
      requestAnimationFrame(paso);
    })(ini);
  }
  new MutationObserver(function () { document.querySelectorAll('.pf-num b').forEach(contar); })
    .observe(document.documentElement, {childList: true, subtree: true, characterData: true});
})();
