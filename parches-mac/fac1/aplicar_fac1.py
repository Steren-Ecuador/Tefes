"""fac1 (22-nov-2026, Diego): en la app de tienda, Facturas de autoconsumo sale de Inventario y pasa a Formas de pago
como tercera opcion (Transferencia | Otras | Autoconsumos), con iconos en las tres opciones.
Uso: python3 aplicar_fac1.py Index.html   (o tienda.html / prueba/tienda.html; idempotente)"""
import sys
p = sys.argv[1]; s = open(p, encoding='utf-8').read()
if '/* fac1 */' in s:
    print('ya estaba', p); sys.exit(0)
def rep(a, b, n=1):
    global s
    assert s.count(a) == n, (a[:70], s.count(a)); s = s.replace(a, b)
I = lambda d: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>'
TR = I('<path d="M4 8h13l-3.5-3.5"/><path d="M20 16H7l3.5 3.5"/>')
OT = I('<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>')
AC = I('<path d="M5 8h14l-1.2 12H6.2z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>')
# 1) opciones con icono
rep("const FPG_GRUPOS = [['tr', 'Transferencias'], ['ot', 'Otros']];   // fpg8",
    "const FPG_GRUPOS = [['tr', 'Transferencia', '" + TR + "'], ['ot', 'Otras', '" + OT + "'], ['ac', 'Autoconsumos', '" + AC + "']];   // fpg8 + fac1 */ /* fac1 */")
rep("FPG_GRUPOS.map(([k, l]) => '<button data-fpgg=\"' + k + '\" class=\"' + (k === G ? 'on' : '') + '\" style=\"flex:1\">' + l + '</button>').join('') + '</div>';",
    "FPG_GRUPOS.map(([k, l, ic]) => '<button data-fpgg=\"' + k + '\" class=\"' + (k === G ? 'on' : '') + '\" style=\"flex:1\">' + (ic || '') + '<span>' + l + '</span></button>').join('') + '</div>';\n  if (G === 'ac') return h + aucHtml();   // fac1: Autoconsumos dentro de Formas de pago")
# 2) enlazar autoconsumo cuando se ve esa opcion
rep("function fpgEnlazar(){\n  fpgPosEnlazar();   // fpg21",
    "function fpgEnlazar(){\n  if ((FPGS.grupo || 'tr') === 'ac') { aucEnlazar(); document.querySelectorAll('[data-fpgg]').forEach(b => b.onclick = () => { FPGS.grupo = b.dataset.fpgg; FPGS.todos = false; renderPago(); }); return; }   // fac1\n  fpgPosEnlazar();   // fpg21")
# 3) fuera de Inventario
rep("$('#main').innerHTML = vfHtml() + aucHtml() + inventarioHtml() + informesInvHtml();",
    "$('#main').innerHTML = vfHtml() + inventarioHtml() + informesInvHtml();   /* fac1: autoconsumo pasa a Formas de pago */")
# 4) al cargar o registrar, repintar la pantalla donde esta ahora
rep(".finally(() => { AUCS.cargando = false; if (S.vista === 'inv') renderInv(); });",
    ".finally(() => { AUCS.cargando = false; aucRepintar(); });")
rep("const re = $('#aucRe'); if (re) re.onclick = () => { AUCS.error = ''; AUCS.lista = null; renderInv(); };",
    "const re = $('#aucRe'); if (re) re.onclick = () => { AUCS.error = ''; AUCS.lista = null; aucRepintar(); };")
rep("closeModal(); toast('Registrada. Queda por autorizar.', 3500); renderInv();",
    "closeModal(); toast('Registrada. Queda por autorizar.', 3500); aucRepintar();")
rep("function aucEnlazar(){", "function aucRepintar(){ if (S.vista === 'pago') renderPago(); else if (S.vista === 'inv') renderInv(); }   // fac1\nfunction aucEnlazar(){")
# 5) estilo de la barra con iconos
k = s.rindex('</body>')
s = s[:k] + '<style>/* fac1 */.fpg-seg{border:0!important;gap:8px;overflow:visible!important}.fpg-seg button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;padding:10px 4px 9px;font-size:13.5px;line-height:1.1;border:1px solid var(--line)!important;border-radius:14px;background:#fff;color:#002F57;box-shadow:0 1px 3px rgba(0,47,87,.08)}.fpg-seg button svg{flex:none;width:34px;height:34px;padding:8px;border-radius:50%;background:#E5F7FC;color:#006B9E;box-sizing:border-box}.fpg-seg button span{white-space:nowrap}.fpg-seg button.on{background:#002F57;color:#fff;border-color:#002F57!important;box-shadow:0 6px 16px rgba(0,47,87,.25)}.fpg-seg button.on svg{background:rgba(255,255,255,.16);color:#fff}@media(max-width:380px){.fpg-seg button{font-size:12px}}</style>\n' + s[k:]
open(p, 'w', encoding='utf-8').write(s)
print('ok fac1', p)
