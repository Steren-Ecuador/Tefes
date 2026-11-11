#!/usr/bin/env python3
"""al4 (Diego 10-nov): admin, anuncios. La lectura se muestra con el alias (nombreCorto) y se une a la persona del personal de esa
tienda (mismo nombre, o mismo apellido si es único); cada persona cuenta una vez. Uso: python3 aplicar_al4.py <admin.html>. Idempotente."""
import sys
p = sys.argv[1]; s = open(p, encoding='utf-8').read()
if '/* al4 */' in s: print('ya aplicado', p); sys.exit(0)
a = "a.porTienda = ts.map(t => { const g = gente[t] || [], l = lect[a.id + '|' + t] || [], ya = l.map(x => x.p);"
b = """a.porTienda = ts.map(t => { const g = gente[t] || [], ya = [];   /* al4 */
        const ape = x => ncNorm(x).split(' ').pop(), can = n => { n = nombreCorto(n); if (g.indexOf(n) >= 0) return n; const c = g.filter(x => ape(x) === ape(n)); return c.length === 1 ? c[0] : n; };
        const l = (lect[a.id + '|' + t] || []).map(x => Object.assign({}, x, {p: can(x.p)})).filter(x => ya.indexOf(x.p) < 0 && ya.push(x.p));"""
assert s.count(a) == 1, 'ancla'
s = s.replace(a, b)
open(p, 'w', encoding='utf-8').write(s); print('ok', p)
