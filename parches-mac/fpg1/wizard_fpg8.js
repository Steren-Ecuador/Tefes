/* fpg8 (Diego 17-nov): asistente para registrar cómo se pagó una factura del POS. Antes fpg5 (4 pasos) + fpg6 (vendedor).
   Grupos del menú Formas de pago: 'tr' Transferencias (deUna, Tipti, Transferencia bancaria, Otra con detalle: Shopping Dólares, MobiSol…),
   'ot' Otros (Notas de crédito, Préstamos a empleados, Descuentos por inventarios); 'asesor' = Transferencias + Notas de crédito.
   Siempre: factura SRI (005-001-000004800), fecha y total con IVA de la factura, quién registra; fecha y hora del registro las pone el servidor.
   El servidor vuelve a validar todo (fpgValidar_). Uso: fpgWizard({api, subirFoto, formas, grupo, prefijo, hoy, lista, quienHtml, quienFijo, desde, alGuardar}) */
function fpgWizard(o){
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const usd = n => '$' + Number(n || 0).toFixed(2).replace('.', ',');
  const num = x => { let s = String(x == null ? '' : x).replace(/[$\s]/g, ''); if (s.indexOf(',') >= 0) s = s.replace(/\./g, '').replace(',', '.'); const n = Number(s); return isNaN(n) ? 0 : Math.round(n * 100) / 100; };
  const numOk = x => /^\$?\s*\d{1,6}([.,]\d{1,2})?$/.test(String(x || '').trim());
  const dias = (iso, k) => { const t = new Date(iso + 'T12:00:00Z'); t.setUTCDate(t.getUTCDate() + k); return t.toISOString().slice(0, 10); };
  const fCorta = iso => iso ? iso.split('-').reverse().join('/') : '';
  const sri = x => { const g = String(x || '').replace(/[^\d-]/g, ' ').trim().split(/[\s-]+/).filter(Boolean);
    if (g.length === 3 && g[0].length <= 3 && g[1].length <= 3 && g[2].length <= 9 && Number(g[0]) && Number(g[2])) return ('00' + g[0]).slice(-3) + '-' + ('00' + g[1]).slice(-3) + '-' + ('00000000' + g[2]).slice(-9);
    if (g.length === 1 && g[0].length === 15) return g[0].slice(0, 3) + '-' + g[0].slice(3, 6) + '-' + g[0].slice(6); return ''; };
  const hoy = o.hoy || new Date().toISOString().slice(0, 10);
  const BANCOS = ['Pichincha cte. 2100349639', 'Produbanco cte. 02006219957', 'Bolivariano cte. 5005110152'];   // fpg8: cuentas corrientes de Tefes S.A.S (Diego 17-nov)
  const GRUPOS = {tr: ['deUna', 'Tipti', 'Transferencias', 'Otra'], ot: ['Nota de crédito', 'Préstamo empleado', 'Descuento inventario'], asesor: ['deUna', 'Tipti', 'Transferencias', 'Otra', 'Nota de crédito']};
  const NOM = {'Transferencias': 'Transferencia bancaria', 'Préstamo empleado': 'Préstamo a empleado', 'Descuento inventario': 'Descuento por inventario'}, nom = f => NOM[f] || f;
  const BANCO_SVG = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10l9-6 9 6"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"/></svg>';
  const ICO = {'deUna': ['ic-deuna', 'd!'], 'Tipti': ['ic-tipti', 't'], 'Transferencias': ['ic-banco', BANCO_SVG], 'Otra': ['ic-otra', '✎'], 'Nota de crédito': ['ic-nc', 'NC'], 'Préstamo empleado': ['ic-prest', '$'], 'Descuento inventario': ['ic-inv', '▤']};
  const ico = f => { const i = ICO[f] || ['ic-otra', esc(String(f).charAt(0).toUpperCase())]; return '<span class="fw-ic ' + i[0] + '">' + i[1] + '</span>'; };
  const AYUDA = {'deUna': 'Pago con QR deUna. Pide el comprobante al cliente.', 'Tipti': 'Pedido hecho por Tipti. Copia el número de pedido.', 'Transferencias': 'Transferencia a la cuenta de la empresa. Verifica que llegó.',
    'Otra': 'Shopping Dólares, MobiSol u otra: escribe el detalle.', 'Nota de crédito': 'El cliente devolvió una factura y paga con la nota de crédito.', 'Préstamo empleado': 'Compra de un empleado que se descuenta en el rol.', 'Descuento inventario': 'Faltante de inventario que se cobra al personal.'};
  const VALES_OTRA = ['Shopping Dólares - Condado', 'MobiSol - Mall del Sol'], esVale = () => D.forma === 'Otra' && /shopping|mobisol|vale/i.test(D.otra);
  const fotoOblig = () => D.forma === 'Transferencias' || esVale() || (EXW[D.forma] && EXW[D.forma].p === 'C');
  if (!document.getElementById('fwCss8')) {
    const st = document.createElement('style'); st.id = 'fwCss8';
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
      '.fw-chk input{width:22px;height:22px;flex:none;margin:0}.fw-fin{text-align:center;padding:10px 0}.fw-fin .big{font-size:46px}.fw-foto{display:flex;align-items:center;gap:10px}.fw-foto img{width:64px;height:64px;object-fit:cover;border-radius:8px}.fw label.fw-fbtn{display:inline-block;margin:0;padding:12px 16px;border:1.5px dashed #0077c0;border-radius:10px;color:#0077c0;font-size:15px;cursor:pointer}.fw-op .fw-ic{flex:none;width:42px;height:42px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;color:#fff;font-family:Arial,Helvetica,sans-serif;letter-spacing:-.5px}.fw-ic.ic-deuna{background:linear-gradient(135deg,#5b21b6,#c026d3)}.fw-ic.ic-tipti{background:linear-gradient(135deg,#f97316,#ea580c)}.fw-ic.ic-banco{background:#0f4c81}.fw-ic.ic-otra{background:#64748b}.fw-ic.ic-nc{background:#0e7490}.fw-ic.ic-prest{background:#15803d}.fw-ic.ic-inv{background:#b45309}.fw h3 .fw-ic{display:inline-flex;width:30px;height:30px;border-radius:8px;font-size:16px;vertical-align:-6px;margin-right:6px;color:#fff;align-items:center;justify-content:center;font-weight:800;font-family:Arial,Helvetica,sans-serif}.fw-usd{position:relative}.fw-usd:before{content:"$";position:absolute;left:12px;top:50%;transform:translateY(-50%);font-size:17px;color:#475569;font-weight:700}.fw-usd input{padding-left:28px}.fw-ob{color:#dc2626;font-weight:700}';
    document.head.appendChild(st);
  }
  const bg = document.createElement('div'); bg.className = 'fw-bg'; bg.innerHTML = '<div class="fw" role="dialog" aria-modal="true"></div>'; document.body.appendChild(bg);
  const box = bg.firstChild, $w = s => box.querySelector(s);
  const permitidas = o.formas && o.formas.length ? o.formas : GRUPOS.tr.concat(GRUPOS.ot);
  const EXW = {}; (o.extras || []).forEach(x => { EXW[x.n] = x; });   // fpg9: formas de reserva activas (pestaña 'Formas de pago config')
  const PLA = {A: 'Pide valor y comprobante.', B: 'Pide valor y número.', C: 'Pide valor, comprobante y foto.', D: 'Empleado, valor y cuotas (máx. 6).'};
  Object.keys(EXW).forEach(n => { AYUDA[n] = PLA[EXW[n].p] || ''; });
  const gExtra = g => (o.extras || []).filter(x => g === 'asesor' ? x.p !== 'D' : x.g === g).map(x => x.n);
  const FORMAS = (GRUPOS[o.grupo || 'tr'] || GRUPOS.tr).concat(gExtra(o.grupo || 'tr')).filter(f => permitidas.indexOf(f) >= 0);
  const solo = FORMAS.length === 1;
  const CUENTAS = o.cuentas && o.cuentas.length ? o.cuentas : BANCOS;   // fpg8: cuentas de la empresa (Diego las define)
  const TIT = {tr: 'Registrar pago con transferencia', ot: 'Registrar otra forma de pago', asesor: 'Registrar forma de pago'}[o.grupo || 'tr'] || 'Registrar forma de pago';
  const D = {pto: localStorage.getItem('fpgPto') || o.prefijo || '', sec: '', fechaFac: hoy, valorFac: '', forma: solo ? FORMAS[0] : '', otra: '', banco: '', pedido: '', valor: '', foto: '', fotoFile: null, fotoUrl: '', quien: o.quienFijo || '', vend: o.quienFijo || '', confirmo: false};
  let paso = 1, guardando = false, err = '', fijo = null;
  const cerrar = () => { if (D.fotoUrl) URL.revokeObjectURL(D.fotoUrl); bg.remove(); };
  const facNorm = () => { const a = D.pto.replace(/[^\d-]/g, '').split('-').filter(Boolean), s = D.sec.replace(/\D/g, '');
    if (a.length !== 2 || a[0].length > 3 || a[1].length > 3 || !s || s.length > 9 || !Number(s) || !Number(a[0])) return '';
    return ('00' + a[0]).slice(-3) + '-' + ('00' + a[1]).slice(-3) + '-' + ('00000000' + s).slice(-9); };
  const previos = () => { const f = facNorm(); return f ? (o.lista || []).filter(x => x.estado !== 'Anulada' && String(x.factura).replace(/\D/g, '') === f.replace(/\D/g, '')) : []; };
  const valorPago = () => num(D.valor);
  const ya = () => previos().reduce((a, x) => a + (Number(x.valor) || 0), 0);
  /* qué se pide de cada forma: [campo, etiqueta] (la etiqueta sale en el resumen y en el panel) */
  const REF = {'deUna': 'Comprobante deUna', 'Tipti': 'N° de pedido Tipti', 'Transferencias': 'Comprobante', 'Otra': 'N° de comprobante o de los vales', 'Nota de crédito': 'N° de la nota de crédito', 'Préstamo empleado': 'N° de cuotas', 'Descuento inventario': 'N° de inventario'};
  function errPaso(p){
    if (p === 1) {
      if (!/^\d{1,3}-\d{1,3}$/.test(D.pto.trim())) return 'Escribe el punto de emisión, como 005-001.';
      if (!facNorm()) return 'Escribe el número de la factura.';
      if (!D.fechaFac || D.fechaFac > hoy) return 'La fecha de la factura no puede ser futura.';
      if (D.fechaFac < dias(hoy, -45)) return 'La factura tiene más de 45 días: pide a Financiero que la registre.';
      if (!(num(D.valorFac) > 0)) return 'Pon el total de la factura con IVA.';
      if (!D.vend) return 'Elige el vendedor que hizo la venta.';
      const pv = previos()[0];
      if (pv && pv.vendedor && D.vend && pv.vendedor !== D.vend) return 'Esta factura ya está registrada con el vendedor ' + (pv.vendedorVer || pv.vendedor) + '.';
      if (pv && pv.valorFac && Math.abs(pv.valorFac - num(D.valorFac)) > 0.004) return 'Esta factura ya está registrada con total ' + usd(pv.valorFac) + '.';
      if (pv && ya() >= num(D.valorFac) - 0.004) return 'Esta factura ya tiene registrado todo su valor (' + usd(ya()) + ').';
      return '';
    }
    if (p === 2) return D.forma ? '' : 'Elige la forma de pago.';
    if (p === 3) {
      const f = D.forma, ref = D.pedido.trim();
      if (f === 'deUna' && ref.replace(/\s/g, '').length < 4) return 'Escribe el comprobante de deUna.';
      if (f === 'Tipti' && !/^\d{4,12}$/.test(ref)) return 'El pedido Tipti es solo números.';
      if (f === 'Transferencias') { if (!D.banco) return 'Elige la cuenta a la que llegó la transferencia.'; if (ref.length < 3) return 'Escribe el comprobante de la transferencia.'; }
      if (f === 'Otra') { if (D.otra.trim().length < 3) return 'Escribe el detalle: qué forma de pago es.'; if (ref.length < 3) return 'Escribe el número de comprobante o de los vales.'; }
      if (f === 'Nota de crédito') { if (!sri(D.banco)) return 'Escribe el N° de la factura devuelta como sale en el PDF: 005-001-000004700.'; if (sri(D.banco) === facNorm()) return 'La factura devuelta es otra, no esta.';
        if (!sri(ref)) return 'Escribe el N° de la nota de crédito completo: 005-001-000000123.'; }
      if (f === 'Descuento inventario') { if (!D.otra) return 'Elige el empleado al que se le descuenta.'; if (ref.length < 2) return 'Escribe el N° de inventario.'; if (!(Number(D.banco) >= 1 && Number(D.banco) <= 6)) return 'Elige el número de cuotas (máximo 6 meses).'; }
      if (EXW[f]) { const P = EXW[f].p;
        if (P === 'D') { if (!D.otra) return 'Elige el empleado.'; if (!(Number(ref) >= 1 && Number(ref) <= 6)) return 'Elige el número de cuotas (máximo 6 meses).'; }
        else if (P === 'B' ? !/^\d{3,15}$/.test(ref) : ref.replace(/\s/g, '').length < 3) return P === 'B' ? 'Escribe el número (solo dígitos).' : 'Escribe el comprobante.'; }
      if (f === 'Préstamo empleado') { if (!D.otra) return 'Elige el empleado que compra.'; if (!(Number(ref) >= 1 && Number(ref) <= 6)) return 'Elige el número de cuotas (máximo 6 meses).'; }
      if (!String(D.valor).trim()) return 'Pon el valor pagado con ' + nom(f) + '.';
      if (!numOk(D.valor)) return 'Escribe el valor en dólares, con punto o coma para los centavos (ej. 45,90).';
      const v = valorPago();
      if (!(v > 0)) return 'Pon el valor pagado con ' + nom(f) + '.';
      if (v > num(D.valorFac) + (esVale() ? 0.99 : 0) + 0.004) return 'Es más que el total de la factura (' + usd(num(D.valorFac)) + ').';
      if (ya() + v > num(D.valorFac) + (esVale() ? 0.994 : 0.004)) return 'Con lo ya registrado (' + usd(ya()) + ') pasaría el total de la factura.';
      if (fotoOblig() && !D.fotoFile && !D.foto) return 'Toma la foto del ' + (f === 'Transferencias' ? 'comprobante.' : 'vale y la factura.');
      return '';
    }
    if (p === 4) { if (!D.quien) return 'Elige quién registra.'; if (!D.confirmo) return 'Marca que revisaste los datos.'; return ''; }
    return '';
  }
  const ROT = solo ? [[1, 'Factura'], [3, 'Datos'], [4, 'Confirmar']] : [[1, 'Factura'], [2, 'Forma de pago'], [3, 'Datos del pago'], [4, 'Confirmar']];
  function barra(){ return '<div class="fw-pasos">' + ROT.map((t, i) => '<div class="' + (t[0] < paso ? 'ok' : t[0] === paso ? 'on' : '') + '"><i></i>' + (i + 1) + '. ' + t[1] + '</div>').join('') + '</div>'; }
  function nav(sig){ return '<div class="fw-nav">' + (paso > 1 ? '<button class="fw-atras" data-fw="atras">← Atrás</button>' : '<button class="fw-atras" data-fw="x">Cancelar</button>') +
    '<button class="fw-sig' + (errPaso(paso) ? ' fw-off' : '') + '" data-fw="sig" ' + (guardando ? 'disabled' : '') + '>' + (guardando ? 'Guardando…' : sig) + '</button></div><div class="fw-h err" id="fwMsg" style="text-align:center;margin-top:8px">' + esc(err || '') + '</div>'; }
  const ob = '<span class="fw-ob">*</span>';
  const campoUsd = (lab, ph) => '<label>' + lab + ' ' + ob + '</label><div class="fw-usd"><input id="fwVal" inputmode="decimal" placeholder="' + ph + '" value="' + esc(D.valor) + '" autocomplete="off"></div>';
  const cuotas = () => { const n = Number(D.forma === 'Descuento inventario' ? D.banco : D.pedido), v = valorPago(); if (!(n >= 1 && n <= 6) || !(v > 0)) return null; const c = Math.floor(v * 100 / n) / 100; return {n: n, c: c, u: Math.round((v - c * (n - 1)) * 100) / 100}; };
  const cuotaTxt = () => { const q = cuotas(); return !q ? '' : q.n === 1 ? 'Se descuenta ' + usd(q.c) + ' en un solo mes.' : 'Se descuenta ' + usd(q.c) + ' al mes durante ' + q.n + ' meses' + (Math.abs(q.u - q.c) > 0.004 ? ' (la última cuota: ' + usd(q.u) + ')' : '') + '.'; };
  function datosHtml(){
    const f = D.forma, falta = Math.max(0, num(D.valorFac) - ya()), ph = Number(falta).toFixed(2).replace('.', ',');
    let h = '<h3>' + ico(f) + esc(nom(f)) + '</h3><p class="fw-s">Factura ' + facNorm() + ' · total ' + usd(num(D.valorFac)) + ' · falta registrar ' + usd(falta) + '</p>';
    const ref = (lab, attrs, phr) => '<label>' + lab + ' ' + ob + '</label><input id="fwRef" ' + attrs + ' autocomplete="off" placeholder="' + (phr || '') + '" value="' + esc(D.pedido) + '">';
    const valor = lab => campoUsd(lab, ph) + (falta ? '<div class="fw-h"><button type="button" data-fw="todo" style="border:0;background:none;color:#0077c0;padding:0;font-size:13px;cursor:pointer">Usar lo que falta: ' + usd(falta) + '</button></div>' : '');
    if (f === 'deUna') h += valor('Valor pagado con deUna') + ref('Comprobante', 'maxlength="60"', 'Ej.: 123456789');
    else if (f === 'Tipti') h += valor('Valor pagado con Tipti') + ref('N° de pedido', 'inputmode="numeric" maxlength="12"', 'Ej.: 1234567');
    else if (f === 'Transferencias') h += '<label>Cuenta de la empresa a la que transfirió el cliente ' + ob + '</label><div class="fw-ban">' + CUENTAS.map(b => '<button data-ban="' + esc(b) + '" class="' + (D.banco === b ? 'sel' : '') + '">' + esc(b) + '</button>').join('') + '</div>' +
      valor('Valor pagado') + ref('Comprobante de la transferencia', 'maxlength="60"', 'N° del comprobante');
    else if (f === 'Otra') h += '<label>Detalle: ¿qué forma de pago es? ' + ob + '</label><div class="fw-ban" style="margin-bottom:6px">' + VALES_OTRA.map(b => '<button data-otra="' + esc(b) + '" class="' + (D.otra === b ? 'sel' : '') + '">' + esc(b) + '</button>').join('') + '</div>' +
      '<textarea id="fwOtra" rows="2" maxlength="100" placeholder="Ej.: Shopping Dólares Condado, MobiSol, tarjeta Diners…">' + esc(D.otra) + '</textarea>' +
      '<label>N° de comprobante o de los vales ' + ob + '</label><textarea id="fwRef" rows="2" maxlength="1500" placeholder="Si son vales, un número por línea">' + esc(D.pedido) + '</textarea>' + valor('Valor pagado');
    else if (f === 'Nota de crédito') h += '<label>N° de la factura devuelta ' + ob + '</label><input id="fwBan" maxlength="17" placeholder="005-001-000004700" value="' + esc(D.banco) + '" autocomplete="off">' +
      '<div class="fw-h" id="fwDevV">' + (sri(D.banco) ? 'Factura devuelta <b>' + sri(D.banco) + '</b>' : 'Como sale en el PDF de la factura') + '</div>' +
      ref('N° de la nota de crédito', 'maxlength="17"', '005-001-000000123') + '<div class="fw-h" id="fwNcV">' + (sri(D.pedido) ? 'NC <b>' + sri(D.pedido) + '</b>' : 'Como sale en el PDF de la nota de crédito') + '</div>' +
      valor('Valor de la nota de crédito (con IVA)') + '<label>Motivo (opcional)</label><input id="fwOtra" maxlength="100" placeholder="Ej.: devolución por garantía" value="' + esc(D.otra) + '">';
    else if (f === 'Descuento inventario') h += '<label>Empleado al que se le descuenta ' + ob + '</label>' + (o.quienHtml || '').replace(/id="[^"]*"/, 'id="fwEmp"').replace('Elige tu nombre', 'Elige el empleado').replace('Tu nombre y apellido', 'Nombre del empleado') +
      ref('N° de inventario', 'maxlength="40"', 'Ej.: INV-0123 o S46') + valor('Valor a descontar') +
      '<label>N° de cuotas (máximo 6 meses) ' + ob + '</label><select id="fwCuoI"><option value="">Elige</option>' + [1, 2, 3, 4, 5, 6].map(n => '<option' + (String(n) === D.banco ? ' selected' : '') + '>' + n + '</option>').join('') + '</select>' +
      '<div class="fw-h okk" id="fwCuoV">' + cuotaTxt() + '</div>';
    else if (EXW[f] && EXW[f].p !== 'D') h += valor('Valor pagado con ' + f) + (EXW[f].p === 'B' ? ref('Número', 'inputmode="numeric" maxlength="15"', 'Solo números') : ref('Comprobante', 'maxlength="60"'));
    else if (EXW[f]) h += '<label>Empleado ' + ob + '</label>' + (o.quienHtml || '').replace(/id="[^"]*"/, 'id="fwEmp"').replace('Elige tu nombre', 'Elige el empleado').replace('Tu nombre y apellido', 'Nombre del empleado') +
      valor('Valor') + '<label>N° de cuotas (máximo 6 meses) ' + ob + '</label><select id="fwCuo"><option value="">Elige</option>' + [1, 2, 3, 4, 5, 6].map(n => '<option' + (String(n) === D.pedido ? ' selected' : '') + '>' + n + '</option>').join('') + '</select>' +
      '<div class="fw-h okk" id="fwCuoV">' + cuotaTxt() + '</div>';
    else if (f === 'Préstamo empleado') h += '<label>Empleado que recibe el préstamo ' + ob + '</label>' + (o.quienHtml || '').replace(/id="[^"]*"/, 'id="fwEmp"').replace('Elige tu nombre', 'Elige el empleado').replace('Tu nombre y apellido', 'Nombre del empleado') +
      valor('Valor a prestar') + '<label>N° de cuotas a pagar (máximo 6 meses) ' + ob + '</label><select id="fwCuo"><option value="">Elige</option>' + [1, 2, 3, 4, 5, 6].map(n => '<option' + (String(n) === D.pedido ? ' selected' : '') + '>' + n + '</option>').join('') + '</select>' +
      '<div class="fw-h okk" id="fwCuoV">' + cuotaTxt() + '</div>';
    h += '<label>Foto ' + (fotoOblig() ? '(obligatoria) ' : '(opcional) ') + 'del ' + (esVale() ? 'vale y la factura' : 'comprobante') + '</label>' +
      '<div class="fw-foto">' + (D.fotoUrl ? '<img src="' + D.fotoUrl + '" alt="">' : '') + '<label class="fw-fbtn">📷 ' + (D.fotoUrl ? 'Cambiar foto' : 'Tomar o elegir foto') + '<input type="file" id="fwFoto" accept="image/*" hidden></label></div>';
    return h + nav('Revisar →');
  }
  function resumen(){
    const f = D.forma, fila = (a, b) => '<div><span>' + a + '</span><b>' + b + '</b></div>';
    let r = fila('Factura', facNorm()) + fila('Fecha de la factura', fCorta(D.fechaFac)) + fila('Total de la factura (con IVA)', usd(num(D.valorFac))) + (o.quienFijo ? '' : fila('Vendedor', esc(D.vend))) + fila('Forma de pago', esc(nom(f)));
    if (f === 'Transferencias') r += fila('Cuenta que recibió', esc(D.banco));
    if (f === 'Otra') r += fila('Detalle', esc(D.otra));
    if (f === 'Nota de crédito') r += fila('Factura devuelta', esc(sri(D.banco))) + (D.otra.trim() ? fila('Motivo', esc(D.otra)) : '');
    const conCuotas = f === 'Préstamo empleado' || f === 'Descuento inventario' || (EXW[f] && EXW[f].p === 'D');
    if (conCuotas) r += fila('Empleado', esc(D.otra));
    if (conCuotas && cuotas()) r += fila('Descuento mensual', esc(cuotaTxt().replace('Se descuenta ', '')));
    r += fila(REF[f] || (EXW[f] ? {B: 'Número', D: 'N° de cuotas'}[EXW[f].p] || 'Comprobante' : 'Comprobante'), esc(f === 'Nota de crédito' ? sri(D.pedido) : D.pedido)) + fila('Valor', '<span style="color:#0f172a;font-size:18px">' + usd(valorPago()) + '</span>') +
      (ya() ? fila('Ya registrado antes', usd(ya())) : '') + fila('Queda sin registrar', usd(Math.max(0, num(D.valorFac) - ya() - valorPago()))) + fila('Foto', D.fotoFile || D.foto ? 'Sí ✓' : 'No') + fila('Fecha y hora del registro', 'Automática al guardar');
    return r;
  }
  function pintar(enfocar){
    let h = '<div class="fw-top"><b>' + esc(TIT) + '</b><button class="fw-x" data-fw="x" aria-label="Cerrar">×</button></div>' + barra();
    if (paso === 1) {
      const pv = previos();
      h += '<h3>¿Qué factura es?</h3><p class="fw-s">Cópiala tal como sale en el PDF de la factura del POS.</p>' +
        '<label>N° de factura ' + ob + '</label><div class="fw-fac"><input id="fwPto" inputmode="numeric" placeholder="005-001" value="' + esc(D.pto) + '" maxlength="7"><input id="fwSec" inputmode="numeric" placeholder="Número (ej. 4800)" value="' + esc(D.sec) + '" maxlength="9" autocomplete="off"></div>' +
        '<div class="fw-h" id="fwFacV">' + (facNorm() ? 'Factura <b>' + facNorm() + '</b>' : 'Punto de emisión y número') + '</div>' +
        '<div class="fw-dos"><div><label>Fecha de la factura ' + ob + '</label><input type="date" id="fwFecha" value="' + esc(D.fechaFac) + '" max="' + hoy + '" min="' + dias(hoy, -45) + '"' + (fijo ? ' disabled' : '') + '></div>' +
        '<div><label>Total con IVA ' + ob + '</label><div class="fw-usd"><input id="fwTot" inputmode="decimal" placeholder="0,00" value="' + esc(D.valorFac) + '"' + (fijo ? ' disabled' : '') + '></div></div></div>' +
        (o.quienFijo ? '' : '<label>Vendedor (quién hizo la venta) ' + ob + '</label>' + (fijo && D.vend ? '<input value="' + esc(D.vend) + '" disabled>' : (o.quienHtml || '').replace(/id="[^"]*"/, 'id="fwVend"').replace('Elige tu nombre', 'Elige quién vendió').replace('Tu nombre y apellido', 'Nombre de quien vendió'))) +
        (pv.length ? '<div class="fw-ya">Esta factura ya tiene registrado: ' + pv.map(x => esc(nom(x.forma)) + ' ' + usd(x.valor)).join(', ') + '. ' + (ya() >= num(D.valorFac) - 0.004 ? '<b>Ya está completa</b>: no hay nada más que registrar.' : 'Falta por registrar <b>' + usd(Math.max(0, num(D.valorFac) - ya())) + '</b>.') + '</div>' : '') +
        nav('Siguiente →');
    } else if (paso === 2) {
      h += '<h3>¿Con qué pagó?</h3><p class="fw-s">Factura ' + facNorm() + ' · total ' + usd(num(D.valorFac)) + (ya() ? ' · ya registrado ' + usd(ya()) : '') + '. Si pagó con dos formas, registras una y luego la otra.</p>' +
        FORMAS.map(f => '<button class="fw-op' + (D.forma === f ? ' sel' : '') + '" data-forma="' + esc(f) + '">' + ico(f) + '<div><b>' + esc(nom(f)) + '</b><small>' + esc(AYUDA[f] || '') + '</small></div></button>').join('') +
        '<div class="fw-nav"><button class="fw-atras" data-fw="atras">← Atrás</button></div>';
    } else if (paso === 3) h += datosHtml();
    else if (paso === 4) {
      h += '<h3>Revisa antes de guardar</h3><p class="fw-s">Compara con la factura y el comprobante. Después de guardar, solo se puede anular con motivo.</p><div class="fw-res">' + resumen() + '</div>' +
        (o.quienFijo ? '<label>Registra</label><input value="' + esc(o.quienFijo) + '" disabled>' : '<label>¿Quién registra? ' + ob + '</label>' + (o.quienHtml || '').replace(/id="[^"]*"/, 'id="fwQuien"')) +
        '<label class="fw-chk"><input type="checkbox" id="fwOk"' + (D.confirmo ? ' checked' : '') + '><span>Revisé la factura y el comprobante: los datos son correctos.</span></label>' + nav('Guardar ✓');
    } else {
      const r = D.res;
      h = '<div class="fw-fin"><div class="big">✅</div><h3>¡Registrado!</h3><p class="fw-s">' + esc(r.id) + ' · factura ' + esc(r.factura) + ' · ' + esc(nom(r.forma)) + ' ' + usd(r.valor) + (r.fecha ? '<br>' + fCorta(r.fecha) + (r.hora ? ' ' + esc(r.hora) : '') + ' · registró ' + esc(r.registroVer || r.registro || D.quien) : '') + '</p>' +
        (D.resta > 0.004 ? '<div class="fw-ya" style="text-align:left">Faltan <b>' + usd(D.resta) + '</b> de esta factura. Si se pagaron con otra forma que se registra aquí, regístrala ahora.</div>' : '') +
        '<div class="fw-nav" style="flex-direction:column">' + (solo ? '' : '<button class="fw-sig" data-fw="otraForma">+ Otra forma de pago de esta factura</button>') + '<button class="fw-atras" data-fw="nueva">Registrar otra factura</button><button class="fw-atras" data-fw="x">Terminar</button></div></div>';
    }
    box.innerHTML = h; enlazar();
    const foco = enfocar === false ? null : box.querySelector(paso === 1 ? (D.pto ? '#fwSec' : '#fwPto') : paso === 3 ? (D.forma === 'Nota de crédito' ? '#fwBan' : '#fwVal,#fwRef') : null); if (foco && !('ontouchstart' in window)) foco.focus();
  }
  function refrescarNav(){ const b = $w('[data-fw="sig"]'); if (b) { b.disabled = guardando; b.classList.toggle('fw-off', !!errPaso(paso)); } const m = $w('#fwMsg'); if (m) m.textContent = err || '';
    const fv = $w('#fwFacV'); if (fv) fv.innerHTML = facNorm() ? 'Factura <b>' + facNorm() + '</b>' : 'Punto de emisión y número';
    const dv = $w('#fwDevV'); if (dv) dv.innerHTML = sri(D.banco) ? 'Factura devuelta <b>' + sri(D.banco) + '</b>' : 'Como sale en el PDF de la factura';
    const cv = $w('#fwCuoV'); if (cv) cv.textContent = cuotaTxt();
    const nv = $w('#fwNcV'); if (nv) nv.innerHTML = sri(D.pedido) ? 'NC <b>' + sri(D.pedido) + '</b>' : 'Como sale en el PDF de la nota de crédito'; }
  function enlazar(){
    const on = (sel, k, f) => { const e = $w(sel); if (e) e.addEventListener('input', () => { D[k] = f ? f(e.value) : e.value; err = ''; refrescarNav(); }); };
    on('#fwPto', 'pto', v => v.replace(/[^\d-]/g, '')); on('#fwSec', 'sec', v => v.replace(/\D/g, '')); on('#fwFecha', 'fechaFac'); on('#fwTot', 'valorFac'); on('#fwOtra', 'otra'); on('#fwBan', 'banco'); on('#fwVal', 'valor');
    on('#fwRef', 'pedido', D.forma === 'Tipti' || (EXW[D.forma] && EXW[D.forma].p === 'B') ? (v => { const d = v.replace(/\D/g, ''); const e = $w('#fwRef'); if (e && e.value !== d) e.value = d; return d; }) : null);
    const ot = $w('#fwOtra'); if (ot && D.forma === 'Otra') ot.addEventListener('change', () => pintar(false));   // la foto pasa a obligatoria si son vales
    const sec = $w('#fwSec'); if (sec) sec.addEventListener('change', () => { const pv = previos()[0]; if (pv) { D.valorFac = String(pv.valorFac || ''); if (pv.fechaFac) D.fechaFac = pv.fechaFac; if (pv.vendedor && !o.quienFijo) D.vend = pv.vendedor; fijo = true; pintar(false); } else if (fijo) { fijo = null; pintar(false); } });
    const sel = (id, k) => { const e = $w(id); if (!e) return; if (D[k]) e.value = D[k]; const f = () => { D[k] = e.value.trim(); err = ''; refrescarNav(); }; e.addEventListener('change', f); e.addEventListener('input', f); };
    sel('#fwVend', 'vend'); sel('#fwQuien', 'quien'); sel('#fwEmp', 'otra'); sel('#fwCuo', 'pedido'); sel('#fwCuoI', 'banco');
    const ok = $w('#fwOk'); if (ok) ok.onchange = () => { D.confirmo = ok.checked; refrescarNav(); };
    const fo = $w('#fwFoto'); if (fo) fo.onchange = () => { const fl = fo.files && fo.files[0]; if (!fl) return; D.fotoFile = fl; if (D.fotoUrl) URL.revokeObjectURL(D.fotoUrl); D.fotoUrl = URL.createObjectURL(fl); pintar(false); };
    box.querySelectorAll('[data-forma]').forEach(b => b.onclick = () => { if (D.forma !== b.dataset.forma) { D.otra = ''; D.banco = ''; D.pedido = ''; D.valor = ''; } D.forma = b.dataset.forma; paso = 3; err = ''; pintar(); });
    box.querySelectorAll('[data-ban]').forEach(b => b.onclick = () => { D.banco = b.dataset.ban; pintar(false); });
    box.querySelectorAll('[data-otra]').forEach(b => b.onclick = () => { D.otra = b.dataset.otra; pintar(false); });
    box.querySelectorAll('[data-fw]').forEach(b => b.onclick = () => accion(b.dataset.fw));
  }
  async function accion(a){
    if (a === 'x') return cerrar();
    if (a === 'atras') { paso = paso === 3 ? (solo ? 1 : 2) : paso === 4 ? 3 : paso - 1; err = ''; return pintar(); }
    if (a === 'todo') { D.valor = Number(Math.max(0, num(D.valorFac) - ya())).toFixed(2).replace('.', ','); return pintar(false); }
    if (a === 'otraForma' || a === 'nueva') {
      const keep = a === 'otraForma';
      Object.assign(D, {forma: solo ? FORMAS[0] : '', otra: '', banco: '', pedido: '', valor: '', foto: '', fotoFile: null, confirmo: false}); if (D.fotoUrl) URL.revokeObjectURL(D.fotoUrl); D.fotoUrl = '';
      if (!keep) { D.sec = ''; D.valorFac = ''; D.fechaFac = hoy; if (!o.quienFijo) D.vend = ''; fijo = null; paso = 1; } else { fijo = true; paso = solo ? 3 : 2; }
      return pintar();
    }
    if (a !== 'sig') return;
    const e = errPaso(paso); if (e) { err = e; return refrescarNav(); }
    if (paso < 4) { paso = paso === 1 ? (solo ? 3 : 2) : paso + 1; if (paso === 4 && !D.quien) D.quien = D.vend; err = ''; return pintar(); }
    guardando = true; err = ''; refrescarNav();
    try {
      if (D.fotoFile && !D.foto) { const b = $w('[data-fw="sig"]'); if (b) b.textContent = 'Subiendo foto…'; D.foto = await o.subirFoto(D.fotoFile, 'pago_' + facNorm().replace(/\D/g, '')); if (o.subirOk) D.foto = o.subirOk(D.foto); }
      const f = D.forma, d = {factura: facNorm(), fechaFac: D.fechaFac, valorFac: num(D.valorFac), forma: f, otra: D.otra.trim(), banco: f === 'Nota de crédito' ? sri(D.banco) : D.banco,
        pedido: f === 'Nota de crédito' ? sri(D.pedido) : D.pedido.trim(), valor: valorPago(), foto: D.foto, registro: D.quien, vendedor: D.vend, desde: o.desde || 'Tienda', confirmo: true};
      const r = await o.api(d);
      localStorage.setItem('fpgPto', D.pto.trim());
      (o.lista = o.lista || []).unshift(r); if (o.alGuardar) o.alGuardar(r);
      D.res = r; D.resta = Math.max(0, num(D.valorFac) - ya()); guardando = false; paso = 5; pintar();
    } catch (x) { guardando = false; err = (x && x.message) || 'No se pudo guardar. Revisa tu internet.'; pintar(); }
  }
  pintar();
}
