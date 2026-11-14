#!/usr/bin/env python3
"""pwa1 (Diego 14-nov): el sitio de GitHub se puede instalar como app "Steren" (Agregar a pantalla de inicio).
El manifiesto NO tiene start_url: así el ícono abre la misma dirección con la que se instaló (?t=, ?p=, ?ase=...),
y cada persona entra a lo suyo. Uso: python3 aplicar_pwa.py <archivo.html> [...] (idempotente)."""
import sys
BLOQUE = '''<meta charset="utf-8">
<!-- pwa1 --><link rel="manifest" href="manifest.webmanifest"><link rel="icon" href="icono-192.png"><link rel="apple-touch-icon" href="icono-180.png">
<meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="Steren"><meta name="apple-mobile-web-app-status-bar-style" content="default">
<script>if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));</script>'''
for p in sys.argv[1:]:
    s = open(p, encoding='utf-8').read()
    if '<!-- pwa1 -->' in s: print('ya aplicado', p); continue
    if s.count('<meta charset="utf-8">') < 1: sys.exit('sin <meta charset="utf-8"> en ' + p)
    s = s.replace('<meta charset="utf-8">', BLOQUE, 1)
    open(p, 'w', encoding='utf-8').write(s); print('ok', p)
