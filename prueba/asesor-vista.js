/* TEFES · MAQUETA de la vista del ASESOR (entorno de pruebas, 2026-10-31).
   Se carga después de las pantallas de la tienda y deja solo 3 pestañas:
   Hoy (anuncios + mis garantías + venta de mi tienda) · Ventas futuras · Cómo trabajamos.
   Las garantías son datos de ejemplo: en la app real salen del POS de cada noche. */
(function () {
  var YO_KEY = 'tefes_asesor_yo';
  function yo() { try { return localStorage.getItem(YO_KEY) || ''; } catch (e) { return ''; } }
  function ponerYo(n) { try { n ? localStorage.setItem(YO_KEY, n) : localStorage.removeItem(YO_KEY); } catch (e) {} }
  var asesores = function () { return (S.data.personal || []).filter(function (p) { return !/gerente|subgerente|jefe|encargad/i.test(p.cargo || ''); }); };

  /* Menú: Hoy · Ventas futuras · Cómo trabajamos */
  var st = document.createElement('style');
  st.textContent = 'nav button[data-v=pend],nav button[data-v=sup],nav button[data-v=gui]{display:none!important}' +
    '@media(max-width:760px){nav{grid-template-columns:repeat(3,minmax(0,1fr))!important}}' +
    '.as-yo{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 0 12px}' +
    '.as-num{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px}.as-num div{background:var(--bg,#f6f7f9);border-radius:10px;padding:10px}' +
    '.as-num b{display:block;font-size:24px;line-height:1.1}';
  document.head.appendChild(st);
  ['pend', 'sup'].forEach(function (v) { var x = document.querySelector('nav button[data-v=' + v + ']'); if (x) x.hidden = true; });
  var bInv = document.querySelector('nav button[data-v=inv]');
  if (bInv) bInv.innerHTML = bInv.innerHTML.replace(/Inventario\s*$/, 'Ventas futuras');

  function elegirHtml() {
    return '<div class="card"><h3 style="margin:0 0 4px">¿Quién eres?</h3><p class="small muted" style="margin:0 0 10px">Elige tu nombre una sola vez. El teléfono lo recuerda.</p><div class="quien">' +
      asesores().map(function (p) { return '<button data-yo="' + esc(p.nombre) + '">' + esc(p.nombre) + '<small>' + esc(p.cargo || '') + '</small></button>'; }).join('') + '</div></div>';
  }
  function enlazarYo() {
    document.querySelectorAll('[data-yo]').forEach(function (b) { b.onclick = function () { ponerYo(b.dataset.yo); render(); }; });
    var c = document.getElementById('asCambiar'); if (c) c.onclick = function () { ponerYo(''); render(); };
  }

  /* Ejemplo: garantías del mes del asesor (en la app real: POS por asesor, acumulado del mes) */
  function misGarantias(n) {
    var h = 0; for (var i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) % 997;
    var cant = 4 + h % 23; return {cant: cant, usd: cant * (7.5 + (h % 9))};
  }
  function garantiasHtml(n) {
    var g = misGarantias(n), usd = new Intl.NumberFormat('es-EC', {style: 'currency', currency: 'USD'});
    var f = new Date(S.data.hoy + 'T12:00:00'); f.setDate(f.getDate() - 1);
    return '<div class="card"><div class="fl-cab"><h3>Mis garantías extendidas del mes</h3><span class="tiny muted">al ' + fechaCorta(f.toISOString().slice(0, 10)) + '</span></div>' +
      '<div class="as-num"><div><span class="tiny muted">Vendidas</span><b>' + g.cant + '</b></div><div><span class="tiny muted">Dólares</span><b>' + usd.format(g.usd) + '</b></div></div>' +
      '<div class="tiny muted" style="margin-top:6px">Del POS, se actualiza cada noche. Ejemplo de prueba.</div></div>';
  }

  /* Hoy */
  renderInicio = function () {
    var D = S.data, A = D.anuncios || [], n = yo();
    if (!n) { $('#main').innerHTML = elegirHtml(); enlazarYo(); return; }
    var act = A.filter(activo), sem = semanaDe(D.hoy);
    var fl = flashHtml().replace(/<details open><summary>Todas las tiendas<\/summary>[\s\S]*?<\/details>/, '');
    var h = '<div class="as-yo"><b>Hola, ' + esc(n.split(' ')[0]) + '</b><button class="link tiny" id="asCambiar">No soy yo</button></div>' +
      '<div class="sec-t" id="anuncios"><h3>Anuncios</h3><span class="tiny muted">Semana del ' + fechaCorta(sem[0]) + ' al ' + fechaCorta(sem[1]) + '</span></div>' +
      (act.length ? act.map(anuncioHtml).join('') : '<div class="card muted small">No hay anuncios nuevos.</div>') +
      '<div style="margin-top:16px"></div>' + garantiasHtml(n) + fl;
    $('#main').innerHTML = h;
    enlazarYo();
    document.querySelectorAll('[data-conf]').forEach(function (b) { b.onclick = function () { modalConfirmar(A.find(function (x) { return x.id === b.closest('[data-an]').dataset.an; })); }; });
    confetiFx();
  };

  /* Ventas futuras: solo lo mío */
  var vfOriginal = vfHtml;
  vfHtml = function () {
    var n = yo(), L = VFS.lista;
    if (!n || !L) return vfOriginal();
    VFS.lista = L.filter(function (v) { return v.asesor === n; });
    try { return vfOriginal(); } finally { VFS.lista = L; }
  };
  renderInv = function () {
    if (!yo()) { $('#main').innerHTML = elegirHtml(); enlazarYo(); return; }
    $('#main').innerHTML = vfHtml(); vfEnlazar();
  };

  /* Si alguien llega a una pestaña del líder, vuelve a Hoy */
  var irOriginal = irA;
  irA = function (v) { return irOriginal(['pend', 'sup', 'hist'].indexOf(v) >= 0 ? 'inicio' : v); };
})();
