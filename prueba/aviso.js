/* TEFES · ENTORNO DE PRUEBAS — franja que marca cada pantalla como prueba (va en las tres pantallas). */
(function () {
  var css = '#prAviso{background:#fff3cd;color:#5c4100;border-bottom:2px solid #f2b233;font:600 13px/1.35 -apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;padding:8px 14px;' +
    'display:flex;gap:10px;align-items:center;justify-content:center;flex-wrap:wrap;text-align:center;position:relative;z-index:50}' +
    '#prAviso b{background:#f2b233;color:#2a1a00;border-radius:999px;padding:2px 9px;letter-spacing:.6px;text-transform:uppercase;font-size:11.5px}' +
    '#prAviso a,#prAviso button{color:#5c4100;font:inherit;font-weight:700;background:none;border:0;padding:0;cursor:pointer;text-decoration:underline}' +
    '@media print{#prAviso{display:none}}';
  function poner() {
    if (document.getElementById('prAviso')) return;
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    var d = document.createElement('div'); d.id = 'prAviso'; d.setAttribute('role', 'note');
    var P = window.TEFES_PRUEBA, f = P.esReal() ? P.fecha().split(' ') : null;
    d.innerHTML = '<b>Entorno de pruebas</b><span>' + (f ? 'Datos reales del ' + f[0].split('-').reverse().join('/') + ' ' + f[1] + '. Lo que hagas aquí queda solo en este navegador: nada llega a la app real.' :
      'Datos de ejemplo: personas, clientes y cifras son inventados. Nada llega a la app real.') + '</span>' +
      '<a href="./">Cambiar de nivel</a><button type="button" id="prReiniciar">Empezar de nuevo</button>';
    document.body.insertBefore(d, document.body.firstChild);
    document.getElementById('prReiniciar').onclick = function () {
      if (!confirm('¿Volver a los datos del inicio? Se borra lo que hiciste en esta prueba.')) return;
      if (window.TEFES_PRUEBA.reiniciar() !== 'va') location.reload();
    };
    if (!/^Pruebas/.test(document.title)) document.title = 'Pruebas · ' + document.title;
  }
  if (document.body) poner(); else document.addEventListener('DOMContentLoaded', poner);
})();
