#!/usr/bin/env python3
"""e04a (Diego 2026-11-10): el punto E04 (transferencias) se califica solo con los datos del ERP.
Uso: aplicar_e04auto.py <Index.html o tienda.html> [...]  (idempotente; requiere el recuadro E04 de aplicar_e04.py)
Al cargar las transferencias de la tienda, si E04 aún no tiene nota: 2 si no hay ninguna con diferencias ni abierta
de más de 7 días; 0 si hay (con observación y acción correctiva listas). Llena el dato de apoyo.
El supervisor puede cambiar a 1 si la tienda le muestra el correo de gestión con la bodega o el otro local."""
import sys
MARCA = '/* e04a */'
VIEJO_CARGAR = """  try { TV.d = await api('apiTransfE04'); } catch (e) { TV.error = 'No se pudo leer el ERP: ' + e.message; }
  TV.cargando = false; pintarPunto(p);
}"""
NUEVO_CARGAR = """  try { TV.d = await api('apiTransfE04'); } catch (e) { TV.error = 'No se pudo leer el ERP: ' + e.message; }
  TV.cargando = false; trfE04Auto(p); pintarPunto(p);
}
""" + MARCA + """ /* E04 se califica solo con el ERP si todavía no tiene nota; el supervisor puede cambiarla */
function trfE04Auto(p){
  const F = S.form, d = TV.d; if (!F || !d || F.tipo !== 'Supervisión') return false;
  const x = F.items[p.id] = F.items[p.id] || {}; if (x.calif != null) return false;
  const n = d.dif.length + d.viejas.length, lst = a => a.map(t => t.n).join(', ');
  x.calif = n ? '0' : '2'; x.auto = x.calif; x.dato = trfE04Dato(); x.verDato = true; delete x.abierto;
  anotarTiempo(F, p.sec);
  if (n) {
    x.obs = x.obs || 'Calificado con el ERP: ' + [d.dif.length ? 'con diferencias ' + lst(d.dif) : '', d.viejas.length ? 'abiertas de más de ' + d.umbral + ' días ' + lst(d.viejas) : ''].filter(Boolean).join('; ') + '. Si la tienda muestra el correo de gestión, cambia a 1.';
    x.accion = x.accion || 'Gestionar con la bodega o el otro local las transferencias ' + lst(d.dif.concat(d.viejas)) + ' hasta dejarlas arregladas, con correo de gestión.';
    x.fechaCompromiso = x.fechaCompromiso || sumarDias(S.data.hoy, S.data.diasCompromiso);
    x.responsable = x.responsable || F.gerente || ''; x.prioridad = 'Alta';
  }
  guardarBorrador(); actualizarFooter(); return true;
}"""
VIEJO_TXT = "'<div class=\"tiny\" style=\"margin-top:6px\">Pide a la tienda el correo de gestión con la bodega o el otro local. 1 si lo muestra, 0 si no hay gestión.</div>'"
NUEVO_TXT = "'<div class=\"tiny\" style=\"margin-top:6px\">' + (((S.form.items[p.id] || {}).auto || 'x') === (S.form.items[p.id] || {}).calif ? 'Calificado solo con el ERP. ' : '') + 'Si la tienda te muestra el correo de gestión con la bodega o el otro local, cambia a 1; si no hay gestión, queda en 0.</div>'"
VIEJO_OK = "'<div>Ninguna con diferencias ni abierta de más de ' + d.umbral + ' días: corresponde 2.</div>'"
NUEVO_OK = "'<div>Ninguna con diferencias ni abierta de más de ' + d.umbral + ' días: ' + (((S.form.items[p.id] || {}).auto || 'x') === (S.form.items[p.id] || {}).calif ? 'calificado 2 solo con el ERP.' : 'corresponde 2.') + '</div>'"
VIEJO_HTML = """  if (!TV.d) {
    if (!TV.cargando && !TV.error) trfE04Cargar(p);"""
NUEVO_HTML = """  if (TV.d && trfE04Auto(p)) setTimeout(() => pintarPunto(p), 0);
  if (!TV.d) {
    if (!TV.cargando && !TV.error) trfE04Cargar(p);"""
def aplicar(r):
    s = open(r, encoding='utf-8').read()
    if MARCA in s: print(r, 'ya tenía e04a'); return
    for a, b in [(VIEJO_CARGAR, NUEVO_CARGAR), (VIEJO_TXT, NUEVO_TXT), (VIEJO_OK, NUEVO_OK), (VIEJO_HTML, NUEVO_HTML)]:
        assert s.count(a) == 1, (r, a[:60]); s = s.replace(a, b)
    open(r, 'w', encoding='utf-8').write(s); print(r, 'e04a aplicado')
for r in sys.argv[1:]: aplicar(r)
