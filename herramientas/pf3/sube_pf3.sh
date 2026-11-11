#!/bin/bash
# pf3 · Proformas del call center/web aparte de las tiendas (2026-11-11). Uso: bash sube_pf3.sh
# Se detiene ante cualquier error, sin subir nada.
set -e
K="$(cd "$(dirname "$0")" && pwd)"
C="$HOME/Library/CloudStorage/OneDrive-TEFES/Supervision/App Supervision/proyecto_clasp"
export PATH="$HOME/.local/clasp-tools/node-v22.23.3-darwin-arm64/bin:$PATH"
cd "$C"
R="$C/../respaldo_antes_pf3_$(date +%Y%m%d_%H%M)"
mkdir -p "$R"; cp -p *.gs *.html *.json "$R"/ 2>/dev/null || true
echo "1/4 Respaldo en $R"
[ -f WhatsAppApi.gs ] || { echo "FALTA WhatsAppApi.gs: no subo nada"; exit 1; }
[ -f IngresoPrueba.gs ] || { echo "FALTA IngresoPrueba.gs: no subo nada"; exit 1; }
[ -f ProformasPOS.gs ] || { echo "FALTA ProformasPOS.gs: no subo nada"; exit 1; }
echo "2/4 Archivos hechos a mano OK"
python3 -I "$K/aplicar_pf3_callcenter.py" "$C"
echo "3/4 Proformas call center OK"
clasp push -f
clasp deploy -i AKfycbxvxIW9iw7D6IyKTMx5Xyj9BW4d_u7G4BMVwRzaI9ug1MIB1tdfVCAWhu2iIWjbz0lgMA -d proformas-callcenter
echo "4/4 LISTO: subido y publicado"
