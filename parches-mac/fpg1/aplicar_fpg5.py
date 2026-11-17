#!/usr/bin/env python3
"""fpg5 (Diego 16-nov): el registro de formas de pago pasa a ser un ASISTENTE DE 4 PASOS (wizard_fpg5.js) con reglas contables.
Se aplica DESPUÉS de fpg1, fpg2 y fpg4. Uso: python3 aplicar_fpg5.py <archivo> ... (Index.html, tienda.html, asesor.html, Panel.html, panel.html, prueba/servidor.js)
Necesita wizard_fpg5.js y FormasPago.gs (para fpgValidar_) en la misma carpeta que este script."""
import sys, os, re
AQUI = os.path.dirname(os.path.abspath(__file__))
WIZ = open(os.path.join(AQUI, 'wizard_fpg5.js'), encoding='utf-8').read()
GS = open(os.path.join(AQUI, 'FormasPago.gs'), encoding='utf-8').read()
VAL = GS[GS.index('/* fpg5: VALIDACIÓN CONTABLE'):GS.index('\nfunction apiFPGRegistrar(')]

def entre(s, a, b, nuevo):
    i = s.index(a); j = s.index(b, i); return s[:i] + nuevo + s[j:]

def tienda(s):
    s = entre(s, 'function fpgFormulario(){', '\nfunction renderInv(){', WIZ + r"""function fpgFormulario(){   // fpg5: asistente de 4 pasos
  fpgWizard({api: d => api('apiFPGRegistrar', d), subirFoto: async (f, n) => (await api('apiSubirFoto', await reducirFoto(f, 'Pago ' + n.replace(/\D/g, '')), n)), subirOk: r => (r && r.url) || r,
    formas: FPGS.formas, prefijo: FPGS.prefijo, hoy: FPGS.hoy || (S.data && S.data.hoy), lista: (FPGS.lista || []).slice(), quienHtml: vfQuien('fwQuien'), desde: 'Tienda',
    alGuardar: r => { if (window.REG) REG.ev('Forma de pago', r.id + ' · ' + r.factura); FPGS.lista = [r].concat((FPGS.lista || []).filter(x => x.id !== r.id)); if (S.vista === 'pago') renderPago(); }});
}""")
    a = "FPGS.formas = (r && r.formas) || [];"
    assert s.count(a) == 1, 'tienda formas'; s = s.replace(a, a + " FPGS.prefijo = (r && r.prefijo) || '';")
    a = "Registra aquí la factura del POS con su forma de pago, el n.º de pedido o comprobante y el valor con IVA (por ejemplo, lo pagado con Shopping Dólares).</p>'"
    if s.count(a) == 1: s = s.replace(a, "Cada vez que un cliente pague con deUna, transferencia, Tipti o vales, regístralo aquí en 4 pasos: factura, forma de pago, datos del pago y confirmar.</p>'")
    return s

def asesor(s):
    s = entre(s, 'function formPago(){', '\nfunction buscarCat(', WIZ + r"""function formPago(){   // fpg5: asistente de 4 pasos
  fpgWizard({api: d => llamar('apiFPGRegistrar', TOKEN, d), subirFoto: (f, n) => fpgFoto(f).then(u => llamar('apiSubirFoto', TOKEN, u, n)).then(r => (r && r.url) || r),
    formas: FPG.formas, prefijo: FPG.prefijo, hoy: FPG.hoy, lista: (FPG.lista || []).slice(), quienFijo: YO.nombre, desde: 'Asesor',
    alGuardar: r => { FPG.lista = [r].concat((FPG.lista || []).filter(x => x.id !== r.id)); renderCli(); }});
}""")
    a = "FPG.formas = (r && r.formas) || [];"
    assert s.count(a) == 1, 'asesor formas'; s = s.replace(a, a + " FPG.prefijo = (r && r.prefijo) || '';")
    return s

def panel(s):
    R = [("'N° factura', 'Forma de pago', 'Detalle otra'", "'N° factura', 'Fecha factura', 'Forma de pago', 'Detalle otra'"),
         ("x.tienda, x.factura, x.forma, x.otra || ''", "x.tienda, x.factura, x.fechaFac || '', x.forma, x.otra || ''"),
         ("e(x.factura) + (x.cliente ? '<small>' + e(x.cliente) + '</small>' : '')", "e(x.factura) + (x.fechaFac ? '<small>del ' + fCorta(x.fechaFac) + '</small>' : '') + (x.cliente ? '<small>' + e(x.cliente) + '</small>' : '')")]
    for a, n in R:
        assert s.count(a) == 1, 'panel ' + a[:40]; s = s.replace(a, n)
    return s

def prueba(s):
    R = [("'Detalle otra', 'Banco'];", "'Detalle otra', 'Banco', 'Fecha factura'];"),
         ("DB.escribir('Formas de pago!A1:U1', [FPG_CAB]);", "DB.escribir('Formas de pago!A1:V1', [FPG_CAB]);"),
         ("banco: S(r[20])};", "banco: S(r[20]), fechaFac: S(r[21])};"),
         ("while (f.length < 21) f.push(''); DB.escribir('Formas de pago!A' + (i + 1) + ':U' + (i + 1), [f]);", "while (f.length < 22) f.push(''); DB.escribir('Formas de pago!A' + (i + 1) + ':V' + (i + 1), [f]);"),
         ("'Tienda', x[0], 'Shopping Dólares - Condado', x[4], x[2], 'Cliente de ejemplo ' + (i + 1), x[3], '', ent ? hy : '', ent ? x[5] : '', ent ? 'Financiero' : '', 'Vigente', '', '', ''];",
          "'Tienda', '010-001-00000' + x[0], 'Shopping Dólares - Condado', x[4], x[2], 'Cliente de ejemplo ' + (i + 1), x[3], '', ent ? hy : '', ent ? x[5] : '', ent ? 'Financiero' : '', 'Vigente', '', '', '', '', ay];"),
         ("return {formas: fpDe(t), hoy: DB.isoDe(new Date()),", "return {formas: fpDe(t), hoy: DB.isoDe(new Date()), prefijo: t === 'Condado' ? '010-001' : '',")]
    for a, n in R:
        assert s.count(a) == 1, 'prueba ' + a[:50]; s = s.replace(a, n)
    nuevo = "  /* fpg5: misma validación contable que el servidor (copiada de FormasPago.gs) */\n" + VAL + r"""
  API.apiFPGRegistrar = function (tok, d) {
    var t = tiendaDe(tok), dd = new Date(), L = fpTab();
    if (!d.registro) throw new Error('Elige tu nombre.'); if (d.confirmo !== true) throw new Error('Confirma que revisaste los datos.');
    if (/^data:/.test(S(d.foto))) d.foto = 'https://drive.google.com/prueba-foto';   // en la prueba la foto no se sube
    var v = fpgValidar_(d, t, L.slice(1).map(fpObj), DB.isoDe(dd), fpDe(t));
    var fila = ['FP' + String(10000 + L.length), DB.isoDe(dd), DB.hm(dd), t, d.registro, d.desde === 'Asesor' ? 'Asesor' : 'Tienda', v.factura, v.forma, v.pedido, String(v.valor), v.cliente, String(v.valorFac), v.foto, '', '', '', 'Vigente', '', '', v.otra, v.banco, v.fechaFac];
    DB.agregar('Formas de pago', fila); var o = fpObj(fila); fpLog('Registro', o, d.registro, fila[5], 'Fact. ' + o.factura + ' · ' + o.forma + ' · $' + o.valor); return o;
  };
"""
    return entre(s, '  API.apiFPGRegistrar = function (tok, d) {', '  function fpAnular(', nuevo)

for p in sys.argv[1:]:
    s = open(p, encoding='utf-8').read(); b = os.path.basename(p)
    if 'fpg5' in s: print('ya aplicado', p); continue
    s = prueba(s) if b == 'servidor.js' else asesor(s) if b == 'asesor.html' else panel(s) if b.lower() == 'panel.html' else tienda(s)
    open(p, 'w', encoding='utf-8').write(s); print('ok', p)
