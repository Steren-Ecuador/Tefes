"""tkp (22-nov-2026, Diego): Inicio del panel (supervisores, gerencia, financiero, control, call center) tipo TikTok en el celular.
Uso: python3 aplicar_tkp.py Panel.html carpeta_tkp   (idempotente)"""
import sys, re, os
p, d = sys.argv[1], sys.argv[2]
s = open(p, encoding='utf-8').read()
b = open(os.path.join(d, 'tkp.html'), encoding='utf-8').read().strip()
s = re.sub(r'<script>/\* tkp: .*?</script>\s*<style>/\* tkp \*/.*?</style>\n?', '', s, flags=re.S)
k = s.rindex('</body>'); s = s[:k] + b + '\n' + s[k:]
open(p, 'w', encoding='utf-8').write(s)
print('ok tkp', p)
