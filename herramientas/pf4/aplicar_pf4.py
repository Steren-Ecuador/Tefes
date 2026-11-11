#!/usr/bin/env python3
"""pf4 · Proformas del call center en Avisos (2026-11-11). Copia ProformasCC.gs, separa pf2Seguir_ en ProformasPOS.gs
y habilita apiPFCC / apiPFCCSeguir en PortalApi.gs. Uso: python3 aplicar_pf4.py <proyecto_clasp> <kit>. Idempotente."""
import sys, os, shutil
C, K = sys.argv[1], sys.argv[2]
def parche(nombre, pares, marca):
    p = os.path.join(C, nombre); s = open(p, encoding='utf-8').read()
    if marca in s: print('ya aplicado:', nombre); return
    for a, b in pares:
        if s.count(a) != 1: sys.exit('FALTA ancla en %s (%d veces): %s' % (nombre, s.count(a), a[:90]))
        s = s.replace(a, b)
    open(p, 'w', encoding='utf-8').write(s); print('OK', nombre)
if 'pf3' not in open(os.path.join(C, 'ProformasPOS.gs'), encoding='utf-8').read(): sys.exit('FALTA pf3 en ProformasPOS.gs: no sigo')
shutil.copyfile(os.path.join(K, 'ProformasCC.gs'), os.path.join(C, 'ProformasCC.gs')); print('OK ProformasCC.gs')
parche('ProformasPOS.gs', [
 ("function apiPFSeguir(token, id, persona, d) {\n  const tienda = exigirTienda_(token).nombre; d = d || {};",
  "function apiPFSeguir(token, id, persona, d) { return pf2Seguir_(exigirTienda_(token).nombre, id, persona, d, true); }\n"
  "/** pf4: lo usan el asesor (solo las suyas) y el call center (todas las de su 'tienda') */\n"
  "function pf2Seguir_(tienda, id, persona, d, soloMias) {\n  d = d || {};"),
 ("if (r[PC.TIENDA] !== tienda || nombreCorto_(r[PC.ASESOR]) !== persona) throw new Error('Esa proforma no es tuya.');",
  "if (r[PC.TIENDA] !== tienda || (soloMias && nombreCorto_(r[PC.ASESOR]) !== persona)) throw new Error('Esa proforma no es tuya.');"),
], 'pf2Seguir_')
parche('PortalApi.gs', [("  apiPFPanel: (a) => apiPFPanel(...a),   // pf2\n",
  "  apiPFPanel: (a) => apiPFPanel(...a),   // pf2\n  apiPFCC: (a) => apiPFCC(...a),   // pf4 (ProformasCC.gs)\n  apiPFCCSeguir: (a) => apiPFCCSeguir(...a),   // pf4\n")], 'pf4')
