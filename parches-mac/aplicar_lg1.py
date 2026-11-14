#!/usr/bin/env python3
"""lg1 (Diego 14-nov): junto al logo dice "Steren" (antes TEFES) y al tocar el logo se va al inicio.
Sirve para admin.html, Panel.html/panel.html e Index.html/tienda.html. Uso: python3 aplicar_lg1.py <archivo> [...]"""
import sys
JS = """<script>/* lg1: el logo lleva al inicio */
(function(){ const l = document.querySelector('.tem-logo, #logo'); if (!l) return;
  l.style.cursor = 'pointer'; l.setAttribute('role', 'button'); l.title = 'Ir al inicio';
  l.addEventListener('click', () => {
    const t = document.querySelector('.tem-nav [data-t]');
    if (t) { t.click(); setTimeout(() => { const s = document.querySelector('.tem-sub:not([hidden]) [data-v]'); if (s && !s.classList.contains('on')) s.click(); }, 80); }
    else { const b = document.querySelector('#tabs button[data-v], header nav button[data-v], nav button[data-v]'); if (b) b.click(); }
    window.scrollTo(0, 0); });
})();
</script>
"""
TXT = [('</span><h1>TEFES</h1>', '</span><h1>Steren</h1>'), ('<span class="sub">TEFES</span>', '<span class="sub">Steren</span>')]
for p in sys.argv[1:]:
    s = open(p, encoding='utf-8').read()
    if '/* lg1' in s: print('ya aplicado', p); continue
    n = 0
    for a, b in TXT:
        c = s.count(a)
        if c > 1: sys.exit('ancla repetida en %s: %s' % (p, a))
        if c == 1: s = s.replace(a, b); n += 1
    if n != 1: sys.exit('no encontré el texto TEFES junto al logo en ' + p)
    i = s.rfind('</body>')
    if i < 0: sys.exit('sin </body> en ' + p)
    s = s[:i] + JS + s[i:]
    open(p, 'w', encoding='utf-8').write(s); print('ok', p)
