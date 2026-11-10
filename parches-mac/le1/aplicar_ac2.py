#!/usr/bin/env python3
"""ac2 (Diego 10-nov): "Registrar factura de autoconsumo" sin el campo "Productos (código y cantidad)"; el detalle sale del ERP con el número de factura.
Uso: python3 aplicar_ac2.py <tienda.html|Index.html>. Idempotente."""
import sys
p = sys.argv[1]; s = open(p, encoding='utf-8').read()
if 'ac2:' in s: print('ya aplicado', p); sys.exit(0)
R = [
 ("""    '<label class="f">Productos (código y cantidad)</label><textarea id="aucProd" maxlength="500" placeholder="Ej.: COM-13100 x1, CAB-010 x2"></textarea>' +\n""", ""),
 ("productos: $('#aucProd').value.trim(),", "productos: '',   /* ac2: el detalle sale del ERP con el n.º de factura */"),
 ("      d.productos.length < 3 ? 'Escribe qué productos salieron.' : !d.motivo ?", "      !d.motivo ?"),
]
for a, b in R:
    c = s.count(a)
    if c != 1: sys.exit('ancla %r aparece %d veces en %s' % (a[:70], c, p))
    s = s.replace(a, b)
open(p, 'w', encoding='utf-8').write(s); print('ok', p)
