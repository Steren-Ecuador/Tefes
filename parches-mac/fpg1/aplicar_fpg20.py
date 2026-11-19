#!/usr/bin/env python3
"""fpg20 (Diego 18-nov): al Exportar a Excel, el comprobante / pedido / factura salen como TEXTO (antes un comprobante
12345678 salía como número decimal 12.345.678,00). Solo las columnas de dinero (Valor, Total, Pagado, Monto, IVA) van como número.
Uso: python3 aplicar_fpg20.py archivo...  (panel.html, Panel.html, admin, xlsx_fpg17.js). Idempotente."""
import sys

PAR = [
    ("const celda = (v, ref, cab) => { const s = v == null ? '' : String(v);",
     "const numCol = (filas[0] || []).map(h => /valor|total|pagado|monto|iva/i.test(String(h))), celda = (v, ref, cab, j) => { const s = v == null ? '' : String(v);   /* fpg20 */"),
    ("if (!cab && /^-?\\d{1,12}([.,]\\d{1,2})?$/.test(s) && !/^0\\d/.test(s))",
     "if (!cab && numCol[j] && /^-?\\d{1,12}([.,]\\d{1,2})?$/.test(s) && !/^0\\d/.test(s))"),
    ("celda(v, col(j) + (i + 1), i === 0)", "celda(v, col(j) + (i + 1), i === 0, j)"),
]

for ruta in sys.argv[1:]:
    s = open(ruta, encoding='utf-8').read()
    if 'fpg20' in s:
        print(ruta, 'ya tenía fpg20'); continue
    for a, b in PAR:
        n = s.count(a)
        if n != 1:
            sys.exit(ruta + ': encontré ' + str(n) + ' veces: ' + a[:70])
        s = s.replace(a, b)
    open(ruta, 'w', encoding='utf-8').write(s)
    print(ruta, 'fpg20 aplicado')
