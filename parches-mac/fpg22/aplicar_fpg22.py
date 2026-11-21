#!/usr/bin/env python3
"""fpg22 (Diego 21-nov): en el panel (admin, supervisores y espejo), arriba de Formas de pago, el cuadre con el POS por tienda:
elegir la tienda, ver lo que tiene por registrar o por revisar, registrar con los datos del POS y corregir. Solo el administrador guarda.
Uso: python3 aplicar_fpg22.py archivo...   (FormasPago.gs, PortalApi.gs, Panel.html, panel.html, admin.html). Idempotente."""
import sys, os
D = os.path.dirname(os.path.abspath(__file__))
GS = open(os.path.join(D, 'fpg22.gs.txt'), encoding='utf-8').read()
UI = open(os.path.join(D, 'fpg22_panel.html'), encoding='utf-8').read()
VAL = [("function fpgValidar_(d, tienda, filas, hoy, formas, extras) {", "function fpgValidar_(d, tienda, filas, hoy, formas, extras, opc) {   // fpg22: opc.sinFoto desde el panel"),
       ("  const diasPos = {}; pos.forEach(p => { diasPos[p.fecha] = 1; });", "  const diasPos = {}; pos.forEach(p => { diasPos[p.fecha] = 1; }); const maxSec = Math.max(0, ...pos.map(p => p.sec));   // fpg22"),
       ("    if (fd < lim || !diasPos[fd]) return;   // sin datos del POS de ese día: no se puede decir nada", "    if (fd < lim || !diasPos[fd]) return;   // sin datos del POS de ese día: no se puede decir nada\n    if (fpgSec_(x.factura) > maxSec) return;   // fpg22: factura más nueva que la última ronda del POS (todavía no baja)"),
       (".filter(x => x.tipo && x.sec && x.fecha >= sumarDiasIso_(lim, -7) && fpgSinAc_(x.tienda) === t);", ".filter(x => x.tipo && x.sec && x.fecha >= sumarDiasIso_(lim, -7) && fpgSinAc_(x.tienda) === t && !anu.has(t + ' ' + x.sec));   // fpg22: sin las anuladas con NC"),
       ("  if (!sh || sh.getLastRow() < 2) return [];\n  const lim = [FPG_POS.DESDE, sumarDiasIso_(hoy_(), -FPG_POS.DIAS)].sort().pop(), t = fpgSinAc_(tienda);", "  if (!sh || sh.getLastRow() < 2) return [];\n  const lim = [FPG_POS.DESDE, sumarDiasIso_(hoy_(), -FPG_POS.DIAS)].sort().pop(), t = fpgSinAc_(tienda), anu = fpgAnuladas_();"),
       ("EX[forma] && EX[forma].p === 'C') && !foto) throw", "EX[forma] && EX[forma].p === 'C') && !foto && !(opc && opc.sinFoto)) throw")]
RUTA_A = "  apiFPGCorregirTienda: (a) => apiFPGCorregirTienda(...a),   // fpg21\n"
RUTA_B = RUTA_A + ("  apiFPGPanelPos: (a) => apiFPGPanelPos(...a),   // fpg22\n  apiFPGRegistrarPanel: (a) => apiFPGRegistrarPanel(...a),   // fpg22\n"
                   "  apiFPGCorregirPanel: (a) => apiFPGCorregirPanel(...a),   // fpg22\n  apiFPGFotoPanel: (a) => apiFPGFotoPanel(...a),   // fpg22\n")
for ruta in sys.argv[1:]:
    s = open(ruta, encoding='utf-8').read()
    if 'fpg22' in s:
        print(ruta, 'ya tenía fpg22'); continue
    if ruta.endswith('FormasPago.gs'):
        for a, b in VAL:
            if s.count(a) != 1: sys.exit(ruta + ': no encontré ' + a[:60])
            s = s.replace(a, b)
        s = s.rstrip('\n') + '\n' + GS
    elif ruta.endswith('PortalApi.gs'):
        if s.count(RUTA_A) != 1: sys.exit(ruta + ': no encontré la ruta fpg21')
        s = s.replace(RUTA_A, RUTA_B)
    else:
        k = '<script>/* fpg1: Ventas › Formas de pago'
        if s.count(k) != 1: sys.exit(ruta + ': no encontré el bloque fpg1')
        i = s.index('</script>', s.index(k)) + len('</script>')
        s = s[:i] + '\n' + UI.rstrip('\n') + s[i:]
    open(ruta, 'w', encoding='utf-8').write(s)
    print(ruta, 'fpg22 aplicado')
