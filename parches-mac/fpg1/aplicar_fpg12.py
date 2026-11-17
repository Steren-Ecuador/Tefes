#!/usr/bin/env python3
"""fpg12 (Diego 17-nov): el comprobante de deUna y de la transferencia bancaria lleva SOLO números;
se avisa en el momento debajo del campo. Uso: python3 aplicar_fpg12.py archivo...  (pantallas con el asistente
y/o FormasPago.gs). Necesita fpg11 antes. Idempotente."""
import sys

PANT = [
    ("ref('Comprobante', 'maxlength=\"60\"', 'Ej.: 123456789')",
     "ref('Comprobante (solo números)', 'inputmode=\"numeric\" maxlength=\"30\"', 'Ej.: 123456789') + '<div class=\"fw-err\" id=\"fwRefAv\" style=\"margin-top:6px\" hidden></div>'"),
    ("ref('Comprobante de la transferencia', 'maxlength=\"60\"', 'N° del comprobante')",
     "ref('Comprobante de la transferencia (solo números)', 'inputmode=\"numeric\" maxlength=\"30\"', 'N° del comprobante') + '<div class=\"fw-err\" id=\"fwRefAv\" style=\"margin-top:6px\" hidden></div>'"),
    ("if (f === 'deUna' && ref.replace(/\\s/g, '').length < 4) return 'Escribe el comprobante de deUna.';",
     "if (f === 'deUna') { if (/[^\\d\\s]/.test(ref)) return 'El comprobante de deUna lleva solo números.'; if (ref.replace(/\\s/g, '').length < 4) return 'Escribe el comprobante de deUna.'; }   // fpg12"),
    ("if (ref.length < 3) return 'Escribe el comprobante de la transferencia.'; }",
     "if (/[^\\d\\s]/.test(ref)) return 'El comprobante de la transferencia lleva solo números.'; if (ref.length < 3) return 'Escribe el comprobante de la transferencia.'; }"),
    ("// fpg11\n    const b = $w('[data-fw=\"sig\"]');",
     "// fpg11\n    const ra = $w('#fwRefAv'); if (ra) { const t2 = /[^\\d\\s]/.test(D.pedido || '') ? '⚠️ El comprobante lleva solo números. Quita las letras o signos.' : ''; ra.textContent = t2; ra.hidden = !t2; const ir = $w('#fwRef'); if (ir) ir.style.borderColor = t2 ? '#dc2626' : ''; }   // fpg12\n    const b = $w('[data-fw=\"sig\"]');"),
]
GS = [
    ("if (forma === 'deUna') { ref = ref.replace(/\\s/g, ''); if (ref.length < 4)",
     "if (forma === 'deUna') { ref = ref.replace(/\\s/g, ''); if (/\\D/.test(ref)) throw new Error('El comprobante de deUna lleva solo números.'); /* fpg12 */ if (ref.length < 4)"),
    ("ref = ref.replace(/\\s/g, ''); if (ref.length < 3) throw new Error('Escribe el comprobante de la transferencia.');",
     "ref = ref.replace(/\\s/g, ''); if (/\\D/.test(ref)) throw new Error('El comprobante de la transferencia lleva solo números.'); /* fpg12 */ if (ref.length < 3) throw new Error('Escribe el comprobante de la transferencia.');"),
]

for ruta in sys.argv[1:]:
    s = open(ruta, encoding='utf-8').read()
    if 'fpg12' in s:
        print(ruta, 'ya tenía fpg12'); continue
    par = GS if ruta.endswith('.gs') else PANT
    for a, b in par:
        n = s.count(a)
        if n != 1:
            sys.exit(ruta + ': encontré ' + str(n) + ' veces: ' + a[:70])
        s = s.replace(a, b)
    open(ruta, 'w', encoding='utf-8').write(s)
    print(ruta, 'fpg12 aplicado')
