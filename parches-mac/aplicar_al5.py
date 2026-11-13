#!/usr/bin/env python3
"""al5 (Diego 10-nov): AvisosPanel.gs. La lectura de un anuncio se unía por nombre exacto, así que quien confirmó con su nombre
anterior (Germania Jaramillo) contaba aparte de su alias (Paola Jaramillo). Ahora la persona de la lectura pasa por nombreCorto_
y, si no está en el personal de esa tienda, se une por apellido cuando hay una sola persona con ese apellido.
Uso: python3 aplicar_al5.py <proyecto_clasp>/AvisosPanel.gs. Idempotente."""
import sys
p = sys.argv[1]; s = open(p, encoding='utf-8').read()
if '/* al5 */' in s: print('ya aplicado', p); sys.exit(0)
a = "leido[r[2] + '|' + r[3] + '|' + r[4]] = 1;"
if s.count(a) != 1: sys.exit('ancla aparece %d veces' % s.count(a))
b = """{ /* al5 */ const g = Object.keys(gente[r[3]] || {}), ape = x => String(x || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase().trim().split(/\\s+/).pop();
    let n = nombreCorto_(r[4]); if (g.indexOf(n) < 0) { const c = g.filter(x => ape(x) === ape(n)); if (c.length === 1) n = c[0]; }
    leido[r[2] + '|' + r[3] + '|' + n] = 1; leido[r[2] + '|' + r[3] + '|' + r[4]] = 1; }"""
s = s.replace(a, b)
open(p, 'w', encoding='utf-8').write(s); print('ok', p)
