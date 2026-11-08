#!/bin/bash
# pf2 · Seguimiento de proformas del POS (2026-11-08). Uso: bash sube_pf2.sh
# Se detiene ante cualquier error, sin subir nada.
set -e
K="$(cd "$(dirname "$0")" && pwd)"
C="$HOME/Library/CloudStorage/OneDrive-TEFES/Supervision/App Supervision/proyecto_clasp"
export PATH="$HOME/.local/clasp-tools/node-v22.23.3-darwin-arm64/bin:$PATH"
cd "$C"
R="$C/../respaldo_antes_pf2_$(date +%Y%m%d_%H%M)"
mkdir -p "$R"; cp -p *.gs *.html *.json "$R"/ 2>/dev/null || true
echo "1/5 Respaldo en $R"
[ -f WhatsAppApi.gs ] || { echo "FALTA WhatsAppApi.gs: no subo nada"; exit 1; }
[ -f IngresoPrueba.gs ] || { echo "FALTA IngresoPrueba.gs: no subo nada"; exit 1; }
grep -q "ingresoFn_(d.fn)" MuestreoApi.gs || { echo "FALTA ingresoFn_ en MuestreoApi.gs: no subo nada"; exit 1; }
echo "2/5 Archivos hechos a mano OK"
python3 -I "$K/aplicar_pf2_servidor.py" "$C" "$K"
echo "3/5 Servidor OK (ProformasPOS.gs, Asesores.gs, PortalApi.gs)"
python3 -I "$K/aplicar_pf2_tienda_panel.py" tienda "$C/Index.html"
python3 -I "$K/aplicar_pf2_tienda_panel.py" panel "$C/Panel.html"
echo "4/5 Tienda y supervisores OK"
clasp push -f
clasp deploy -i AKfycbxvxIW9iw7D6IyKTMx5Xyj9BW4d_u7G4BMVwRzaI9ug1MIB1tdfVCAWhu2iIWjbz0lgMA -d proformas-pf2
echo "5/5 LISTO: subido y publicado"
