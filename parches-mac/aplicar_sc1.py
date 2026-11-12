#!/usr/bin/env python3
"""sc1 (Diego 12-nov): en el celular, durante la supervisión, no se podía bajar hasta Prioridad ni la fecha de compromiso:
scroll-snap "mandatory" devolvía la pantalla al inicio del punto cuando el punto era más alto que la pantalla (iPhone).
Ahora "proximity" (ayuda a encajar pero deja quedarse donde uno quiera) y la fecha no se sale de su columna.
Uso: python3 aplicar_sc1.py <tienda.html|Index.html>. Idempotente."""
import sys
p = sys.argv[1]; s = open(p, encoding='utf-8').read()
if '/* sc1 */' in s: print('ya aplicado', p); sys.exit(0)
a = "  html.tk{scroll-snap-type:y mandatory}"
assert s.count(a) == 1, 'ancla'
s = s.replace(a, "  html.tk{scroll-snap-type:y proximity}   /* sc1 */\n  .grid2 input{min-width:0;width:100%;max-width:100%;box-sizing:border-box} .grid2 input[type=date]{-webkit-appearance:none;appearance:none;min-height:44px}")
open(p, 'w', encoding='utf-8').write(s); print('ok', p)
