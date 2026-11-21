"""mfp1 (21-nov-2026): Formas de pago es menu propio en 'Menus por perfil' (claves formaspago/tr y formaspago/ot).
Uso: python3 aplicar_mfp1.py Panel.html  (idempotente; la clave vieja ventas/formaspago sigue valiendo para Financiero)."""
import sys
p = sys.argv[1]; s = open(p, encoding='utf-8').read()
if '/* mfp1 */' in s:
    print('ya estaba'); sys.exit(0)
A = "'formaspago|': 'ventas/formaspago', 'formaspago|tr': 'ventas/formaspago', 'formaspago|ot': 'ventas/formaspago'};"
B = "'formaspago|': 'formaspago/tr', 'formaspago|tr': 'formaspago/tr', 'formaspago|ot': 'formaspago/ot'};   /* mfp1 */"
C = "if (A.has('hoy/hoy')) ['validacion', 'supervision', 'ventas', 'actividades'].forEach(x => A.add('inicio/' + x));"
D = C + "\n    if (A.has('ventas/formaspago')) ['tr', 'ot'].forEach(x => A.add('formaspago/' + x));   // mfp1: clave vieja (Financiero)"
assert s.count(A) == 1 and s.count(C) == 1, 'no encontre los textos esperados; no cambie nada'
s = s.replace(A, B).replace(C, D)
open(p, 'w', encoding='utf-8').write(s); print('ok mfp1')
