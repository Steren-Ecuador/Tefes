#!/usr/bin/env python3
"""fpg18 (Diego 17-nov 18:03): en Otros, de momento solo Nota de crédito. Préstamo a empleado y Descuento por inventario
se ven transparentes ("Próximamente") y no se pueden elegir; el servidor también los rechaza.
Para activarlas: vaciar FPG_APAGADAS (pantallas) y FPG.APAGADAS (FormasPago.gs). Uso: python3 aplicar_fpg18.py archivo...  Idempotente."""
import sys
PANT = [
    ("  const solo = FORMAS.length === 1;",
     "  const FPG_APAGADAS = {'Préstamo empleado': 1, 'Descuento inventario': 1};   // fpg18: se ven transparentes, aún no se usan\n"
     "  const solo = FORMAS.length === 1;"),
    ("FORMAS.map(f => '<button class=\"fw-op' + (D.forma === f ? ' sel' : '') + '\" data-forma=\"' + esc(f) + '\">' + ico(f) + '<div><b>' + esc(nom(f)) + '</b><small>' + esc(AYUDA[f] || '') + '</small></div></button>').join('')",
     "FORMAS.map(f => FPG_APAGADAS[f] ? '<button class=\"fw-op\" disabled style=\"opacity:.4;cursor:not-allowed\" title=\"Próximamente\">' + ico(f) + '<div><b>' + esc(nom(f)) + ' <span style=\"font-size:11px;font-weight:600;color:#64748b;border:1px solid #cbd5e1;border-radius:999px;padding:1px 7px;margin-left:4px\">Próximamente</span></b><small>' + esc(AYUDA[f] || '') + '</small></div></button>' : '<button class=\"fw-op' + (D.forma === f ? ' sel' : '') + '\" data-forma=\"' + esc(f) + '\">' + ico(f) + '<div><b>' + esc(nom(f)) + '</b><small>' + esc(AYUDA[f] || '') + '</small></div></button>').join('')"),
]
GS = [
    ("  FORMAS: ['deUna', 'Tipti', 'Transferencias', 'Otra', 'Nota de crédito', 'Préstamo empleado', 'Descuento inventario'],",
     "  FORMAS: ['deUna', 'Tipti', 'Transferencias', 'Otra', 'Nota de crédito', 'Préstamo empleado', 'Descuento inventario'],\n"
     "  APAGADAS: {'Préstamo empleado': 1, 'Descuento inventario': 1},   // fpg18: Diego 17-nov, de momento solo NC en Otros"),
]
for ruta in sys.argv[1:]:
    s = open(ruta, encoding='utf-8').read()
    if 'fpg18' in s: print(ruta, 'ya tenía fpg18'); continue
    gs = ruta.endswith('.gs')
    for a, b in (GS if gs else PANT):
        if s.count(a) != 1: sys.exit(ruta + ': no encontré ' + a[:60])
        s = s.replace(a, b)
    if gs:
        a = "function apiFPGRegistrar("
        i = s.index(a); j = s.index('{', i) + 1
        s = s[:j] + "\n  if (d && FPG.APAGADAS[String(d.forma || '')]) throw new Error('Esa forma de pago todavía no está habilitada.');   // fpg18" + s[j:]
    open(ruta, 'w', encoding='utf-8').write(s); print(ruta, 'fpg18 aplicado')
