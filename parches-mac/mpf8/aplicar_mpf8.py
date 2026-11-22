# mpf8 (Diego 22-nov): al entrar, el panel abre el primer tema del menú del perfil (orden de 'Menús por perfil'), no el primer botón del código.
import sys
OLD = "if (on && on.hidden) { const p = [...tabs.querySelectorAll('button[data-v]')].find(b => !b.hidden && b.style.display !== 'none'); if (p) p.click(); }"
NEW = "if (on && on.hidden) { const vis = b => b && !b.hidden && b.style.display !== 'none'; let p = null;   /* mpf8: primer tema del menú del perfil */\n      try { ((window.TEM && TEM.temas) || []).some(t => (t.vistas || []).some(v => { const b = tabs.querySelector('button[data-v=\"' + v + '\"]'); if (vis(b)) { p = b; return true; } return false; })); } catch (e) {}\n      p = p || [...tabs.querySelectorAll('button[data-v]')].find(vis); if (p) p.click(); }"
for f in sys.argv[1:]:
    t = open(f, encoding='utf-8').read()
    if 'mpf8:' in t: print(f, 'ya tiene mpf8'); continue
    assert t.count(OLD) == 1, f
    open(f, 'w', encoding='utf-8').write(t.replace(OLD, NEW)); print(f, 'ok')
