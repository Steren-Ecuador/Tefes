#!/usr/bin/env python3
"""fl1 (20-nov, Diego: "necesitamos saber qué pasa para poder corregir"): el admin anota cada falla del conector de Google
(hora, herramienta, rango, código y cuántas lecturas hizo el panel en el último minuto) en la db del artefacto, colección 'fallas'.
No usa Sheets para anotar (no gasta cupo). Solo admin. Uso: python3 aplicar_fl1.py admin.html  (idempotente)"""
import sys
A = "  st.mcp = await window.claude?.use?.('mcp') ?? null;\n"
B = A + r"""  if (st.mcp) { /* fl1: registro de fallas de Google */
    const m0 = st.mcp, w = {}, hist = [], cola = []; let db = null, esc_ = false;
    Object.getOwnPropertyNames(m0).forEach(k => { const v = m0[k]; w[k] = typeof v === 'function' ? v.bind(m0) : v; });
    const anotar = async x => { cola.push(x); if (esc_) return; esc_ = true;
      try { db = db || await window.claude.use('db'); while (db && cola.length) { const f = cola.shift(); await db.collection('fallas').doc(f.t.replace(/[:.]/g, '-') + '-' + Math.random().toString(36).slice(2, 6)).set(f); } } catch (_) {}
      esc_ = false; };
    w.callTool = async (srv, tool, args, opt) => { const t0 = Date.now(); hist.push(t0); while (hist.length && hist[0] < t0 - 60000) hist.shift();
      try { return await m0.callTool(srv, tool, args, opt); }
      catch (e) { const a = args || {}; anotar({t: new Date().toISOString(), srv, tool, rango: String(a.range || (a.ranges || []).join(' ; ') || '').slice(0, 300),
          code: String((e && e.code) || ''), msg: String((e && e.message) || '').slice(0, 300) + ' ' + JSON.stringify((e && e.result) || '').slice(0, 300),
          ms: Date.now() - t0, lecturas1min: hist.length, vista: (document.querySelector('.view:not([hidden])') || {}).dataset ? document.querySelector('.view:not([hidden])').dataset.view : ''}); throw e; } };
    st.mcp = w; }
"""
for p in sys.argv[1:]:
    s = open(p, encoding='utf-8').read()
    if '/* fl1' in s: print('ya', p); continue
    if s.count(A) != 1: sys.exit(p + ': ancla %d' % s.count(A))
    s = s.replace(A, B); open(p, 'w', encoding='utf-8', newline='\n').write(s); print('ok', p)
