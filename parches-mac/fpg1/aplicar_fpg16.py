#!/usr/bin/env python3
"""fpg16 (Diego 17-nov): se quita "Entrega" (los respaldos físicos van por sobre directo a Financiero; aquí solo se
llena la información). Panel/admin: sin filtro Entrega, sin "Marcar entregadas", sin "Por entregar", columna Estado,
CSV sin columnas de entrega. Tienda: sin la línea "Entregado con recibo". Uso: python3 aplicar_fpg16.py archivo...  Idempotente."""
import sys, re
PANEL = [
    ("      '<label>Entrega<select id=\"fpgE\">' + opt('', 'Todas', f.ent) + opt('no', 'Por entregar', f.ent) + opt('si', 'Entregadas', f.ent) + '</select></label>' +\n", ""),
    ("      '<input id=\"fpgRec\" placeholder=\"N° de recibo\"><button class=\"btn\" id=\"fpgEnt\">Marcar entregadas</button>' +\n      '<span style=\"opacity:.5\">|</span><input id=\"fpgMot\"", "      '<input id=\"fpgMot\""),
    ("      (pend.length && f.est !== 'Anulada' ? '<span class=\"fpg-pend\">' + (pend.length === cuenta.length ? 'Todo por entregar' : 'Por entregar ' + usd(pv10) + ' (' + pend.length + ')') + '</span>' : '') +\n", ""),
    ("<th>Entrega</th></tr>", "<th>Estado</th></tr>"),
    ("title=\"Elegir para marcar la entrega o anular\"", "title=\"Elegir para anular\""),
    ("'Entregado', 'N° recibo', 'Marcó entrega', ", ""),
    ("x.entregado || '', x.recibo || '', x.marco || '', ", ""),
]
RX_PANEL = (r" : x\.entregado \? '<span class=\"fpg-ok\">Recibo ' \+ e\(x\.recibo\) \+ '</span><small>' \+ fCorta\(x\.entregado\) \+ \(x\.marco \? ' · ' \+ e\(x\.marco\) : ''\) \+ '</small>' : '<span class=\"fpg-pend\">Por entregar</span>'\)",
            " : '<span class=\"fpg-ok\">Vigente</span>')   /* fpg16 */")
TIENDA = [("      (x.entregado ? '<div class=\"tiny\" style=\"color:var(--ok)\">Entregado con recibo ' + esc(x.recibo) + ' el ' + fechaCorta(x.entregado) + '</div>' : '') +\n",
           "      /* fpg16: sin entrega física */\n")]
for ruta in sys.argv[1:]:
    s = open(ruta, encoding='utf-8').read()
    if 'fpg16' in s: print(ruta, 'ya tenía fpg16'); continue
    esPanel = 'id="fpgE"' in s
    par = PANEL if esPanel else TIENDA
    for a, b in par:
        n = s.count(a)
        if n != 1: sys.exit(ruta + ': encontré ' + str(n) + ' veces: ' + a[:70])
        s = s.replace(a, b)
    if esPanel:
        s, n = re.subn(RX_PANEL[0], RX_PANEL[1], s)
        if n != 1: sys.exit(ruta + ': columna entrega encontrada ' + str(n))
    elif 'fpgan' not in s and 'Entregado con recibo' not in s:
        sys.exit(ruta + ': no parece pantalla de formas de pago')
    open(ruta, 'w', encoding='utf-8').write(s); print(ruta, 'fpg16 aplicado')
