#!/usr/bin/env python3
"""ic1 (Diego 12-nov): D04 se califica con el % IDC del último reporte semanal de Super Coach (México).
El supervisor escribe el % y la app pone la nota sola: 2 = 90 % o más, 1 = 80 a 89,9 %, 0 = bajo 80 %.
El % queda en "Dato de apoyo". El supervisor puede cambiar la nota a mano.
Uso: python3 aplicar_ic1.py <tienda.html|Index.html>. Idempotente."""
import sys
p = sys.argv[1]; s = open(p, encoding='utf-8').read()
if '/* ic1 */' in s: print('ya aplicado', p); sys.exit(0)

MOD = r"""/* ic1 */ /* ---------- punto D04: % IDC del último reporte de Super Coach ---------- */
const IDC_REGLA = '2: 90 % o más · 1: 80 a 89,9 % · 0: bajo 80 %';
function idcCalif(n){ return n >= 90 ? '2' : n >= 80 ? '1' : '0'; }
function idcValor(it){ const m = String((it && it.dato) || '').match(/IDC Super Coach[^:]*: ([\d.,]+) %/); return m ? parseFloat(m[1].replace(',', '.')) : null; }
function idcD04Html(p){
  if (p.id !== 'D04') return '';
  const it = S.form.items[p.id] || {}, v = idcValor(it), hay = v != null && !isNaN(v);
  return '<div class="vbox' + (hay && v < 80 ? ' mal' : '') + '"><div class="ttl">Último reporte de Super Coach</div>' +
    '<div>Escribe el % IDC de la tienda del último reporte semanal que llega de México. La app pone la nota sola.</div>' +
    '<label class="f">% IDC de la tienda</label><input type="text" inputmode="decimal" data-idc placeholder="Ej. 92,5" value="' + (hay ? esc(String(v).replace('.', ',')) : '') + '">' +
    '<div class="tiny' + (hay ? '' : ' muted') + '" style="margin-top:6px">' + (hay ? 'Corresponde ' + idcCalif(v) + '. ' : '') + esc(IDC_REGLA) + '</div></div>';
}
function idcD04Wire(p, el){
  if (p.id !== 'D04') return;
  const inp = el.querySelector('[data-idc]'); if (!inp) return;
  inp.onkeydown = e => { if (e.key === 'Enter') inp.blur(); };
  inp.onchange = () => {
    const t = String(inp.value).trim(); if (!t) return;
    const n = parseFloat(t.replace('%', '').replace(',', '.'));
    if (isNaN(n) || n < 0 || n > 100) { toast('Escribe el porcentaje entre 0 y 100.'); return; }
    const x = S.form.items[p.id] = S.form.items[p.id] || {};
    x.dato = 'IDC Super Coach (último reporte de México): ' + String(n).replace('.', ',') + ' %'; x.verDato = true;
    guardarBorrador(); pintarPunto(p);
    const bt = $('#pt-' + p.id) && $('#pt-' + p.id).querySelector('[data-c="' + idcCalif(n) + '"]'); if (bt) bt.click();
  };
}
"""
a1 = "/* ---------- punto E04: transferencias de la tienda en el ERP (TransferenciasE04.gs) ---------- */"
a2 = "ventasHtml(p) + polVisitaHtml(p) + trfE04Html(p) +"
a3 = "  polVisitaWire(p, el);\n"
for a in (a1, a2, a3): assert s.count(a) == 1, 'ancla: ' + a
s = s.replace(a1, MOD + a1)
s = s.replace(a2, "ventasHtml(p) + polVisitaHtml(p) + idcD04Html(p) + trfE04Html(p) +")
s = s.replace(a3, a3 + "  idcD04Wire(p, el);\n")
open(p, 'w', encoding='utf-8').write(s); print('ok', p)
