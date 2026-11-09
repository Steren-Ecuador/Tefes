# mp3 (9-nov-2026): el panel de supervisores muestra solo los menús/opciones del perfil de quien entra.
# Uso: python3 aplicar_mp3.py Panel.html   (idempotente; también sirve para panel.html y prueba/panel.html del espejo)
import sys
p = sys.argv[1]; s = open(p, encoding='utf-8').read()
if '/* mp3: menús por perfil */' in s: print('ya tenía mp3'); sys.exit(0)
a = "  window.MN_SUB = window.MN_SUB || {};\n"
if s.count(a) != 1: sys.exit('ancla MN_SUB aparece %d veces' % s.count(a))
s = s.replace(a, a + "  window.MN_T_REF = MN_T;   // mp3\n")
JS = r'''<script>/* mp3: menús por perfil */
(function(){
  const K = {'hoy|': 'hoy/hoy', 'supervision|': 'supervision/nueva', 'pendientes|': 'supervision/pendientes', 'calendario|': 'supervision/calendario',
    'anuncios|': 'anuncios/leer', 'flash|': 'ventas/flash', 'inventario|top': 'mercaderia/top', 'inventario|extra': 'mercaderia/extra', 'inventario|stock': 'mercaderia/stock',
    'universidad|tabla': 'universidad/tabla', 'universidad|gol': 'universidad/gol', 'universidad|car': 'universidad/car', 'universidad|al': 'universidad/al',
    'politicas|leer': 'politicas/politicas', 'guias|': 'politicas/guias', 'politicas|rep': 'politicas/reporte',
    'contactos|tel': 'contactos/tel', 'contactos|wa': 'contactos/wa', 'contactos|mail': 'contactos/mail', 'contactos|hor': 'contactos/hor',
    'clientes|pf': 'clientes/pf', 'clientes|vf': 'clientes/vf'};
  let quien = '', pedido = false;
  function aplicar(cfg){
    window.MPF_CFG = cfg;
    if (!cfg || cfg.todo || !Array.isArray(cfg.claves)) return;
    const A = new Set(cfg.claves), M = window.MN_T_REF, tabs = document.getElementById('tabs'); if (!M || !tabs) return;
    const vivas = {}, todas = {};
    Object.keys(M).forEach(t => { const keep = M[t].filter(x => { const k = K[x[0] + '|' + x[1]]; todas[x[0]] = 1; const ok = !k || A.has(k); if (ok) vivas[x[0]] = 1; return ok; }); M[t].length = 0; keep.forEach(x => M[t].push(x)); });
    Object.keys(todas).forEach(v => { if (!vivas[v]) { const b = tabs.querySelector('button[data-v="' + v + '"]'); if (b) { b.dataset.mpf = '1'; b.hidden = true; } } });
    new MutationObserver(() => tabs.querySelectorAll('button[data-mpf]').forEach(b => { if (!b.hidden) b.hidden = true; })).observe(tabs, {subtree: true, attributes: true, attributeFilter: ['hidden', 'style']});
    const on = tabs.querySelector('button[data-v].on');
    if (on && on.hidden) { const p = [...tabs.querySelectorAll('button[data-v]')].find(b => !b.hidden && b.style.display !== 'none'); if (p) p.click(); }
    tabs.dataset.mn = String(Date.now());
  }
  setInterval(() => {
    const y = window.cvCtx && cvCtx.yo && cvCtx.yo(); if (!y || !y.nombre || pedido && quien === y.nombre) return;
    if (pedido && quien && quien !== y.nombre) { location.reload(); return; }   // otra persona en el mismo equipo
    quien = y.nombre; pedido = true;
    cvCtx.api('apiMenusPerfil', y.nombre).then(aplicar).catch(() => {});
  }, 700);
})();
</script>
'''
i = s.rfind('</body>'); s = s[:i] + JS + s[i:]
open(p, 'w', encoding='utf-8').write(s); print('mp3 aplicado')
