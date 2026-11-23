"""fpf1 (22-nov-2026, Diego aprobó la maqueta JX86wJud591Ch1Eh6bygjw): Formas de pago del panel / admin.
- Submenús: "Registros" (clave tr) y "Pendientes por local" (clave ot): se mantienen las claves de menú tr/ot (mfp1), solo cambia lo que muestran.
- Registros: primero el resumen con el botón grande "Descargar Excel", luego tarjetas por forma de pago (filtran), filtros y tabla. Todas las formas juntas.
- Pendientes por local: solo el cuadre con el POS (#fpgPos en el panel, #fpcBody en el admin).
- Call center (body.fpg-cc): queda como antes (sus ventas por registrar primero, sin resumen arriba).
Uso: python3 aplicar_fpf1.py Panel.html|panel.html|admin.html   (idempotente)"""
import sys, re
p = sys.argv[1]; s = open(p, encoding='utf-8').read()
if '/* fpf1 */' in s:
    print('ya estaba', p); sys.exit(0)
def rep(a, b, n=1):
    global s
    assert s.count(a) == n, (a[:80], s.count(a)); s = s.replace(a, b)
# 1) nombres de los submenús (mismas claves)
rep('["formaspago", "tr", "Transferencias"], ["formaspago", "ot", "Otros"]', '["formaspago", "tr", "Registros"], ["formaspago", "ot", "Pendientes por local"]')
if "['tr','Transferencias'],['ot','Otros']" in s:   # editor de Menús por perfil (admin)
    rep("['tr','Transferencias'],['ot','Otros']", "['tr','Registros'],['ot','Pendientes por local']")
T0 = 'Lo que registran asesores y gerentes por cada factura del POS: transferencias (Deuna, Tipti, banco, otras) y otros (notas de crédito, préstamos a empleados y descuentos por inventarios).'
if T0 in s: s = s.replace(T0, 'Lo que registran asesores, gerentes y call center por cada factura del POS.')
# 2) Registros = todas las formas juntas
rep("return L.filter(x => grp(x) === G && ", "return L.filter(x => (G || 1) && ")
i = s.index("formas = G8 === 'ot' ?"); j = s.index("];   // fpg8", i) + 1
s = s[:i] + "formas = [...new Set(['Deuna', 'Tipti', 'Transferencias', 'Otra'].concat(EX8.filter(x => x.g !== 'ot').map(x => x.n), OT8, EX8.filter(x => x.g === 'ot').map(x => x.n), todas.map(x => x.forma)))]" + s[j:]
rep("csv(({tr: 'Transferencias', ot: 'Otros'}[(document.querySelector('.view[data-view=\"formaspago\"]') || {dataset: {}}).dataset.sub] || 'Formas de pago')",
    "csv((F.f.forma ? (F.f.forma === 'Transferencias' ? 'Transferencia' : F.f.forma) : 'Formas de pago')")
# 3) el resumen primero
rep("let h = integridadHtml() + '<div class=\"fpg-f\">' +", "const CC1 = document.body.classList.contains('fpg-cc');   /* fpf1 */\n    let hF = '<div class=\"fpg-f\">' +")
rep("Exportar a Excel</button></div>';", "Exportar a Excel</button></div>';\n    let h = '';   // fpf1: aquí va la barra de anular; el orden se arma abajo")
i = s.index("    h += '<div class=\"fpg-sum\">"); j = s.index("'</div>';\n", i) + len("'</div>';\n")
viejo = s[i:j].replace("    h += '<div class=\"fpg-sum\">", "    const sumV = '<div class=\"fpg-sum\">", 1)
NUEVO = viejo + r"""    if (CC1) h = integridadHtml() + hF + h + sumV;
    else {   /* fpf1: resumen + Descargar Excel, tarjetas por forma, filtros */
      const f0 = f.forma; f.forma = ''; const L0 = filtrar(); f.forma = f0;
      const c0 = f.est === 'Anulada' ? L0 : L0.filter(x => x.estado !== 'Anulada'), p0 = {}; c0.forEach(x => { p0[x.forma] = p0[x.forma] || {v: 0, n: 0}; p0[x.forma].v += x.valor || 0; p0[x.forma].n++; });
      const nomF = k => k === 'Transferencias' ? 'Transferencia' : k === 'Préstamo empleado' ? 'Préstamo a empleado' : k === 'Descuento inventario' ? 'Descuento por inventario' : k;
      const COLF = {'Deuna': '#00a19a', 'Transferencias': '#006B9E', 'Tipti': '#e0533d', 'Otra': '#7a4fd0', 'Nota de crédito': '#b26a00', 'Préstamo empleado': '#5d6b7a', 'Descuento inventario': '#1a7f4b'};
      const ff = d => d ? d.slice(8, 10) + '/' + d.slice(5, 7) + '/' + d.slice(0, 4) : '';
      const ordF = formas.slice().sort((a, b) => ((p0[b] || {}).v || 0) - ((p0[a] || {}).v || 0));
      const res = '<div class="fpf-res"><div class="fpf-tot"><span>' + e(f.forma ? nomF(f.forma) : 'Todas las formas de pago') + (f.est === 'Anulada' ? ' · anuladas' : '') + '</span><b>' + usd(tot) + '</b><span>' + cuenta.length + (cuenta.length === 1 ? ' registro' : ' registros') + (f.est === 'Anulada' ? ' anulados' : f.est ? ' vigentes' : '') + '</span></div>' +
        '<div class="fpf-per">' + e(f.t || 'Todas las tiendas') + '<br>' + (f.desde || f.hasta ? 'Del ' + ff(f.desde) + ' al ' + ff(f.hasta || hoyIso()) : 'Todas las fechas') + (I10 && I10.ok ? '<br><span class="fpf-bit">🔒 Bitácora íntegra (' + I10.lineas + ') <button id="fpgB">ver</button></span>' : '') + '</div>' +
        '<button class="fpf-xls" id="fpgX2" type="button"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>Descargar Excel</button></div>';
      const cards = '<div class="fpf-fm"><button type="button" data-fpf="" class="' + (f.forma ? '' : 'on') + '"><b>Todas</b><small>' + usd(c0.reduce((a, x) => a + (x.valor || 0), 0)) + ' · ' + c0.length + '</small></button>' +
        ordF.map(k => '<button type="button" data-fpf="' + e(k) + '" class="' + (f.forma === k ? 'on' : '') + '"><b><i style="background:' + (COLF[k] || '#8a96a3') + '"></i>' + e(nomF(k)) + '</b><small>' + (p0[k] ? usd(p0[k].v) + ' · ' + p0[k].n : 'sin registros') + '</small></button>').join('') + '</div>';
      h = integridadHtml() + res + cards + hF + h;
    }
"""
s = s[:i] + NUEVO + s[j:]
rep("    el.innerHTML = h;\n    const on = (id, k, ev) =>", "    el.innerHTML = h; el.classList.toggle('fpf-on', !CC1);   // fpf1\n    el.querySelectorAll('[data-fpf]').forEach(b => b.onclick = () => { F.f.forma = b.dataset.fpf; pintar(); });\n    const x2 = document.getElementById('fpgX2'); if (x2) x2.onclick = exportar;\n    const on = (id, k, ev) =>")
# 4) si cambia a call center (llega después), repintar con su orden
rep("new MutationObserver(() => { F.sel = {}; if (F.d) pintar(); }).observe(v, {attributes: true, attributeFilter: ['data-sub']});   // fpg8: cambia la opción del menú",
    "new MutationObserver(() => { F.sel = {}; if (F.d) pintar(); }).observe(v, {attributes: true, attributeFilter: ['data-sub']});   // fpg8: cambia la opción del menú\n    let cc1 = document.body.classList.contains('fpg-cc'); new MutationObserver(() => { const c = document.body.classList.contains('fpg-cc'); if (c !== cc1) { cc1 = c; if (F.d) pintar(); } }).observe(document.body, {attributes: true, attributeFilter: ['class']});   // fpf1")
CSS = r"""<style>/* fpf1 */
body:not(.fpg-cc) .view[data-view="formaspago"]:not([data-sub="ot"]) #fpgPos,body:not(.fpg-cc) .view[data-view="formaspago"]:not([data-sub="ot"]) #fpcBody{display:none!important}
body:not(.fpg-cc) .view[data-view="formaspago"][data-sub="ot"] #fpgBody{display:none!important}
.fpf-res{display:flex;flex-wrap:wrap;align-items:center;gap:14px 22px;background:linear-gradient(120deg,#002F57,#006B9E);color:#fff;border-radius:16px;padding:16px 18px;margin:0 0 12px}
.fpf-tot span{display:block;font-size:13.5px;opacity:.88}.fpf-tot b{display:block;font-size:30px;font-weight:800;line-height:1.15;font-variant-numeric:tabular-nums}
.fpf-per{font-size:13px;opacity:.9;line-height:1.5}.fpf-bit{opacity:.95}.fpf-bit button{border:0;background:none;color:#E5F7FC;text-decoration:underline;font:inherit;cursor:pointer;padding:0}
.fpf-xls{margin-left:auto;display:flex;align-items:center;gap:8px;border:0;border-radius:12px;padding:12px 18px;background:#E5F7FC;color:#002F57;font:800 15px Heebo,system-ui,sans-serif;cursor:pointer;box-shadow:0 6px 16px rgba(0,0,0,.18)}
.fpf-xls:active{transform:scale(.97)}
.fpf-fm{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 12px}
.fpf-fm button{flex:0 1 auto;min-width:124px;text-align:left;border:1px solid var(--line,#e2e7ee);background:var(--surface,#fff);color:inherit;border-radius:12px;padding:8px 12px;cursor:pointer;font:inherit}
.fpf-fm button b{display:block;font-size:14.5px;white-space:nowrap}.fpf-fm button small{display:block;font-size:12px;color:var(--fg-3,#6b7280);white-space:nowrap;font-variant-numeric:tabular-nums}
.fpf-fm button i{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:6px;vertical-align:1px}
.fpf-fm button.on{border-color:#006B9E;box-shadow:inset 0 0 0 2px #006B9E;background:#f2fafd}
.fpf-on #fpgX,.fpf-on label:has(#fpgF){display:none!important}
@media(max-width:700px){.fpf-res{padding:14px}.fpf-tot b{font-size:26px}.fpf-xls{margin-left:0;width:100%;justify-content:center}.fpf-fm{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;padding-bottom:2px}.fpf-fm::-webkit-scrollbar{display:none}.fpf-fm button{flex:none;min-width:0}}
</style>"""
k = s.rindex('</body>'); s = s[:k] + CSS + '\n' + s[k:]
open(p, 'w', encoding='utf-8').write(s)
print('ok fpf1', p)
