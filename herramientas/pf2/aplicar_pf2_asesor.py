#!/usr/bin/env python3
"""pf2 · Proformas del POS en la app del asesor (asesor.html). Idempotente (marcador /* pf2 */).
Uso: python3 aplicar_pf2_asesor.py ruta/asesor.html"""
import sys
p = sys.argv[1]; s = open(p, encoding='utf-8').read()
if '/* pf2 */' in s: print('ya aplicado:', p); sys.exit(0)
def rep(a, b, n=1):
    global s
    c = s.count(a)
    if c != n: sys.exit('FALTA ancla (%d veces, se esperaban %d): %s' % (c, n, a[:90]))
    s = s.replace(a, b)

CSS = r'''<style>/* pf2 */
.pf-hero{background:linear-gradient(135deg,#0b3b5c,#0078be);color:#fff}
.pf-chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}.pf-chips span{background:#fff;color:#0b3b5c;font-weight:800;font-size:12px;border-radius:20px;padding:3px 10px}
.btn.on{background:#eaf4fb;border-color:var(--brand);color:var(--brand)}
.pf-res{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}
.pf-res button{border:1px solid var(--line);background:#fff;border-radius:12px;min-height:72px;padding:6px;font-weight:700;font-size:12.5px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;cursor:pointer;color:#16202b}
.pf-res button span{font-size:22px}.pf-res button.on{border:2px solid var(--brand);background:#eaf4fb}
.pf-mot{display:flex;flex-direction:column;gap:8px;margin-top:12px}.pf-mot .btn{text-align:left;min-height:44px}
.pf-meds{display:flex;gap:4px}.pf-med{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;opacity:.45;text-align:center}.pf-med.on{opacity:1}
.pf-med span{width:50px;height:50px;border-radius:50%;background:#e7ecf2;display:flex;align-items:center;justify-content:center;font-size:26px}.pf-med.on span{background:#fff4e0}
.pf-med b{font-size:12px}.pf-med small{font-size:11px;color:var(--muted)}
.pf-fiesta{text-align:center;display:flex;flex-direction:column;gap:10px;align-items:center;background:linear-gradient(180deg,#0b3b5c,#0078be);color:#fff;border-radius:14px;padding:26px 16px 16px;position:relative;overflow:hidden}
.pf-fiesta>*{position:relative}.pf-fiesta i{position:absolute;top:-20px;width:8px;height:14px;border-radius:2px;animation:pfc 2.6s linear infinite}
@keyframes pfc{0%{transform:translateY(0) rotate(0)}100%{transform:translateY(460px) rotate(540deg)}}
.pf-gana{background:rgba(255,255,255,.15);border-radius:14px;padding:12px;width:100%;box-sizing:border-box}.pf-gana small{display:block;font-weight:800;opacity:.85;font-size:11.5px}.pf-gana b{font-size:32px;color:#7be0a5}
.pf-hist summary{font-size:12.5px;color:var(--brand);font-weight:700;cursor:pointer;margin-top:6px}.pf-hist div{font-size:12.5px;padding:5px 0;border-top:1px solid var(--line)}
.pf-fuera{margin-top:8px;background:#eaf4fb;border-radius:10px;padding:8px 10px;font-size:13.5px}
</style>
</head>'''
rep('</head>', CSS)

# datos del servidor
rep("  E.proformas = d.proformas || [];\n", "  E.proformas = d.proformas || [];\n  PFJ = d.pf || null;   /* pf2 */\n")

# contador del punto rojo de Clientes
rep("function porContactar(){ return E.proformas.filter(p => p.estado === 'Abierta' && dif(p.contacto) <= 0).length + E.futuras.filter(v => v.estado === 'Llegó').length; }",
    "function porContactar(){ return E.proformas.filter(p => p.estado === 'Abierta' && (p.fuera || pfEspera(p) || dif(p.contacto) <= 0)).length + E.futuras.filter(v => v.estado === 'Llegó').length; }")

# lista de proformas
ini = "  if (segCli === 'pro'){\n"
fin = "  } else {\n    const ab = E.futuras.filter("
a = s.index(ini); b = s.index(fin, a)
NUEVO = r'''  if (segCli === 'pro'){   /* pf2 */
    const ab = E.proformas.filter(p => p.estado === 'Abierta').sort((a, b) => (pfUrge(b) - pfUrge(a)) || (a.contacto < b.contacto ? -1 : 1)), ce = E.proformas.filter(p => p.estado !== 'Abierta');
    const hoyL = ab.filter(pfUrge), monto = ab.reduce((a, p) => a + p.monto, 0), J = PFJ || {mes: {n: 0}, racha: 0, cierres: 0};
    h += '<div class="card pf-hero"><div class="tiny" style="opacity:.85;font-weight:800;letter-spacing:.04em">TUS PROFORMAS · HOY</div>' +
      '<div style="font-size:21px;font-weight:900;margin:4px 0">' + (hoyL.length ? (hoyL.length === 1 ? '1 cliente espera tu llamada ☎️' : hoyL.length + ' clientes esperan tu llamada ☎️') : ab.length ? '¡Estás al día! 🙌' : 'Sin proformas abiertas 😎') + '</div>' +
      (ab.length ? '<div class="small" style="opacity:.92">Tienes <b>' + usd0(monto) + '</b> en juego' + (SUELDO.pct ? '. Si cierras la mitad, sumas unos <b style="color:#7be0a5">' + usd2(monto / 2 * SUELDO.pct) + '</b> a tu cuenta de comisiones.' : '.') + '</div>'
        : '<div class="small" style="opacity:.92">Cuando hagas una proforma en el POS, te aparece aquí al día siguiente para que le des seguimiento.</div>') +
      ((J.racha || J.mes.n >= 3) ? '<div class="pf-chips">' + (J.racha ? '<span>🔥 Racha: ' + J.racha + (J.racha === 1 ? ' cliente' : ' clientes') + ' a tiempo</span>' : '') + (J.mes.n >= 3 ? '<span>🏆 Cierras ' + Math.round(J.mes.cerradas / J.mes.n * 100) + '%</span>' : '') + '</div>' : '') + '</div>';
    h += ab.length ? ab.map(pfTarjeta).join('') : '';
    h += pfLogrosHtml(J);
    h += '<button class="btn block" id="nPro" style="margin-bottom:12px">+ Registrar una proforma a mano</button>';
    if (ce.length) h += '<details class="card"><summary class="small"><b>Cerradas (' + ce.length + ')</b></summary>' + ce.map(p => '<div class="fila small" style="padding:6px 0;border-top:1px solid var(--line)"><span>' + esc(p.cliente) + ' · ' + usd2(p.monto) + '</span><span class="chip ' + (p.estado === 'Compró' ? 'verde' : '') + '">' + (p.estado === 'Compró' ? '🎉 Compró' : esc(p.motivo || p.estado)) + '</span></div>').join('') + '</details>';
'''
s = s[:a] + NUEVO + s[b:]

# botones de la lista
rep("  document.querySelectorAll('[data-pc]').forEach(b => b.onclick = () => pfCambio(b.dataset.pc, {estado: 'Compró'}, '¡Bien! Venta cerrada 🎉'));\n  document.querySelectorAll('[data-pn]').forEach(b => b.onclick = () => pfCambio(b.dataset.pn, {estado: 'No compró'}, 'Anotado.'));\n",
    "  document.querySelectorAll('[data-pc]').forEach(b => b.onclick = () => pfCerrar(pf(b.dataset.pc)));   /* pf2 */\n  document.querySelectorAll('[data-pn]').forEach(b => b.onclick = () => pfPerder(pf(b.dataset.pn)));\n  document.querySelectorAll('[data-po]').forEach(b => b.onclick = () => pfAnotar(pf(b.dataset.po)));\n")

# funciones nuevas (antes de pfCambio)
FN = r'''/* pf2: proformas del POS con seguimiento, racha, medallas y ranking (Diego 2026-11-08) */
let PFJ = null;
const MEDALLAS = [[5, '🥉', '5 cierres'], [10, '🥈', '10 cierres'], [20, '🥇', '20 cierres'], [50, '💎', '50 cierres']];
const PF_RES = [['😍', '¡Le interesa!'], ['🤔', 'Lo está pensando'], ['🏃', 'Viene a la tienda'], ['💲', 'Pide otro precio'], ['📵', 'No contestó']];
const PF_CAN = [['💬', 'WhatsApp'], ['📞', 'Llamada'], ['🏬', 'Vino a la tienda'], ['✉️', 'Correo']];
const PF_MOT = [['💲', 'Le pareció caro'], ['📦', 'No teníamos stock'], ['🏬', 'Compró en otro lado'], ['📵', 'No responde'], ['🤷', 'Ya no lo necesita'], ['✏️', 'Otro']];
const PF_ANIMO = ['¡Anotado! Un paso más cerca de la venta 💪', '¡Eso! Los clientes con seguimiento compran más 🙌', '¡Bien! Tu cliente sabe que lo tienes presente 😊', '¡Anotado! Te lo recordamos ese día 📅'];
function pfEspera(p){ return p.estado === 'Abierta' && !p.contactos && !(p.hist && p.hist.length) && dif(p.creada) <= -2; }
function pfUrge(p){ return p.estado === 'Abierta' && (p.fuera || pfEspera(p) || dif(p.contacto) <= 0) ? 1 : 0; }
function pfTel(p){ return String(p.cel || '').replace(/\D/g, ''); }
function pfMsg(p){ return '¡Hola ' + nombreCorto(p.cliente) + '! 👋 Soy ' + nombreCorto(ver(YO.nombre)) + ', de Steren ' + TIENDA.nombre + '. Te escribo por la proforma' + (p.productos && !/^Proforma /.test(p.productos) ? ' de ' + p.productos : '') + ' del ' + fCorta(new Date(p.creada + 'T12:00:00')) + '. ¿Te la separo? 😊'; }
function pfChip(p){ return p.fuera ? '<span class="chip azul">¿Compró?</span>' : pfEspera(p) ? '<span class="chip rojo">Esperando ' + (-dif(p.creada)) + ' días</span>' : chipContacto(p); }
function pfTarjeta(p){
  const H = p.hist || [];
  return '<div class="card"><div class="fila"><b style="font-size:16px">' + esc(p.cliente) + '</b>' + pfChip(p) + '</div>' +
    '<div class="small" style="margin-top:4px">' + esc(p.productos) + ' · <b>' + usd2(p.monto) + '</b></div>' +
    (p.nota ? '<div class="tiny muted" style="margin-top:4px">📝 ' + esc(p.nota) + '</div>' : '') +
    '<div class="tiny muted">' + (p.origen === 'POS' ? '🧾 Del POS' : 'Registrada por ti') + ' · ' + fCorta(new Date(p.creada + 'T12:00:00')) + (pfTel(p) ? ' · ' + esc(p.cel) : '') + '</div>' +
    (H.length ? '<details class="pf-hist"><summary>Lo que va pasando (' + H.length + ')</summary>' + H.slice().reverse().map(x => '<div><b>' + fCorta(new Date(x.f + 'T12:00:00')) + '</b> · ' + esc(x.canal ? x.canal + ': ' : '') + esc(x.res) + (x.nota ? '<br><span class="muted">' + esc(x.nota) + '</span>' : '') + '</div>').join('') + '</details>' : '') +
    (p.fuera ? '<div class="pf-fuera">Este pedido ya no está pendiente en el POS. ¿Compró? 🤞</div><div class="btns"><button class="btn" data-pc="' + p.id + '" style="color:var(--ok)">🎉 Sí, compró</button><button class="btn" data-pn="' + p.id + '">No compró</button></div>'
      : '<div class="btns">' + (pfTel(p) ? '<a class="btn" target="_blank" rel="noopener" style="text-decoration:none;color:inherit" href="' + wa(p.cel, pfMsg(p)) + '">💬 WhatsApp</a><a class="btn" style="text-decoration:none;color:inherit" href="tel:' + pfTel(p) + '">📞 Llamar</a>' : '') +
        '<button class="btn pri" data-po="' + p.id + '">✍️ Anotar cómo me fue</button></div>') + '</div>';
}
function pfLogrosHtml(J){
  if (!J || !J.mes) return '';
  const m = J.mes, pct = m.n ? m.cerradas / m.n : 0, mesN = MESES[HOY.getMonth()];
  const med = MEDALLAS.map(x => '<div class="pf-med' + (J.cierres >= x[0] ? ' on' : '') + '"><span>' + x[1] + '</span><b>' + x[2] + '</b><small>' + (J.cierres >= x[0] ? '¡Logrado!' : 'Te faltan ' + (x[0] - J.cierres)) + '</small></div>').join('');
  const R = (J.ranking || []).filter(x => x.pct != null).slice(0, 5);
  return (m.n ? '<div class="card" style="text-align:center"><h3 style="margin:0 0 4px">🎯 ' + mesN.charAt(0).toUpperCase() + mesN.slice(1) + ': cerraste ' + m.cerradas + ' de ' + m.n + '</h3>' +
      '<div class="anillo" style="background:' + anillo(pct, 'var(--brand)') + '"><div><b>' + Math.round(pct * 100) + '%</b><span class="tiny muted">de cierre</span></div></div>' +
      '<div class="small">' + (m.cerradoUsd ? 'Vendiste <b>' + usd0(m.cerradoUsd) + '</b> gracias a tu seguimiento' + (SUELDO.pct ? ': unos <b>+' + usd2(m.cerradoUsd * SUELDO.pct) + '</b> en comisiones 🙌' : ' 🙌') : 'Tu primera venta por seguimiento del mes está cerca. ¡Dale! 💪') + '</div>' +
      (m.vencibles ? '<div class="tiny muted" style="margin-top:4px">Contactaste a tiempo (48 h) a ' + m.aTiempo + ' de ' + m.vencibles + '</div>' : '') +
      (J.tienda && J.tienda.n >= 3 ? '<div class="tiny muted">' + esc(TIENDA.nombre) + ': ' + Math.round(J.tienda.pct * 100) + '%</div>' : '') + '</div>' : '') +
    '<div class="card"><h3 style="margin:0 0 10px">🏅 Tus medallas</h3><div class="pf-meds">' + med + '</div></div>' +
    (R.length ? '<div class="card"><h3 style="margin:0 0 6px">Ranking de cierre en ' + esc(TIENDA.nombre) + '</h3>' + R.map((x, i) => { const q = EQUIPO.find(e => e.nombre === x.nombre);
      return '<div class="rk' + (q === YO ? ' yo' : '') + '"><span class="n">' + (i + 1) + '</span>' + (q ? avatar(q) : '') + '<div class="q"><b>' + (q === YO ? 'Tú' : esc(ver(x.nombre))) + '</b><span class="tiny muted">' + x.cerradas + ' de ' + x.n + '</span></div><span class="v">' + Math.round(x.pct * 100) + '%</span></div>'; }).join('') +
      '<div class="tiny muted" style="margin-top:6px">Cuenta desde 3 proformas en el mes.</div></div>' : '');
}
function pfGuardar(p, d, despues){
  return llamar('apiPFSeguir', TOKEN, p.id, YO.nombre, d).then(n => { const i = E.proformas.findIndex(x => x.id === p.id); if (i >= 0) E.proformas[i] = n; despues(n); },
    e => { libre('#ok'); toast(e.message); });
}
function pfAnotar(p){
  let canal = 'WhatsApp', res = '';
  abrir('<h3 style="margin-top:0">¿Cómo te fue con ' + esc(nombreCorto(p.cliente)) + '?</h3>' +
    '<label class="f">¿Por dónde?</label><div class="btns" style="margin-top:4px">' + PF_CAN.map(([e, t], i) => '<button class="btn' + (i ? '' : ' on') + '" data-can="' + t + '">' + e + ' ' + t + '</button>').join('') + '</div>' +
    '<label class="f">¿Qué pasó?</label><div class="pf-res">' + PF_RES.map(([e, t]) => '<button data-res="' + t + '"><span>' + e + '</span>' + t + '</button>').join('') +
      '<button data-res="Compró"><span>🎉</span>¡Compró!</button><button data-res="No compró"><span>🙅</span>No va a comprar</button></div>' +
    '<label class="f">¿Cuándo le vuelves a escribir?</label><div class="btns" style="margin-top:4px">' + [[1, 'Mañana'], [3, 'En 3 días'], [7, 'En una semana']].map(([n, t]) => '<button class="btn' + (n === 3 ? ' on' : '') + '" data-dias="' + n + '">' + t + '</button>').join('') + '</div>' +
    '<input class="i" type="date" id="pfF" value="' + iso(sumar(HOY, 3)) + '" min="' + iso(HOY) + '" style="margin-top:8px">' +
    (pfTel(p) ? '' : '<label class="f">Celular del cliente (si te lo dio)</label><input class="i" id="pfCel" inputmode="tel" placeholder="09…">') +
    '<label class="f">Una nota para acordarte (opcional)</label><input class="i" id="pfN" placeholder="Ej.: le ofrecí la garantía de 1 año">' +
    '<div class="dos" style="margin-top:14px"><button class="btn" id="cx">Cancelar</button><button class="btn pri" id="ok">Guardar</button></div>');
  $('#cx').onclick = cerrar;
  document.querySelectorAll('[data-can]').forEach(b => b.onclick = () => { canal = b.dataset.can; document.querySelectorAll('[data-can]').forEach(x => x.classList.toggle('on', x === b)); });
  document.querySelectorAll('[data-dias]').forEach(b => b.onclick = () => { $('#pfF').value = iso(sumar(HOY, +b.dataset.dias)); document.querySelectorAll('[data-dias]').forEach(x => x.classList.toggle('on', x === b)); });
  document.querySelectorAll('[data-res]').forEach(b => b.onclick = () => {
    res = b.dataset.res;
    if (res === 'Compró') { cerrar(); return pfCerrar(p, canal); }
    if (res === 'No compró') { cerrar(); return pfPerder(p, canal); }
    document.querySelectorAll('[data-res]').forEach(x => x.classList.toggle('on', x === b));
  });
  $('#ok').onclick = () => {
    if (!res) return toast('Toca qué pasó 👆');
    const f = $('#pfF').value; if (!f) return toast('Elige cuándo le vuelves a escribir.');
    const cel = $('#pfCel') ? $('#pfCel').value.trim() : '';
    if (cel && cel.replace(/\D/g, '').length < 9) return toast('El celular debe tener al menos 9 números.');
    ocupado('#ok');
    pfGuardar(p, {canal: canal, resultado: res, proximo: f, nota: $('#pfN').value.trim(), cel: cel}, () => {
      if (PFJ && !p.contactos && !(p.hist && p.hist.length) && dif(p.creada) >= -2) PFJ.racha = (PFJ.racha || 0) + 1;
      cerrar(); toast(PF_ANIMO[Math.floor(Math.random() * PF_ANIMO.length)]); render(); });
  };
}
function pfConfeti(){ const C = ['#f0a35b', '#7be0a5', '#d0477a', '#ffffff', '#7b4bc4']; let h = ''; for (let i = 0; i < 18; i++) h += '<i style="left:' + (i * 5.5 + 1) + '%;background:' + C[i % 5] + ';animation-delay:' + (i % 6) * 0.35 + 's"></i>'; return h; }
function pfFiesta(p, sola){
  const gana = p.monto * SUELDO.pct, c = PFJ ? PFJ.cierres : 0, med = MEDALLAS.find(x => x[0] === c);
  abrir('<div class="pf-fiesta">' + pfConfeti() + '<div style="font-size:60px;line-height:1">🎉</div><div style="font-size:28px;font-weight:900">¡Venta cerrada!</div>' +
    '<div class="small" style="opacity:.92">' + esc(nombreCorto(p.cliente)) + ' compró lo que le cotizaste. Tu seguimiento hizo la diferencia.</div>' +
    (gana ? '<div class="pf-gana"><small>A TU CUENTA DE COMISIONES</small><b>+' + usd2(gana) + '</b><div class="tiny" style="opacity:.85">Proforma de ' + usd2(p.monto) + '</div></div>' : '') +
    (med ? '<span class="chip" style="background:#fff;color:#0b3b5c;font-size:13px">' + med[1] + ' ¡Nueva medalla: ' + med[2] + '!</span>' : '') +
    (sola ? '<div class="tiny" style="opacity:.85">Se marcó sola: el pedido apareció facturado en el POS.</div>' : '<div class="tiny" style="opacity:.85">Tu equipo lo verá en Inicio para aplaudirte 👏</div>') +
    '<button class="btn block" id="cx" style="margin-top:6px;background:#1a8f7a;border-color:#1a8f7a;color:#fff">¡A seguir! 💪</button></div>');
  $('#cx').onclick = () => { cerrar(); render(); };
}
function pfCerrar(p, canal){
  pfGuardar(p, {estado: 'Compró', resultado: '¡Compró!', canal: canal || ''}, n => {
    if (PFJ) { PFJ.cierres = (PFJ.cierres || 0) + 1; if (PFJ.mes) { PFJ.mes.cerradas++; PFJ.mes.cerradoUsd = (PFJ.mes.cerradoUsd || 0) + n.monto; } }
    E.festejados = E.festejados || {}; E.festejados[p.id] = 1; guardar(); pfFiesta(n, false); });
}
function pfPerder(p, canal){
  let mot = '';
  abrir('<div style="text-align:center"><div style="font-size:40px">💪</div><h3 style="margin:4px 0">Esta no se dio. ¡La próxima sí!</h3><div class="small muted">Contar por qué nos ayuda a todos: si es el precio o el stock, tu gerente lo ve y lo puede arreglar.</div></div>' +
    '<div class="pf-mot">' + PF_MOT.map(([e, t]) => '<button class="btn" data-mot2="' + t + '">' + e + ' ' + t + '</button>').join('') + '</div>' +
    '<label class="f">Nota (opcional)</label><input class="i" id="pfN" placeholder="Ej.: lo encontró más barato">' +
    '<div class="dos" style="margin-top:14px"><button class="btn" id="cx">Cancelar</button><button class="btn pri" id="ok">Guardar y seguir</button></div>');
  $('#cx').onclick = cerrar;
  document.querySelectorAll('[data-mot2]').forEach(b => b.onclick = () => { mot = b.dataset.mot2; document.querySelectorAll('[data-mot2]').forEach(x => x.classList.toggle('on', x === b)); });
  $('#ok').onclick = () => { if (!mot) return toast('Toca qué pasó 👆'); ocupado('#ok');
    pfGuardar(p, {estado: 'No compró', resultado: 'No compró', motivo: mot, nota: $('#pfN').value.trim(), canal: canal || ''}, () => {
      if (PFJ && PFJ.mes) PFJ.mes.perdidas = (PFJ.mes.perdidas || 0) + 1; cerrar(); toast('Gracias por contarlo. ¡A la siguiente! 💪'); render(); }); };
}
/* ventas que se cerraron solas (facturadas en el POS): se festejan una vez al abrir la app */
function pfFestejarSolas(){
  E.festejados = E.festejados || {};
  const p = E.proformas.find(x => x.estado === 'Compró' && x.resultado === 'Facturada en el POS' && !E.festejados[x.id] && dif(x.cierre || x.creada) >= -3);
  if (!p) return; E.festejados[p.id] = 1; guardar(); pfFiesta(p, true);
}
function pfCambio(id, cambio, msg){'''
rep("function pfCambio(id, cambio, msg){", FN)

# muro: logros de proformas del equipo
rep("  const cerca = EQUIPO.filter(p => p.mes / p.meta >= 0.9 && p.mes < p.meta)[0];",
    "  ((PFJ && PFJ.logros) || []).slice(0, 3).forEach(l => { const q = EQUIPO.find(e => e.nombre === l.nombre); if (q) posts.push({id: 'PF-' + l.id, html: '<div class=\"pc\">' + avatar(q) + '<div><b>' + esc(ver(q.nombre)) + '</b><span class=\"tiny muted\">' + fCorta(new Date(l.fecha + 'T12:00:00')) + ' · Logro</span></div></div><p class=\"txt\">🎉 ¡Cerró una proforma de <b>' + usd2(l.monto) + '</b> gracias a su seguimiento! 💪</p>'}); });   /* pf2 */\n  const cerca = EQUIPO.filter(p => p.mes / p.meta >= 0.9 && p.mes < p.meta)[0];")

# al abrir: festejar ventas cerradas solas
rep("    if (!E.perfil || !E.perfil.foto) bienvenida();\n", "    if (!E.perfil || !E.perfil.foto) bienvenida(); else setTimeout(pfFestejarSolas, 400);   /* pf2 */\n")

open(p, 'w', encoding='utf-8').write(s)
print('pf2 asesor aplicado:', p)
