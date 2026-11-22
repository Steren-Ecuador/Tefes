/* vc1 — "Ver como" del panel de Diego (22-nov-2026).
   Con ?vista=1 en la dirección, la página es la MISMA que ve la persona, con sus datos reales, pero:
   - no se registra nada en "Uso app" (las llamadas apiRegistro* no salen),
   - no se guarda ni se envía nada (solo pasan las lecturas; lo demás se frena con un aviso),
   - no toca lo guardado en este navegador (localStorage/sessionStorage quedan en memoria y se borran al cerrar),
   - abre las páginas del mismo sitio también en modo vista y frena WhatsApp, correo y apps externas.
   &como=<nombre> elige a la persona (panel: supervisor/gerencia/financiero/call center; asesor: su nombre).
   Sin ?vista=1 este archivo no hace nada. Va como PRIMER script de panel.html, tienda.html, asesor.html y avisos/. */
(function () {
  var q = new URLSearchParams(location.search);
  if (q.get('vista') !== '1') return;
  var COMO = (q.get('como') || '').trim();
  window.TEFES_VISTA = {como: COMO};

  /* Lecturas permitidas (revisadas una por una en los .gs: no escriben en hojas, Drive ni correo) */
  var LEE = ('apiActividadesPanel apiAliasNombres apiAutoconsumoPanel apiAvisosPanel apiClientesPanel apiContactosPanel apiConteoVivo ' +
    'apiDatoPanel apiFPGBitacora apiFPGPanel apiFPGPanelPos apiFdClave apiFlashPanel apiGarantiasPanel apiGuiasPanel apiHojaManualPdf ' +
    'apiInitTienda apiInvLeer apiInvPdf apiInventarioPanel apiLogin apiMenusPerfil apiMiUso apiPFPanel apiPPPanel apiPanel apiPoliticaPdf ' +
    'apiPoliticasInformePanel apiPoliticasPanel apiPoliticasTextoPanel apiPreguntasPoliticaSup apiStockPanel apiUniPanel apiVentasPanel apiVisitas ' +
    'apiAutoconsumoLista apiFPGLista apiFdClaveTienda apiInitTiendaParte apiPFTienda apiPPTienda apiPreguntaVisita apiPreguntasGuia ' +
    'apiPreguntasPolitica apiTransfE04 apiUniTienda apiVFCatalogo apiVFLista apiAsesor apiPerfilAsesor apiPFCC').split(' ');
  var MSG = 'Modo vista: aquí solo miras. No se guardó ni se envió nada.';

  /* 1. Almacenamiento en memoria (no lee ni pisa tu sesión ni tus datos de este navegador) */
  function Mem(seed) {
    var m = {};
    Object.keys(seed || {}).forEach(function (k) { m[k] = String(seed[k]); });
    return {
      getItem: function (k) { k = String(k); return Object.prototype.hasOwnProperty.call(m, k) ? m[k] : null; },
      setItem: function (k, v) { m[String(k)] = String(v); },
      removeItem: function (k) { delete m[String(k)]; },
      clear: function () { m = {}; },
      key: function (i) { return Object.keys(m)[i] || null; },
      get length() { return Object.keys(m).length; }
    };
  }
  var seed = {}, tok = q.get('ase') || q.get('t') || '';
  if (COMO) {
    seed.supTefes = JSON.stringify({nombre: COMO});                 // panel: quién entra
    if (tok) seed['tefes_asesor_yo_' + tok.slice(-8)] = COMO;       // asesor: quién soy
    seed['av.yo'] = COMO;                                           // avisos
  }
  var L = Mem(seed), S = Mem();
  var pegar = function (n, o) { try { Object.defineProperty(window, n, {configurable: true, get: function () { return o; }}); } catch (e) {} };
  pegar('localStorage', L); pegar('sessionStorage', S);
  try {   // respaldo por si el navegador no deja cambiar window.localStorage
    var P = Storage.prototype, el = function (t) { return t === window.sessionStorage || t === S ? S : L; };
    ['getItem', 'setItem', 'removeItem', 'clear', 'key'].forEach(function (f) {
      P[f] = function () { var o = el(this); return o[f].apply(o, arguments); };
    });
  } catch (e) {}

  /* 2. Llamadas al servidor: solo lecturas */
  var aviso = function () { mostrar(MSG); };
  var resp = function (x) { return new Response(JSON.stringify(x), {status: 200, headers: {'Content-Type': 'application/json'}}); };
  var F = window.fetch.bind(window);
  window.fetch = function (u, o) {
    var url = String(u && u.url || u || '');
    if (/script\.google(usercontent)?\.com/.test(url)) {
      var fn = '';
      try { fn = JSON.parse(o && o.body || '{}').fn || ''; } catch (e) {}
      if (/^apiRegistro/.test(fn)) return Promise.resolve(resp({ok: true, r: null}));
      if (!(o && o.method && /post/i.test(o.method)) || LEE.indexOf(fn) < 0) { aviso(); return Promise.resolve(resp({ok: false, error: MSG})); }
    }
    return F(u, o);
  };
  try { navigator.sendBeacon = function () { return true; }; } catch (e) {}

  /* 3. Enlaces: el mismo sitio sigue en modo vista; WhatsApp, correo y apps externas se frenan */
  var BASE = location.origin + location.pathname.replace(/\/(avisos\/)?[^\/]*$/, '/');
  function conVista(h) {
    var u = new URL(h, location.href);
    u.searchParams.set('vista', '1');
    if (COMO && !u.searchParams.get('como')) u.searchParams.set('como', COMO);
    return u.href;
  }
  function decidir(h) {
    if (!h || /^(#|javascript:)/i.test(h)) return 'ok';
    var u; try { u = new URL(h, location.href); } catch (e) { return 'ok'; }
    if (/^(blob|data):/.test(u.protocol)) return 'ok';
    if (u.href.indexOf(BASE) === 0) return 'vista';
    if (/^(https?):$/.test(u.protocol) && !/wa\.me|whatsapp|script\.google|diegorevelom\.github\.io/i.test(u.host + u.pathname)) return 'ok';
    return 'no';
  }
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest && e.target.closest('a[href]'); if (!a) return;
    var d = decidir(a.getAttribute('href'));
    if (d === 'vista') a.setAttribute('href', conVista(a.getAttribute('href')));
    else if (d === 'no') { e.preventDefault(); e.stopPropagation(); mostrar('Modo vista: no se abre WhatsApp, correo ni otras apps.'); }
  }, true);
  var WO = window.open;
  window.open = function (h) {
    var d = decidir(h);
    if (d === 'no') { mostrar('Modo vista: no se abre WhatsApp, correo ni otras apps.'); return null; }
    var a = Array.prototype.slice.call(arguments); if (d === 'vista') a[0] = conVista(h);
    return WO.apply(window, a);
  };
  document.addEventListener('submit', function (e) { e.preventDefault(); aviso(); }, true);

  /* 4. Se ve claramente que es una vista: marco naranja + etiqueta arriba */
  var css = 'html::after{content:"";position:fixed;inset:0;border:4px solid #f08c00;pointer-events:none;z-index:2147483646}' +
    '#vcTag{position:fixed;top:6px;left:50%;transform:translateX(-50%);z-index:2147483647;background:#f08c00;color:#fff;font:600 12px/1.2 -apple-system,BlinkMacSystemFont,Arial,sans-serif;' +
    'padding:5px 12px;border-radius:999px;box-shadow:0 2px 8px rgba(0,0,0,.25);white-space:nowrap;max-width:94vw;overflow:hidden;text-overflow:ellipsis;pointer-events:none}' +
    '#vcToast{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:2147483647;background:#1f2937;color:#fff;font:14px/1.35 -apple-system,BlinkMacSystemFont,Arial,sans-serif;' +
    'padding:10px 16px;border-radius:10px;box-shadow:0 4px 14px rgba(0,0,0,.3);max-width:90vw;text-align:center}';
  function poner() {
    if (document.getElementById('vcTag')) return;
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    var t = document.createElement('div'); t.id = 'vcTag';
    t.textContent = '👁 Modo vista' + (COMO ? ' · ' + COMO : '') + ' · no se guarda ni se registra nada';
    document.body.appendChild(t);
    document.title = '👁 ' + document.title;
  }
  var tt = null;
  function mostrar(m) {
    var d = document.getElementById('vcToast');
    if (!d) { d = document.createElement('div'); d.id = 'vcToast'; (document.body || document.documentElement).appendChild(d); }
    d.textContent = m; d.hidden = false; clearTimeout(tt); tt = setTimeout(function () { d.hidden = true; }, 3500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', poner); else poner();
})();
