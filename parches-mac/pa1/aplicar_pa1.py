#!/usr/bin/env python3
"""pa1 (17-nov-2026): el perfil de bienvenida del asesor se guarda en la hoja privada "Perfil asesores".
Uso: python3 aplicar_pa1.py ruta/asesor.html   (idempotente)"""
import sys

ruta = sys.argv[1]
s = open(ruta, encoding='utf-8').read()
if '/* pa1 */' in s:
    print('pa1 ya aplicado'); sys.exit(0)

def rep(a, b):
    global s
    if s.count(a) != 1:
        sys.exit('No encontré (o hay varias): ' + a[:80])
    s = s.replace(a, b)

# 1) saber si la bienvenida es primera vez o edición
rep("{paso: 0});\n  pasoOB();", "{paso: 0, ed: !!editar});   /* pa1 */\n  pasoOB();")
# 2) al terminar la bienvenida, subir el perfil a la hoja
rep("E.motivo = OB.motivo; guardar();", "E.motivo = OB.motivo; guardar(); paSubir(OB.ed ? 'edición' : 'bienvenida');   /* pa1 */")
# 3) al abrir: traer el perfil de la hoja (o recuperar el del teléfono) antes de pedir la bienvenida
rep("if (!E.perfil || !E.perfil.foto) bienvenida(); else setTimeout(pfFestejarSolas, 400);   /* pf2 */",
    "paSync();   /* pa1 (antes: bienvenida si el teléfono no tenía perfil) · pf2 */")
# 4) funciones
FN = r"""/* pa1 */
/* El perfil (foto, apodo, cumpleaños, motivo, sueño, qué le gusta vender, reconocimiento) se guarda en la hoja privada
   "Perfil asesores". Si la hoja lo tiene, el teléfono lo usa y no vuelve a preguntar; si solo el teléfono lo tiene
   (lo llenó antes de pa1), lo sube solo. La foto viaja reducida a 200 px. */
function paChica(u){ return new Promise(ok => { if (!u) return ok(''); const i = new Image();
  i.onload = () => { const c = document.createElement('canvas'), z = 200, m = Math.min(i.width, i.height); c.width = c.height = z;
    c.getContext('2d').drawImage(i, (i.width - m) / 2, (i.height - m) / 2, m, m, 0, 0, z, z); ok(c.toDataURL('image/jpeg', 0.72)); };
  i.onerror = () => ok(''); i.src = u; }); }
function paSubir(origen){
  if (!YO || !E.perfil) return Promise.resolve();
  const p = Object.assign({}, E.perfil, {motivo: E.motivo || ''});
  return paChica(p.foto).then(f => { p.foto = f; return llamar('apiPerfilGuardar', TOKEN, YO.nombre, p, origen, DISP); }).catch(() => {});
}
function paSync(){
  const fin = () => { if (!E.perfil || !E.perfil.foto) bienvenida(); else setTimeout(pfFestejarSolas, 400); };
  const yo = YO && YO.nombre; if (!yo) return fin();
  llamar('apiPerfilAsesor', TOKEN, yo).then(s => {
    if (!YO || YO.nombre !== yo) return;
    if (s && (s.foto || s.apodo || s.motivo)) {
      const fotoLocal = E.perfil && E.perfil.foto;
      E.perfil = {foto: s.foto || fotoLocal || '', apodo: s.apodo || '', cumple: s.cumple || '', sueno: s.sueno || '', vender: s.vender || [], recon: s.recon || ''};
      if (s.motivo) E.motivo = s.motivo;
      guardar(); pintarCab(); render();
    } else if (E.perfil && E.perfil.foto) paSubir('recuperado del teléfono');
    fin();
  }, fin);
}
function pintarCab(){"""
rep("function pintarCab(){", FN)

open(ruta, 'w', encoding='utf-8').write(s)
print('pa1 aplicado')
