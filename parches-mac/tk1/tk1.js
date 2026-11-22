/* tk1: Inicio tipo TikTok (Diego 22-nov-2026). Reemplaza el armado del Inicio; los datos y botones son los mismos de antes. */
(function(){
  if (typeof renderInicio !== 'function') return;
  const COL = ['#0078be', '#7b4bc4', '#d0477a', '#1a8f7a', '#e07b16', '#3d5a80'];
  const ini = n => String(n || '').split(' ').filter(Boolean).slice(0, 2).map(x => x[0]).join('').toUpperCase();
  const d0 = n => '$' + Math.round(n || 0).toLocaleString('es-EC');
  function venta(){
    const F = S.data.flash; if (!F || !F.filas || F.filas.length < 2) return null;
    const nm = v => { if (v === '' || v == null) return null; const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.')); return isNaN(n) ? null : n; };
    const r = F.filas.slice(1).find(x => String(x[1]) === F.mio); if (!r) return null;
    const f = String(r[6] || '').slice(0, 10); if (!/^\d{4}-\d{2}-\d{2}/.test(f)) return null;
    const d = new Date(f + 'T12:00:00Z'), fin = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
    const mes = nm(r[4]) || 0, pres = nm(r[5]), ritmo = d.getUTCDate() / fin, quedan = fin - d.getUTCDate();
    return {mes, pres, dia: nm(r[3]) || 0, cu: pres ? mes / pres : null, ritmo, quedan, mesTxt: new Intl.DateTimeFormat('es-EC', {month: 'long', timeZone: 'UTC'}).format(d)};
  }
  const sl = (c, vis, k, t, d, btns, extra) => '<section class="tk-s tk-c' + c + '"' + (extra || '') + '><div class="tk-vis">' + vis + '</div><div class="tk-k">' + k + '</div><div class="tk-t">' + t + '</div>' + (d ? '<div class="tk-d">' + d + '</div>' : '') + (btns ? '<div class="tk-btns">' + btns + '</div>' : '') + '</section>';
  const bt = (txt, attr, sec) => '<button class="tk-b' + (sec ? ' sec' : '') + '" ' + attr + '>' + txt + '</button>';
  function slides(){
    const D = S.data, hoy = D.hoy, sem = semanaDe(hoy), G = gente(), out = [];
    const abiertos = D.pendientes.filter(p => ABIERTOS.includes(p.estado)), venc = abiertos.filter(p => p.fechaCompromiso && p.fechaCompromiso < hoy).length;
    const auto = D.supervisiones.find(s => s.tipo === 'Autosupervisión' && String(s.fecha).slice(0, 10) >= sem[0]);
    /* 1. Venta del mes */
    const v = venta(), dato = D.dato && D.dato.texto ? String(D.dato.texto) : '';
    if (v && v.pres) {
      const falta = Math.max(v.pres - v.mes, 0), ok = v.cu >= v.ritmo, p = Math.round(Math.min(v.cu, 1) * 100);
      out.push(sl(0, '<div class="tk-donut' + (ok ? ' ok' : '') + '" style="--p:' + p + '"><b>' + Math.round(v.cu * 100) + '%<small>de la meta</small></b></div>',
        'Hola, equipo ' + esc(D.tienda) + ' 👋', 'Venta de ' + esc(v.mesTxt) + ': ' + d0(v.mes),
        'De ' + d0(v.pres) + '. ' + (v.cu >= 1 ? '¡Meta cumplida! 🎉' : (ok ? 'Vamos sobre el ritmo 💪' : 'Vamos un pelín por debajo del ritmo.') + (v.quedan > 0 ? ' Faltan <b>' + d0(falta / v.quedan) + ' por día</b>.' : '')) +
        '<div class="tk-bar"><i class="' + (ok ? 'ok' : '') + '" style="width:' + p + '%"></i><u style="left:' + v.ritmo * 100 + '%"></u></div>' + (dato ? '<div style="opacity:.85;font-size:13px">' + esc(dato) + '</div>' : ''),
        bt('Ver ventas', 'data-tkv') ));
    } else if (dato) out.push(sl(0, '<div class="tk-pic">☀️</div>', 'Hola, equipo ' + esc(D.tienda) + ' 👋', 'Dato del día', esc(dato), bt('Ver ventas', 'data-tkv')));
    /* 2. Anuncios sin confirmar: uno por pantalla */
    (D.anuncios || []).filter(a => activo(a) && (faltan(a).length || !G.length && !a.lecturas.length)).forEach(a => {
      const f = faltan(a), ya = lecs(a).map(l => l.persona);
      const av = '<div class="tk-av">' + G.map((n, i) => '<span class="' + (ya.indexOf(n) < 0 ? 'no' : '') + '" style="background:' + COL[i % COL.length] + '">' + esc(ini(n)) + '</span>').join('') + '</div>';
      out.push('<div data-an="' + esc(a.id) + '" style="display:contents">' + sl(1, '<div class="tk-pic">📣</div>', 'Anuncio · Gerencia TEFES · ' + esc(fechaCorta(a.desde)), esc(a.titulo),
        (a.texto ? esc(a.texto) : '') + av + '<div style="font-size:13px;margin-top:6px;opacity:.9">Confirmaron ' + ya.length + (G.length ? ' de ' + G.length : '') + (f.length ? ' · faltan ' + esc(f.map(x => String(x).split(' ')[0]).join(', ')) : '') + '</div>',
        bt('👍 Leí y confirmo', 'data-conf'), '') + '</div>');
    });
    /* 3. Pendientes de supervisión */
    if (abiertos.length) out.push(sl(3, '<div class="tk-num">' + abiertos.length + '</div>', 'Supervisión', abiertos.length === 1 ? '1 pendiente por corregir' : abiertos.length + ' pendientes por corregir',
      venc ? '<b style="color:#ffb4ae">' + venc + ' vencido' + (venc > 1 ? 's' : '') + '</b>. Corrígelos y envíalos con foto.' : 'Todos a tiempo. Corrígelos y envíalos con foto.', bt('Ver pendientes', 'data-ir="pend"')));
    /* 4. Autosupervisión de la semana */
    if (!auto) out.push(sl(2, '<div class="tk-pic">📋</div>', 'Esta semana', 'Falta la autosupervisión', 'Hazla una vez por semana: el teléfono te lleva punto por punto.', bt('Hacer ahora', 'data-ir="sup"')));
    /* 5. Actividades del mes (caja chica y otras) */
    (D.actividades || []).filter(a => !a.hecho).forEach(a => { const d = diasHasta(a.vence);
      out.push(sl(3, '<div class="tk-pic">🗓️</div>', 'Actividad del mes', esc(a.titulo), d < 0 ? '<b style="color:#ffb4ae">Vencida el ' + fechaCorta(a.vence) + '</b>' : d === 0 ? 'Vence hoy' : 'Entregar hasta el ' + fechaCorta(a.vence) + ' · faltan ' + d + ' día' + (d === 1 ? '' : 's'),
        bt('Ya entregué', 'data-actv="' + esc(a.id + '|' + a.periodo) + '"'))); });
    /* 6. Políticas y guías por leer */
    const P = polPend(), Gu = guiaPend();
    if (P.length) out.push(sl(2, '<div class="tk-stack">' + P.slice(0, 3).map(p => '<div>' + esc(p.titulo) + '<small>' + (G.length ? (G.length - polFaltan(p).length) + ' de ' + G.length + ' la aprobaron' : '') + '</small></div>').join('') + '</div>',
      'Cómo trabajamos', P.length === 1 ? '1 política por leer' : P.length + ' políticas por leer', 'Cada uno elige su nombre y responde 3 preguntas.', bt('Leer ahora', 'data-ir="pol"')));
    if (Gu.length) out.push(sl(5, '<div class="tk-stack">' + Gu.slice(0, 3).map(g => '<div>' + esc(g.titulo) + '<small>' + (G.length ? 'faltan ' + guiaFaltan(g).length + ' de ' + G.length : '') + '</small></div>').join('') + '</div>',
      'Cómo trabajamos', Gu.length === 1 ? '1 guía por leer' : Gu.length + ' guías por leer', 'Cada persona la lee y confirma.', bt('Leer', 'data-ir="gui"')));
    /* 7. Clientes: lista de espera (si hay algo que hacer) y proformas */
    const r = D.ventasFuturas;
    if (r && (r.llego || r.bodega || r.viejos)) out.push(sl(1, '<div class="tk-pic">⏳</div>', 'Lista de espera',
      r.llego ? (r.llego === 1 ? 'Llegó un producto que espera un cliente' : 'Llegaron ' + r.llego + ' productos que esperan clientes') : r.bodega ? (r.bodega === 1 ? 'Un producto que espera un cliente está en otra tienda' : r.bodega + ' productos que esperan clientes están en otras tiendas') : (r.viejos === 1 ? 'Un cliente espera hace más de 60 días' : r.viejos + ' clientes esperan hace más de 60 días'),
      r.llego ? 'Contacta al cliente hoy.' : r.bodega ? 'Pide la transferencia a tu tienda.' : 'Llámalo y ofrécele una alternativa.', bt('Ver lista de espera', 'data-ir="inv"')));
    out.push(sl(3, '<div class="tk-pic">🧾</div>', 'Clientes', 'Proformas del equipo', '<span id="pfDet">Revisando…</span>', bt('Ver proformas', 'id="pfVer"')));
    /* 8. Logros de la semana */
    const inv = D.inventario, invOk = inv && (!inv.fase || inv.fase === 'Enviado'), ex = inv && inv.exactitud != null ? Math.round(inv.exactitud * (inv.exactitud <= 1 ? 100 : 1)) : null;
    const rings = (auto ? '<div class="tk-rg" style="--p:' + Math.round(auto.total * 100) + '">' + pct(auto.total) + '<small>Autosup.</small></div>' : '') + (invOk && ex != null ? '<div class="tk-rg" style="--p:' + ex + '">' + ex + '%<small>Muestreo</small></div>' : '');
    const chips = [auto ? '✓ Autosupervisión ' + pct(auto.total) : '', inv ? (invOk ? '✓ ' : '') + 'Muestreo Top 50: ' + esc(invTexto(inv)) : '', !abiertos.length ? '✓ Sin pendientes' : ''].filter(Boolean);
    if (chips.length) out.push(sl(4, rings ? '<div style="text-align:center"><div style="font-size:50px">🏆</div><div class="tk-rings">' + rings + '</div></div>' : '<div class="tk-num">🏆</div>', 'Esta semana', auto || !abiertos.length ? '¡Buen trabajo, ' + esc(D.tienda) + '!' : 'Cómo vamos',
      chips.join('<br>'), inv ? bt('Ver inventario', 'data-ir="inv"', 1) : ''));
    /* 9. El equipo y la Universidad */
    out.push(sl(5, tsEquipo(), 'Tu equipo', 'Lecturas del equipo', 'Aro de color = lo que cada uno ya leyó. Toca a la persona para ver qué le falta. Universidad: <span id="uniDet">revisando…</span>', bt('Ver Universidad Steren', 'id="uniVer"', 1)));
    return out;
  }
  renderInicio = function(){
    const L = slides(), m = $('#main');
    m.classList.add('tk1-on');
    m.innerHTML = '<div class="tk-feed" id="tkFeed">' + L.join('') + '</div>' +
      '<div class="tk-ov" id="tkVentas" hidden><div class="tk-ovh">Ventas<button data-tkx>Cerrar</button></div>' + stockBtn(S.data.stock) + flashHtml() + garHtml() + '</div>';
    /* rayitas de avance arriba de cada pantalla (celular) */
    const SS = [...m.querySelectorAll('.tk-s')];
    SS.forEach((s, i) => { const p = document.createElement('div'); p.className = 'tk-pos'; p.innerHTML = SS.map((_, k) => '<i class="' + (k <= i ? 'on' : '') + '"></i>').join(''); s.appendChild(p); });
    const fe = $('#tkFeed'); if (fe) fe.scrollTop = 0;
    fdsMontar();
    m.querySelectorAll('[data-ir]').forEach(b => b.onclick = () => irA(b.dataset.ir));
    const A = S.data.anuncios || [];
    m.querySelectorAll('[data-conf]').forEach(b => b.onclick = () => modalConfirmar(A.find(x => x.id === b.closest('[data-an]').dataset.an)));
    const ov = $('#tkVentas');
    m.querySelectorAll('[data-tkv]').forEach(b => b.onclick = () => { ov.hidden = false; ov.scrollTop = 0; });
    m.querySelectorAll('[data-tkx]').forEach(b => b.onclick = () => { ov.hidden = true; });
    confetiFx();
    const ub = $('#uniVer'); if (ub) ub.onclick = uniAbrir;
    const pb = $('#pfVer'); if (pb) pb.onclick = pfTAbrir; pfTCargar().then(pfTDetalle, () => {});
    uniTiendaCargar().then(uniDetalle, () => {});
  };
  /* al salir del Inicio, el #main vuelve a su margen normal */
  const _irA = irA; irA = function(v){ const m = $('#main'); if (m && v !== 'inicio') m.classList.remove('tk1-on'); return _irA.apply(this, arguments); };
  if (S.data && S.vista === 'inicio') renderInicio();
})();
