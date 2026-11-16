#!/usr/bin/env python3
"""fpg1 (Diego 16-nov): servidor de Formas de pago + perfil Financiero.
- Copia FormasPago.gs (junto a este script) a proyecto_clasp.
- PortalApi.gs: apiFPGLista, apiFPGRegistrar, apiFPGPanel.
- MenusPerfil.gs: perfil Financiero sin filas en 'Menús por perfil' => ve solo Ventas › Formas de pago (nunca todo).
- IngresoPrueba.gs: quien tenga Perfil = Financiero en la pestaña Supervisores entra como "Financiero" y va al panel.
Uso: python3 aplicar_fpg1_gs.py <carpeta proyecto_clasp>"""
import os, shutil, sys

d = sys.argv[1]
aqui = os.path.dirname(os.path.abspath(__file__))

def parchar(nombre, pares):
    p = os.path.join(d, nombre)
    s = open(p, encoding='utf-8').read()
    if 'fpg1' in s:
        print('ya aplicado', nombre); return
    for a, b in pares:
        c = s.count(a)
        if c != 1: sys.exit('ancla %d veces en %s: %s' % (c, nombre, a[:80]))
        s = s.replace(a, b)
    open(p, 'w', encoding='utf-8').write(s)
    print('ok', nombre)

shutil.copyfile(os.path.join(aqui, 'FormasPago.gs'), os.path.join(d, 'FormasPago.gs'))
print('ok FormasPago.gs')

parchar('PortalApi.gs', [(
    "  apiAutoconsumoPanel: (a) => apiAutoconsumoPanel(...a),   // aco1\n",
    "  apiAutoconsumoPanel: (a) => apiAutoconsumoPanel(...a),   // aco1\n"
    "  apiFPGLista: (a) => apiFPGLista(...a),   // fpg1 (FormasPago.gs)\n"
    "  apiFPGRegistrar: (a) => apiFPGRegistrar(...a),   // fpg1\n"
    "  apiFPGPanel: (a) => apiFPGPanel(...a),   // fpg1\n"
    "  apiFPGEntregar: (a) => apiFPGEntregar(...a),   // fpg1\n"
    "  apiFPGAnularTienda: (a) => apiFPGAnularTienda(...a),   // fpg1\n"
    "  apiFPGAnularPanel: (a) => apiFPGAnularPanel(...a),   // fpg1\n"
    "  apiFPGBitacora: (a) => apiFPGBitacora(...a),   // fpg1\n"
    "  apiFPGExporto: (a) => apiFPGExporto(...a),   // fpg1\n")])

parchar('MenusPerfil.gs', [(
    "    if (/^admin/i.test(perfil) || !R.length) return {perfil: perfil, todo: true, orden: orden};",
    "    if (/^financ/i.test(perfil) && !R.length) return {perfil: perfil, todo: false, orden: ['ventas/formaspago'], claves: ['ventas/formaspago']};   // fpg1\n"
    "    if (/^admin/i.test(perfil) || !R.length) return {perfil: perfil, todo: true, orden: orden};")])

parchar('IngresoPrueba.gs', [
    ("    const t = tabla[perfil];\n    if (t && t.activo)",
     "    const t = tabla[perfil] || (perfil === 'Financiero' ? {activo: true, ve: 'Formas de pago de las facturas del POS, todas las tiendas', hace: 'Consultar, filtrar y exportar'} : null);   // fpg1\n    if (t && t.activo)"),
    ("  if (s) usa('Supervisores', 'Tiendas: ' + etiqTiendas_(s.tiendas) + ' · ' + s.permiso, {sup: s.nombre});",
     "  if (s && /^financ/i.test(String(apiMenusPerfil(s.nombre).perfil || ''))) usa('Financiero', 'Todas las tiendas', {sup: s.nombre});   // fpg1\n"
     "  else if (s) usa('Supervisores', 'Tiendas: ' + etiqTiendas_(s.tiendas) + ' · ' + s.permiso, {sup: s.nombre});"),
    ("    if ((p.perfil === 'Supervisores' || p.perfil === 'Gerentes') && clave('__PANEL__')",
     "    if ((p.perfil === 'Supervisores' || p.perfil === 'Gerentes' || p.perfil === 'Financiero') && clave('__PANEL__')   /* fpg1 */"),
])
