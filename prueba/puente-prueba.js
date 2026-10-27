/* TEFES · ENTORNO DE PRUEBAS — puente de las pantallas de prueba (lo inserta generar_prueba.py).
   Igual que el puente del sitio, pero google.script.run responde con el servidor simulado (servidor.js)
   en vez de la app de Google. No hace falta ninguna clave: el enlace abre directo. */
(function () {
  var DB = window.TEFES_PRUEBA, API = window.TEFES_SERVIDOR;
  var q = new URLSearchParams(location.search), esPanel = /panel\.html$/.test(location.pathname);
  if (esPanel && !q.get('p')) q.set('p', DB.token('__PANEL__'));
  if (!esPanel && !q.get('t')) q.set('t', DB.token(q.get('tienda') || '') || DB.token(DB.tiendas()[0]));

  function llamar(fn, args) {
    return new Promise(function (ok, ko) {
      setTimeout(function () {
        try {
          if (!API[fn]) throw new Error('Esta función no está en el entorno de pruebas (' + fn + ').');
          var r = API[fn].apply(null, JSON.parse(JSON.stringify(args)));
          ok(despues(fn, r === undefined ? null : JSON.parse(JSON.stringify(r))));
        } catch (e) { ko(e); }
      }, 120 + Math.random() * 180);
    });
  }
  function despues(fn, r) {
    if ((fn === 'apiInitTienda' || fn === 'apiInitTiendaParte') && r && r.tienda) {
      var h = document.getElementById('hTienda');
      if (h) h.textContent = r.tienda;
      document.title = 'Pruebas · ' + r.tienda.replace(/\bMegakywi\b(?!-EloyAlfaro)/, 'Megakywi-EloyAlfaro').replace(/\bMegamaxi\b(?! 6 Dic)/, 'Megamaxi 6 Dic') + ' · TEFES';
    }
    return r;
  }
  function runner(ok, ko, uo) {
    return new Proxy({}, {get: function (_, k) {
      if (k === 'withSuccessHandler') return function (f) { return runner(f, ko, uo); };
      if (k === 'withFailureHandler') return function (f) { return runner(ok, f, uo); };
      if (k === 'withUserObject') return function (o) { return runner(ok, ko, o); };
      if (typeof k !== 'string' || !/^api[A-Z]/.test(k)) return undefined;
      return function () {
        llamar(k, Array.prototype.slice.call(arguments)).then(
          function (r) { if (ok) ok(r, uo); },
          function (e) { if (ko) ko(e, uo); else console.error(e); });
      };
    }});
  }
  function ubicacion(cb) {
    var p = {}, ps = {};
    q.forEach(function (v, k) { if (!(k in p)) p[k] = v; (ps[k] = ps[k] || []).push(v); });
    setTimeout(function () { cb({hash: location.hash.replace(/^#/, ''), parameter: p, parameters: ps}); }, 0);
  }
  window.google = {script: {run: runner(), url: {getLocation: ubicacion}}};
  window.PORTAL = {param: function (k) { return q.get(k) || ''; }};
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[href*="__PTOKEN__"],[href*="__TOKEN__"]').forEach(function (a) {
      a.setAttribute('href', a.getAttribute('href').replace('__PTOKEN__', encodeURIComponent(q.get('p') || '')).replace('__TOKEN__', encodeURIComponent(q.get('t') || '')));
    });
  });
})();
