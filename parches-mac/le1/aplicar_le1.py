#!/usr/bin/env python3
"""le1 (Diego 10-nov): "Ventas futuras" se llama "Lista de espera" en todo lo que se ve (tiendas, asesores, panel, admin).
No cambia nombres de hojas ni de eventos. Uso: python3 aplicar_le1.py tienda|asesor|panel|admin <archivo>. Idempotente."""
import sys
modo, p = sys.argv[1], sys.argv[2]; s = open(p, encoding='utf-8').read()
if '/* le1 */' in s: print('ya aplicado', p); sys.exit(0)
R = {
 'tienda': [
  ('<button data-ir="inv">Venta futura</button>', '<button data-ir="inv">Lista de espera</button>'),
  ("<h3>Ventas futuras</h3>", "<h3>Lista de espera</h3>"),
  ("+ Registrar venta futura</button>", "+ Agregar a la lista de espera</button>"),
  ("openModal('<h3>Registrar venta futura</h3>'", "openModal('<h3>Agregar a la lista de espera</h3>'"),
  ("registra las ventas futuras: lo que un cliente pide y no tenemos.", "anota en la lista de espera lo que un cliente pide y no tenemos."),
  ('{"t": "Ventas futuras", "v": "inv",', '{"t": "Lista de espera", "v": "inv",'),
  ('"kw": "cliente pedido registrar venta futura sin stock"', '"kw": "cliente pedido registrar venta futura lista de espera sin stock"'),
 ],
 'asesor': [
  ("['vf', 'Ventas futuras']", "['vf', 'Lista de espera']"),
  ("+ Registrar venta futura</button>", "+ Agregar a la lista de espera</button>"),
  ("<h3>Nueva venta futura</h3>", "<h3>Agregar a la lista de espera</h3>"),
  ("'Lo registro como venta futura'", "'Lo anoto en la lista de espera'"),
  ("Lo registras en Clientes › Ventas futuras", "Lo anotas en Clientes › Lista de espera"),
 ],
 'panel': [("Inventario → Registrar venta futura.", "Inventario → Lista de espera.")],
 'admin': [("Inventario → Registrar venta futura.", "Inventario → Lista de espera.")],
}[modo]
for a, b in R:
    c = s.count(a)
    if c != 1: sys.exit('ancla %r aparece %d veces en %s' % (a[:70], c, p))
    s = s.replace(a, b)
i = s.rfind('</body>'); s = s[:i] + '<!-- le1 --><script>/* le1 */</script>\n' + s[i:]
open(p, 'w', encoding='utf-8').write(s); print('ok', p)
