#!/usr/bin/env python3
"""fpg10 (Diego 17-nov "qué feo se ve esto"): vista de Formas de pago más limpia en panel y admin.
- Filtros en una sola fila pareja (mismo alto), Exportar a la derecha.
- En vez de tres tarjetas repetidas, una línea de resumen: total · registros · por entregar; desglose por forma solo si hay más de una.
- Bitácora íntegra como etiqueta pequeña al lado del resumen.
Uso: python3 aplicar_fpg10.py Panel.html|panel.html|admin.html   (idempotente; también devuelve los pares para el admin)"""
import sys
CSS = ("<style>/* fpg10 */.fpg-f{display:flex;flex-wrap:wrap;gap:8px 10px;align-items:flex-end;margin-bottom:14px}"
       ".fpg-f label{flex:1 1 100px;max-width:150px}.fpg-f label.grow{flex:2 1 170px;max-width:none}"
       ".fpg-f select,.fpg-f input{height:36px;box-sizing:border-box;width:100%}.fpg-f #fpgX{height:36px;margin-left:auto;white-space:nowrap}"
       ".fpg-sum{display:flex;flex-wrap:wrap;align-items:center;gap:6px 14px;margin:0 0 10px;padding:10px 12px;border-radius:12px;background:var(--surface-2,#f4f6f8);font-size:14px}"
       ".fpg-sum b{font-size:18px;font-variant-numeric:tabular-nums}.fpg-sum .fpg-ch{display:inline-block;padding:2px 9px;border-radius:999px;background:var(--surface,#fff);border:1px solid var(--line);font-size:12.5px}"
       ".fpg-sum .fpg-ok8{margin-left:auto;font-size:12.5px;opacity:.75}.fpg-sum .fpg-ok8 button{border:0;background:none;color:var(--brand,#0077c0);cursor:pointer;font:inherit;padding:0;margin-left:4px;text-decoration:underline}</style>")
R = [
 ("""    if (I.ok) return '<p class="small faint" style="margin:0 0 10px">🔒 Bitácora íntegra: ' + I.lineas + ' movimientos registrados, ninguno alterado. <button class="btn" id="fpgB" style="margin-left:6px">Ver bitácora</button></p>';""",
  """    if (I.ok) return '';   // fpg10: la etiqueta "Bitácora íntegra" va en la línea de resumen"""),
 ("""    h += '<div class="fpg-k"><div><b>' + usd(tot) + '</b><span>' + cuenta.length + (cuenta.length === 1 ? ' registro' : ' registros') + (f.est === 'Anulada' ? ' anulados' : '') + '</span></div>' +
      (pend.length && f.est !== 'Anulada' ? '<div><b class="fpg-pend">' + usd(pend.reduce((a, x) => a + (x.valor || 0), 0)) + '</b><span>Por entregar · ' + pend.length + '</span></div>' : '') +
      Object.keys(por).sort((a, b) => por[b].v - por[a].v).map(k => '<div><b>' + usd(por[k].v) + '</b><span>' + e(k) + ' · ' + por[k].n + '</span></div>').join('') + '</div>';""",
  """    const pv10 = pend.reduce((a, x) => a + (x.valor || 0), 0), I10 = F.d && F.d.integridad, ks10 = Object.keys(por).sort((a, b) => por[b].v - por[a].v);   // fpg10: una sola línea
    h += '<div class="fpg-sum"><span><b>' + usd(tot) + '</b> · ' + cuenta.length + (cuenta.length === 1 ? ' registro' : ' registros') + (f.est === 'Anulada' ? ' anulados' : '') + '</span>' +
      (pend.length && f.est !== 'Anulada' ? '<span class="fpg-pend">' + (pend.length === cuenta.length ? 'Todo por entregar' : 'Por entregar ' + usd(pv10) + ' (' + pend.length + ')') + '</span>' : '') +
      (ks10.length > 1 ? ks10.map(k => '<span class="fpg-ch">' + e(k === 'Transferencias' ? 'Transferencia' : k) + ' ' + usd(por[k].v) + '</span>').join('') : '') +
      (I10 && I10.ok ? '<span class="fpg-ok8">🔒 Bitácora íntegra (' + I10.lineas + ')<button id="fpgB">ver</button></span>' : '') + '</div>';"""),
]
def aplicar(s):
    for a, n in R:
        if n in s: continue
        assert s.count(a) == 1, a[:70]; s = s.replace(a, n)
    if '/* fpg10 */' not in s:
        i = s.index('</style>', s.index('<style>/* fpg1 */')) + len('</style>'); s = s[:i] + '\n' + CSS + s[i:]
    return s
if __name__ == '__main__':
    for p in sys.argv[1:]:
        s = open(p, encoding='utf-8').read(); open(p, 'w', encoding='utf-8').write(aplicar(s)); print('ok', p)
