"""emx1 · Copia el estilo Steren México dentro de cada página (idempotente).
Uso: python3 herramientas/estilo-mx/aplicar.py tienda.html prueba/tienda.html ...
     python3 herramientas/estilo-mx/aplicar.py --panel panel.html ...   (paneles: estilo-mx-panel.css, sin el contador)
Inserta, justo antes de </body> (para que gane a los estilos de la página): la letra Heebo, el CSS y el JS de esta carpeta, entre marcas emx1."""
import os, re, sys

AQUI = os.path.dirname(os.path.abspath(__file__))
panel = '--panel' in sys.argv
css = open(os.path.join(AQUI, 'estilo-mx-panel.css' if panel else 'estilo-mx.css'), encoding='utf-8').read().strip()
js = '' if panel else open(os.path.join(AQUI, 'estilo-mx.js'), encoding='utf-8').read().strip()
bloque = ('<!-- emx1 inicio -->\n'
          '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
          '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;700;800&display=swap">\n'
          '<style id="emx1">\n' + css + '\n</style>\n' + ('<script>\n' + js + '\n</script>\n' if js else '') + '<!-- emx1 fin -->\n')

for ruta in [a for a in sys.argv[1:] if a != '--panel']:
    s = open(ruta, encoding='utf-8').read()
    s = re.sub(r'<!-- emx1 inicio -->.*?<!-- emx1 fin -->\n', '', s, flags=re.S)
    i = s.rindex('</body>')                      # el último: el de la página (puede haber otro dentro de un texto de JS)
    s = s[:i] + bloque + s[i:]
    open(ruta, 'w', encoding='utf-8').write(s)
    print('ok', ruta)
