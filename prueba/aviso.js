/* TEFES · ENTORNO DE PRUEBAS — franja que marca cada pantalla como prueba (va en las tres pantallas). */
(function () {
  // discreto: una línea fina y gris arriba, casi no se nota (Diego 2026-10-26)
  var css = '#prAviso{background:transparent;color:#8a96a3;font:500 10.5px/1.2 -apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;padding:2px 10px;' +
    'display:flex;gap:8px;align-items:center;justify-content:flex-end;flex-wrap:wrap;position:relative;z-index:50;opacity:.75}' +
    '#prAviso:hover{opacity:1}' +
    '#prAviso a,#prAviso button{color:inherit;font:inherit;background:none;border:0;padding:0;cursor:pointer;text-decoration:underline}' +
    '@media print{#prAviso{display:none}}';
  function poner() {
    if (document.getElementById('prAviso')) return;
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    var d = document.createElement('div'); d.id = 'prAviso'; d.setAttribute('role', 'note');
    var P = window.TEFES_PRUEBA, f = P.esReal() ? P.fecha().split(' ') : null;
    d.innerHTML = '<span>Prueba' + (f ? ' · ' + f[0].split('-').reverse().slice(0, 2).join('/') : '') + '</span>' +
      '<a href="./">niveles</a><button type="button" id="prReiniciar">reiniciar</button>';
    document.body.insertBefore(d, document.body.firstChild);
    document.getElementById('prReiniciar').onclick = function () {
      if (!confirm('¿Volver a los datos del inicio? Se borra lo que hiciste en esta prueba.')) return;
      if (window.TEFES_PRUEBA.reiniciar() !== 'va') location.reload();
    };
  }
  if (document.body) poner(); else document.addEventListener('DOMContentLoaded', poner);
})();
