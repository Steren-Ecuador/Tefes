#!/usr/bin/env python3
"""pc3 + in24 (16-nov). Uso: python3 aplicar_pc3.py <proyecto_clasp>   (idempotente)
1. Copia PoliticasRapido.gs.
2. Tiendas.gs: pc1Leer_ usa pc3Leer_ (precalculado).
3. Politicas.gs (apiResponderPolitica) y Guias.gs (apiConfirmarGuia): tras anotar la lectura, borran la copia de esa tienda.
4. Notificaciones.gs: revisarNotificaciones llama a pc3Precalcular_ junto al precálculo del inventario (l10).
5. InventarioRapido.gs: el precálculo del inventario corre todo el día (antes solo de día)."""
import os, re, shutil, sys
P = sys.argv[1]; AQUI = os.path.dirname(os.path.abspath(__file__))
def leer(n): return open(os.path.join(P, n), encoding='utf-8').read()
def escribir(n, s): open(os.path.join(P, n), 'w', encoding='utf-8', newline='\n').write(s); print('ok', n)
def funcion(s, nombre):
    i = s.find('function ' + nombre + '(')
    if i < 0: sys.exit('no encontré function ' + nombre)
    j = s.find('\nfunction ', i + 10); return i, (j if j > 0 else len(s))
shutil.copy(os.path.join(AQUI, 'PoliticasRapido.gs'), os.path.join(P, 'PoliticasRapido.gs')); print('ok PoliticasRapido.gs')
# 2
s = leer('Tiendas.gs')
if '/* pc3 */' not in s:
    a = 'function pc1Leer_(q, tk, f) {   /* pc1 */\n'
    if s.count(a) != 1: sys.exit('Tiendas.gs: ancla pc1Leer_ %d veces' % s.count(a))
    escribir('Tiendas.gs', s.replace(a, a + "  if (typeof pc3Leer_ === 'function') return pc3Leer_(q, tk, f);   /* pc3 */\n"))
# 3
for arch, fn, hoja, q in (('Politicas.gs', 'apiResponderPolitica', 'POL_LECT', 'pol'), ('Guias.gs', 'apiConfirmarGuia', 'GUIAS_LECT', 'gui')):
    s = leer(arch)
    if "pc3Tocar_('%s'" % q in s: print('ya', arch); continue
    i, j = funcion(s, fn); cuerpo = s[i:j]
    if not re.search(r'\bconst tienda = ', cuerpo): sys.exit(arch + ': no veo la variable tienda en ' + fn)
    lineas = [m for m in re.finditer(r'[^\n]*appendRow\(\[hoy_\(\)[^\n]*\btienda\b[^\n]*\n', cuerpo)]
    if len(lineas) != 1: sys.exit('%s: %d líneas appendRow en %s' % (arch, len(lineas), fn))
    m = lineas[0]; sangria = re.match(r'\s*', m.group(0)).group(0)
    nuevo = cuerpo[:m.end()] + sangria + "try { pc3Tocar_('%s', tienda); } catch (e) {}   /* pc3 */\n" % q + cuerpo[m.end():]
    escribir(arch, s[:i] + nuevo + s[j:])
# 4
s = leer('Notificaciones.gs')
if 'pc3Precalcular_' not in s:
    m = list(re.finditer(r'[^\n]*l10Precalcular_\(\)[^\n]*\n', s))
    if len(m) != 1: sys.exit('Notificaciones.gs: %d llamadas a l10Precalcular_' % len(m))
    sangria = re.match(r'\s*', m[0].group(0)).group(0)
    escribir('Notificaciones.gs', s[:m[0].end()] + sangria + "try { if (typeof pc3Precalcular_ === 'function') pc3Precalcular_(); } catch (e) { console.warn('pc3: ' + e.message); }   /* pc3 */\n" + s[m[0].end():])
# 5
s = leer('InventarioRapido.gs')
if 'in24:' not in s:
    m = list(re.finditer(r'if \(h < \d+ \|\| h >= \d+ \|\| Math\.floor\(m / 5\) % 2\) return;', s))
    if len(m) != 1: sys.exit('InventarioRapido.gs: %d condiciones de hora' % len(m))
    escribir('InventarioRapido.gs', s[:m[0].start()] + 'if (Math.floor(m / 5) % 2) return;   /* in24: todo el día */' + s[m[0].end():])
