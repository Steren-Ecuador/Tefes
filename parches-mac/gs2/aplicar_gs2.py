#!/usr/bin/env python3
"""gs2 (20-nov): al validar/cerrar un pendiente, si lo guardado ya quedó pero la recarga de la lista falla,
ya no sale "Google Sheets no respondió": se avisa que quedó guardado y la lista se recarga sola en 20 s.
En el admin, la lectura previa de la fila también se reintenta (3 veces).
Uso: python3 aplicar_gs2.py admin.html|Panel.html [...]   (idempotente)"""
import sys
RECARGA = ("try { await cargar(true); } catch (e2) { toast('Guardado ✓. La lista se actualiza en unos segundos.', 5000); "
           "setTimeout(() => { try { Promise.resolve(cargar(true)).catch(() => {}); } catch (_) {} }, 20000); return; }   /* gs2 */")
for p in sys.argv[1:]:
    s = open(p, encoding='utf-8').read()
    if '/* gs2 */' in s: print('ya', p); continue
    i = s.find('async function guardarEstado(')
    if i < 0 or s.count('async function guardarEstado(') != 1: sys.exit(p + ': guardarEstado')
    j = s.find('\n}\n', i); cuerpo = s[i:j]
    a = "    $('#drawer').innerHTML = '';\n    await cargar(true);\n"
    if cuerpo.count(a) != 1: sys.exit(p + ': recarga %d veces' % cuerpo.count(a))
    cuerpo = cuerpo.replace(a, "    $('#drawer').innerHTML = '';\n    " + RECARGA + "\n")
    b = "const filas = await getRange('Pendientes!A1:W', true);"
    if b in cuerpo:   # admin
        cuerpo = cuerpo.replace(b, "let filas; for (let k = 0; ; k++) { try { filas = await getRange('Pendientes!A1:W', true); break; } catch (e3) { if (k >= 2 || !(['server_unavailable', 'upstream_error', 'rate_limited', 'timeout'].includes(e3 && e3.code) || (e3 && e3.retryable))) throw e3; if (btn) btn.textContent = 'Google tardó, reintentando…'; await new Promise(ok => setTimeout(ok, [2000, 5000][k])); } }   // gs2")
    s = s[:i] + cuerpo + s[j:]
    open(p, 'w', encoding='utf-8', newline='\n').write(s); print('ok', p)
