# emx1 · Estilo Steren México (22-nov-2026)

Diego pidió que la app se vea como steren.com.mx (idea de un video sobre los skills de diseño Impeccable, Taste Skill y Emil Kowalski).
Solo cambia la apariencia y agrega movimientos cortos; no toca la lógica.

- `estilo-mx.css` + `estilo-mx.js`: tienda y asesores (encabezado blanco con logo, bloque de la tienda en azul marino,
  botones #006B9E, letra Heebo, toque que "hunde" el botón, tarjetas que aparecen suaves, números que suben contando).
- `estilo-mx-panel.css`: paneles de supervisores y admin (encabezado blanco, pestañas azul marino). En modo oscuro no cambia nada.
- `entrar.html` tiene su propio estilo dentro (no usa este bloque).
- Todo respeta "reducir movimiento" del teléfono.

## Si se regenera el sitio (generar_sitio.py o generar_prueba.py), volver a aplicar (idempotente):

    python3 herramientas/estilo-mx/aplicar.py tienda.html prueba/tienda.html asesor.html prueba/asesor.html
    python3 herramientas/estilo-mx/aplicar.py --panel panel.html prueba/panel.html

El bloque queda entre `<!-- emx1 inicio -->` y `<!-- emx1 fin -->`, justo antes del último `</body>`.
