/* TEFES · ENTORNO DE PRUEBAS — reemplaza el conector de Google Sheets del panel de administración.
   El panel pide rangos de las hojas (get_values / get_spreadsheet / update_values); aquí los responde la base de ejemplo de datos.js.
   Las descargas (PDF) se guardan como un archivo normal del navegador. */
(function () {
  var DB = window.TEFES_PRUEBA;
  var mcp = {
    callTool: function (server, tool, args) {
      return new Promise(function (ok, ko) {
        setTimeout(function () {
          try {
            if (tool === 'get_values') ok({payload: {range: args.range, values: DB.leer(args.range)}});
            else if (tool === 'update_values') ok({payload: DB.escribir(args.range, args.values)});
            else if (tool === 'get_spreadsheet') ok({payload: {sheets: (args.ranges || []).map(function (r) {   // varios rangos en una petición, como Google
              var i = r.lastIndexOf('!'), m = /^([A-Z]*)(\d*)/i.exec(r.slice(i + 1)) || [], col = String(m[1] || 'A').toUpperCase().split('').reduce(function (n, c) { return n * 26 + c.charCodeAt(0) - 64; }, 0) - 1;
              return {properties: {title: r.slice(0, i).replace(/^'|'$/g, '').replace(/''/g, "'")}, data: [{startRow: m[2] ? +m[2] - 1 : 0, startColumn: Math.max(0, col),
                rowData: DB.leer(r).map(function (f) { return {values: (f || []).map(function (v) { return {formattedValue: v == null ? '' : String(v)}; })}; })}]};
            })}});
            else throw new Error('Herramienta no disponible en pruebas: ' + tool);
          } catch (e) { ko({code: 'tool_error', message: e.message}); }
        }, 60 + Math.random() * 140);
      });
    }
  };
  var downloads = {
    save: function (o) {
      var blob = o.data instanceof Blob ? o.data : new Blob([o.data], {type: o.mimeType || 'application/octet-stream'});
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = o.filename || 'archivo';
      document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
      return Promise.resolve(true);
    }
  };
  window.claude = {use: function (cap) { return Promise.resolve(cap === 'mcp' ? mcp : cap === 'downloads' ? downloads : null); }};
})();
