#!/usr/bin/env python3
"""pc2 (14-nov, Diego "si dale"): la caché de Políticas/Guías dura 60 min, y su clave incluye
una huella de la hoja Políticas (o Guías): si se activa, edita o agrega una, la caché se renueva al instante.
Requiere pc1. Uso: python3 aplicar_pc2.py <proyecto_clasp>/Tiendas.gs"""
import sys
p = sys.argv[1]
s = open(p, encoding='utf-8').read()
if '/* pc2 */' in s:
    print('pc2 ya aplicado'); sys.exit(0)
R = [("  try { const sh = q === 'pol' ? polHojas_().getSheetByName(POL_LECT) : ss_().getSheetByName(GUIAS_LECT); v = sh ? sh.getLastRow() : 0; } catch (err) { return f(); }",
      "  try { const L = q === 'pol' ? polHojas_() : ss_(), sh = L.getSheetByName(q === 'pol' ? POL_LECT : GUIAS_LECT), hj = L.getSheetByName(q === 'pol' ? POL_HOJA : GUIAS_HOJA);   /* pc2 */\n"
      "    v = (sh ? sh.getLastRow() : 0) + '_' + (hj ? Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, JSON.stringify(hj.getDataRange().getDisplayValues()))).slice(0, 12) : ''); } catch (err) { return f(); }"),
     ("c.putAll(H, 900); c.put(k, j, 600); }", "c.putAll(H, 3900); c.put(k, j, 3600); }   /* pc2: 60 min */")]
for a, b in R:
    n = s.count(a)
    if n != 1: sys.exit('ancla encontrada %d veces: %s' % (n, a[:70]))
    s = s.replace(a, b)
open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('pc2 aplicado')
