#!/usr/bin/env python3
"""fpg11 (Diego 17-nov): si el valor pagado está mal (más que la factura, o mal escrito), avisarlo
con un mensaje claro debajo del campo, en el momento, y no solo dejar el botón en gris.
Uso: python3 aplicar_fpg11.py archivo [archivo...]   (asesor.html, tienda.html, Index.html, wizard_fpg8.js) — idempotente."""
import sys

PAR = [
    ("const valor = lab => campoUsd(lab, ph) + ",
     "const valor = lab => campoUsd(lab, ph) + '<div class=\"fw-err\" id=\"fwValAv\" style=\"margin-top:6px\" hidden></div>' + "),
    ("  function refrescarNav(){ const b = $w('[data-fw=\"sig\"]');",
     "  /* fpg11: aviso en vivo del valor pagado */\n"
     "  function avisoValor(){ if (paso !== 3 || !String(D.valor || '').trim()) return '';\n"
     "    if (!numOk(D.valor)) return '⚠️ Escribe el valor en dólares, con punto o coma para los centavos (ej. 45,90).';\n"
     "    const v = valorPago(), t = num(D.valorFac);\n"
     "    if (v > t + (esVale() ? 0.99 : 0) + 0.004) return '⚠️ ' + usd(v) + ' es más que el total de la factura (' + usd(t) + '). Revisa el valor.';\n"
     "    if (ya() + v > t + (esVale() ? 0.994 : 0.004)) return '⚠️ Con lo ya registrado (' + usd(ya()) + ') pasaría el total de la factura (' + usd(t) + '). Lo máximo que puedes poner es ' + usd(Math.max(0, t - ya())) + '.';\n"
     "    return ''; }\n"
     "  function refrescarNav(){ const av = $w('#fwValAv'), ta = avisoValor(); if (av) { av.textContent = ta; av.hidden = !ta; } const iv = $w('#fwVal'); if (iv) iv.style.borderColor = ta ? '#dc2626' : '';   // fpg11\n"
     "    const b = $w('[data-fw=\"sig\"]');"),
    ("    box.innerHTML = h; enlazar();\n",
     "    box.innerHTML = h; enlazar(); refrescarNav();   // fpg11\n"),
]

for ruta in sys.argv[1:]:
    s = open(ruta, encoding='utf-8').read()
    if 'fpg11' in s:
        print(ruta, 'ya tenía fpg11'); continue
    for a, b in PAR:
        n = s.count(a)
        if n != 1:
            sys.exit(ruta + ': encontré ' + str(n) + ' veces: ' + a[:60])
        s = s.replace(a, b)
    open(ruta, 'w', encoding='utf-8').write(s)
    print(ruta, 'fpg11 aplicado')
