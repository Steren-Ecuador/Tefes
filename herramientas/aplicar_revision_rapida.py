#!/usr/bin/env python3
"""rv2 (Diego 2026-10-31): revisión de diferencias más corta + sin "En vivo".
- Si el recuento cuadra con el sistema se elige "Cuadra, fue error de conteo" solo.
- Comentario opcional con Cuadra y con Vendido antes del conteo.
- Se quitan "Ajustar en el sistema" y "Sigue en revisión" (solo se ve en revisiones viejas que ya lo tenían).
- "Faltante a cargo de la tienda" pasa a "Faltante a cargo del personal"; nueva "Sobrante cargar a la tienda".
  Solo se ofrece Faltante si hay faltante y Sobrante si hay sobrante.
- Nueva "Pendiente para el próximo inventario": no se descuenta y el ítem entra en la lista del próximo Top 50 (Muestreo.gs).
- En vivo quitado: sin luz, sin lecturas, sin cuadro, fuera del buscador.
Uso: python3 aplicar_revision_rapida.py Panel.html [panel.html ...]  (idempotente)"""
import sys
R = [
("'Faltante a cargo de la tienda', 'Sigue en revisión'];",
 "'Faltante a cargo del personal', 'Sobrante cargar a la tienda', 'Pendiente para el próximo inventario', 'Sigue en revisión'];\nconst ivDecN = d => d === 'Faltante a cargo de la tienda' ? 'Faltante a cargo del personal' : d;   // nombre anterior de la decisión"),
("const INF_NO_DESC = ['Ajustar en el sistema', 'Sigue en revisión', 'Cuadra, fue error de conteo'];",
 "const INF_NO_DESC = ['Ajustar en el sistema', 'Sigue en revisión', 'Cuadra, fue error de conteo', 'Pendiente para el próximo inventario'];   // el pendiente entra solo en la lista del próximo Top 50"),
("<div class=\"an-chips\" id=\"ivDec\">${IV_DEC.map(d => `<button type=\"button\" class=\"chip${cr[10] === d ? ' on' : ''}\" data-d=",
 "<div class=\"an-chips\" id=\"ivDec\">${IV_DEC.filter(d => !['Ajustar en el sistema', 'Sigue en revisión'].includes(d) || cr[10] === d).map(d => `<button type=\"button\" class=\"chip${ivDecN(cr[10]) === d ? ' on' : ''}\" data-d="),
("let dec = o.cr ? o.cr[10] : '';", "let dec = o.cr ? ivDecN(o.cr[10]) : '';"),
("""  const marcar = () => { $('#ivDec').querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c.dataset.d === dec)); $('#ivVendBox').hidden = dec !== IV_VEND; };
  const ver = () => { const v = rec.value.trim(); if (v === '') { txt.textContent = 'Déjalo vacío si no recontaste.'; return; }""",
"""  /* rv2: con Cuadra o Vendido antes del conteo el comentario es opcional; si el recuento cuadra con el sistema se elige Cuadra solo */
  const IV_SIN_COM = [IV_DEC[0], IV_VEND];
  const marcar = () => { $('#ivDec').querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c.dataset.d === dec)); $('#ivVendBox').hidden = dec !== IV_VEND;
    const dd = rec.value.trim() !== '' ? Number(rec.value) - o.teo : o.dif;   // faltante o sobrante: solo se ofrece la decisión que corresponde
    $('#ivDec').querySelectorAll('.chip').forEach(c => { const x = c.dataset.d; c.hidden = x !== dec && (x === 'Faltante a cargo del personal' && !(dd < 0) || x === 'Sobrante cargar a la tienda' && !(dd > 0)); });
    $('#ivCom').placeholder = IV_SIN_COM.includes(dec) ? 'Comentario (opcional)' : 'Comentario: qué encontraste, con quién lo revisaste'; };
  const ver = escribio => { const v = rec.value.trim(); if (v === '') { txt.textContent = 'Déjalo vacío si no recontaste.'; marcar(); return; }"""),
("    if (d === 0 && !dec) { dec = IV_DEC[0]; marcar(); } };\n  rec.oninput = ver; ver();",
 "    if (d === 0 && (escribio || !dec || dec === IV_VEND)) dec = IV_DEC[0]; marcar(); };\n  rec.oninput = () => ver(true); ver(); marcar();"),
("      com.length < 3 ? 'Escribe un comentario corto.' : '';",
 "      dec === IV_VEND && v !== '' && Number(v) === o.teo ? 'Tu recuento ya cuadra con el sistema: elige \"Cuadra, fue error de conteo\".' :\n      !IV_SIN_COM.includes(dec) && com.length < 3 ? 'Escribe un comentario corto.' : '';"),
("function cvIniciar(){\n  if (CV.timer) return;",
 "function cvIniciar(){\n  return;   // En vivo quitado definitivamente (Diego 2026-10-31): sin luz, sin lecturas\n  if (CV.timer) return;"),
('{"t": "Inventario en vivo", "v": "inventario", "sub": "Tiendas · quién está contando ahora", "kw": "conteo vivo contando ahora", "go": () => TEM_ABRIR("#cvBox")}, ', ''),
('<details class="panel cv-box" id="cvBox"', '<details hidden class="panel cv-box" id="cvBox"'),
]
for f in sys.argv[1:]:
    s = open(f, encoding='utf-8').read()
    if 'rv2:' in s: print(f, 'ya aplicado'); continue
    for a, b in R:
        n = s.count(a)
        if n != 1: sys.exit(f'{f}: ancla encontrada {n} veces: {a[:70]!r}')
        s = s.replace(a, b)
    open(f, 'w', encoding='utf-8').write(s); print(f, 'OK')
