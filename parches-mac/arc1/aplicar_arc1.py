#!/usr/bin/env python3
"""arc1 (26-nov-2026, error INV-015): el botón Archivar de los informes de inventario ya no deja archivar
el informe vigente de un inventario cerrado o único, y los archivados se pueden ver y restaurar.
1) Bloquea si es el único informe vigente de su semana+tienda+tipo, o si ya tiene cobros o documentos
   (acta, factura o RRHH) en 'Documentos de cobro'.
2) La confirmación muestra semana, tienda, fecha y monto.
3) Lista "Archivados (n)" plegable, con botón Restaurar (devuelve el estado que tenía).
Al archivar, el estado anterior queda en Observaciones como "[arc1 estaba: X]".
Uso: python3 aplicar_arc1.py archivo.html"""
import sys
p = sys.argv[1]
s = open(p, encoding='utf-8').read()
if 'arc1' in s:
    print('ya estaba arc1'); sys.exit(0)

# 2 y 3: lista de archivados al final de la lista de informes
a = "      <span class=\"pol-acc\">${(e0 => `<span class=\"pill ${e0 === 'Por firmar' ? 'p-warn' : 'p-good'}\">${esc(e0)}</span>`)(!(num(r[11]) > 0) && (!r[13] || r[13] === 'Por firmar') ? 'Sin descuento' : r[13] || 'Por firmar')}${icEstado(r[0])}<button class=\"btn\" data-infpdf=\"${esc(r[0])}\">PDF</button><button class=\"btn\" data-infmail=\"${esc(r[0])}\">Correo</button><button class=\"btn\" data-infarc=\"${esc(r[0])}\" title=\"Lo quita de la lista; queda guardado en la hoja\">Archivar</button>${r[13] === 'Firmado' || !(num(r[11]) > 0) ? '' : `<button class=\"btn\" data-inffir=\"${esc(r[0])}\">Firmado</button>`}</span></div>`).join('') : '');"
assert s.count(a) == 1, 'no encontré la lista de informes'
s = s.replace(a, a[:-2] + ") + arcHtml(ui);   /* arc1 */")

b = """  el.querySelectorAll('[data-infarc]').forEach(b => b.onclick = async () => {
    if (!okToque(b, '¿Archivar? Toca otra vez')) return;   // ct1
    b.disabled = true;
    try { const v = await getRange(INF_TAB + '!A1:A', true, CLAVES), i = v.findIndex(x => x[0] === b.dataset.infarc);
      if (i < 1) throw {message: 'no encontré el informe'};
      await setRange(INF_TAB + '!N' + (i + 1), [['Archivado']], CLAVES);
      const r = st.mue.inf.find(x => x[0] === b.dataset.infarc); if (r) r[13] = 'Archivado';
      toast('Informe archivado'); infLista(); }
    catch (e) { b.disabled = false; toast('No se pudo archivar: ' + (e.message || errorCopy(e)), 5000); }
  });"""
assert s.count(b) == 1, 'no encontré el botón Archivar'
nb = """  el.querySelectorAll('[data-infarc]').forEach(b => b.onclick = async () => {   /* arc1: candado para no archivar el informe vigente */
    const id = b.dataset.infarc, r0 = st.mue.inf.find(x => x[0] === id);
    if (!r0) return toast('No encontré el informe.');
    if (!b.dataset.arcOk) {
      b.disabled = true;
      let freno = '';
      try { freno = await arcFreno(r0); } catch (e) { freno = 'No pude revisar sus documentos (' + (e.message || errorCopy(e)) + '). Intenta de nuevo.'; }
      b.disabled = false;
      if (freno) return arcAviso(b, freno);
      b.dataset.arcOk = '1';
      return arcAviso(b, '¿Archivar el informe ' + id + '? ' + r0[3] + ' · ' + r0[4] + ' · ' + fmtF(r0[1], r0[2]) + ' · a descontar ' + ivMon(num(r0[11]) || 0) + '. Toca Archivar otra vez para confirmar.', true);
    }
    b.disabled = true;
    try { const v = await getRange(INF_TAB + '!A1:A', true, CLAVES), i = v.findIndex(x => x[0] === id);
      if (i < 1) throw {message: 'no encontré el informe'};
      const obs = String(r0[14] || '').replace(/\\s*\\[arc1 estaba: [^\\]]*\\]/g, ''), obs2 = (obs ? obs + ' ' : '') + '[arc1 estaba: ' + (r0[13] || '') + ']';
      await setRange(INF_TAB + '!N' + (i + 1) + ':O' + (i + 1), [['Archivado', obs2]], CLAVES);
      r0[13] = 'Archivado'; r0[14] = obs2;
      toast('Informe archivado. Puedes restaurarlo en "Archivados".'); infLista(); }
    catch (e) { b.disabled = false; delete b.dataset.arcOk; toast('No se pudo archivar: ' + (e.message || errorCopy(e)), 5000); }
  });
  el.querySelectorAll('[data-infres]').forEach(b => b.onclick = async () => {   /* arc1: restaurar */
    const id = b.dataset.infres, r0 = st.mue.inf.find(x => x[0] === id); if (!r0) return;
    b.disabled = true;
    try { const v = await getRange(INF_TAB + '!A1:A', true, CLAVES), i = v.findIndex(x => x[0] === id);
      if (i < 1) throw {message: 'no encontré el informe'};
      const m = /\\[arc1 estaba: ([^\\]]*)\\]/.exec(String(r0[14] || '')), antes = m ? m[1] : '', obs = String(r0[14] || '').replace(/\\s*\\[arc1 estaba: [^\\]]*\\]/g, '');
      await setRange(INF_TAB + '!N' + (i + 1) + ':O' + (i + 1), [[antes, obs]], CLAVES);
      r0[13] = antes; r0[14] = obs;
      toast('Informe restaurado'); infLista(); }
    catch (e) { b.disabled = false; toast('No se pudo restaurar: ' + (e.message || errorCopy(e)), 5000); }
  });"""
s = s.replace(b, nb)

c = "/* ic1: enviar el informe a la tienda por correo"
assert s.count(c) == 1, 'no encontré el ancla ic1'
fn = r"""/* arc1 (26-nov, INV-015): candado y lista de archivados de los informes de inventario */
const arcTipo = r => /c[ií]clico/i.test(String(r[5] || '')) ? 'Cíclico' : 'Top 50';
async function arcFreno(r){
  const otros = infFilas().filter(x => x[0] !== r[0] && x[3] === r[3] && x[4] === r[4] && arcTipo(x) === arcTipo(r));
  if (!otros.length) return 'Este es el informe vigente del inventario ' + r[3] + ' de ' + r[4] + ' (' + arcTipo(r) + '); primero guarda el informe que lo reemplaza.';
  const D = await getRange(CBD_TAB + '!A1:K', true, CLAVES), d = D.find((x, k) => k && x && x[0] === r[0]) || [];
  const docs = [d[2] && d[2] !== 'Pendiente' && 'acta', d[4] && d[4] !== 'Pendiente' && 'factura', d[8] && d[8] !== 'Pendiente' && 'RRHH'].filter(Boolean);
  if (!docs.length && typeof cbFilas === 'function' && cbFilas().some(c => c.org === r[0])) docs.push('cobros');
  if (docs.length) return 'Este informe ya tiene ' + docs.join(', ') + '. No se puede archivar; si hay que corregirlo, guarda un informe nuevo y avísame.';
  return '';
}
function arcAviso(b, txt, conf){
  const it = b.closest('.sv-it'); let m = it && it.nextElementSibling;
  if (!m || !m.classList.contains('arc-msg')) { m = document.createElement('div'); m.className = 'arc-msg small'; if (it) it.after(m); }
  m.style.cssText = 'margin:-4px 0 8px;padding:8px 10px;border-radius:8px;' + (conf ? 'background:#fff7e0;color:#6b4a00' : 'background:#fdecec;color:#8a1f1f');
  m.textContent = txt;
  if (conf) setTimeout(() => { if (b.dataset.arcOk) { delete b.dataset.arcOk; m.remove(); } }, 8000);
}
function arcHtml(ui){
  const A = ((st.mue && st.mue.inf) || []).slice(1).filter(r => r[0] && r[13] === 'Archivado' && r[4] === ui.tienda && (ui.tipo === 'cic') === /c[ií]clico/i.test(r[5] || '')).reverse();
  if (!A.length) return '';
  return `<details class="arc-lista" style="margin-top:10px"><summary class="lbl" style="cursor:pointer">Archivados (${A.length})</summary>` +
    A.map(r => `<div class="sv-it"><div><b>${esc(r[0])}</b> · ${esc(fmtF(r[1], r[2]))}<div class="small faint">${esc(r[5])} ${esc(r[3])} · a descontar ${esc(ivMon(num(r[11]) || 0))}</div></div><span class="pol-acc"><button class="btn" data-infres="${esc(r[0])}">Restaurar</button></span></div>`).join('') + '</details>';
}
"""
s = s.replace(c, fn + c)
open(p, 'w', encoding='utf-8').write(s)
print('ok arc1', p)
