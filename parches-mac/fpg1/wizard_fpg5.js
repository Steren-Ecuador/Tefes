/* fpg5 (Diego 16-nov): asistente de 4 pasos para registrar la forma de pago de una factura del POS.
   1 Factura · 2 Forma de pago · 3 Datos del pago · 4 Revisar y confirmar. No se puede saltar pasos: "Siguiente" se activa solo con todo bien.
   El servidor vuelve a validar todo (fpgValidar_). Uso: fpgWizard({api, subirFoto, formas, prefijo, hoy, lista, quienHtml, quienFijo, desde, alGuardar}) */
function fpgWizard(o){
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const usd = n => '$' + Number(n || 0).toFixed(2).replace('.', ',');
  const num = x => { let s = String(x == null ? '' : x).replace(/[$\s]/g, ''); if (s.indexOf(',') >= 0) s = s.replace(/\./g, '').replace(',', '.'); const n = Number(s); return isNaN(n) ? 0 : Math.round(n * 100) / 100; };
  const dias = (iso, k) => { const t = new Date(iso + 'T12:00:00Z'); t.setUTCDate(t.getUTCDate() + k); return t.toISOString().slice(0, 10); };
  const fCorta = iso => iso ? iso.split('-').reverse().join('/') : '';
  const hoy = o.hoy || new Date().toISOString().slice(0, 10);
  const BANCOS = ['Pichincha', 'Pacífico', 'Guayaquil', 'Produbanco', 'Bolivariano', 'Internacional', 'Austro', 'Otro banco'];
  const ICO = {'deUna': '📱', 'Transferencias': '🏦', 'Tipti': '🛒', 'Shopping Dólares - Condado': '🎟️', 'MobiSol - Mall del Sol': '🎟️', 'Otra': '✏️'};
  const AYUDA = {'deUna': 'Pago con QR deUna. Pide al cliente el comprobante y copia la referencia.', 'Transferencias': 'Transferencia bancaria. Verifica que el dinero llegó antes de facturar.',
    'Tipti': 'Pedido de Tipti. El número de pedido tiene 7 dígitos.', 'Shopping Dólares - Condado': 'Vales de $1 del Condado. Cada vale es $1.', 'MobiSol - Mall del Sol': 'Vales MobiSol del Mall del Sol.', 'Otra': 'Solo si no es ninguna de las anteriores.'};
  const VALES = {'Shopping Dólares - Condado': 1, 'MobiSol - Mall del Sol': 1}, FOTO = {'Shopping Dólares - Condado': 1, 'MobiSol - Mall del Sol': 1, 'Transferencias': 1};
  if (!document.getElementById('fwCss')) {
    const st = document.createElement('style'); st.id = 'fwCss';
    st.textContent = '.fw-bg{position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:9998;display:flex;align-items:flex-end;justify-content:center}' +
      '.fw{background:#fff;color:#0f172a;width:100%;max-width:520px;max-height:94vh;overflow:auto;border-radius:18px 18px 0 0;padding:16px 16px 22px;box-shadow:0 -8px 30px rgba(0,0,0,.25);font-size:16px}' +
      '@media(min-width:700px){.fw-bg{align-items:center}.fw{border-radius:18px}}' +
      '.fw-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}.fw-top b{font-size:17px}.fw-x{background:none;border:0;font-size:24px;line-height:1;color:#64748b;cursor:pointer}' +
      '.fw-pasos{display:flex;gap:6px;margin:0 0 14px}.fw-pasos div{flex:1;text-align:center;font-size:11px;color:#94a3b8}.fw-pasos i{display:block;height:5px;border-radius:3px;background:#e2e8f0;margin-bottom:4px}' +
      '.fw-pasos .ok i{background:#16a34a}.fw-pasos .on i{background:#0077c0}.fw-pasos .on{color:#0077c0;font-weight:700}.fw-pasos .ok{color:#16a34a}' +
      '.fw h3{margin:0 0 4px;font-size:19px}.fw p.fw-s{margin:0 0 12px;color:#64748b;font-size:14px}' +
      '.fw label{display:block;font-size:13px;font-weight:600;color:#334155;margin:12px 0 5px}.fw input,.fw textarea,.fw select{width:100%;box-sizing:border-box;font-size:17px;padding:12px;border:1.5px solid #cbd5e1;border-radius:10px;background:#fff;color:#0f172a}' +
      '.fw input:focus,.fw textarea:focus{outline:none;border-color:#0077c0}.fw .fw-bad{border-color:#dc2626}.fw-h{font-size:12.5px;color:#64748b;margin-top:4px}.fw-h.err{color:#dc2626}.fw-h.okk{color:#16a34a;font-weight:600}' +
      '.fw-fac{display:grid;grid-template-columns:110px 1fr;gap:8px}.fw-dos{display:grid;grid-template-columns:1fr 1fr;gap:8px}' +
      '.fw-op{display:flex;align-items:center;gap:12px;width:100%;text-align:left;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:12px;padding:14px;margin-bottom:8px;font-size:16px;cursor:pointer;color:#0f172a}' +
      '.fw-op span{font-size:24px}.fw-op small{display:block;color:#64748b;font-size:12.5px;margin-top:2px}.fw-op.sel{border-color:#0077c0;background:#eff6ff}' +
      '.fw-ban{display:flex;flex-wrap:wrap;gap:6px}.fw-ban button{border:1.5px solid #cbd5e1;background:#fff;border-radius:20px;padding:8px 12px;font-size:14px;cursor:pointer;color:#0f172a}.fw-ban button.sel{border-color:#0077c0;background:#0077c0;color:#fff}' +
      '.fw-nav{display:flex;gap:8px;margin-top:18px}.fw-nav button{flex:1;padding:14px;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;border:0}' +
      '.fw-atras{background:#f1f5f9;color:#334155}.fw-sig{background:#0077c0;color:#fff}.fw-sig:disabled,.fw-sig.fw-off{background:#cbd5e1;color:#fff}' +
      '.fw-res{border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin:6px 0 4px}.fw-res div{display:flex;justify-content:space-between;gap:10px;padding:9px 12px;border-top:1px solid #f1f5f9;font-size:14.5px}' +
      '.fw-res div:first-child{border-top:0}.fw-res span{color:#64748b}.fw-res b{text-align:right;word-break:break-word;max-width:62%}.fw-ya{background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:10px;font-size:13.5px;margin-top:10px}' +
      '.fw-err{background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;border-radius:10px;padding:10px;font-size:14px;margin-top:12px}.fw-chk{display:flex;gap:10px;align-items:flex-start;margin-top:14px;font-size:14.5px;font-weight:400!important}' +
      '.fw-chk input{width:22px;height:22px;flex:none;margin:0}.fw-fin{text-align:center;padding:10px 0}.fw-fin .big{font-size:46px}.fw-foto{display:flex;align-items:center;gap:10px}.fw-foto img{width:64px;height:64px;object-fit:cover;border-radius:8px}.fw label.fw-fbtn{display:inline-block;margin:0;padding:12px 16px;border:1.5px dashed #0077c0;border-radius:10px;color:#0077c0;font-size:15px;cursor:pointer}';
    document.head.appendChild(st);
  }
  const bg = document.createElement('div'); bg.className = 'fw-bg'; bg.innerHTML = '<div class="fw" role="dialog" aria-modal="true"></div>'; document.body.appendChild(bg);
  const box = bg.firstChild, $w = s => box.querySelector(s);
  const D = {pto: localStorage.getItem('fpgPto') || o.prefijo || '', sec: '', fechaFac: hoy, valorFac: '', forma: '', otra: '', banco: '', pedido: '', valor: '', foto: '', fotoFile: null, fotoUrl: '', quien: o.quienFijo || '', confirmo: false};
  let paso = 1, guardando = false, err = '', fijo = null;
  const cerrar = () => { if (D.fotoUrl) URL.revokeObjectURL(D.fotoUrl); bg.remove(); };
  const facNorm = () => { const a = D.pto.replace(/[^\d-]/g, '').split('-').filter(Boolean), s = D.sec.replace(/\D/g, '');
    if (a.length !== 2 || a[0].length > 3 || a[1].length > 3 || !s || s.length > 9 || !Number(s) || !Number(a[0])) return '';
    return ('00' + a[0]).slice(-3) + '-' + ('00' + a[1]).slice(-3) + '-' + ('00000000' + s).slice(-9); };
  const previos = () => { const f = facNorm(); return f ? (o.lista || []).filter(x => x.estado !== 'Anulada' && String(x.factura).replace(/\D/g, '') === f.replace(/\D/g, '')) : []; };
  const vales = () => { const c = (D.pedido.match(/\d{4,}/g) || []).map(x => String(Number(x))); return {c: c, rep: c.filter((x, i) => c.indexOf(x) !== i)}; };
  const valorPago = () => D.forma === 'Shopping Dólares - Condado' ? vales().c.length : num(D.valor);
  const ya = () => previos().reduce((a, x) => a + (Number(x.valor) || 0), 0);
  function errPaso(p){
    if (p === 1) {
      if (!/^\d{1,3}-\d{1,3}$/.test(D.pto.trim())) return 'Escribe el punto de emisión, como 005-001.';
      if (!facNorm()) return 'Escribe el número de la factura.';
      if (!D.fechaFac || D.fechaFac > hoy) return 'La fecha de la factura no puede ser futura.';
      if (D.fechaFac < dias(hoy, -45)) return 'La factura tiene más de 45 días: pide a Financiero que la registre.';
      if (!(num(D.valorFac) > 0)) return 'Pon el total de la factura con IVA.';
      const pv = previos()[0];
      if (pv && pv.valorFac && Math.abs(pv.valorFac - num(D.valorFac)) > 0.004) return 'Esta factura ya está registrada con total ' + usd(pv.valorFac) + '.';
      if (pv && ya() >= num(D.valorFac) - 0.004) return 'Esta factura ya tiene registrado todo su valor (' + usd(ya()) + ').';
      return '';
    }
    if (p === 2) return D.forma ? '' : 'Elige la forma de pago.';
    if (p === 3) {
      const f = D.forma;
      if (f === 'Otra' && D.otra.trim().length < 3) return 'Escribe cuál es la otra forma de pago.';
      if (f === 'Transferencias' && !D.banco) return 'Elige el banco.';
      if (f === 'Tipti' && D.pedido.replace(/\D/g, '').length !== 7) return 'El pedido Tipti tiene 7 dígitos.';
      if (f === 'deUna' && D.pedido.replace(/\s/g, '').length < 4) return 'Escribe la referencia de deUna.';
      if (VALES[f]) { const v = vales(); if (!v.c.length) return 'Escribe los números de los vales.'; if (v.rep.length) return 'El vale ' + v.rep[0] + ' está repetido.'; }
      if ((f === 'Transferencias' || f === 'Otra') && D.pedido.trim().length < 3) return f === 'Otra' ? 'Escribe el número de comprobante.' : 'Escribe el número de documento.';
      const v = valorPago();
      if (!(v > 0)) return 'Pon el valor pagado con ' + f + '.';
      if (v > num(D.valorFac) + (VALES[f] ? 0.99 : 0) + 0.004) return 'Es más que el total de la factura (' + usd(num(D.valorFac)) + ').';
      if (ya() + v > num(D.valorFac) + (VALES[f] || previos().some(x => VALES[x.forma]) ? 0.994 : 0.004)) return 'Con lo ya registrado (' + usd(ya()) + ') pasaría el total de la factura.';
      if (FOTO[f] && !D.fotoFile && !D.foto) return 'Toma la foto del ' + (f === 'Transferencias' ? 'comprobante.' : 'vale y la factura.');
      return '';
    }
    if (p === 4) { if (!D.quien) return 'Elige quién registra.'; if (!D.confirmo) return 'Marca que revisaste los datos.'; return ''; }
    return '';
  }
  const ROT = ['Factura', 'Forma de pago', 'Datos del pago', 'Confirmar'];
  function barra(){ return '<div class="fw-pasos">' + ROT.map((t, i) => '<div class="' + (i + 1 < paso ? 'ok' : i + 1 === paso ? 'on' : '') + '"><i></i>' + (i + 1) + '. ' + t + '</div>').join('') + '</div>'; }
  function nav(sig){ return '<div class="fw-nav">' + (paso > 1 ? '<button class="fw-atras" data-fw="atras">← Atrás</button>' : '<button class="fw-atras" data-fw="x">Cancelar</button>') +
    '<button class="fw-sig' + (errPaso(paso) ? ' fw-off' : '') + '" data-fw="sig" ' + (guardando ? 'disabled' : '') + '>' + (guardando ? 'Guardando…' : sig) + '</button></div><div class="fw-h err" id="fwMsg" style="text-align:center;margin-top:8px">' + esc(err || '') + '</div>'; }
  const etiquetaRef = f => ({'deUna': 'Referencia del pago deUna', 'Transferencias': 'N° de documento de la transferencia', 'Tipti': 'N° de pedido Tipti (7 dígitos)', 'Shopping Dólares - Condado': 'Números de los vales (escanea o escribe, uno por línea)', 'MobiSol - Mall del Sol': 'Números de los vales MobiSol', 'Otra': 'N° de comprobante'})[f] || 'Comprobante';
  function pintar(enfocar){
    let h = '<div class="fw-top"><b>Registrar forma de pago</b><button class="fw-x" data-fw="x" aria-label="Cerrar">×</button></div>' + barra();
    if (paso === 1) {
      const pv = previos();
      h += '<h3>¿Qué factura es?</h3><p class="fw-s">Cópiala del POS tal como sale impresa.</p>' +
        '<label>N° de factura</label><div class="fw-fac"><input id="fwPto" inputmode="numeric" placeholder="005-001" value="' + esc(D.pto) + '" maxlength="7"><input id="fwSec" inputmode="numeric" placeholder="Número (ej. 4800)" value="' + esc(D.sec) + '" maxlength="9" autocomplete="off"></div>' +
        '<div class="fw-h" id="fwFacV">' + (facNorm() ? 'Factura <b>' + facNorm() + '</b>' : 'Punto de emisión y número') + '</div>' +
        '<div class="fw-dos"><div><label>Fecha de la factura</label><input type="date" id="fwFecha" value="' + esc(D.fechaFac) + '" max="' + hoy + '" min="' + dias(hoy, -45) + '"' + (fijo ? ' disabled' : '') + '></div>' +
        '<div><label>Total de la factura (con IVA)</label><input id="fwTot" inputmode="decimal" placeholder="0,00" value="' + esc(D.valorFac) + '"' + (fijo ? ' disabled' : '') + '></div></div>' +
        (pv.length ? '<div class="fw-ya">Esta factura ya tiene registrado: ' + pv.map(x => esc(x.forma) + ' ' + usd(x.valor)).join(', ') + '. ' + (ya() >= num(D.valorFac) - 0.004 ? '<b>Ya está completa</b>: no hay nada más que registrar.' : 'Falta por registrar <b>' + usd(Math.max(0, num(D.valorFac) - ya())) + '</b>.') + '</div>' : '') +
        nav('Siguiente →');
    } else if (paso === 2) {
      h += '<h3>¿Con qué pagó?</h3><p class="fw-s">Factura ' + facNorm() + ' · total ' + usd(num(D.valorFac)) + (ya() ? ' · ya registrado ' + usd(ya()) : '') + '. Si pagó con dos formas, registras una y luego la otra.</p>' +
        (o.formas || []).map(f => '<button class="fw-op' + (D.forma === f ? ' sel' : '') + '" data-forma="' + esc(f) + '"><span>' + (ICO[f] || '💳') + '</span><div><b>' + esc(f) + '</b><small>' + esc(AYUDA[f] || '') + '</small></div></button>').join('') +
        '<div class="fw-nav"><button class="fw-atras" data-fw="atras">← Atrás</button></div>';
    } else if (paso === 3) {
      const f = D.forma, v = VALES[f] ? vales() : null, falta = Math.max(0, num(D.valorFac) - ya());
      h += '<h3>' + (ICO[f] || '') + ' ' + esc(f) + '</h3><p class="fw-s">Factura ' + facNorm() + ' · falta registrar ' + usd(falta) + '</p>';
      if (f === 'Otra') h += '<label>¿Cuál forma de pago?</label><input id="fwOtra" maxlength="100" value="' + esc(D.otra) + '" placeholder="Ej.: tarjeta de crédito Diners">';
      if (f === 'Transferencias') h += '<label>Banco</label><div class="fw-ban">' + BANCOS.map(b => '<button data-ban="' + esc(b) + '" class="' + (D.banco === b ? 'sel' : '') + '">' + esc(b) + '</button>').join('') + '</div>';
      h += '<label>' + etiquetaRef(f) + '</label>' + (v ? '<textarea id="fwRef" rows="4" placeholder="BILLECOND35590&#10;BILLECOND35591">' + esc(D.pedido) + '</textarea>' :
        '<input id="fwRef" ' + (f === 'Tipti' ? 'inputmode="numeric" maxlength="7"' : 'maxlength="60"') + ' autocomplete="off" value="' + esc(D.pedido) + '">');
      if (v) h += '<div class="fw-h ' + (v.rep.length ? 'err' : v.c.length ? 'okk' : '') + '" id="fwVales">' + (v.rep.length ? 'El vale ' + v.rep[0] + ' está repetido' : v.c.length ? v.c.length + (v.c.length === 1 ? ' vale leído' : ' vales leídos') + (f === 'Shopping Dólares - Condado' ? ' = ' + usd(v.c.length) : '') : 'Cada número de vale en su línea') + '</div>';
      if (f === 'Tipti') h += '<div class="fw-h" id="fwTip">' + D.pedido.replace(/\D/g, '').length + ' de 7 dígitos</div>';
      if (f !== 'Shopping Dólares - Condado') h += '<label>Valor pagado con ' + esc(f) + '</label><input id="fwVal" inputmode="decimal" placeholder="' + Number(falta).toFixed(2).replace('.', ',') + '" value="' + esc(D.valor) + '">' +
        (falta ? '<div class="fw-h"><button type="button" class="fw-ban" data-fw="todo" style="border:0;background:none;color:#0077c0;padding:0;font-size:13px;cursor:pointer">Usar lo que falta: ' + usd(falta) + '</button></div>' : '');
      h += '<label>Foto ' + (FOTO[f] ? '(obligatoria) ' : '(opcional) ') + 'del ' + (f === 'Transferencias' ? 'comprobante' : VALES[f] ? 'vale y la factura' : 'comprobante') + '</label>' +
        '<div class="fw-foto">' + (D.fotoUrl ? '<img src="' + D.fotoUrl + '" alt="">' : '') + '<label class="fw-fbtn">📷 ' + (D.fotoUrl ? 'Cambiar foto' : 'Tomar o elegir foto') + '<input type="file" id="fwFoto" accept="image/*" hidden></label></div>';
      h += nav('Revisar →');
    } else if (paso === 4) {
      const f = D.forma, fila = (a, b) => '<div><span>' + a + '</span><b>' + b + '</b></div>';
      h += '<h3>Revisa antes de guardar</h3><p class="fw-s">Compara con la factura y el comprobante. Después de guardar, solo se puede anular con motivo.</p><div class="fw-res">' +
        fila('Factura', facNorm()) + fila('Fecha de la factura', fCorta(D.fechaFac)) + fila('Total de la factura', usd(num(D.valorFac))) + fila('Forma de pago', esc(f + (D.otra ? ': ' + D.otra : '') + (D.banco ? ' · ' + D.banco : ''))) +
        fila(etiquetaRef(f).replace(/ \(.*\)/, ''), esc(VALES[f] ? vales().c.length + ' vales: ' + vales().c.join(', ') : D.pedido)) + fila('Valor pagado', '<span style="color:#0f172a;font-size:18px">' + usd(valorPago()) + '</span>') +
        (ya() ? fila('Ya registrado antes', usd(ya())) : '') + fila('Queda sin registrar', usd(Math.max(0, num(D.valorFac) - ya() - valorPago()))) + fila('Foto', D.fotoFile || D.foto ? 'Sí ✓' : 'No') + '</div>' +
        (o.quienFijo ? '<label>Registra</label><input value="' + esc(o.quienFijo) + '" disabled>' : '<label>¿Quién registra?</label>' + o.quienHtml.replace(/id="[^"]*"/, 'id="fwQuien"')) +
        '<label class="fw-chk"><input type="checkbox" id="fwOk"' + (D.confirmo ? ' checked' : '') + '><span>Revisé la factura y el comprobante: los datos son correctos.</span></label>' + nav('Guardar ✓');
    } else {
      const r = D.res;
      h = '<div class="fw-fin"><div class="big">✅</div><h3>¡Registrado!</h3><p class="fw-s">' + esc(r.id) + ' · factura ' + esc(r.factura) + ' · ' + esc(r.forma) + ' ' + usd(r.valor) + '</p>' +
        (D.resta > 0.004 ? '<div class="fw-ya" style="text-align:left">Faltan <b>' + usd(D.resta) + '</b> de esta factura. Si se pagaron con otra forma registrada aquí (deUna, transferencia, Tipti o vales), regístrala ahora.</div>' : '') +
        '<div class="fw-nav" style="flex-direction:column"><button class="fw-sig" data-fw="otraForma">+ Otra forma de pago de esta factura</button><button class="fw-atras" data-fw="nueva">Registrar otra factura</button><button class="fw-atras" data-fw="x">Terminar</button></div></div>';
    }
    box.innerHTML = h; enlazar();
    const foco = enfocar === false ? null : box.querySelector(paso === 1 ? (D.pto ? '#fwSec' : '#fwPto') : paso === 3 ? '#fwOtra,#fwRef' : null); if (foco && !('ontouchstart' in window)) foco.focus();
  }
  function refrescarNav(){ const b = $w('[data-fw="sig"]'); if (b) { b.disabled = guardando; b.classList.toggle('fw-off', !!errPaso(paso)); } const m = $w('#fwMsg'); if (m) m.textContent = err || '';
    const fv = $w('#fwFacV'); if (fv) fv.innerHTML = facNorm() ? 'Factura <b>' + facNorm() + '</b>' : 'Punto de emisión y número'; }
  function enlazar(){
    const on = (sel, k, f) => { const e = $w(sel); if (e) e.addEventListener('input', () => { D[k] = f ? f(e.value) : e.value; err = ''; refrescarNav(); extra(); }); };
    on('#fwPto', 'pto', v => v.replace(/[^\d-]/g, '')); on('#fwSec', 'sec', v => v.replace(/\D/g, '')); on('#fwFecha', 'fechaFac'); on('#fwTot', 'valorFac'); on('#fwOtra', 'otra'); on('#fwRef', 'pedido'); on('#fwVal', 'valor');
    const sec = $w('#fwSec'); if (sec) sec.addEventListener('change', () => { const pv = previos()[0]; if (pv) { D.valorFac = String(pv.valorFac || ''); if (pv.fechaFac) D.fechaFac = pv.fechaFac; fijo = true; pintar(false); } else if (fijo) { fijo = null; pintar(false); } });
    const q = $w('#fwQuien'); if (q) { if (D.quien) q.value = D.quien; q.addEventListener('change', () => { D.quien = q.value.trim(); refrescarNav(); }); q.addEventListener('input', () => { D.quien = q.value.trim(); refrescarNav(); }); }
    const ok = $w('#fwOk'); if (ok) ok.onchange = () => { D.confirmo = ok.checked; refrescarNav(); };
    const fo = $w('#fwFoto'); if (fo) fo.onchange = () => { const fl = fo.files && fo.files[0]; if (!fl) return; D.fotoFile = fl; if (D.fotoUrl) URL.revokeObjectURL(D.fotoUrl); D.fotoUrl = URL.createObjectURL(fl); pintar(false); };
    box.querySelectorAll('[data-forma]').forEach(b => b.onclick = () => { if (D.forma !== b.dataset.forma) { D.otra = ''; D.banco = ''; D.pedido = ''; D.valor = ''; } D.forma = b.dataset.forma; paso = 3; err = ''; pintar(); });
    box.querySelectorAll('[data-ban]').forEach(b => b.onclick = () => { D.banco = b.dataset.ban; pintar(false); });
    box.querySelectorAll('[data-fw]').forEach(b => b.onclick = () => accion(b.dataset.fw));
  }
  function extra(){
    const v = $w('#fwVales'); if (v) { const x = vales(); v.className = 'fw-h ' + (x.rep.length ? 'err' : x.c.length ? 'okk' : ''); v.textContent = x.rep.length ? 'El vale ' + x.rep[0] + ' está repetido' : x.c.length ? x.c.length + (x.c.length === 1 ? ' vale leído' : ' vales leídos') + (D.forma === 'Shopping Dólares - Condado' ? ' = ' + usd(x.c.length) : '') : 'Cada número de vale en su línea'; }
    const t = $w('#fwTip'); if (t) { const n = D.pedido.replace(/\D/g, '').length; t.textContent = n + ' de 7 dígitos'; t.className = 'fw-h ' + (n === 7 ? 'okk' : n > 7 ? 'err' : ''); }
  }
  async function accion(a){
    if (a === 'x') return cerrar();
    if (a === 'atras') { paso = paso === 3 ? 2 : paso - 1; err = ''; return pintar(); }
    if (a === 'todo') { D.valor = Number(Math.max(0, num(D.valorFac) - ya())).toFixed(2); return pintar(false); }
    if (a === 'otraForma' || a === 'nueva') {
      const keep = a === 'otraForma';
      Object.assign(D, {forma: '', otra: '', banco: '', pedido: '', valor: '', foto: '', fotoFile: null, confirmo: false}); if (D.fotoUrl) URL.revokeObjectURL(D.fotoUrl); D.fotoUrl = '';
      if (!keep) { D.sec = ''; D.valorFac = ''; D.fechaFac = hoy; fijo = null; paso = 1; } else { fijo = true; paso = 2; }
      return pintar();
    }
    if (a !== 'sig') return;
    const e = errPaso(paso); if (e) { err = e; return refrescarNav(); }
    if (paso < 4) { paso = paso === 1 ? 2 : paso + 1; err = ''; return pintar(); }
    guardando = true; err = ''; refrescarNav();
    try {
      if (D.fotoFile && !D.foto) { const b = $w('[data-fw="sig"]'); if (b) b.textContent = 'Subiendo foto…'; D.foto = await o.subirFoto(D.fotoFile, 'pago_' + facNorm().replace(/\D/g, '')); if (o.subirOk) D.foto = o.subirOk(D.foto); }
      const d = {factura: facNorm(), fechaFac: D.fechaFac, valorFac: num(D.valorFac), forma: D.forma, otra: D.otra.trim(), banco: D.banco, pedido: D.pedido.trim(), valor: valorPago(), foto: D.foto, registro: D.quien, desde: o.desde || 'Tienda', confirmo: true};
      const r = await o.api(d);
      localStorage.setItem('fpgPto', D.pto.trim());
      (o.lista = o.lista || []).unshift(r); if (o.alGuardar) o.alGuardar(r);
      D.res = r; D.resta = Math.max(0, num(D.valorFac) - ya()); guardando = false; paso = 5; pintar();
    } catch (x) { guardando = false; err = (x && x.message) || 'No se pudo guardar. Revisa tu internet.'; pintar(); }
  }
  pintar();
}
