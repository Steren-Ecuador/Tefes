/* TEFES · ENTORNO DE PRUEBAS — servidor simulado en el navegador.
   Responde las mismas funciones que la app de Google (Apps Script) con la base de ejemplo de datos.js.
   Las pantallas de tienda y de supervisores son las mismas de la app; solo cambia de dónde salen los datos. */
(function () {
  var DB = window.TEFES_PRUEBA;
  var S = function (v) { return String(v == null ? '' : v).trim(); };
  var N = function (v) { var x = S(v).replace('%', '').replace(/\$|\s/g, ''); if (x.indexOf(',') >= 0) x = x.replace(/\./g, '').replace(',', '.'); var n = Number(x); return isNaN(n) || S(v) === '' ? null : n; };
  var F = DB.filas;
  var lista = function (v) { return S(v).split(',').map(function (x) { return x.trim(); }).filter(Boolean); };
  function ahora() { var d = new Date(); return DB.isoDe(d) + ' ' + DB.hm(d); }
  function sinPdf() { throw new Error('En el entorno de pruebas no se generan PDF. En la app real este botón descarga el documento.'); }

  function tiendaDe(tok) { var t = DB.tiendaDeToken(tok); if (!t) throw new Error('Enlace no válido.'); return t; }
  function panelOk(p) { if (p !== DB.token('__PANEL__')) throw new Error('Enlace no válido.'); }
  function supervisores() { return F('Supervisores').filter(function (r) { return /^s/i.test(S(r[4])); }).map(function (r) { return {nombre: S(r[0]), tiendas: S(r[2]) || 'Todas', permiso: S(r[3]) || 'Lectura'}; }); }
  function quien(nombre) {
    var n = S(nombre).split('#')[0];
    if (n === DB.ADMIN) return {nombre: n, tiendas: 'Todas', permiso: 'Seguimiento', admin: true};
    var s = supervisores().filter(function (x) { return x.nombre === n; })[0];
    if (!s) throw new Error('Ese nombre no está en la lista de supervisores.');
    return s;
  }
  function activas() { return F('Tiendas').filter(function (r) { return r[0] && /^s/i.test(S(r[1])); }).map(function (r) { return S(r[0]); }); }
  function gente(t) { return F('Personal').filter(function (r) { return r[1] === t && S(r[6] || 'Activo') === 'Activo'; }).map(function (r) { return {nombre: S(r[0]), cargo: S(r[4])}; }); }
  function para(v) { return /^todas$/i.test(S(v)) ? activas() : lista(v); }
  function cfg(k) { var r = F('Config').filter(function (x) { return x[0] === k; })[0]; return r ? r[1] : ''; }

  /* ---------- pendientes ---------- */
  var P = {ID: 0, SUP: 1, TIENDA: 2, FSUP: 3, ORIGEN: 4, PUNTO: 5, SECCION: 6, TEXTO: 7, CALIF: 8, HALLAZGO: 9, ACCION: 10, RESP: 11, FCOMP: 12, PRIOR: 13, ESTADO: 14,
    FOTO_A: 15, FOTO_D: 16, COM_T: 17, F_RES: 18, F_CIERRE: 19, COM_S: 20, ACT: 21, HIST: 22};
  var sep = function (s) { return S(s).split('|').map(function (x) { return x.trim(); }).filter(Boolean); };
  function pendObj(r) {
    return {id: r[P.ID], sup: r[P.SUP], fechaSup: S(r[P.FSUP]), origen: r[P.ORIGEN], punto: r[P.PUNTO], seccion: r[P.SECCION], texto: r[P.TEXTO], calif: S(r[P.CALIF]),
      hallazgo: r[P.HALLAZGO], accion: r[P.ACCION], responsable: r[P.RESP], fechaCompromiso: S(r[P.FCOMP]), prioridad: r[P.PRIOR], estado: r[P.ESTADO] || 'Pendiente',
      fotosAntes: sep(r[P.FOTO_A]), fotosDespues: sep(r[P.FOTO_D]), comentarioTienda: r[P.COM_T], fechaResuelto: S(r[P.F_RES]), fechaCierre: S(r[P.F_CIERRE]),
      comentarioSupervisor: r[P.COM_S], historial: S(r[P.HIST])};
  }
  function filaPend(id) { var t = DB.hoja('Pendientes'); for (var i = 1; i < t.length; i++) if (t[i][0] === id) return t[i]; throw new Error('No se encontró el pendiente ' + id); }

  /* ---------- ventas de una tienda (C04/C05/C06) ---------- */
  function ventasModelo() {
    var ve = F('Ventas'), mes = ve.map(function (r) { return S(r[0]).slice(0, 7); }).sort().pop(), out = {};
    ve.filter(function (r) { return S(r[0]).slice(0, 7) === mes; }).forEach(function (r) {
      var t = r[1], venta = N(r[2]) || 0, fac = N(r[3]) || 0, it = N(r[4]) || 0, ult = S(r[6]), dia = +ult.slice(8, 10), y = +mes.slice(0, 4), m = +mes.slice(5, 7), dm = new Date(y, m, 0).getDate();
      var p = F('Presupuesto').filter(function (x) { return S(x[0]).slice(0, 7) === mes && x[1] === t; })[0], meta = p ? N(p[2]) : null, proy = venta / dia * dm;
      out[t] = {venta: venta, meta: meta, cumpl: meta ? venta / meta : null, proyeccion: proy, cumplProy: meta ? proy / meta : null, metodo: 'lineal', ultimo: ult,
        ticket: fac ? Math.round(venta / fac * 100) / 100 : null, art: fac ? Math.round(it / fac * 100) / 100 : null, metaTicket: 35, metaArt: 1.8};
    });
    return {mes: mes, ultimo: ve.map(function (r) { return S(r[6]); }).sort().pop(), tiendas: out};
  }

  /* ---------- inventario ---------- */
  function semanaMue() { return F('MueEstado').map(function (r) { return S(r[0]); }).filter(function (s) { return /^\d{4}-S\d{2}$/.test(s); }).sort().pop() || ''; }
  function venceDe(sem) { var l = F('MueLista').filter(function (r) { return r[0] === sem; })[0]; return l && /^\d{4}-\d\d-\d\d/.test(S(l[18])) ? DB.sumar(DB.lunes(DB.sumar(S(l[18]).slice(0, 10), 1)), 2) : DB.hoyISO(); }   // miércoles de la semana publicada
  function corrDe(sem, t) { var m = {}; F('MueCorrecciones').forEach(function (r) { if (r[1] === sem && r[2] === t && r[3]) m[S(r[3]).replace(/^'/, '')] = r; }); return m; }
  function invFilas(sem) {
    var cache = {};
    return F('MueLista').filter(function (r) { return r[0] === sem; }).map(function (r) {
      var k = r[1]; cache[k] = cache[k] || corrDe(sem, k);
      var cr = cache[k][r[3]], costo = N(r[9]) || 0, est = S(r[17]), cerrado = /^OK|^Diferencia/.test(est), dif = cerrado ? (N(r[13]) != null ? N(r[13]) : 0) : null;
      var fin = dif; if (cr && S(cr[8]) !== '') fin = N(cr[8]);
      return {t: r[1], cod: r[3], cic: /c[ií]clico/i.test(S(r[6])), exh: /^ARQ\//i.test(S(r[5])) || /^E-/i.test(S(r[3])), estado: est, costo: costo, dif: dif,
        difd: dif == null ? 0 : Math.round(dif * costo * 100) / 100, fin: fin, rev: !!cr};
    });
  }
  function invTienda(t) {
    var sem = semanaMue(), e = F('MueEstado').filter(function (r) { return r[0] === sem && r[1] === t; })[0];
    if (!e) return null;
    var L = invFilas(sem).filter(function (r) { return r.t === t && !r.cic; }), cont = F('MueLista').filter(function (r) { return r[0] === sem && r[1] === t && !/c[ií]clico/i.test(S(r[6])) && S(r[11]) !== ''; }).length;
    var ok = L.filter(function (r) { return /^OK/.test(r.estado) || r.fin === 0; }).length;
    return {fase: S(e[2]), total: L.length, contados: cont, exactitud: S(e[2]) === 'Enviado' && L.length ? Math.round(ok / L.length * 1000) / 10 : null, vence: venceDe(sem),
      enlace: 'https://diegorevelom.github.io/Muestreo/demo.html'};
  }

  /* ---------- políticas ---------- */
  function politicas() { return F('Políticas').filter(function (r) { return r[0] && !/^no$/i.test(S(r[4])); }).map(function (r) { return {id: S(r[0]), titulo: S(r[1]), publicada: S(r[2]), tiendas: S(r[3]) || 'Todas', resumen: S(r[5])}; }); }
  function polHtml(id) { var r = F('Textos de políticas').filter(function (x) { return x[0] === id; })[0]; return r ? {html: r[1], version: r[2]} : {html: '', version: ''}; }
  function preguntas(id) { return F('Preguntas de políticas').filter(function (r) { return r[0] === id; }).map(function (r) { return {n: S(r[1]), pregunta: S(r[2]), opciones: [r[3], r[4], r[5]].map(S), ok: S(r[6])}; }); }
  function corregir(id, resp) {
    return preguntas(id).map(function (q) { var buena = q.opciones['ABC'.indexOf(q.ok)]; return {n: q.n, bien: S(resp[q.n]) === buena}; });
  }

  /* ---------- guías ---------- */
  function guias() { return F('Guías').filter(function (r) { return r[0] && !/^no$/i.test(S(r[6])); }).map(function (r) { return {id: S(r[0]), titulo: S(r[1]), resumen: S(r[2]), enlace: S(r[3]), publicada: S(r[4]), tiendas: S(r[5]) || 'Todas', tipo: S(r[7]) || 'Guía', para: S(r[8]) || 'Tiendas', preguntas: (S(r[7]) || 'Guía') === 'Guía' && bancoGuia(S(r[0])).length >= 5 ? 5 : 0}; }); }
  function bancoGuia(id) { return F('Preguntas de guías').filter(function (r) { return S(r[0]) === id && r[2] && r[3] && r[4] && r[5]; }); }
  function barajar(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  function lecturasDe(tab, id, t) { return F(tab).filter(function (r) { return r[2] === id && r[3] === t; }).map(function (r) { return {persona: S(r[4]), fecha: S(r[0]), hora: S(r[1])}; }); }
  function cargoDe(t, n) { var g = gente(t).filter(function (x) { return x.nombre === n; })[0]; return g ? g.cargo : ''; }

  /* ---------- funciones de la página de la tienda ---------- */
  var API = {};
  /* lote8: la página pide sus datos en 3 partes a la vez */
  API.apiInitTiendaParte = function (tok, p) {
    var d = API.apiInitTienda(tok);
    if (p === 'base') return d;
    if (p === 'inv') return {inventario: d.inventario, informesInv: d.informesInv, ventasFuturas: d.ventasFuturas, actividades: d.actividades};
    return {politicas: d.politicas, guias: d.guias};
  };
  API.apiInitTienda = function (tok) {
    var t = tiendaDe(tok), hoy = DB.hoyISO(), sec = F('Secciones').map(function (r) { return {cod: r[0], nombre: r[1], peso: N(r[2])}; });
    var puntos = F('Puntos').filter(function (r) { return S(r[5]) !== 'Automático'; }).map(function (r) { return {id: r[0], sec: r[1], seccion: r[2], texto: r[3], criterio: r[4], foto: r[5], queFoto: r[6], datoReq: /^s/i.test(S(r[7]))}; });
    var sups = F('Supervisiones').filter(function (r) { return r[1] === t; }).map(function (r) {
      return {id: r[0], tipo: r[2], fecha: S(r[3]), por: r[6], total: N(r[15]), resultado: r[16], secs: [10, 11, 12, 13, 14, 27].map(function (i) { return N(r[i]); }), pend: N(r[21]) || 0, informe: '', ini: r[4], fin: r[5], min: N(r[25])};
    }).sort(function (a, b) { return a.fecha < b.fecha ? 1 : -1; }).slice(0, 15);
    var v = ventasModelo().tiendas[t];
    var g = gente(t), ger = F('Tiendas').filter(function (r) { return r[0] === t; })[0];
    var vf = F('Ventas futuras').filter(function (r) { return r[3] === t; }), lim = DB.sumar(hoy, -60);
    var mio = t, fl = DB.hoja('Flash');
    return {tienda: t, hoy: hoy, diasCompromiso: N(cfg('DIAS_COMPROMISO')) || 7, maxFotos: N(cfg('MAX_FOTOS_POR_PUNTO')) || 3,
      secciones: sec.filter(function (s) { return puntos.some(function (p) { return p.sec === s.cod; }); }), puntos: puntos, supervisiones: sups,
      pendientes: F('Pendientes').filter(function (r) { return r[2] === t; }).map(pendObj),
      textos: F('Textos').filter(function (r) { return r[1]; }).map(function (r) { return {tipo: S(r[0]), texto: S(r[1])}; }),
      personal: g, gerente: ger ? S(ger[2]) : '',
      ventas: v ? {venta: v.venta, meta: v.meta, cumpl: v.cumpl, proyeccion: v.proyeccion, cumplProy: v.cumplProy, ticket: v.ticket, metaTicket: 35, art: v.art, metaArt: 1.8, ultimo: v.ultimo,
        impulso: [{producto: 'Bocina Bluetooth portátil 10 W', pvp: '44,90', meta: 12}, {producto: 'Batería portátil 10 000 mAh', pvp: '27,90', meta: 20}]} : null,
      anuncios: F('Anuncios').filter(function (r) { return r[0] && !/^no$/i.test(S(r[6])) && para(r[3]).indexOf(t) >= 0 && S(r[1]) <= hoy; }).map(function (r) {
        return {id: S(r[0]), titulo: S(r[4]), texto: S(r[5]), desde: S(r[1]), hasta: S(r[2]) || DB.sumar(S(r[1]), 6), efecto: S(r[7]), cuenta: S(r[8]), lecturas: lecturasDe('Lecturas de anuncios', S(r[0]), t)};
      }).sort(function (a, b) { return a.desde < b.desde ? 1 : -1; }),
      politicas: politicas().filter(function (p) { return para(p.tiendas).indexOf(t) >= 0; }).map(function (p) {
        return {id: p.id, titulo: p.titulo, publicada: p.publicada, resumen: p.resumen, html: polHtml(p.id).html,
          aprobados: F('Lecturas de políticas').filter(function (r) { return r[2] === p.id && r[3] === t && r[7] === 'Aprobó'; }).map(function (r) { return {persona: S(r[4]), fecha: S(r[0]), hora: S(r[1])}; })};
      }),
      guias: guias().filter(function (x) { return x.para === 'Tiendas' && para(x.tiendas).indexOf(t) >= 0; }).map(function (x) { return Object.assign({}, x, {lecturas: lecturasDe('Lecturas de guías', x.id, t)}); }),
      foto: '', inventario: invTienda(t),
      informesInv: F('Informes de inventario').filter(function (r) { return r[4] === t; }).map(function (r) { return {id: r[0], tipo: r[5], fecha: S(r[1]), hora: S(r[2]), desc: N(r[11]) || 0, estado: S(r[13])}; }),
      flash: {filas: fl.map(function (r) { return r.slice(); }), mio: mio},
      ventasFuturas: {llego: vf.filter(function (r) { return r[14] === 'Llegó'; }).length, avisado: vf.filter(function (r) { return r[14] === 'Avisado'; }).length,
        esperando: vf.filter(function (r) { return r[14] === 'Esperando'; }).length, viejos: vf.filter(function (r) { return r[14] === 'Esperando' && S(r[1]) < lim; }).length},
      supervisores: supervisores().filter(function (s) { return s.permiso === 'Seguimiento' && (/^todas$/i.test(s.tiendas) || lista(s.tiendas).indexOf(t) >= 0); }).map(function (s) { return s.nombre; })};
  };
  API.apiActualizarPendiente = function (tok, id, cambio) {
    var t = tiendaDe(tok), r = filaPend(id);
    if (r[P.TIENDA] !== t) throw new Error('Este pendiente no es de tu tienda.');
    if (r[P.ESTADO] === 'Cerrado') throw new Error('Este pendiente ya fue cerrado.');
    var fotos = (cambio.fotos || []).filter(Boolean), st = ahora();
    if (cambio.estado === 'Mensaje' && !S(cambio.comentario)) throw new Error('Escribe el mensaje.');
    if (cambio.estado !== 'Mensaje') r[P.ESTADO] = cambio.estado;
    if (cambio.comentario) r[P.COM_T] = cambio.comentario;
    if (fotos.length) r[P.FOTO_D] = (cambio.estado === 'Por validar' ? fotos : sep(r[P.FOTO_D]).concat(fotos)).join(' | ');
    if (cambio.estado === 'Por validar') r[P.F_RES] = st.slice(0, 10);
    r[P.ACT] = st;
    r[P.HIST] = S(r[P.HIST]) + '\n' + st + ' · ' + cambio.estado + ' (' + (cambio.por || t) + ')' + (cambio.comentario ? ': ' + cambio.comentario : '') + (fotos.length ? ' [' + fotos.length + ' foto(s)]' : '');
    DB.guardar();
    return pendObj(r);
  };
  API.apiSubirFoto = function () { return DB.FOTO; };
  API.apiConfirmarLectura = function (tok, id, persona) {
    var t = tiendaDe(tok), d = new Date(), f = DB.isoDe(d), h = DB.hm(d);
    DB.agregar('Lecturas de anuncios', [f, h, id, t, persona, cargoDe(t, persona)]);
    return {persona: persona, fecha: f, hora: h};
  };
  API.apiPreguntasGuia = function (tok, id) { tiendaDe(tok); return barajar(bancoGuia(id)).slice(0, 5).map(function (r) { return {n: S(r[1]), pregunta: S(r[2]), opciones: barajar([S(r[3]), S(r[4]), S(r[5])])}; }); };
  API.apiConfirmarGuia = function (tok, id, persona, resp) {
    var t = tiendaDe(tok), d = new Date(), f = DB.isoDe(d), h = DB.hm(d), cargo = cargoDe(t, persona), resultado = '';
    var g = guias().filter(function (x) { return x.id === id; })[0];
    if (g && g.preguntas && /gerente de tienda/i.test(cargo)) {
      var banco = bancoGuia(id), ns = Object.keys(resp || {});
      if (ns.length < g.preguntas) throw new Error('Responde las ' + g.preguntas + ' preguntas.');
      var det = ns.map(function (n) { var r = banco.filter(function (x) { return S(x[1]) === n; })[0]; return {n: n, pregunta: r ? S(r[2]) : '', bien: !!r && S(resp[n]) === S(r[3 + 'ABC'.indexOf(S(r[6]).toUpperCase())])}; });
      var ok = det.filter(function (x) { return x.bien; }).length;
      if (ok < ns.length) return {aprobado: false, detalle: det, persona: persona};
      resultado = ok + ' de ' + ns.length;
    }
    DB.agregar('Lecturas de guías', [f, h, id, t, persona, cargo, resultado]);
    return {aprobado: true, persona: persona, fecha: f, hora: h};
  };
  API.apiPreguntasGuia = function (tok, id) {   // guías con preguntas (Guias.gs); en la prueba no hay banco de preguntas de guías
    tiendaDe(tok);
    var q = DB.filas('Preguntas de guías').filter(function (r) { return r[0] === id; });
    if (q.length < 5) throw new Error('Esta guía no tiene preguntas.');
    return q.slice(0, 5).map(function (r) { return {n: S(r[1]), pregunta: S(r[2]), opciones: [r[3], r[4], r[5]].map(S)}; });
  };
  API.apiPreguntasPolitica = function (tok, id) { tiendaDe(tok); return preguntas(id).map(function (q) { return {n: q.n, pregunta: q.pregunta, opciones: q.opciones}; }); };
  API.apiResponderPolitica = function (tok, id, persona, resp) {
    var t = tiendaDe(tok), det = corregir(id, resp || {}), ok = det.every(function (x) { return x.bien; }), d = new Date(), f = DB.isoDe(d), h = DB.hm(d);
    DB.agregar('Lecturas de políticas', [f, h, id, t, persona, cargoDe(t, persona), String(det.filter(function (x) { return x.bien; }).length), ok ? 'Aprobó' : 'No aprobó']);
    return {aprobado: ok, persona: persona, fecha: f, hora: h, detalle: det};
  };
  API.apiPreguntaVisita = function (tok) {
    var t = tiendaDe(tok), P0 = politicas(), p = P0[Math.floor(Math.random() * P0.length)], Q = preguntas(p.id), q = Q[Math.floor(Math.random() * Q.length)], g = gente(t);
    var alDia = g.filter(function (x) { return P0.every(function (pp) { return F('Lecturas de políticas').some(function (r) { return r[2] === pp.id && r[3] === t && r[4] === x.nombre && r[7] === 'Aprobó'; }); }); }).length;
    return {pid: p.id, n: q.n, titulo: p.titulo, pregunta: q.pregunta, opciones: q.opciones, alDia: alDia, total: g.length};
  };
  API.apiCorregirVisita = function (tok, pid, n, opcion) { tiendaDe(tok); var q = preguntas(pid).filter(function (x) { return x.n === S(n); })[0]; return {bien: !!q && q.opciones['ABC'.indexOf(q.ok)] === opcion}; };
  /* punto E04: transferencias de la tienda en el ERP (en pruebas, una lista de ejemplo fija) */
  API.apiTransfE04 = function (tok) {
    tiendaDe(tok); var h = new Date(), d = function (n) { var x = new Date(h.getTime() - n * 864e5); return ('0' + x.getDate()).slice(-2) + '/' + ('0' + (x.getMonth() + 1)).slice(-2) + '/' + x.getFullYear(); };
    return {corte: d(0), umbral: 7, recientes: 2,
      dif: [{n: '10000999', fecha: d(60), dias: 60, estado: 'Con diferencias', con: 'CEDIS Quito', envia: false}],
      viejas: [{n: '10003999', fecha: d(12), dias: 12, estado: 'En tránsito', con: 'CEDIS Guayaquil', envia: false}]};
  };
  API.apiGuardarSupervisionTienda = function (tok, d) {
    var t = tiendaDe(tok), secs = F('Secciones'), puntos = F('Puntos'), suma = {}, cnt = {}, c = {'0': 0, '1': 0, '2': 0, 'N/A': 0};
    (d.items || []).forEach(function (i) { var p = puntos.filter(function (x) { return x[0] === i.id; })[0]; if (!p) return; c[i.calif] = (c[i.calif] || 0) + 1;
      if (i.calif === 'N/A' || i.calif == null) return; suma[p[1]] = (suma[p[1]] || 0) + Number(i.calif); cnt[p[1]] = (cnt[p[1]] || 0) + 2; });
    var pct = {}, tot = 0, pes = 0;
    secs.forEach(function (s) { if (cnt[s[0]]) { pct[s[0]] = Math.round(suma[s[0]] / cnt[s[0]] * 10000) / 10000; tot += pct[s[0]] * N(s[2]); pes += N(s[2]); } });
    var total = pes ? Math.round(tot / pes * 10000) / 10000 : 0, res = total >= 0.9 ? 'Óptimo' : total >= 0.71 ? 'Plan de trabajo' : 'Contención';
    var n = DB.hoja('Supervisiones').length, id = 'S' + (2000 + n), malos = (d.items || []).filter(function (i) { return i.calif === '0' || i.calif === '1'; }), st = ahora();
    DB.agregar('Supervisiones', [id, t, d.tipo, d.fecha, d.horaInicio, d.horaFin, d.realizadaPor, d.gerente, d.subadmin, d.personas, pct.A, pct.B, pct.C, pct.D, pct.E, total, res,
      c['2'], c['1'], c['0'], c['N/A'], malos.length, d.comentario, st, '', d.duracionMin, JSON.stringify(d.tiempoSecciones || {}), '']);
    malos.forEach(function (i, k) {
      var p = puntos.filter(function (x) { return x[0] === i.id; })[0], np = DB.hoja('Pendientes').length;
      DB.agregar('Pendientes', ['P' + (9000 + np), id, t, d.fecha, d.tipo, i.id, p[2], p[3], i.calif, i.obs || '', i.accion || '', i.responsable || '', i.fechaCompromiso || DB.sumar(d.fecha, 7),
        i.prioridad || 'Media', 'Pendiente', (i.fotos || []).join(' | '), '', '', '', '', '', st, st + ' · Creado por ' + d.realizadaPor]);
    });
    return {id: id, total: total, resultado: res, pendientes: malos.length, informe: ''};
  };
  function vfObj(r) {
    return {id: r[0], fecha: S(r[1]), hora: S(r[2]), tienda: r[3], asesor: r[4], cod: r[5], prod: r[6], cant: N(r[7]) || 1, cliente: r[8], celular: r[9], correo: r[10], contacto: r[11], obs: r[12],
      estado: r[14] || 'Esperando', llego: S(r[15]), avisado: S(r[17]), avisoPor: r[18], cierre: S(r[19]), nota: r[20], cedis: S(r[21])};
  }
  API.apiVFLista = function (tok) {
    var t = tiendaDe(tok), lim = DB.sumar(DB.hoyISO(), -30);
    return F('Ventas futuras').map(vfObj).filter(function (v) { return v.tienda === t && (['Compró', 'No compró', 'Cancelado'].indexOf(v.estado) < 0 || (v.cierre || v.fecha) >= lim); })
      .sort(function (a, b) { return a.fecha + a.hora < b.fecha + b.hora ? 1 : -1; });
  };
  API.apiVFCatalogo = function (tok) {
    var t = tiendaDe(tok), cat = {};
    F('MueLista').forEach(function (r) { var k = r[3]; if (!cat[k]) cat[k] = [k, r[4], 'ERP', 0, 0, 0]; if (r[1] === t) cat[k][3] = N(r[8]) || 0; else cat[k][4] += N(r[8]) || 0; });
    Object.keys(cat).forEach(function (k, i) { cat[k][5] = i % 3 ? 12 + i % 9 : 0; if (i % 7 === 0) { cat[k][3] = 0; cat[k][4] = 0; } });
    return {corte: DB.hoyISO(), p: Object.keys(cat).map(function (k) { return cat[k]; })};
  };
  API.apiVFRegistrar = function (tok, d) {
    var t = tiendaDe(tok), dd = new Date(), id = 'VF' + (500 + DB.hoja('Ventas futuras').length);
    var fila = [id, DB.isoDe(dd), DB.hm(dd), t, d.asesor, d.cod, d.prod, String(d.cant || 1), d.cliente, d.celular, d.correo, d.contacto, d.obs, d.acepta ? 'Sí' : 'No', 'Esperando', '', '', '', '', '', '', ''];
    DB.agregar('Ventas futuras', fila);
    return vfObj(fila);
  };
  API.apiVFEstado = function (tok, id, estado, persona, nota) {
    var t = tiendaDe(tok), r = DB.hoja('Ventas futuras').filter(function (x) { return x[0] === id && x[3] === t; })[0];
    if (!r) throw new Error('No se encontró el registro.');
    var hoy = DB.hoyISO(); r[14] = estado;
    if (estado === 'Avisado') { r[17] = hoy; r[18] = persona; }
    if (/Compró|No compró|Cancelado/.test(estado)) { r[19] = hoy; r[20] = nota || ''; if (!r[18]) r[18] = persona; }
    DB.guardar(); return vfObj(r);
  };
  API.apiInformeInventarioDatos = sinPdf;
  API.apiInformeInventarioPdf = sinPdf;
  API.apiRegistro = API.apiRegistroTienda = API.apiRegistroPanel = function () { return true; };

  /* ---------- funciones del panel de supervisores ---------- */
  API.apiPanel = function (p) {
    panelOk(p);
    var lee = function (n) { return DB.hoja(n).map(function (r) { return r.slice(); }); };
    return {ti: lee('Tiendas'), su: lee('Supervisiones'), pe: lee('Pendientes'), co: lee('Config'), tx: lee('Textos'),
      us: supervisores().map(function (s) { return s.nombre; }).concat([DB.ADMIN]), ad: [DB.ADMIN]};
  };
  API.apiLogin = function (p, nombre) {
    panelOk(p); var y = quien(nombre);
    if (y.admin) y.adminUrl = DB.SITIO + 'admin.html';
    return y;
  };
  /* cal1: calendario de visitas (Calendario.gs) */
  API.apiVisitas = function (p, nombre) {
    panelOk(p); var ics = '';
    try { if (nombre) ics = 'prueba-' + quien(nombre).nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-'); } catch (e) {}
    return {v: DB.hoja('Visitas').map(function (r) { return r.slice(); }), ics: ics, url: DB.SITIO + 'calendario-de-prueba.ics'};
  };
  API.apiVisitaGuardar = function (p, nombre, v) {
    panelOk(p); var y = quien(nombre); v = v || {};
    var fecha = S(v.fecha).slice(0, 10); if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) throw new Error('Falta la fecha de la visita.');
    var q = y.admin && v.quien ? S(v.quien) : y.nombre, tipo = q === DB.ADMIN ? 'Diego' : 'Ventas', t = DB.hoja('Visitas'), sello = ahora() + ' · ' + y.nombre;
    if (v.id) {
      var r = t.filter(function (x, k) { return k > 0 && x[0] === v.id; })[0]; if (!r) throw new Error('No se encontró la visita ' + v.id);
      if (!y.admin && S(r[3]) !== y.nombre) throw new Error('Esa visita es de ' + r[3] + '; solo esa persona o el administrador la cambian.');
      r[1] = fecha; r[2] = S(v.tienda); if (y.admin && v.quien) { r[3] = q; r[4] = tipo; } r[5] = v.estado === 'Cancelada' ? 'Cancelada' : 'Programada'; r[6] = S(v.nota); r[7] = S(r[7]) + ' | ' + sello;
      DB.guardar(); return {ok: true, id: r[0]};
    }
    var n = 0; t.slice(1).forEach(function (x) { var m = /^V(\d+)$/.exec(S(x[0])); if (m) n = Math.max(n, +m[1]); });
    var id = 'V' + String(n + 1).padStart(4, '0');
    DB.agregar('Visitas', [id, fecha, S(v.tienda), q, tipo, 'Programada', S(v.nota), sello]);
    return {ok: true, id: id};
  };
  API.apiMiUso = function (p, nombre) { panelOk(p); return 'Tu uso esta semana: 2 h 15 min · este mes: 8 h 40 min'; };
  API.apiAccion = function (p, nombre, id, estado, comentario, fecha) {
    panelOk(p); var y = quien(nombre);
    if (y.permiso !== 'Seguimiento') throw new Error('Tu acceso es de solo lectura.');
    var r = filaPend(id), st = ahora();
    if (estado !== 'Mensaje') r[P.ESTADO] = estado;
    if (comentario) r[P.COM_S] = comentario;
    if (estado === 'Cerrado') r[P.F_CIERRE] = st.slice(0, 10);
    if (estado === 'Reabierto' && fecha) r[P.FCOMP] = fecha;
    r[P.ACT] = st;
    r[P.HIST] = S(r[P.HIST]) + '\n' + st + ' · ' + estado + ' (' + y.nombre + ' · supervisor)' + (comentario ? ': ' + comentario : '');
    DB.guardar(); return true;
  };
  API.apiVentasPanel = function (p) { panelOk(p); return ventasModelo(); };
  API.apiFlashPanel = function (p) { panelOk(p); return DB.hoja('Flash').map(function (r) { return r.slice(); }); };
  API.apiInventarioPanel = function (p) {
    panelOk(p); var sem = semanaMue();
    return {sem: sem, vence: venceDe(sem), estados: F('MueEstado').filter(function (r) { return r[0] === sem; }).map(function (r) { return {t: r[1], fase: r[2], por: r[4]}; }), filas: invFilas(sem)};
  };
  API.apiPoliticasPanel = function (p) {
    panelOk(p); var lect = F('Lecturas de políticas');
    return politicas().map(function (x) {
      return {id: x.id, titulo: x.titulo, desde: x.publicada, tiendas: x.tiendas, por: para(x.tiendas).map(function (t) {
        var lt = lect.filter(function (r) { return r[2] === x.id && r[3] === t; }), ok = lt.filter(function (r) { return r[7] === 'Aprobó'; }).map(function (r) { return r[4]; }).filter(function (n, i, a) { return a.indexOf(n) === i; });
        var g = gente(t).map(function (z) { return z.nombre; });
        return {t: t, ok: ok.length, total: Math.max(g.length, ok.length), faltan: g.filter(function (n) { return ok.indexOf(n) < 0; }), fail: lt.filter(function (r) { return r[7] !== 'Aprobó'; }).length};
      })};
    });
  };
  API.apiPoliticasInformePanel = function (p) {   // informe y cumplimiento por persona: Personal y Lecturas tal cual (con encabezado)
    panelOk(p); var pe = F('Personal'), lp = F('Lecturas de políticas');
    return {pe: [['Nombre completo', 'Tienda', 'Departamento', 'Ciudad', 'Cargo', 'Ingreso', 'Estado']].concat(pe), lp: [['Fecha', 'Hora', 'Política', 'Tienda', 'Persona', 'Cargo', 'Correctas', 'Resultado']].concat(lp)};
  };
  API.apiAliasNombres = function () { return {}; };
  API.apiMenusPerfil = function () { var c = ''; try { c = localStorage.getItem('mpfPrueba') || ''; } catch (e) {} var o = []; try { o = JSON.parse(localStorage.getItem('mpfOrden') || '[]'); } catch (e) {} return c ? {perfil: 'Prueba', todo: false, claves: JSON.parse(c), orden: o} : {perfil: '', todo: true, orden: o}; };   // mp5: orden con mpfOrden   // mp3: en la prueba ve todo salvo que se fije mpfPrueba   // ma2: alias de nombres; en la prueba no hay alias
  API.apiUniPanel = function (p) { panelOk(p); return {fecha: '', total: 0, filas: []}; };   // Universidad Steren: en la prueba no hay lecturas de cursos
  API.apiUniTienda = function (tok) {   // c01u: datos de ejemplo, uno sin cuenta, uno con carreras a medias y uno sin entrar hace 20 días
    var t = tiendaDe(tok), g = gente(t), hoy = DB.isoDe(new Date());
    var filas = g.slice(0, Math.max(g.length - 1, 1)).map(function (p, i) { var n = p.nombre.split(/\s+/), asig = 90 + i * 7, ok = asig - (i % 3 === 1 ? 14 : 2), dias = i === 2 ? 20 : i;
      var v = new Date(); v.setDate(v.getDate() - dias);
      return {n: n.length >= 3 ? n[2].charAt(0) + n[2].slice(1).toLowerCase() + ' ' + n[0].charAt(0) + n[0].slice(1).toLowerCase() : p.nombre, t: t, rol: p.cargo, pos: i + 1, asig: asig, ok: ok, faltan: asig - ok,
        car: i % 3 === 1 ? [100, 100, 100, 66] : [100, 100, 100, 100], cert: 8, visita: DB.isoDe(v), dias: dias, semana: null, estado: dias > 14 ? 'rojo' : ok < asig - 10 ? 'naranja' : 'ok'}; });
    return {fecha: hoy, total: filas.length, filas: filas};
  };
  // fds1/pps1: Explorar ventas usa datos reales cifrados; en la prueba no se entrega la clave. Presupuesto por persona de ejemplo vacío.
  API.apiFdClave = function (p) { panelOk(p); throw new Error('en el entorno de pruebas no hay detalle de ventas'); };
  API.apiFdClaveTienda = function (tok) { tiendaDe(tok); throw new Error('en el entorno de pruebas no hay detalle de ventas'); };
  API.apiPPPanel = function (p) { panelOk(p); return []; };
  API.apiDatoPanel = function (p) { panelOk(p); return {fecha: new Date().toISOString().slice(0, 10), texto: '🏆 Dato de prueba: Portal tuvo su mejor lunes desde que abrió.', tienda: 'Todas'}; };   // dd1
  API.apiGarantiasPanel = function (p) { panelOk(p); return {mesA: '2026-11', mesP: '2026-10', hasta: '2026-11-04', tomado: '2026-11-04 22:31', filas: [['2026-10-01','2026-10-31','Portal','ASESOR1',30,280.5,8],['2026-10-01','2026-10-31','Scala','ASESOR2',25,210,6],['2026-11-01','2026-11-04','Portal','ASESOR1',4,38.9,8],['2026-11-01','2026-11-04','Scala','ASESOR2',3,27,6]]}; };   // gt1
  API.apiStockPanel = function (p) { panelOk(p); return '../stock/'; };   // stk1
  /* aco1: facturas de autoconsumo */
  function acTab() { try { return DB.hoja('Autoconsumo'); } catch (e) {} DB.escribir('Autoconsumo!A1:Q1', [['ID', 'Fecha registro', 'Hora', 'Tienda', 'Registró', 'N° factura', 'Fecha factura', 'Valor', 'Productos', 'Motivo', 'Detalle del motivo', 'Pidió', 'Foto', 'Estado', 'Revisó', 'Fecha revisión', 'Comentario revisión']]); return DB.hoja('Autoconsumo'); }
  function acObj(r) { return {id: r[0], fecha: S(r[1]), hora: S(r[2]), tienda: r[3], registro: r[4], factura: S(r[5]), fechaFac: S(r[6]), valor: N(r[7]) || 0, productos: r[8], motivo: r[9], detalle: r[10], pidio: r[11], foto: r[12], estado: S(r[13]) || 'Por autorizar', reviso: r[14], fechaRev: S(r[15]), comentario: r[16]}; }
  API.apiAutoconsumoLista = function (tok) { var t = tiendaDe(tok); return acTab().slice(1).map(acObj).filter(function (x) { return x.tienda === t; }).sort(function (a, b) { return (b.fecha + b.hora).localeCompare(a.fecha + a.hora); }); };
  API.apiAutoconsumoRegistrar = function (tok, d) {
    var t = tiendaDe(tok), dd = new Date(), L = acTab();
    if (L.slice(1).some(function (r) { return r[3] === t && S(r[5]).replace(/\D/g, '') === S(d.factura).replace(/\D/g, ''); })) throw new Error('Esa factura ya está registrada.');
    var fila = ['AC' + String(1000 + L.length), DB.isoDe(dd), DB.hm(dd), t, d.registro, d.factura, d.fechaFac, String(d.valor), d.productos, d.motivo, d.detalle, d.pidio, d.foto || '', 'Por autorizar', '', '', ''];
    DB.agregar('Autoconsumo', fila); return acObj(fila);
  };
  API.apiAutoconsumoPanel = function (p) { panelOk(p); return acTab().slice(1); };
  /* fpg1: formas de pago de facturas del POS (en la prueba la bitácora vive en memoria) */
  var FPG_FORMAS = ['deUna', 'Transferencias', 'Tipti', 'Shopping Dólares - Condado', 'MobiSol - Mall del Sol', 'Otra'], fpDe = function (t) { return FPG_FORMAS.filter(function (f) { return f.indexOf('Condado') > 0 ? /condado/i.test(t) : f.indexOf('MobiSol') === 0 ? /\bsol\b/i.test(t) : true; }); }, FPG_BIT = [];
  var FPG_CAB = ['ID', 'Fecha registro', 'Hora', 'Tienda', 'Registró', 'Desde', 'N° factura', 'Forma de pago', 'N° de pedido', 'Valor con IVA', 'Cliente', 'Valor de la factura', 'Foto', 'Entregado', 'N° recibo', 'Marcó entrega', 'Estado', 'Anuló', 'Motivo anulación', 'Detalle otra', 'Banco', 'Fecha factura'];
  /* fpg3: ejemplo con las 8 facturas de Condado del 24-oct (registro de Shopping Dólares que ya usaba la tienda; clientes de ejemplo) */
  var FPG_EJ = [['3607', 'Abigail', '4', '3.99', 'BILLECOND 28858-28859-28857-28860', '64', '17:05'], ['3616', 'Danny', '10', '21.99', 'BILLECOND35590 BILLECOND35589 BILLECOND35588 BILLECOND35587 BILLECOND35586 BILLECOND35585 BILLECOND35594 BILLECOND35593 BILLECOND35592 BILLECOND35591', '62', '17:40'],
    ['3620', 'Mauricio', '14', '36', 'BILLECOND35939 BILLECOND35940 BILLECOND35941 BILLECOND35942 BILLECOND35943 BILLECOND35944 BILLECOND35945 BILLECOND35946 BILLECOND35947 BILLECOND35948 BILLECOND35949 BILLECOND35950 BILLECOND35951 BILLECOND35952', '62', '18:12'],
    ['3625', 'Mauricio', '12', '14.98', 'BILLECOND36080 BILLECOND36081 BILLECOND36082 BILLECOND36083 BILLECOND36084 BILLECOND36085 BILLECOND36086 BILLECOND36087 BILLECOND36088 BILLECOND36089 BILLECOND36091 BILLECOND36090', '62', '18:31'],
    ['3629', 'Mauricio', '8', '18.99', 'Sin números anotados (ejemplo de registro incompleto)', '63', '18:50'],
    ['3633', 'Abigail', '51', '56.08', 'BILLECOND36583 BILLECOND36584 BILLECOND36585 BILLECOND36586 BILLECOND36587 BILLECOND36589 BILLECOND36588 BILLECOND36568 BILLECOND36590 BILLECOND36591 BILLECOND36592 BILLECOND36593 BILLECOND36594 BILLECOND36595 BILLECOND36618 BILLECOND36617 BILLECOND36616 BILLECOND36596 BILLECOND36597 BILLECOND36598 BILLECOND36599 BILLECOND36600 BILLECOND36601 BILLECOND36602 BILLECOND36603 BILLECOND36604 BILLECOND36605 BILLECOND36606 BILLECOND36607 BILLECOND36608 BILLECOND36609 BILLECOND36610 BILLECOND36611 BILLECOND36612 BILLECOND36613 BILLECOND36614 BILLECOND36615 BILLECOND36569 BILLECOND36570 BILLECOND36571 BILLECOND36572 BILLECOND36577 BILLECOND36576 BILLECOND36575 BILLECOND36574 BILLECOND36573 BILLECOND36578 BILLECOND36579 BILLECOND36580 BILLECOND36581 BILLECOND36582', '254', '19:20'],
    ['3641', 'Kevin', '12', '27.99', 'BILLECOND38012 BILLECOND38002 BILLECOND38003 BILLECOND38004 BILLECOND38005 BILLECOND38006 BILLECOND38007 BILLECOND38008 BILLECOND38009 BILLECOND38010 BILLECOND38011 BILLECOND38001', '252', '20:02'],
    ['3642', 'Danny', '6', '19.99', 'BILLECOND39713-BILLECOND39712-BILLECOND39711-BILLECOND39710-BILLECOND39709-BILLECOND39708', '253', '20:35']];
  function fpTab() { try { return DB.hoja('Formas de pago'); } catch (e) {}
    DB.escribir('Formas de pago!A1:V1', [FPG_CAB]);
    var ay = DB.isoDe(new Date(Date.now() - 864e5)), hy = DB.isoDe(new Date());   // fechas corridas a ayer para que salgan con el filtro del mes
    FPG_EJ.forEach(function (x, i) { var ent = i < 5, f = ['FP' + String(10001 + i), ay, x[6], 'Condado', x[1], 'Tienda', '010-001-00000' + x[0], 'Shopping Dólares - Condado', x[4], x[2], 'Cliente de ejemplo ' + (i + 1), x[3], '', ent ? hy : '', ent ? x[5] : '', ent ? 'Financiero' : '', 'Vigente', '', '', '', '', ay];
      DB.agregar('Formas de pago', f); var o = fpObj(f);
      FPG_BIT.push({fecha: ay, hora: x[6], accion: 'Registro', id: o.id, tienda: 'Condado', quien: x[1], desde: 'Tienda', detalle: 'Fact. ' + o.factura + ' · ' + o.forma + ' · $' + o.valor});
      if (ent) FPG_BIT.unshift({fecha: hy, hora: '10:15', accion: 'Entrega', id: o.id, tienda: 'Condado', quien: 'Financiero', desde: 'Panel', detalle: 'Recibo ' + x[5]}); });
    FPG_BIT.sort(function (a, b) { return (b.fecha + b.hora).localeCompare(a.fecha + a.hora); });
    return DB.hoja('Formas de pago'); }
  function fpObj(r) { return {id: r[0], fecha: S(r[1]), hora: S(r[2]), tienda: r[3], registro: r[4], registroVer: r[4], desde: r[5], factura: S(r[6]), forma: r[7], pedido: S(r[8]), valor: N(r[9]) || 0, cliente: S(r[10]), valorFac: N(r[11]) || 0, foto: S(r[12]), entregado: S(r[13]), recibo: S(r[14]), marco: S(r[15]), estado: S(r[16]) || 'Vigente', anulo: S(r[17]), motivoAnula: S(r[18]), otra: S(r[19]), banco: S(r[20]), fechaFac: S(r[21])}; }
  var fpOrden = function (a, b) { return (b.fecha + b.hora).localeCompare(a.fecha + a.hora); };
  function fpLog(acc, o, q, desde, det) { var d = new Date(); FPG_BIT.unshift({fecha: DB.isoDe(d), hora: DB.hm(d), accion: acc, id: o ? o.id : '', tienda: o ? o.tienda : '', quien: String(q || '').split('#')[0], desde: desde, detalle: det || ''}); }
  function fpPoner(i, f) { while (f.length < 22) f.push(''); DB.escribir('Formas de pago!A' + (i + 1) + ':V' + (i + 1), [f]); return fpObj(f); }
  API.apiFPGLista = function (tok) { var t = tiendaDe(tok); return {formas: fpDe(t), hoy: DB.isoDe(new Date()), prefijo: t === 'Condado' ? '010-001' : '', lista: fpTab().slice(1).map(fpObj).filter(function (x) { return x.tienda === t; }).sort(fpOrden)}; };
  /* fpg5: misma validación contable que el servidor (copiada de FormasPago.gs) */
/* fpg5: VALIDACIÓN CONTABLE de un registro (Diego 16-nov: "piénsalo como un contador"). Función pura: la usa el servidor y, copiada tal cual,
   el entorno de pruebas. d = lo que manda el asistente; filas = registros existentes (objetos); hoy = 'yyyy-MM-dd'; formas = las de la tienda.
   Devuelve los datos normalizados o lanza un Error con un mensaje claro para el usuario. */
function fpgValidar_(d, tienda, filas, hoy, formas) {
  d = d || {};
  const txt = (v, n) => String(v == null ? '' : v).trim().replace(/^[=+\-@]+/, '').replace(/\s+/g, ' ').slice(0, n || 200);
  const num = x => { let s = String(x == null ? '' : x).replace(/[$\s]/g, ''); if (s.indexOf(',') >= 0) s = s.replace(/\./g, '').replace(',', '.'); const n = Number(s); return isNaN(n) ? 0 : Math.round(n * 100) / 100; };
  const usd = n => '$' + Number(n || 0).toFixed(2).replace('.', ',');
  const dias = (iso, k) => { const t = new Date(iso + 'T12:00:00Z'); t.setUTCDate(t.getUTCDate() + k); return t.toISOString().slice(0, 10); };
  const VALES = {'Shopping Dólares - Condado': 1, 'MobiSol - Mall del Sol': 1};
  const FOTO = {'Shopping Dólares - Condado': 1, 'MobiSol - Mall del Sol': 1, 'Transferencias': 1};
  /* 1. factura completa del SRI: establecimiento-punto-secuencial (005-001-000004800) */
  const g = String(d.factura == null ? '' : d.factura).replace(/[^\d-]/g, ' ').trim().split(/[\s-]+/).filter(Boolean);
  let fac = '';
  if (g.length === 3 && g[0].length <= 3 && g[1].length <= 3 && g[2].length <= 9 && Number(g[2]) > 0) fac = ('00' + g[0]).slice(-3) + '-' + ('00' + g[1]).slice(-3) + '-' + ('00000000' + g[2]).slice(-9);
  else if (g.length === 1 && g[0].length === 15) fac = g[0].slice(0, 3) + '-' + g[0].slice(3, 6) + '-' + g[0].slice(6);
  if (!fac || /^000-|-000-/.test(fac)) throw new Error('Escribe la factura completa, como sale en el POS: 005-001-000004800.');
  /* 2. fecha y total de la factura */
  const fechaFac = /^\d{4}-\d{2}-\d{2}$/.test(String(d.fechaFac || '')) ? String(d.fechaFac) : '';
  if (!fechaFac) throw new Error('Pon la fecha de la factura.');
  if (fechaFac > hoy) throw new Error('La fecha de la factura no puede ser futura.');
  if (fechaFac < dias(hoy, -45)) throw new Error('La factura tiene más de 45 días. Pide a Financiero que la registre.');
  const valorFac = num(d.valorFac);
  if (!(valorFac > 0)) throw new Error('Pon el total de la factura con IVA.');
  if (valorFac > 100000) throw new Error('Revisa el total de la factura: parece demasiado alto.');
  /* 3. forma de pago y sus datos */
  const forma = txt(d.forma, 40);
  if ((formas || []).indexOf(forma) < 0) throw new Error('Elige una forma de pago de la lista.');
  const otra = forma === 'Otra' ? txt(d.otra, 100) : '', banco = forma === 'Transferencias' ? txt(d.banco, 40) : '';
  let ref = txt(d.pedido, 1500), claves = [];
  if (forma === 'Otra' && otra.length < 3) throw new Error('Escribe cuál es la otra forma de pago.');
  if (forma === 'Transferencias' && banco.length < 3) throw new Error('Elige el banco de la transferencia.');
  if (forma === 'Tipti') { ref = ref.replace(/\D/g, ''); if (ref.length !== 7) throw new Error('El pedido Tipti tiene 7 dígitos.'); claves = ['TIPTI ' + ref]; }
  else if (forma === 'deUna') { ref = ref.replace(/\s/g, ''); if (ref.length < 4) throw new Error('Escribe la referencia de deUna.'); claves = ['DEUNA ' + ref.toUpperCase()]; }
  else if (forma === 'Transferencias') { ref = ref.replace(/\s/g, ''); if (ref.length < 3) throw new Error('Escribe el número de documento de la transferencia.'); claves = ['TRANSF ' + banco.toUpperCase() + ' ' + ref.toUpperCase()]; }
  else if (VALES[forma]) {
    const c = (ref.match(/\d{4,}/g) || []).map(x => String(Number(x)));
    if (!c.length) throw new Error('Escribe los números de los vales.');
    const rep = c.filter((x, i) => c.indexOf(x) !== i); if (rep.length) throw new Error('El vale ' + rep[0] + ' está repetido en la lista.');
    claves = c.map(x => 'VALE ' + forma + ' ' + x);
    ref = forma.indexOf('Shopping') === 0 ? c.map(x => 'BILLECOND' + x).join(' ') : c.join(' ');
  } else { if (ref.length < 3) throw new Error('Escribe el número de comprobante.'); claves = []; }
  /* 4. valor pagado con esta forma */
  let valor = num(d.valor);
  if (forma === 'Shopping Dólares - Condado') { const n = claves.length; if (valor && Math.abs(valor - n) > 0.004) throw new Error((n === 1 ? 'Es 1 vale de $1' : 'Son ' + n + ' vales de $1') + ': el valor pagado debe ser ' + usd(n) + '.'); valor = n; }
  if (!(valor > 0)) throw new Error('Pon el valor pagado con esta forma.');
  if (valor > valorFac + (VALES[forma] ? 0.99 : 0) + 0.004) throw new Error('Lo pagado con esta forma (' + usd(valor) + ') es más que el total de la factura (' + usd(valorFac) + ').');
  /* 5. respaldo */
  const foto = /^https:\/\/drive\.google\.com\//.test(String(d.foto || '')) ? String(d.foto) : '';
  if (FOTO[forma] && !foto) throw new Error('Toma la foto del ' + (forma === 'Transferencias' ? 'comprobante de la transferencia' : 'vale y la factura') + '.');
  /* 6. cuadre con lo ya registrado de la misma factura (vigentes) */
  const vig = (filas || []).filter(x => (x.estado || 'Vigente') !== 'Anulada');
  const misma = vig.filter(x => x.tienda === tienda && String(x.factura).replace(/\D/g, '') === fac.replace(/\D/g, ''));
  misma.forEach(x => {
    if (x.valorFac && Math.abs(x.valorFac - valorFac) > 0.004) throw new Error('Esta factura ya está registrada con total ' + usd(x.valorFac) + '. Revisa el total o anula el registro anterior.');
    if (x.fechaFac && x.fechaFac !== fechaFac) throw new Error('Esta factura ya está registrada con fecha ' + x.fechaFac.split('-').reverse().join('/') + '. Revisa la fecha.');
  });
  const suma = misma.reduce((a, x) => a + (Number(x.valor) || 0), 0);
  const tol = VALES[forma] || misma.some(x => VALES[x.forma]) ? 0.994 : 0.004;   // los vales de $1 pueden pasar la factura por centavos
  if (suma + valor > valorFac + tol) throw new Error('Con este pago, las formas registradas de la factura suman ' + usd(suma + valor) + ' y la factura es de ' + usd(valorFac) + '.');
  /* 7. una referencia, pedido o vale no se usa dos veces (en ninguna factura ni tienda) */
  if (claves.length) {
    const ya = {};
    vig.forEach(x => {
      const f = x.forma, r = String(x.pedido || '');
      let k = [];
      if (f === 'Tipti') k = ['TIPTI ' + r.replace(/\D/g, '')];
      else if (f === 'deUna') k = ['DEUNA ' + r.replace(/\s/g, '').toUpperCase()];
      else if (f === 'Transferencias') k = ['TRANSF ' + String(x.banco || '').toUpperCase() + ' ' + r.replace(/\s/g, '').toUpperCase()];
      else if (VALES[f]) k = (r.match(/\d{4,}/g) || []).map(y => 'VALE ' + f + ' ' + String(Number(y)));
      k.forEach(y => { ya[y] = x; });
    });
    const choque = claves.find(k => ya[k]);
    if (choque) { const x = ya[choque];
      throw new Error((VALES[forma] ? 'El vale ' + choque.split(' ').pop() : forma === 'Tipti' ? 'El pedido Tipti ' + ref : forma === 'deUna' ? 'La referencia deUna ' + ref : 'La transferencia ' + ref + ' de ' + banco) +
        ' ya se registró en la factura ' + x.factura + ' (' + x.tienda + ', ' + String(x.fecha || '').split('-').reverse().join('/') + ').'); }
  }
  return {factura: fac, fechaFac: fechaFac, valorFac: valorFac, forma: forma, otra: otra, banco: banco, pedido: ref, valor: valor, foto: foto, cliente: txt(d.cliente, 100)};
}

  API.apiFPGRegistrar = function (tok, d) {
    var t = tiendaDe(tok), dd = new Date(), L = fpTab();
    if (!d.registro) throw new Error('Elige tu nombre.'); if (d.confirmo !== true) throw new Error('Confirma que revisaste los datos.');
    if (/^data:/.test(S(d.foto))) d.foto = 'https://drive.google.com/prueba-foto';   // en la prueba la foto no se sube
    var v = fpgValidar_(d, t, L.slice(1).map(fpObj), DB.isoDe(dd), fpDe(t));
    var fila = ['FP' + String(10000 + L.length), DB.isoDe(dd), DB.hm(dd), t, d.registro, d.desde === 'Asesor' ? 'Asesor' : 'Tienda', v.factura, v.forma, v.pedido, String(v.valor), v.cliente, String(v.valorFac), v.foto, '', '', '', 'Vigente', '', '', v.otra, v.banco, v.fechaFac];
    DB.agregar('Formas de pago', fila); var o = fpObj(fila); fpLog('Registro', o, d.registro, fila[5], 'Fact. ' + o.factura + ' · ' + o.forma + ' · $' + o.valor); return o;
  };
  function fpAnular(id, q, desde, mot) { var H = fpTab(), i = H.findIndex(function (r) { return r[0] === id; }); if (i < 1) throw new Error('No encontré el registro.');
    var f = H[i].slice(); f[16] = 'Anulada'; f[17] = String(q).split('#')[0]; f[18] = mot; var o = fpPoner(i, f); fpLog('Anulación', o, q, desde, 'Motivo: ' + mot); return o; }
  API.apiFPGAnularTienda = function (tok, id, per, mot) { tiendaDe(tok); return fpAnular(id, per, 'Tienda', mot); };
  API.apiFPGAnularPanel = function (p, q, id, mot) { panelOk(p); return fpAnular(id, q, 'Panel', mot); };
  API.apiFPGEntregar = function (p, q, ids, rec) { panelOk(p); var H = fpTab(), out = [], hoy = DB.isoDe(new Date());
    H.forEach(function (r, i) { if (i && ids.indexOf(r[0]) >= 0) { var f = r.slice(); f[13] = rec ? hoy : ''; f[14] = rec || ''; f[15] = rec ? String(q).split('#')[0] : ''; var o = fpPoner(i, f); fpLog('Entrega', o, q, 'Panel', 'Recibo ' + rec); out.push(o); } });
    return out; };
  API.apiFPGPanel = function (p, q) { panelOk(p); fpLog('Consulta', null, q, 'Panel', ''); return {formas: FPG_FORMAS, lista: fpTab().slice(1).map(fpObj).sort(fpOrden), integridad: {ok: true, lineas: FPG_BIT.length, rotas: [], cambiadas: []}}; };
  API.apiFPGBitacora = function (p) { panelOk(p); return FPG_BIT.slice(); };
  API.apiFPGExporto = function (p, q, det) { panelOk(p); fpLog('Exportación', null, q, 'Panel', det); return true; };
  API.apiPPTienda = function (tok) { tiendaDe(tok); return []; };
  API.apiClientesPanel = function (p) {   // pestaña Clientes del panel: las dos hojas tal cual, con encabezado (en la foto real celular y correo van tapados)
    panelOk(p);
    return {vf: DB.hoja('Ventas futuras').slice(), rec: DB.hoja('Reclamos clientes').slice()};
  };
  API.apiActividadesPanel = function (p) {   // actividades del mes de ejemplo (sobre de caja chica)
    panelOk(p); var mes = new Date().toISOString().slice(0, 7);
    return [{id: 'A1', periodo: mes, titulo: 'Sobre de caja chica ' + mes, vence: mes + '-28',
      tiendas: F('Tiendas').filter(function (r) { return r[0]; }).map(function (r, i) { return {tienda: S(r[0]), hecho: i % 2 ? null : {persona: 'Ejemplo', fecha: mes + '-05', hora: '10:15', foto: ''}}; })}];
  };
  API.apiMarcarActividad = function (tok, id, periodo, persona) {
    tiendaDe(tok); if (!persona) throw new Error('Elige quién entrega.');
    return {persona: persona, fecha: new Date().toISOString().slice(0, 10), hora: '10:00', foto: ''};
  };
  API.apiPoliticasTextoPanel = function (p) {
    panelOk(p); var sup = {};
    F('Lecturas de políticas supervisores').forEach(function (r) { var m = sup[r[2]] = sup[r[2]] || {}; if (m[r[3]] !== 'Aprobó') m[r[3]] = r[4]; });
    return {politicas: politicas().map(function (x) { var h = polHtml(x.id); return {id: x.id, titulo: x.titulo, resumen: x.resumen, desde: x.publicada, html: h.html, version: h.version}; }),
      supervisores: supervisores().map(function (s) { return s.nombre; }), sup: sup};
  };
  API.apiPreguntasPoliticaSup = function (p, nombre, id) { panelOk(p); quien(nombre); return preguntas(id).map(function (q) { return {n: q.n, pregunta: q.pregunta, opciones: q.opciones}; }); };
  API.apiResponderPoliticaSup = function (p, nombre, id, resp) {
    panelOk(p); var y = quien(nombre), det = corregir(id, resp || {}), ok = det.every(function (x) { return x.bien; }), d = new Date();
    DB.agregar('Lecturas de políticas supervisores', [DB.isoDe(d), DB.hm(d), id, y.nombre, ok ? 'Aprobó' : 'No aprobó']);
    return {aprobado: ok, detalle: det};
  };
  API.apiGuiasPanel = function (p) {
    panelOk(p);
    return guias().map(function (g) {
      var o = Object.assign({}, g);
      if (g.tipo !== 'Manual' && g.para === 'Tiendas') o.por = para(g.tiendas).map(function (t) {
        var ya = lecturasDe('Lecturas de guías', g.id, t).map(function (l) { return l.persona; }), gg = gente(t).map(function (z) { return z.nombre; });
        return {t: t, ok: gg.filter(function (n) { return ya.indexOf(n) >= 0; }).length, total: gg.length, faltan: gg.filter(function (n) { return ya.indexOf(n) < 0; })};
      });
      return o;
    });
  };
  API.apiAvisosPanel = function (p) {
    panelOk(p); var hoy = DB.hoyISO(), leido = {};
    F('Lecturas de anuncios').forEach(function (r) { leido[r[2] + '|' + r[3] + '|' + r[4]] = 1; });
    return F('Anuncios').map(function (r) { return {id: S(r[0]), desde: S(r[1]), hasta: S(r[2]) || DB.sumar(S(r[1]), 6), tiendas: S(r[3]) || 'Todas', titulo: S(r[4]), texto: S(r[5]), activo: S(r[6]) || 'Sí', efecto: S(r[7]), cuenta: S(r[8])}; })
      .filter(function (a) { return a.id && a.desde <= hoy && a.hasta >= hoy && !/^no$/i.test(a.activo); })
      .map(function (a) { return {id: a.id, titulo: a.titulo, texto: a.texto, desde: a.desde, hasta: a.hasta, efecto: a.efecto, cuenta: a.cuenta, lecturas: para(a.tiendas).map(function (t) {
        var g = gente(t).map(function (z) { return z.nombre; }); return {tienda: t, total: g.length, leyeron: g.filter(function (n) { return leido[a.id + '|' + t + '|' + n]; }).length, faltan: g.filter(function (n) { return !leido[a.id + '|' + t + '|' + n]; })}; })}; });   // an2: faltan con nombres
  };
  API.apiContactosPanel = function (p) {
    panelOk(p);
    return F('Contactos').map(function (r) { return {tienda: S(r[0]), ciudad: S(r[1]), correo: S(r[2]), tel: S(r[3]), wa: S(r[4]), ubic: S(r[5]), horario: S(r[6])}; });
  };
  API.apiEnlaceSupervision = function (p, nombre, tienda) {
    if (p !== DB.token('__PANEL__')) { var tt = tiendaDe(p); tienda = tienda || tt; }
    else { var y = quien(nombre); if (y.permiso !== 'Seguimiento') throw new Error('Tu acceso es de solo lectura.'); nombre = y.nombre; }
    var tok = DB.token(S(tienda)); if (!tok) throw new Error('No encontré el enlace de ' + tienda + '.');
    return DB.SITIO + '?t=' + encodeURIComponent(tok) + (nombre ? '&sup=' + encodeURIComponent(nombre) : '');
  };
  API.apiInvLeer = function (p, nombre, rango) { panelOk(p); quien(nombre); return DB.leer(rango); };
  API.apiInvEscribir = function (p, nombre, rango, valores) { panelOk(p); var y = quien(nombre); if (y.permiso !== 'Seguimiento') throw new Error('Tu acceso es de solo lectura.'); return DB.escribir(rango, valores); };
  API.apiInvPdf = API.apiPoliticaPdf = API.apiHojaManualPdf = sinPdf;
  API.apiConteoVivo = function (p, nombre, tienda) {
    panelOk(p); quien(nombre);
    var est = DB.leer('MueEstado!A2:E80'), lis = DB.leer('MueLista!A2:R2000'), con = DB.leer('MueConteo!B2:I5000'), lec = DB.leer('MueLecturas!A2:J5000');
    var sem = est.map(function (r) { return S(r[0]); }).filter(function (x) { return /^\d{4}-S\d{2}$/.test(x); }).sort().pop() || '';
    var todas = lec.filter(function (r) { return S(r[1]) === sem; }), ultima = {};
    todas.forEach(function (r) { var f = S(r[0]); if (f > (ultima[S(r[2])] || '')) ultima[S(r[2])] = f; });
    var hace = function (m) { var d = new Date(Date.now() - m * 60000); return DB.isoDe(d) + ' ' + DB.hm(d); }, corte = hace(15), corteF = hace(120);
    var tiendas = est.filter(function (r) { return S(r[0]) === sem && S(r[1]); }).map(function (r) { var t = S(r[1]), u = ultima[t] || '';
      return {t: t, fase: S(r[2]), act: S(r[3]), por: S(r[4]), ult: u, vivo: u >= corte || (/contando|segundo/i.test(S(r[2])) && (u || S(r[3])) >= corteF)}; });
    if (!tiendas.length) return {sem: sem, tiendas: [], tienda: ''};
    tienda = S(tienda);
    if (!tiendas.some(function (x) { return x.t === tienda; })) { var viva = tiendas.filter(function (x) { return x.vivo; }).sort(function (a, b) { return b.ult.localeCompare(a.ult); })[0] || tiendas.filter(function (x) { return !/enviado/i.test(x.fase); })[0]; tienda = (viva || tiendas[0]).t; }
    var lst = lis.filter(function (r) { return S(r[0]) === sem && S(r[1]) === tienda; }).map(function (r) { return {n: N(r[2]) || 0, cod: S(r[3]), desc: S(r[4]), mot: S(r[6]), teo: N(r[8]) || 0, costo: N(r[9]) || 0}; });
    var conteo = con.filter(function (r) { return S(r[0]) === sem && S(r[1]) === tienda; }).map(function (r) { return [N(r[2]) || 1, S(r[3]), S(r[4]), S(r[5]), N(r[6]) || 0, S(r[7])]; });
    var lect = todas.filter(function (r) { return S(r[2]) === tienda; }).map(function (r) { return [S(r[0]), S(r[4]), S(r[5]), S(r[6]), S(r[7]), S(r[8]), S(r[9])]; });
    var metodos = {}; lect.forEach(function (r) { metodos[r[4] || 'Otro'] = (metodos[r[4] || 'Otro'] || 0) + 1; });
    return {sem: sem, tiendas: tiendas, tienda: tienda, lista: lst, conteo: conteo, lect: lect.slice(-30), metodos: metodos, hora: new Date().toTimeString().slice(0, 8)};
  };

  // pf2: proformas del POS (datos de ejemplo; en la prueba no hay bajada real del POS)
  var PF2 = null;
  function pf2Ej(t) {
    if (PF2 && PF2.t === t) return PF2;
    var g = gente(t).map(function (p) { var n = p.nombre.split(/\s+/); return n.length >= 3 ? n[2].charAt(0) + n[2].slice(1).toLowerCase() + ' ' + n[0].charAt(0) + n[0].slice(1).toLowerCase() : p.nombre; });
    var d = function (n) { var x = new Date(); x.setDate(x.getDate() + n); return DB.isoDe(x); };
    var cli = ['Cliente de ejemplo 1', 'Cliente de ejemplo 2', 'Cliente de ejemplo 3', 'Cliente de ejemplo 4', 'Cliente de ejemplo 5'];
    var filas = cli.map(function (c, i) { var ab = i < 4;
      return {id: 'PV90000' + i, doc: '90000' + i, creada: d(-i - 1), tienda: t, asesor: g[i % Math.max(g.length, 1)] || '', cliente: c, cel: '09' + (91234560 + i), productos: 'Producto de ejemplo', monto: 50 + i * 37.5,
        estado: ab ? 'Abierta' : 'Compró', cierre: ab ? '' : d(-1), contactos: i === 1 ? 1 : 0, hist: i === 1 ? [{f: d(-1), canal: 'WhatsApp', res: 'Lo está pensando', nota: ''}] : [], fuera: i === 3, espera: ab && i >= 2 && i !== 3 && i !== 1, origen: 'POS'}; });
    PF2 = {t: t, filas: filas, gente: g};
    return PF2;
  }
  API.apiPFTienda = function (tok) { var t = tiendaDe(tok), X = pf2Ej(t); return {tienda: t, filas: X.filas, gente: X.gente, juego: {tienda: {n: 5, cerradas: 1, pct: 0.2}}}; };
  API.apiPFReasignar = function (tok, id, persona) { var t = tiendaDe(tok), X = pf2Ej(t); X.filas.forEach(function (f) { if (f.id === id) f.asesor = persona; }); return true; };
  API.apiPFPanel = function (p, per) { panelOk(p);
    return {desde: '', hasta: '', motivos: {'Le pareció caro': 3, 'No teníamos stock': 2, 'Compró en otro lado': 1},
      tiendas: activas().slice(0, 6).map(function (t, i) { return {tienda: t, n: 20 - i * 2, monto: 4000 - i * 300, aTiempo: 15 - i * 2, evaluables: 18 - i * 2, sinContacto: i, cerradas: 6 - i, cerradoUsd: 1500 - i * 180, perdidas: 2 + (i % 2), abiertas: 8}; })}; };

  window.TEFES_SERVIDOR = API;
})();
