#!/usr/bin/env python3
"""fpg19 (Diego 18-nov): las marcas se escriben como ellas: "Deuna" (no "deUna"/"DeUna") y "Tipti".
Íconos parecidos a sus logos: Deuna círculo morado con "d!" verde menta; Tipti círculo naranja con "Tipti" en cursiva blanca.
Uso: python3 aplicar_fpg19.py archivo...  (tienda.html, asesor.html, panel.html, Index.html, Panel.html, FormasPago.gs). Idempotente.
La base de Formas de pago estaba vacía al aplicar (18-nov), así que el valor guardado pasa a "Deuna" sin migrar nada."""
import sys

ICO = [
    (".fw-ic.ic-deuna{background:linear-gradient(135deg,#5b21b6,#c026d3)}",
     ".fw-ic.ic-deuna{background:#5b1f8f;color:#5fe3b4;border-radius:50%}"),
    (".fw-ic.ic-tipti{background:linear-gradient(135deg,#f97316,#ea580c)}",
     ".fw-ic.ic-tipti{background:#f7931e;border-radius:50%;font-family:Georgia,serif;font-style:italic;font-size:13px;letter-spacing:-.2px}"),
    ("'Tipti': ['ic-tipti', 't']", "'Tipti': ['ic-tipti', 'Tipti']"),
]

for ruta in sys.argv[1:]:
    s = open(ruta, encoding='utf-8').read()
    if 'fpg19' in s and 'deUna' not in s:
        print(ruta, 'ya tenía fpg19'); continue
    n = s.count('deUna') + s.count('DeUna')
    s = s.replace('deUna', 'Deuna').replace('DeUna', 'Deuna')
    hechos = 0
    for a, b in ICO:
        if a in s:
            s = s.replace(a, b); hechos += 1
    if ruta.endswith('.gs'):
        s = s.replace('/* fpg12 */', '/* fpg12 · fpg19 */', 1)
    elif hechos and '/* fpg19 */' not in s:
        s = s.replace(".fw-ic.ic-deuna{", "/* fpg19 */.fw-ic.ic-deuna{", 1)
    open(ruta, 'w', encoding='utf-8').write(s)
    print(ruta, 'fpg19:', n, 'textos Deuna,', hechos, 'íconos')
