"""tk1 (22-nov-2026): Inicio de la tienda tipo TikTok.
- tk1.css.html (un <style>) va antes del ultimo </body>.
- tk1.js va DENTRO del bloque principal de la tienda, justo antes de la linea 'window.__S = S;' (debe aparecer 1 vez),
  porque renderInicio, S, irA, etc. viven dentro de ese (function(){ ... })().
Uso: python3 aplicar_tk1.py Index.html carpeta_tk1   (idempotente: si ya esta, lo reemplaza)"""
import sys, re, os
p, d = sys.argv[1], sys.argv[2]
s = open(p, encoding='utf-8').read()
css = open(os.path.join(d, 'tk1.css.html'), encoding='utf-8').read().strip()
js = open(os.path.join(d, 'tk1.js'), encoding='utf-8').read().strip()
s = re.sub(r'<style>/\* tk1: Inicio.*?</style>\n?', '', s, flags=re.S)
s = re.sub(r'/\* tk1: Inicio tipo TikTok.*?/\* /tk1 \*/\n?', '', s, flags=re.S)
M = 'window.__S = S;'
assert s.count(M) == 1, 'no encontre window.__S = S; exactamente una vez'
s = s.replace(M, js + '\n/* /tk1 */\n' + M)
k = s.rindex('</body>'); s = s[:k] + css + '\n' + s[k:]
open(p, 'w', encoding='utf-8').write(s); print('ok tk1', p)
