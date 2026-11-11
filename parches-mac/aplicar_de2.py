#!/usr/bin/env python3
"""de2 (Diego 10-nov): el enlace personal &de=<slug> se hizo con el nombre anterior (p. ej. germania-jaramillo) y el equipo
ahora llega con el alias (Paola Jaramillo): la app no la encontraba y, al elegir su nombre, de1 lo borraba y volvía a preguntar.
Ahora: coincide el slug exacto o, si no, el apellido (solo si hay una persona con ese apellido). Uso: python3 aplicar_de2.py asesor.html"""
import sys
p = sys.argv[1]; s = open(p, encoding='utf-8').read()
if '/* de2 */' in s: print('ya aplicado', p); sys.exit(0)
def rep(a, b):
    global s
    c = s.count(a)
    if c != 1: sys.exit('ancla %r aparece %d veces en %s' % (a[:70], c, p))
    s = s.replace(a, b)
rep("  if (DE && leerYo() && slug(leerYo()) !== DE) guardarYo('');   /* de1 */",
    "  const apeDe = n => slug(n).replace(/-+$/, '').split('-').pop();   /* de2: el enlace puede tener el nombre anterior (alias) */\n  if (DE && leerYo() && slug(leerYo()) !== DE && apeDe(leerYo()) !== apeDe(DE)) guardarYo('');   /* de1 */")
rep("const m = (d.equipo || []).find(p => slug(p.nombre) === DE); if (m)",
    "const eq = d.equipo || [], ap = eq.filter(p => apeDe(p.nombre) === apeDe(DE)), m = eq.find(p => slug(p.nombre) === DE || slug(ver(p.nombre)) === DE) || (ap.length === 1 ? ap[0] : null); if (m)")
open(p, 'w', encoding='utf-8').write(s); print('ok', p)
