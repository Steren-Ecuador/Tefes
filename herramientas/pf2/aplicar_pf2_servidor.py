#!/usr/bin/env python3
"""pf2 · Servidor: copia ProformasPOS.gs a proyecto_clasp, cambia apiAsesor (Asesores.gs) y habilita las 5 funciones nuevas en PortalApi.gs.
Uso: python3 aplicar_pf2_servidor.py <carpeta proyecto_clasp> <carpeta del kit>. Idempotente."""
import sys, os, shutil
C, K = sys.argv[1], sys.argv[2]
def parche(nombre, pares, marca):
    p = os.path.join(C, nombre); s = open(p, encoding='utf-8').read()
    if marca in s: print('ya aplicado:', nombre); return
    for a, b in pares:
        if s.count(a) != 1: sys.exit('FALTA ancla en %s (%d veces): %s' % (nombre, s.count(a), a[:90]))
        s = s.replace(a, b)
    open(p, 'w', encoding='utf-8').write(s); print('OK', nombre)
shutil.copyfile(os.path.join(K, 'ProformasPOS.gs'), os.path.join(C, 'ProformasPOS.gs')); print('OK ProformasPOS.gs')
parche('Asesores.gs', [("proformas: yo ? asProformas_(tienda, yo.nombre) : [],",
                        "proformas: yo ? asProformas2_(tienda, yo.nombre) : [], pf: yo ? (function () { try { return pfJuego_(tienda, yo.nombre); } catch (e) { return null; } })() : null,   /* pf2 */")], 'pf2')
parche('PortalApi.gs', [("  apiPFEstado: (a) => apiPFEstado(...a),\n",
                         "  apiPFEstado: (a) => apiPFEstado(...a),\n  apiPFSeguir: (a) => apiPFSeguir(...a),   // pf2 (ProformasPOS.gs)\n  apiPFTienda: (a) => apiPFTienda(...a),   // pf2\n  apiPFReasignar: (a) => apiPFReasignar(...a),   // pf2\n  apiPFPanel: (a) => apiPFPanel(...a),   // pf2\n")], 'pf2')
