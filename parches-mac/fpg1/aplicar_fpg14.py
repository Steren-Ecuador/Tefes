#!/usr/bin/env python3
"""fpg14 (Diego 17-nov): aviso en Transferencia bancaria: registrar aquí NO valida la transferencia;
se valida con Financiero y con el respaldo. Uso: python3 aplicar_fpg14.py archivo...  Idempotente."""
import sys
A = "else if (f === 'Transferencias') h += '<label>Cuenta de la empresa"
B = ("else if (f === 'Transferencias') h += '<div class=\"fw-aviso\" style=\"background:#fff8e1;border:1px solid #f5c26b;color:#7a4b00;border-radius:10px;padding:10px 12px;font-size:14px;line-height:1.4;margin:0 0 12px\">"
     "⚠️ <b>Registrar aquí no valida la transferencia.</b> Antes de entregar la mercadería, confírmala con Financiero y guarda el respaldo (comprobante del banco).</div>' +   // fpg14\n"
     "      '<label>Cuenta de la empresa")
for ruta in sys.argv[1:]:
    s = open(ruta, encoding='utf-8').read()
    if 'fpg14' in s: print(ruta, 'ya tenía fpg14'); continue
    if s.count(A) != 1: sys.exit(ruta + ': no encontré el formulario de transferencia')
    open(ruta, 'w', encoding='utf-8').write(s.replace(A, B)); print(ruta, 'fpg14 aplicado')
