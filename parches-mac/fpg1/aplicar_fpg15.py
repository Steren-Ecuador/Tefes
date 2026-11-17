#!/usr/bin/env python3
"""fpg15 (Diego 17-nov): 1) etiqueta "Valor total de la factura con IVA"; 2) el aviso de transferencia va ABAJO,
discreto: la valida Financiero antes de facturar. Necesita fpg14. Uso: python3 aplicar_fpg15.py archivo...  Idempotente."""
import sys, re
for ruta in sys.argv[1:]:
    s = open(ruta, encoding='utf-8').read()
    if 'fpg15' in s: print(ruta, 'ya tenía fpg15'); continue
    a = "'<div><label>Total con IVA ' + ob + '</label>"
    if s.count(a) != 1: sys.exit(ruta + ': no encontré Total con IVA')
    s = s.replace(a, "'<div><label>Valor total de la factura con IVA ' + ob + '</label>")
    m = re.search(r"'<div class=\"fw-aviso\"[^\n]*?</div>' \+   // fpg14\n      ", s)
    if not m: sys.exit(ruta + ': no encontré el aviso fpg14')
    s = s[:m.start()] + s[m.end():]
    a = "    return h + nav('Revisar →');\n  }"
    if s.count(a) != 1: sys.exit(ruta + ': no encontré nav Revisar')
    s = s.replace(a, "    if (f === 'Transferencias') h += '<div class=\"fw-h\" style=\"margin-top:14px;color:#64748b;font-size:13px;line-height:1.4\">ℹ️ La transferencia la valida Financiero antes de facturar, con su respaldo. Este registro no reemplaza esa validación.</div>';   // fpg15\n" + a)
    open(ruta, 'w', encoding='utf-8').write(s); print(ruta, 'fpg15 aplicado')
