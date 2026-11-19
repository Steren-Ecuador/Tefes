#!/usr/bin/env python3
"""mpf2 (Diego 18-nov noche): el perfil Financiero veía TODO el panel unos segundos al abrir (hasta que llegaba su menú),
y en ese rato podía entrar a otros temas (Yadira abrió Universidad el 18-nov 12:07).
Ahora el panel queda tapado ("Cargando tu menú…") hasta saber qué ve la persona; el menú se recuerda en el equipo
para que la próxima vez salga al instante; si el servidor no responde, reintenta en vez de mostrar todo.
Uso: python3 aplicar_mpf2.py Panel.html [panel.html ...]. Idempotente."""
import sys

CSS = ('<style>/* mpf2 */html.mpf-espera body>*:not(header):not(#drawer):not(script):not(style),'
       'html.mpf-espera #tabs,html.mpf-espera .tem-nav,html.mpf-espera .tem-sub,html.mpf-espera .tem-buscar{visibility:hidden!important}'
       'html.mpf-espera body::after{content:"Cargando tu menú…";position:fixed;left:0;right:0;top:40%;text-align:center;font-size:15px;color:#64748b}</style>\n')

PAR = [
    ("  let quien = '', pedido = false;\n  function ordenar(cfg){",
     "  let quien = '', pedido = false, previo = null;   // mpf2\n"
     "  const H = document.documentElement; H.classList.add('mpf-espera');\n"
     "  const listo = () => H.classList.remove('mpf-espera');\n"
     "  function ordenar(cfg){"),
    ("  function aplicar(cfg){\n    window.MPF_CFG = cfg;\n    ordenar(cfg);\n    if (!cfg || cfg.todo || !Array.isArray(cfg.claves)) { abajo(); const t = document.getElementById('tabs'); if (t) t.dataset.mn = String(Date.now()); return; }",
     "  function aplicar(cfg, deMemoria){\n"
     "    if (!deMemoria) { try { localStorage.setItem('mpfCfg', JSON.stringify({n: quien, c: cfg})); } catch (e) {}   // mpf2\n"
     "      if (previo) { if (JSON.stringify(previo) !== JSON.stringify(cfg)) location.reload(); return; } }\n"
     "    else previo = cfg;\n"
     "    window.MPF_CFG = cfg;\n    ordenar(cfg);\n"
     "    if (!cfg || cfg.todo || !Array.isArray(cfg.claves)) { abajo(); const t = document.getElementById('tabs'); if (t) t.dataset.mn = String(Date.now()); listo(); return; }"),
    ("    abajo(); tabs.dataset.mn = String(Date.now());\n  }\n  setInterval(() => {",
     "    abajo(); tabs.dataset.mn = String(Date.now()); listo();\n  }\n  setInterval(() => {"),
    ("    const y = window.cvCtx && cvCtx.yo && cvCtx.yo(); if (!y || !y.nombre || pedido && quien === y.nombre) return;",
     "    const y = window.cvCtx && cvCtx.yo && cvCtx.yo(); if (!y || !y.nombre || !window.MN_T_REF || pedido && quien === y.nombre) return;"),
    ("    quien = y.nombre; pedido = true;\n    cvCtx.api('apiMenusPerfil', y.nombre).then(aplicar).catch(() => {});",
     "    quien = y.nombre; pedido = true;\n"
     "    if (!previo) try { const c = JSON.parse(localStorage.getItem('mpfCfg') || 'null'); if (c && c.n === quien && c.c) aplicar(c.c, true); } catch (e) {}   // mpf2: al instante con lo recordado\n"
     "    cvCtx.api('apiMenusPerfil', y.nombre).then(c => aplicar(c)).catch(() => { setTimeout(() => { pedido = false; quien = ''; }, 4000); });   // mpf2: si falla, reintenta (no muestra todo)"),
]

for ruta in sys.argv[1:]:
    s = open(ruta, encoding='utf-8').read()
    if '/* mpf2 */' in s:
        print(ruta, 'ya tenía mpf2'); continue
    for a, b in PAR:
        n = s.count(a)
        if n != 1:
            sys.exit(ruta + ': encontré ' + str(n) + ' veces: ' + a[:80])
        s = s.replace(a, b)
    i = s.index('<style>/* in1 */')
    s = s[:i] + CSS + s[i:]
    open(ruta, 'w', encoding='utf-8').write(s)
    print(ruta, 'mpf2 aplicado')
