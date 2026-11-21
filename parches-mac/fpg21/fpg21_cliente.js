/* fpg21 (Diego 20-nov noche): CRUCE CON EL POS. Cada hora la VM sube a CLAVES las transferencias (TE) y notas de crédito (NC) del POS.
   Aquí la tienda ve "Por registrar" (lo que el POS cobró y nadie registró, con datos ya llenos) y "Por revisar" (registros que no cuadran),
   un número rojo en Formas de pago y un aviso en Hoy. Registrar un pendiente es una sola pantalla. */
const fpgFac = s => { const p = (localStorage.getItem('fpgPto') || FPGS.prefijo || '').trim(); return /^\d{3}-\d{3}$/.test(p) ? p + '-' + ('00000000' + s).slice(-9) : 'N° ' + s; };
const fpgDel = f => { const d = fpgDia(f); return (d === 'hoy' || d === 'ayer' ? 'de ' : 'del ') + d; };
const fpgDia = f => { const h = FPGS.hoy || (S.data && S.data.hoy) || ''; if (f === h) return 'hoy'; const t = new Date(h + 'T12:00:00Z'); t.setUTCDate(t.getUTCDate() - 1); return f === t.toISOString().slice(0, 10) ? 'ayer' : String(f).split('-').reverse().slice(0, 2).join('/'); };
function fpgCuentaPos(){ const P = FPGS.pos; return P ? (P.pend || []).length + (P.rev || []).length : 0; }
function fpgMarca(){
  if (FPGS.lista === null && !FPGS.cargando && !FPGS.error && S.data) fpgCargar();
  const n = fpgCuentaPos(), b = document.getElementById('bPago');
  if (b) { b.textContent = n; b.hidden = !n; }
  if (S.vista !== 'inicio' || !n) return;
  const m = document.getElementById('main'); if (!m || m.querySelector('#fpgAviso')) return;
  const P = FPGS.pos, a = (P.pend || []).length, r = (P.rev || []).length;
  const d = document.createElement('div'); d.id = 'fpgAviso'; d.className = 'fpg-aviso'; d.setAttribute('role', 'button');
  d.innerHTML = '💳 ' + (a ? 'Tienes <b>' + a + (a === 1 ? ' pago' : ' pagos') + ' por registrar</b>' : '') + (a && r ? ' y ' : '') + (r ? '<b>' + r + ' por revisar</b>' : '') + ' en Formas de pago. <u>Ver</u>';
  d.onclick = () => irA('pago');
  const ref = m.querySelector('.ts-h'); if (ref) ref.insertAdjacentElement('beforebegin', d); else m.insertAdjacentElement('afterbegin', d);
}
function fpgPosHtml(){
  const P = FPGS.pos; if (!P) return '';
  const pend = P.pend || [], rev = P.rev || [];
  let h = '';
  if (pend.length) h += '<div class="fpg-bx fpg-reg"><div class="fpg-bh">Por registrar <span>' + pend.length + '</span></div>' + pend.map((p, i) =>
    '<div class="fpg-it"><div><b>Factura ' + esc(fpgFac(p.sec)) + '</b><small>' + (p.tipo === 'NC' ? 'Pagada con nota de crédito' : 'Transferencia' + (p.ref ? ' · comprobante ' + esc(p.ref) : '')) + ' · ' + fpgDia(p.fecha) +
    (p.total > p.valor + 0.009 ? ' · factura de ' + fpgUsd(p.total) : '') + '</small></div><b class="fpg-v">' + fpgUsd(p.valor) + '</b><button class="btn primary" data-fpgp="' + i + '">' + (p.tipo === 'NC' ? 'Registrar NC' : 'Registrar') + '</button></div>').join('') + '</div>';
  if (rev.length) h += '<div class="fpg-bx fpg-rev"><div class="fpg-bh">Por revisar <span>' + rev.length + '</span></div>' + rev.map((r, i) => { const x = r.x;
    const txt = r.tipo === 'valor' ? 'Registraste ' + fpgUsd(r.suma) + ', pero en el POS ' + (r.pos.tipo === 'NC' ? 'la nota de crédito' : 'la transferencia') + ' de esta factura es de <b>' + fpgUsd(r.pos.valor) + '</b>. Si te equivocaste, anúlalo y regístralo de nuevo.'
      : r.sug ? 'Pusiste la factura <s>' + esc(x.factura) + '</s>, pero en el POS ' + (r.sug.tipo === 'NC' ? 'la nota de crédito' : 'el pago') + ' de ' + fpgUsd(r.sug.valor) + ' ' + fpgDel(r.sug.fecha) + ' es la <b>' + esc(String(x.factura).slice(0, 8) + ('00000000' + r.sug.sec).slice(-9)) + '</b>.'
      : 'No encuentro la factura <b>' + esc(x.factura) + '</b> en el POS ' + fpgDel(x.fechaFac || x.fecha) + '. Revisa el número' + (x.fecha === (FPGS.hoy || '') ? ': si está mal, anúlalo y regístralo de nuevo.' : ' y avisa a Financiero.');
    return '<div class="fpg-it"><div><b>' + esc([x.id, fpgNom(x.forma), x.vendedorVer || x.registroVer].filter(Boolean).join(' · ')) + '</b><small>Registrado ' + fpgDia(x.fecha) + ' ' + esc(x.hora || '') + '</small></div><b class="fpg-v">' + fpgUsd(x.valor) + '</b>' +
      '<div class="fpg-dif">' + txt + '</div>' + (r.tipo === 'factura' && r.sug ? '<button class="btn fpg-cor" data-fpgc="' + i + '">Corregir a ' + r.sug.sec + '</button>' : '') + '</div>'; }).join('') + '</div>';
  return h;
}
function fpgPosEnlazar(){
  document.querySelectorAll('[data-fpgp]').forEach(b => b.onclick = () => fpgRapido(FPGS.pos.pend[+b.dataset.fpgp]));
  document.querySelectorAll('[data-fpgc]').forEach(b => b.onclick = () => fpgCorregir(FPGS.pos.rev[+b.dataset.fpgc]));
}
function fpgCorregir(r){
  const x = r.x, nueva = String(x.factura).slice(0, 8) + ('00000000' + r.sug.sec).slice(-9);
  openModal('<h3>Corregir la factura</h3><p class="small" style="margin:0 0 8px">' + esc(x.id) + ' · ' + esc(fpgNom(x.forma)) + ' ' + fpgUsd(x.valor) + '<br>De <s>' + esc(x.factura) + '</s> a <b>' + esc(nueva) + '</b>, que es la que tiene el POS por ese valor.</p>' +
    '<p class="tiny muted" style="margin:0">Queda en la bitácora con tu nombre y la hora.</p><label class="f">¿Quién corrige?</label>' + vfQuien('fpgCQuien') +
    '<div class="row" style="margin-top:14px"><button class="btn ghost grow" id="fpgCNo">Cancelar</button><button class="btn primary grow" id="fpgCSi">Corregir</button></div>');
  $('#fpgCNo').onclick = closeModal;
  $('#fpgCSi').onclick = async () => {
    const per = $('#fpgCQuien').value.trim(); if (!per) return toast('Elige tu nombre.');
    const b = $('#fpgCSi'); b.disabled = true; b.textContent = 'Corrigiendo…';
    try { await api('apiFPGCorregirTienda', x.id, per, r.sug.sec); if (window.REG) REG.ev('Forma de pago', 'Corrección ' + x.id); closeModal(); toast('Listo, corregido a ' + nueva + '.'); FPGS.lista = null; fpgCargar(); }
    catch (e) { b.disabled = false; b.textContent = 'Corregir'; toast((e && e.message) || 'No se pudo corregir.', 4000); }
  };
}
/* Registro rápido de un pendiente del POS: todo en una pantalla. Factura, fecha, valor y total vienen del POS. */
function fpgRapido(p){
  if (!p) return;
  const NC = p.tipo === 'NC', CUENTAS = ['Pichincha cte. 2100349639', 'Produbanco cte. 02006219957', 'Bolivariano cte. 5005110152'];
  const FORMAS = NC ? ['Nota de crédito'] : ['Deuna', 'Tipti', 'Transferencias', 'Otra'].filter(f => (FPGS.formas || []).indexOf(f) >= 0);
  const NOMB = {'Transferencias': 'Banco', 'Nota de crédito': 'Nota de crédito'};
  const D = {pto: (localStorage.getItem('fpgPto') || FPGS.prefijo || '').trim(), forma: NC ? 'Nota de crédito' : (p.banco === '17' && FORMAS.indexOf('Deuna') >= 0 ? 'Deuna' : ''), pedido: NC ? '' : (p.ref || ''), banco: '', otra: '', vend: '', quien: '', file: null, url: ''};
  const total = p.total > 0 ? p.total : p.valor;
  const fac = () => /^\d{3}-\d{3}$/.test(D.pto) ? D.pto + '-' + ('00000000' + p.sec).slice(-9) : '';
  const sel = (id, ph) => vfQuien(id).replace('Elige tu nombre', ph);
  function pintar(){
    const f = D.forma;
    let h = '<h3 style="margin:0 0 2px">' + (NC ? 'Registrar nota de crédito' : 'Registrar transferencia') + '</h3><p class="small muted" style="margin:0 0 10px">Del POS: factura ' + (fac() ? '<b>' + esc(fac()) + '</b>' : 'N° ' + p.sec) + ' · ' + fpgDia(p.fecha) + ' · ' + (NC ? 'NC' : 'transferencia') + ' de <b>' + fpgUsd(p.valor) + '</b>' + (total > p.valor + 0.009 ? ' (factura de ' + fpgUsd(total) + ')' : '') + '</p>';
    if (!fac()) h += '<label class="f">Punto de emisión de tu tienda (como sale en la factura)</label><input class="fr-in" id="frPto" inputmode="numeric" placeholder="005-001" maxlength="7" value="' + esc(D.pto) + '">';
    if (!NC) h += '<label class="f">¿Con qué pagó?</label><div class="fr-ch">' + FORMAS.map(x => '<button type="button" data-frf="' + esc(x) + '" class="' + (x === f ? 'on' : '') + '">' + esc(NOMB[x] || x) + '</button>').join('') + '</div>';
    if (f === 'Transferencias') h += '<label class="f">Cuenta de la empresa que recibió</label><div class="fr-ch">' + CUENTAS.map(c => '<button type="button" data-frb="' + esc(c) + '" class="' + (c === D.banco ? 'on' : '') + '">' + esc(c) + '</button>').join('') + '</div>';
    if (f === 'Otra') h += '<label class="f">¿Qué forma de pago es?</label><input class="fr-in" id="frOtra" maxlength="100" placeholder="Ej.: Shopping Dólares Condado" value="' + esc(D.otra) + '">';
    if (f === 'Nota de crédito') h += '<label class="f">N° de la nota de crédito</label><input class="fr-in" id="frRef" maxlength="17" placeholder="' + esc((D.pto || '005-001') + '-001400123') + '" value="' + esc(D.pedido) + '">' +
      '<label class="f">N° de la factura devuelta</label><input class="fr-in" id="frBan" maxlength="17" placeholder="' + esc((D.pto || '005-001') + '-000004700') + '" value="' + esc(D.banco) + '">' +
      '<label class="f">Motivo (opcional)</label><input class="fr-in" id="frOtra" maxlength="100" placeholder="Ej.: cambio por otro producto" value="' + esc(D.otra) + '">';
    else if (f) h += '<label class="f">' + ({Deuna: 'Comprobante Deuna', Tipti: 'N° de pedido Tipti', Transferencias: 'Comprobante de la transferencia', Otra: 'N° de comprobante o de los vales'})[f] + (p.ref && D.pedido === p.ref ? ' <span class="fr-pos">· del POS</span>' : '') + '</label><input class="fr-in" id="frRef" inputmode="' + (f === 'Otra' ? 'text' : 'numeric') + '" maxlength="30" value="' + esc(D.pedido) + '">';
    if (f) h += '<label class="f">Foto del comprobante ' + (f === 'Transferencias' ? '(obligatoria)' : '(opcional)') + '</label><label class="btn ghost fr-foto">📷 ' + (D.file ? 'Foto lista ✓ (cambiar)' : 'Tomar o elegir foto') + '<input type="file" id="frFoto" accept="image/*" hidden></label>';
    h += '<div class="fr-dos"><div><label class="f">¿Quién vendió?</label>' + sel('frVend', 'Elige quién vendió') + '</div><div><label class="f">¿Quién registra?</label>' + sel('frQuien', 'Elige tu nombre') + '</div></div>' +
      '<div class="fr-err" id="frErr" hidden></div><div class="row" style="margin-top:14px"><button class="btn ghost grow" id="frNo">Cancelar</button><button class="btn primary grow" id="frSi">Guardar</button></div>';
    openModal(h);
    const on = (id, k, fx) => { const e = $(id); if (e) e.oninput = () => { D[k] = fx ? fx(e.value) : e.value; }; };
    on('#frPto', 'pto', v => v.replace(/[^\d-]/g, '')); on('#frRef', 'pedido'); on('#frBan', 'banco'); on('#frOtra', 'otra');
    const pt = $('#frPto'); if (pt) pt.onchange = () => { if (fac()) pintar(); };
    ['frVend', 'frQuien'].forEach(id => { const e = $('#' + id), k = id === 'frVend' ? 'vend' : 'quien'; if (!e) return; if (D[k]) e.value = D[k];
      e.onchange = e.oninput = () => { D[k] = e.value.trim(); if (k === 'vend' && !D.quien) { D.quien = D.vend; const q = $('#frQuien'); if (q) q.value = D.quien; } }; });
    document.querySelectorAll('[data-frf]').forEach(b => b.onclick = () => { if (D.forma !== b.dataset.frf) { D.forma = b.dataset.frf; D.banco = ''; D.otra = ''; D.pedido = D.forma === 'Tipti' ? '' : (p.ref || ''); } pintar(); });
    document.querySelectorAll('[data-frb]').forEach(b => b.onclick = () => { D.banco = b.dataset.frb; pintar(); });
    const fo = $('#frFoto'); if (fo) fo.onchange = () => { D.file = fo.files && fo.files[0] || null; pintar(); };
    $('#frNo').onclick = closeModal;
    $('#frSi').onclick = guardar;
  }
  const error = t => { const e = $('#frErr'); if (e) { e.textContent = '⚠️ ' + t; e.hidden = false; } };
  async function guardar(){
    const f = D.forma;
    if (!fac()) return error('Escribe el punto de emisión de tu tienda, como 005-001.');
    if (!f) return error('Elige con qué pagó.');
    if (f === 'Transferencias' && !D.banco) return error('Elige la cuenta que recibió la transferencia.');
    if (f === 'Transferencias' && !D.file) return error('Toma la foto del comprobante.');
    if (f === 'Otra' && D.otra.trim().length < 3) return error('Escribe qué forma de pago es.');
    if (!String(D.pedido).trim()) return error(f === 'Nota de crédito' ? 'Escribe el N° de la nota de crédito.' : 'Escribe el comprobante.');
    if (!D.vend) return error('Elige quién vendió.');
    if (!D.quien) return error('Elige quién registra.');
    const b = $('#frSi'); b.disabled = true;
    try {
      let foto = '';
      if (D.file) { b.textContent = 'Subiendo foto…'; const r = await api('apiSubirFoto', await reducirFoto(D.file, 'Pago ' + p.sec), 'pago_' + fac().replace(/\D/g, '')); foto = (r && r.url) || r; }
      b.textContent = 'Guardando…';
      const r = await api('apiFPGRegistrar', {factura: fac(), fechaFac: p.fecha, valorFac: total, forma: f, otra: D.otra.trim(), banco: D.banco.trim(), pedido: String(D.pedido).trim(), valor: p.valor, foto: foto,
        registro: D.quien, vendedor: D.vend, desde: 'Tienda', confirmo: true});
      localStorage.setItem('fpgPto', D.pto);
      if (window.REG) REG.ev('Forma de pago', r.id + ' · ' + r.factura + ' · desde POS');
      closeModal(); toast('✅ Registrado ' + r.id + ' · ' + fpgNom(r.forma) + ' ' + fpgUsd(r.valor));
      FPGS.lista = [r].concat(FPGS.lista || []); if (FPGS.pos) FPGS.pos.pend = (FPGS.pos.pend || []).filter(y => y !== p);
      fpgMarca(); if (S.vista === 'pago') renderPago();
    } catch (e) { b.disabled = false; b.textContent = 'Guardar'; error((e && e.message) || 'No se pudo guardar. Revisa tu internet.'); }
  }
  pintar();
}
