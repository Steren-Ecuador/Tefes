#!/usr/bin/env python3
"""pp1 (22-nov-2026, Diego): en la supervisión y autosupervisión, cada punto que la tienda ya tiene abierto
o por validar muestra "⏳ Pendiente desde el DD-mmm" y, si pasó la fecha de compromiso, "vencido hace N días".
Si se califica 0 o 1, el recuadro dice "Se suma al pendiente abierto Pxxxxx" (regla sd1 del servidor).
Uso: python3 aplicar_pp1.py Index.html [tienda.html ...]   (idempotente; sirve para Index.html de Apps Script y tienda.html del espejo)"""
import sys

FUN = r'''/* pp1: pendiente abierto del punto (el más antiguo, igual que sd1 en el servidor) */
function pprevDe(p){ return ((S.data && S.data.pendientes) || []).find(x => x.punto === p.id && x.estado && x.estado !== 'Cerrado') || null; }
function pprevIso(s){ const i = iso(s); if (i) return i; const d = new Date(s); return isNaN(d) ? '' : d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function pprevHtml(p, mini){
  const x = pprevDe(p); if (!x) return '';
  const desde = pprevIso(x.fechaSup), fc = pprevIso(x.fechaCompromiso), hoy = S.data.hoy;
  const venc = ABIERTOS.includes(x.estado) && fc && hoy && fc < hoy ? Math.round((new Date(hoy + 'T12:00') - new Date(fc + 'T12:00')) / 864e5) : 0;
  const tag = mini ? 'span' : 'div';
  return '<' + tag + ' class="pprev' + (mini ? ' mini' : '') + (venc ? ' venc' : '') + '">⏳ Pendiente' + (desde ? ' desde el ' + (+desde.slice(8, 10)) + '-' + MESES_S[+desde.slice(5, 7) - 1] : '') +
    (x.estado === 'Por validar' ? ' · por validar' : '') + (venc ? ' · <b>vencido hace ' + venc + ' día' + (venc > 1 ? 's' : '') + '</b>' : '') + '</' + tag + '>';
}
function pprevTitulo(p){ const x = pprevDe(p); return x ? 'Se suma al pendiente abierto ' + esc(x.id) : 'Pendiente que se va a crear'; }
'''
CSS = '/* pp1 */ .pprev{font-size:12px;color:var(--warn);margin:4px 0 2px}.pprev.venc{color:var(--bad)}.pprev.mini{margin:0;white-space:nowrap;font-size:11px}\n'
CAMBIOS = [
    ("function puntoHtml(p){", FUN + "function puntoHtml(p){"),
    ("'<span class=\"mres '", "pprevHtml(p, true) + '<span class=\"mres '"),
    ("'<div class=\"tools\"><button class=\"link\" data-guia>", "pprevHtml(p) + '<div class=\"tools\"><button class=\"link\" data-guia>"),
    ("'<div class=\"pblock\"><div class=\"ttl\">Pendiente que se va a crear</div>'", "'<div class=\"pblock\"><div class=\"ttl\">' + pprevTitulo(p) + '</div>'"),
    ("</style>", CSS + "</style>"),
]
for ruta in sys.argv[1:]:
    s = open(ruta, encoding='utf-8').read()
    if '/* pp1' in s: print('ya', ruta); continue
    for a, b in CAMBIOS:
        if s.count(a) < 1 or (a != '</style>' and s.count(a) != 1): sys.exit(ruta + ': no encontré (o está repetido) ' + a[:60])
        s = s.replace(a, b, 1)
    open(ruta, 'w', encoding='utf-8', newline='\n').write(s); print('ok', ruta)
