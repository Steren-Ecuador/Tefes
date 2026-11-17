#!/usr/bin/env python3
"""fpg13 (Diego 17-nov: "y lo mismo en el resto de opciones"): en todos los pasos y formas, apenas la persona
escribe o elige algo, se muestra en un recuadro rojo qué falta o qué está mal (antes solo al tocar el botón gris).
Necesita fpg11 y fpg12. Uso: python3 aplicar_fpg13.py archivo...  Idempotente."""
import sys

PAR = [
    ("let paso = 1, guardando = false, err = '', fijo = null;",
     "let paso = 1, guardando = false, err = '', fijo = null, tocado = false, pasoVisto = 0;   // fpg13"),
    ("  function pintar(enfocar){\n",
     "  function pintar(enfocar){\n    if (paso !== pasoVisto) { tocado = false; pasoVisto = paso; }   // fpg13\n"),
    ("err = ''; refrescarNav(); }); };",
     "err = ''; tocado = true; refrescarNav(); }); };"),
    ("D[k] = e.value.trim(); err = ''; refrescarNav(); };",
     "D[k] = e.value.trim(); err = ''; tocado = true; refrescarNav(); };"),
    ("if (m) m.textContent = err || '';",
     "if (m) { const ya3 = (!!$w('#fwValAv') && !$w('#fwValAv').hidden) || (!!$w('#fwRefAv') && !$w('#fwRefAv').hidden);   // fpg13\n"
     "      const t3 = err || (tocado && !ya3 ? errPaso(paso) : ''); m.textContent = t3 ? (/^⚠️/.test(t3) ? t3 : '⚠️ ' + t3) : ''; m.className = t3 ? 'fw-err' : 'fw-h err'; m.style.textAlign = t3 ? 'left' : 'center'; }"),
]

for ruta in sys.argv[1:]:
    s = open(ruta, encoding='utf-8').read()
    if 'fpg13' in s:
        print(ruta, 'ya tenía fpg13'); continue
    if 'fpg12' not in s:
        sys.exit(ruta + ': falta fpg12')
    for a, b in PAR:
        n = s.count(a)
        if n != 1:
            sys.exit(ruta + ': encontré ' + str(n) + ' veces: ' + a[:70])
        s = s.replace(a, b)
    open(ruta, 'w', encoding='utf-8').write(s)
    print(ruta, 'fpg13 aplicado')
