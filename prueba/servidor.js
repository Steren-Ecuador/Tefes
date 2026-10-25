/* TEFES · ENTORNO DE PRUEBAS — servidor simulado en el navegador.
   Responde las mismas funciones que la app de Google (Apps Script) con la base de ejemplo de datos.js.
   Las pantallas de tienda y de supervisores son las mismas de la app; solo cambia de dónde salen los datos. */
(function () {
  var DB = window.TEFES_PRUEBA;
  var S = function (v) { return String(v == null ? '' : v).trim(); };
  var N = function (v) { var n = Number(S(v).replace('%', '').replace(',', '.')); return isNaN(n) || S(v) === '' ? null : n; };
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
  function venceDe(sem) { var l = F('MueLista').filter(function (r) { return r[0] === sem; })[0]; return l ? DB.sumar(S(l[18]), 2) : DB.hoyISO(); }
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
  function guias() { return F('Guías').filter(function (r) { return r[0] && !/^no$/i.test(S(r[6])); }).map(function (r) { return {id: S(r[0]), titulo: S(r[1]), resumen: S(r[2]), enlace: S(r[3]), publicada: S(r[4]), tiendas: S(r[5]) || 'Todas', tipo: S(r[7]) || 'Guía', para: S(r[8]) || 'Tiendas'}; }); }
  function lecturasDe(tab, id, t) { return F(tab).filter(function (r) { return r[2] === id && r[3] === t; }).map(function (r) { return {persona: S(r[4]), fecha: S(r[0]), hora: S(r[1])}; }); }
  function cargoDe(t, n) { var g = gente(t).filter(function (x) { return x.nombre === n; })[0]; return g ? g.cargo : ''; }

  /* ---------- funciones de la página de la tienda ---------- */
  var API = {};
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
        return {id: S(r[0]), titulo: S(r[4]), texto: S(r[5]), desde: S(r[1]), hasta: S(r[2]) || DB.sumar(S(r[1]), 6), efecto: S(r[7]), lecturas: lecturasDe('Lecturas de anuncios', S(r[0]), t)};
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
  API.apiConfirmarGuia = function (tok, id, persona) {
    var t = tiendaDe(tok), d = new Date(), f = DB.isoDe(d), h = DB.hm(d);
    DB.agregar('Lecturas de guías', [f, h, id, t, persona, cargoDe(t, persona)]);
    return {persona: persona, fecha: f, hora: h};
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
  API.apiClientesPanel = function (p) {   // pestaña Clientes del panel: sin datos de clientes en la prueba
    panelOk(p);
    return {vf: [['Fecha', 'Tienda', 'Código', 'Producto', 'Cantidad', 'Asesor', 'Cliente', 'Celular', 'Correo', 'Contacto', 'Nota', 'Consentimiento', 'Estado']], rec: [['Fecha', 'Tienda', 'Cliente', 'Reclamo', 'Estado']]};
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
    return F('Anuncios').map(function (r) { return {id: S(r[0]), desde: S(r[1]), hasta: S(r[2]) || DB.sumar(S(r[1]), 6), tiendas: S(r[3]) || 'Todas', titulo: S(r[4]), texto: S(r[5]), activo: S(r[6]) || 'Sí'}; })
      .filter(function (a) { return a.id && a.desde <= hoy && a.hasta >= hoy && !/^no$/i.test(a.activo); })
      .map(function (a) { return {id: a.id, titulo: a.titulo, texto: a.texto, desde: a.desde, hasta: a.hasta, lecturas: para(a.tiendas).map(function (t) {
        var g = gente(t).map(function (z) { return z.nombre; }); return {tienda: t, total: g.length, leyeron: g.filter(function (n) { return leido[a.id + '|' + t + '|' + n]; }).length}; })}; });
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

  window.TEFES_SERVIDOR = API;
})();
