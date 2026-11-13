#!/usr/bin/env python3
"""e04d (Diego 12-nov): en E04 solo cuentan las transferencias desde el 1 de octubre de 2026
(igual que el filtro Desde/Hasta del panel de Transferencias). Las anteriores no restan.
Uso: python3 aplicar_e04d.py <tienda.html|Index.html>. Idempotente."""
import sys
p = sys.argv[1]; s = open(p, encoding='utf-8').read()
if '/* e04d */' in s: print('ya aplicado', p); sys.exit(0)
a = "  try { TV.d = await api('apiTransfE04'); } catch (e) { TV.error = 'No se pudo leer el ERP: ' + e.message; }\n"
assert s.count(a) == 1, 'ancla'
s = s.replace(a, a + """  if (TV.d) { /* e04d */ const desde = new Date(2026, 9, 1), f = t => { const m = String(t || '').match(/(\\d{1,2})\\/(\\d{1,2})\\/(\\d{4})/); return m ? new Date(+m[3], +m[2] - 1, +m[1]) : null; };
    const ok = x => { const d = f(x.fecha); return !d || d >= desde; };
    TV.d.dif = (TV.d.dif || []).filter(ok); TV.d.viejas = (TV.d.viejas || []).filter(ok); }
""")
open(p, 'w', encoding='utf-8').write(s); print('ok', p)
