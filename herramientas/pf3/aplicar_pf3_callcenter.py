#!/usr/bin/env python3
"""pf3 · Proformas del call center/web aparte (Diego 2026-11-11).
Los vendedores con 'Tienda en la app' (columna F de 'Vendedores POS') = 'Call center/web' (CRUIZ, MTORRES...)
sacan sus proformas de la tienda donde se hicieron: no le llegan al gerente y salen como linea propia en los numeros.
Uso: python3 aplicar_pf3_callcenter.py <carpeta proyecto_clasp>. Idempotente."""
import sys, os
C = sys.argv[1]; p = os.path.join(C, 'ProformasPOS.gs'); s = open(p, encoding='utf-8').read()
if 'pf3' in s: print('ya aplicado: ProformasPOS.gs'); sys.exit(0)
pares = [
 ("  EXTRA: ['Origen', 'Documento', 'Correo', 'Motivo', 'Último resultado', 'Fuera del POS', 'Facturada el'],",
  "  EXTRA: ['Origen', 'Documento', 'Correo', 'Motivo', 'Último resultado', 'Fuera del POS', 'Facturada el', 'Tienda POS'],\n"
  "  CC: 'Call center/web', CC_RE: /^(CRUIZ|(WEB\\d*)?MTORRES)$/i,   // pf3: vendedores de call center/web (se corrige en la columna F de Vendedores POS)"),
 ("  VEND_CAB: ['Tienda', 'Código', 'Nombre en POS', 'Persona', 'Nota'],",
  "  VEND_CAB: ['Tienda', 'Código', 'Nombre en POS', 'Persona', 'Nota', 'Tienda en la app'],"),
 ("const PX = {ORIGEN: 16, DOC: 17, CORREO: 18, MOTIVO: 19, RES: 20, FUERA: 21, FACT: 22};",
  "const PX = {ORIGEN: 16, DOC: 17, CORREO: 18, MOTIVO: 19, RES: 20, FUERA: 21, FACT: 22, TPOS: 23};"),
 ("  const M = {}; asFilas_(PF2.VEND).forEach(r => { if (r[0] && r[1]) M[r[0] + '|' + String(r[1]).trim().toUpperCase()] = nombreCorto_(r[3]) || ''; });\n  return {sh: sh, M: M};",
  "  const M = {}, T = {}; asFilas_(PF2.VEND).forEach(r => { if (r[0] && r[1]) { const k = r[0] + '|' + String(r[1]).trim().toUpperCase(); M[k] = nombreCorto_(r[3]) || ''; T[k] = String(r[5] || '').trim(); } });\n  return {sh: sh, M: M, T: T};"),
 ("      if (!(k in V.M)) { const p = pf2Adivinar_(t, nom); V.M[k] = p; nuevosV.push([t, String(cod || '').trim(), String(nom || '').trim(), p, p ? 'Automático: revisar' : 'Falta: escribir la persona']); }\n      return V.M[k]; };",
  "      if (!(k in V.M)) { const cc = PF2.CC_RE.test(String(nom || '').trim()) ? PF2.CC : '', p = pf2Adivinar_(t, nom); V.M[k] = p; V.T[k] = cc;\n"
  "        nuevosV.push([t, String(cod || '').trim(), String(nom || '').trim(), p, p ? 'Automático: revisar' : (cc ? 'Call center/web' : 'Falta: escribir la persona'), cc]); }\n"
  "      return V.M[k]; };\n"
  "    const tApp = (t, cod) => V.T[t + '|' + String(cod || '').trim().toUpperCase()] || t;   // pf3"),
 ("    F.forEach((r, i) => { if (r[PX.ORIGEN] === 'POS' && r[PX.DOC]) ya[r[PC.TIENDA] + '|' + String(r[PX.DOC]).replace(/^'/, '')] = i; });",
  "    F.forEach((r, i) => { if (r[PX.ORIGEN] === 'POS' && r[PX.DOC]) ya[(r[PX.TPOS] || r[PC.TIENDA]) + '|' + String(r[PX.DOC]).replace(/^'/, '')] = i; });"),
 ("      const per = persona(t, r[6], r[7]);\n      if (k in ya) { const i = ya[k], f = F[i];   // completar datos que antes no venían\n",
  "      const per = persona(t, r[6], r[7]), ta = tApp(t, r[6]);\n      if (k in ya) { const i = ya[k], f = F[i];   // completar datos que antes no venían\n"
  "        if (ta !== t && f[PC.TIENDA] === t) { set(i, PC.TIENDA, ta); set(i, PX.TPOS, t); f[PC.TIENDA] = ta; f[PX.TPOS] = t; if (per) { set(i, PC.ASESOR, per); f[PC.ASESOR] = per; } }   // pf3: pasa a call center\n"),
 ("      fila[PC.ID] = 'PV' + doc; fila[PC.FECHA] = \"'\" + creado; fila[PC.HORA] = ''; fila[PC.TIENDA] = t; fila[PC.ASESOR] = per;",
  "      fila[PC.ID] = 'PV' + doc + (ta !== t ? '-' + pf2Slug_(t).slice(0, 4) : ''); fila[PC.FECHA] = \"'\" + creado; fila[PC.HORA] = ''; fila[PC.TIENDA] = ta; fila[PC.ASESOR] = per;\n"
  "      if (ta !== t) fila[PX.TPOS] = t;"),
 ("      const t = r[PC.TIENDA], doc = String(r[PX.DOC]).replace(/^'/, ''), k = t + '|' + doc;",
  "      const t = r[PX.TPOS] || r[PC.TIENDA], doc = String(r[PX.DOC]).replace(/^'/, ''), k = t + '|' + doc;"),
 ("    if (nuevosV.length) V.sh.getRange(V.sh.getLastRow() + 1, 1, nuevosV.length, PF2.VEND_CAB.length).setValues(nuevosV);",
  "    if (nuevosV.length) V.sh.getRange(V.sh.getLastRow() + 1, 1, nuevosV.length, PF2.VEND_CAB.length).setValues(nuevosV);   // pf3: 6 columnas"),
]
pares += [
 ("const pf2Slug_ = s =>", "const pf2Tienda_ = t => { t = String(t || '').trim(); return /^mall\\s+(el\\s+)?jard/i.test(t) ? 'Mall Jardín' : t; };   // pf3: el POS a veces dice 'Mall El Jardín'\nconst pf2Slug_ = s =>"),
 ("    const POS = asFilas_(PF2.POS); if (!POS.length) return;", "    const POS = asFilas_(PF2.POS).map(r => { r[1] = pf2Tienda_(r[1]); return r; }); if (!POS.length) return;"),
 ("if (r[0] && r[1]) { const k = r[0] + '|'", "if (r[0] && r[1]) { const k = pf2Tienda_(r[0]) + '|'"),
]
for a, b in pares:
    if s.count(a) != 1: sys.exit('FALTA ancla en ProformasPOS.gs (%d veces): %s' % (s.count(a), a[:90]))
    s = s.replace(a, b)
open(p, 'w', encoding='utf-8').write(s); print('OK ProformasPOS.gs (pf3 call center)')
