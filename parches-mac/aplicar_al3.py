#!/usr/bin/env python3
"""al3 (Diego 10-nov): en los anuncios de la tienda una persona salía dos veces cuando confirmó con su nombre anterior
(p. ej. "Germania Jaramillo") y el personal ya sale con su alias ("Paola Jaramillo"). Cada lectura se une a la persona del
personal de la tienda con el mismo nombre o, si no, con el mismo apellido (solo si hay una sola con ese apellido); se cuenta una vez.
Uso: python3 aplicar_al3.py <tienda.html|Index.html>. Idempotente."""
import sys
p = sys.argv[1]; s = open(p, encoding='utf-8').read()
if '/* al3 */' in s: print('ya aplicado', p); sys.exit(0)
def rep(a, b, n=1):
    global s
    c = s.count(a)
    if c != n: sys.exit('ancla %r aparece %d veces en %s' % (a[:70], c, p))
    s = s.replace(a, b)
rep("const faltan = a => { const ya = a.lecturas.map(l => l.persona); return gente().filter(n => ya.indexOf(n) < 0); };",
"""/* al3: la lectura se une a la persona del personal (mismo nombre, o mismo apellido si es único): una persona, una vez, con su alias */
const alNorm = x => String(x || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase().trim();
const canonPer = n => { const g = gente(); if (g.indexOf(n) >= 0) return n; const ap = alNorm(n).split(/\\s+/).pop();
  const c = ap ? g.filter(x => alNorm(x).split(/\\s+/).pop() === ap) : []; return c.length === 1 ? c[0] : n; };
const lecs = a => { const vis = {}; return a.lecturas.map(l => Object.assign({}, l, {persona: canonPer(l.persona)})).filter(l => vis[l.persona] ? false : (vis[l.persona] = 1)); };
const faltan = a => { const ya = lecs(a).map(l => l.persona); return gente().filter(n => ya.indexOf(n) < 0); };""")
rep("'Confirmaron ' + a.lecturas.length + (n ? ' de ' + n : '')", "'Confirmaron ' + lecs(a).length + (n ? ' de ' + n : '')")
rep("'<div class=\"nombres\">' + a.lecturas.map(l => '<span class=\"si\"", "'<div class=\"nombres\">' + lecs(a).map(l => '<span class=\"si\"")
rep("A.filter(a => a.lecturas.some(l => l.persona === n))", "A.filter(a => a.lecturas.some(l => canonPer(l.persona) === n))")
open(p, 'w', encoding='utf-8').write(s); print('ok', p)
