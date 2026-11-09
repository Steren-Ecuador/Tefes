#!/usr/bin/env python3
"""an2 (Diego 9-nov): Anuncios compactos. Siempre se ve el resumen (título, fechas, cuántos leyeron, cada tienda con leídos/total y quién falta);
al tocar el anuncio se abre el detalle (texto y lectura por tienda; en el admin, el botón Ocultar).
Uso: python3 aplicar_an2.py admin|panel <archivo>. Idempotente."""
import sys
modo, p = sys.argv[1], sys.argv[2]; s = open(p, encoding='utf-8').read()
if '/* an2 */' in s: print('ya aplicado', p); sys.exit(0)
def rep(a, b):
    global s
    c = s.count(a)
    if c != 1: sys.exit('ancla %r aparece %d veces en %s' % (a[:70], c, p))
    s = s.replace(a, b)
CSS = ('<style>/* an2 */'
  '.an2{border-bottom:1px solid var(--line);padding:2px 0}.an2:last-child{border-bottom:0}'
  '.an2>summary{list-style:none;cursor:pointer;padding:10px 2px;display:block}.an2>summary::-webkit-details-marker{display:none}'
  '.an2>summary:hover{background:var(--surface-2,#f6f7f9)}'
  '.an2-cab{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.an2-cab b{font-size:15px}'
  '.an2-ch{display:flex;flex-wrap:wrap;gap:4px;margin-top:7px}'
  '.an2-ch span{font-size:12px;border-radius:999px;padding:2px 8px;background:var(--surface-2,#f1f3f5);white-space:nowrap}'
  '.an2-ch .ok{background:#e3f4ea;color:#1e7b45}.an2-ch .med{background:#fdf1dc;color:#9a6200}.an2-ch .cero{background:#fde4e2;color:#b3261e}'
  '.an2-f{font-size:12.5px;color:var(--muted,#6b7280);margin-top:6px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}'
  '.an2-v{font-size:12px;color:var(--accent,#0b5394);font-weight:600;margin-left:6px;white-space:nowrap}.an2[open] .an2-v::after{content:" ▲"}.an2:not([open]) .an2-v::after{content:" ▼"}'
  '.an2.an-it{display:block;padding:2px 0;gap:0}.an2.an-it>summary{color:inherit;font-weight:400;font-size:inherit}'
  '.an2-d{padding:0 2px 12px}.an2-d p,.an2-d .an-txt{margin:0 0 8px;white-space:pre-line}'
  '</style>\n')
# chips por tienda: x = {t, ley, tot}
if modo == 'admin':
    rep("""      const filas = a.porTienda.map(x =>""", """      const chips = a.porTienda.map(x => `<span class="${x.total && !x.faltan.length ? 'ok' : x.leyeron.length ? 'med' : 'cero'}">${esc(x.t)} ${x.leyeron.length}/${x.total}</span>`).join(''), fal = [].concat(...a.porTienda.map(x => x.faltan));   // an2
      const filas = a.porTienda.map(x =>""")
    rep("""      return `<div class="an-it ${a.activo ? '' : 'off'}"><div class="an-cab"><div><b>${esc(a.titulo)}</b>""",
        """      return `<details class="an2 an-it ${a.activo ? '' : 'off'}"><summary><div class="an2-cab"><div><b>${esc(a.titulo)}</b>""")
    rep("""          <span class="pill p-${c}">${a.ok} de ${a.tot} leyeron</span></div>
        ${/^🔒/.test(a.efecto || '') && hoy <= a.hasta ? veloHtml(a, hoy) : ''}${a.texto ? `<div class="small muted an-txt">${esc(a.texto)}</div>` : ''}
        <details ${vig && a.activo ? 'open' : ''}><summary>Lectura por tienda</summary><div class="an-st">${filas}</div></details>
        <div class="actions" style="margin:0"><button class="btn" data-an="${a.row}" data-act="${a.activo ? 1 : 0}">${a.activo ? 'Ocultar en las tiendas' : 'Volver a mostrar'}</button></div></div>`;""",
        """          <span style="white-space:nowrap"><span class="pill p-${c}">${a.ok} de ${a.tot} leyeron</span><span class="an2-v">Detalle</span></span></div>
        <div class="an2-ch">${chips}</div>${fal.length ? `<div class="an2-f">Faltan ${fal.length}: ${fal.map(esc).join(', ')}</div>` : a.tot ? '<div class="an2-f">✓ Todos leyeron</div>' : ''}</summary>
        <div class="an2-d">${/^🔒/.test(a.efecto || '') && hoy <= a.hasta ? veloHtml(a, hoy) : ''}${a.texto ? `<div class="small muted an-txt">${esc(a.texto)}</div>` : ''}
        <div class="an-st" style="margin-bottom:10px">${filas}</div>
        <div class="actions" style="margin:0"><button class="btn" data-an="${a.row}" data-act="${a.activo ? 1 : 0}">${a.activo ? 'Ocultar en las tiendas' : 'Volver a mostrar'}</button></div></div></details>`;""")
else:
    rep("""    const faltan = a.lecturas.filter(l => l.leyeron < l.total).map(l => esc(l.tienda) + ' ' + l.leyeron + '/' + l.total);
    return `<div class="av-item"><h3>${esc(a.titulo)}</h3>${/^🔒/.test(a.efecto || '') ? veloHtml(a, st.d && st.d.hoy || new Date().toLocaleDateString('en-CA', {timeZone: 'America/Guayaquil'})) : ''}${a.texto ? `<p>${esc(a.texto)}</p>` : ''}
      <div class="small faint">Del ${fd(a.desde)} al ${fd(a.hasta)} · ${a.lecturas.length === 1 ? esc(a.lecturas[0].tienda) : a.lecturas.length + ' tiendas'} · leyeron ${ley} de ${tot}${faltan.length ? ' · faltan en ' + faltan.join(', ') : ''}</div></div>`;""",
        """    const c = tot && ley >= tot ? 'good' : ley ? 'warn' : 'bad', fal = [].concat(...a.lecturas.map(l => l.faltan || []));   // an2
    const chips = a.lecturas.map(l => `<span class="${l.total && l.leyeron >= l.total ? 'ok' : l.leyeron ? 'med' : 'cero'}">${esc(l.tienda)} ${l.leyeron}/${l.total}</span>`).join('');
    const filas = a.lecturas.map(l => `<span class="store">${esc(l.tienda)}</span><span class="${l.total && l.leyeron >= l.total ? 'ok' : ''}">${l.leyeron} de ${l.total}</span><span class="faint">${(l.faltan || []).length ? 'Falta: ' + l.faltan.map(esc).join(', ') : l.total && l.leyeron >= l.total ? '✓ Todos leyeron' : l.total ? 'Faltan ' + (l.total - l.leyeron) : 'Sin personal registrado'}</span>`).join('');
    return `<details class="an2"><summary><div class="an2-cab"><div><b>${esc(a.titulo)}</b><div class="small faint">Del ${fd(a.desde)} al ${fd(a.hasta)} · ${a.lecturas.length === 1 ? esc(a.lecturas[0].tienda) : a.lecturas.length + ' tiendas'}</div></div>
      <span style="white-space:nowrap"><span class="pill p-${c}">${ley} de ${tot} leyeron</span><span class="an2-v">Detalle</span></span></div>
      <div class="an2-ch">${chips}</div>${fal.length ? `<div class="an2-f">Faltan ${fal.length}: ${fal.map(esc).join(', ')}</div>` : ''}</summary>
      <div class="an2-d">${/^🔒/.test(a.efecto || '') ? veloHtml(a, st.d && st.d.hoy || new Date().toLocaleDateString('en-CA', {timeZone: 'America/Guayaquil'})) : ''}${a.texto ? `<p>${esc(a.texto)}</p>` : ''}
      <div class="an-st an2-st">${filas}</div></div></details>`;""")
    CSS = CSS.replace('</style>', '.an2-st{display:grid;grid-template-columns:minmax(90px,140px) 64px minmax(0,1fr);gap:5px 10px;font-size:13px}.an2-st .ok{color:var(--good,#1e7b45);font-weight:600}</style>')
i = s.rfind('</body>'); s = s[:i] + CSS + s[i:]
open(p, 'w', encoding='utf-8').write(s); print('ok', p)
