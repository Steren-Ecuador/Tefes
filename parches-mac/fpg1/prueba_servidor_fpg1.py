#!/usr/bin/env python3
"""fpg1: funciones simuladas de Formas de pago en el entorno de pruebas (prueba/servidor.js del repo Tefes).
Uso: python3 prueba_servidor_fpg1.py <repo>/prueba/servidor.js"""
import sys
p = sys.argv[1]
s = open(p, encoding='utf-8').read()
if 'fpg1' in s:
    print('ya aplicado'); sys.exit()
a = "  API.apiAutoconsumoPanel = function (p) { panelOk(p); return acTab().slice(1); };\n"
b = a + r"""  /* fpg1: formas de pago de facturas del POS (en la prueba la bitácora vive en memoria) */
  var FPG_FORMAS = ['Tarjeta de crédito', 'Tarjeta de débito', 'Transferencia', 'Steren Card', 'Shopping Dólares', 'Crédito directo', 'Cheque', 'Efectivo', 'Otra'], FPG_BIT = [];
  var FPG_CAB = ['ID', 'Fecha registro', 'Hora', 'Tienda', 'Registró', 'Desde', 'N° factura', 'Forma de pago', 'N° de pedido', 'Valor con IVA', 'Cliente', 'Valor de la factura', 'Foto', 'Entregado', 'N° recibo', 'Marcó entrega', 'Estado', 'Anuló', 'Motivo anulación'];
  function fpTab() { try { return DB.hoja('Formas de pago'); } catch (e) {} DB.escribir('Formas de pago!A1:S1', [FPG_CAB]); return DB.hoja('Formas de pago'); }
  function fpObj(r) { return {id: r[0], fecha: S(r[1]), hora: S(r[2]), tienda: r[3], registro: r[4], registroVer: r[4], desde: r[5], factura: S(r[6]), forma: r[7], pedido: S(r[8]), valor: N(r[9]) || 0, cliente: S(r[10]), valorFac: N(r[11]) || 0, foto: S(r[12]), entregado: S(r[13]), recibo: S(r[14]), marco: S(r[15]), estado: S(r[16]) || 'Vigente', anulo: S(r[17]), motivoAnula: S(r[18])}; }
  var fpOrden = function (a, b) { return (b.fecha + b.hora).localeCompare(a.fecha + a.hora); };
  function fpLog(acc, o, q, desde, det) { var d = new Date(); FPG_BIT.unshift({fecha: DB.isoDe(d), hora: DB.hm(d), accion: acc, id: o ? o.id : '', tienda: o ? o.tienda : '', quien: String(q || '').split('#')[0], desde: desde, detalle: det || ''}); }
  function fpPoner(i, f) { while (f.length < 19) f.push(''); DB.escribir('Formas de pago!A' + (i + 1) + ':S' + (i + 1), [f]); return fpObj(f); }
  API.apiFPGLista = function (tok) { var t = tiendaDe(tok); return {formas: FPG_FORMAS, hoy: DB.isoDe(new Date()), lista: fpTab().slice(1).map(fpObj).filter(function (x) { return x.tienda === t; }).sort(fpOrden)}; };
  API.apiFPGRegistrar = function (tok, d) {
    var t = tiendaDe(tok), dd = new Date(), L = fpTab(), sol = function (x) { return S(x).replace(/\D/g, ''); };
    if (FPG_FORMAS.indexOf(d.forma) < 0) throw new Error('Elige la forma de pago.');
    if (L.slice(1).some(function (r) { return r[3] === t && sol(r[6]) === sol(d.factura) && r[7] === d.forma && r[16] !== 'Anulada'; })) throw new Error('Esa factura ya tiene registrada la forma de pago ' + d.forma + '.');
    var fila = ['FP' + String(10000 + L.length), DB.isoDe(dd), DB.hm(dd), t, d.registro, d.desde === 'Asesor' ? 'Asesor' : 'Tienda', d.factura, d.forma, d.pedido, String(d.valor), d.cliente || '', d.valorFac ? String(d.valorFac) : '', d.foto || '', '', '', '', 'Vigente', '', ''];
    DB.agregar('Formas de pago', fila); var o = fpObj(fila); fpLog('Registro', o, d.registro, fila[5], 'Fact. ' + o.factura + ' · ' + o.forma + ' · $' + o.valor); return o;
  };
  function fpAnular(id, q, desde, mot) { var H = fpTab(), i = H.findIndex(function (r) { return r[0] === id; }); if (i < 1) throw new Error('No encontré el registro.');
    var f = H[i].slice(); f[16] = 'Anulada'; f[17] = String(q).split('#')[0]; f[18] = mot; var o = fpPoner(i, f); fpLog('Anulación', o, q, desde, 'Motivo: ' + mot); return o; }
  API.apiFPGAnularTienda = function (tok, id, per, mot) { tiendaDe(tok); return fpAnular(id, per, 'Tienda', mot); };
  API.apiFPGAnularPanel = function (p, q, id, mot) { panelOk(p); return fpAnular(id, q, 'Panel', mot); };
  API.apiFPGEntregar = function (p, q, ids, rec) { panelOk(p); var H = fpTab(), out = [], hoy = DB.isoDe(new Date());
    H.forEach(function (r, i) { if (i && ids.indexOf(r[0]) >= 0) { var f = r.slice(); f[13] = rec ? hoy : ''; f[14] = rec || ''; f[15] = rec ? String(q).split('#')[0] : ''; var o = fpPoner(i, f); fpLog('Entrega', o, q, 'Panel', 'Recibo ' + rec); out.push(o); } });
    return out; };
  API.apiFPGPanel = function (p, q) { panelOk(p); fpLog('Consulta', null, q, 'Panel', ''); return {formas: FPG_FORMAS, lista: fpTab().slice(1).map(fpObj).sort(fpOrden), integridad: {ok: true, lineas: FPG_BIT.length, rotas: [], cambiadas: []}}; };
  API.apiFPGBitacora = function (p) { panelOk(p); return FPG_BIT.slice(); };
  API.apiFPGExporto = function (p, q, det) { panelOk(p); fpLog('Exportación', null, q, 'Panel', det); return true; };
"""
if s.count(a) != 1: sys.exit('ancla')
open(p, 'w', encoding='utf-8').write(s.replace(a, b))
print('ok', p)
