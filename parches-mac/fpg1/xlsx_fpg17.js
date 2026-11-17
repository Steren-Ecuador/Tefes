  /* fpg17: Excel de verdad (.xlsx) sin librerías: zip sin compresión con una hoja; encabezado en negrita, números como números */
  function xlsxBlob(hoja, filas){
    const enc = new TextEncoder(), X = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
    const col = i => { let s = ''; i++; while (i) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
    const ancho = (filas[0] || []).map((_, j) => Math.min(60, Math.max(8, ...filas.map(r => String(r[j] == null ? '' : r[j]).length + 2))));
    const celda = (v, ref, cab) => { const s = v == null ? '' : String(v);
      if (!cab && /^\d{4}-\d{2}-\d{2}$/.test(s)) { const d = Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)) / 864e5 + 25569; return '<c r="' + ref + '" s="3"><v>' + d + '</v></c>'; }
      if (!cab && /^-?\d{1,12}([.,]\d{1,2})?$/.test(s) && !/^0\d/.test(s)) return '<c r="' + ref + '" s="2"><v>' + s.replace(',', '.') + '</v></c>';
      return s === '' ? '' : '<c r="' + ref + '" t="inlineStr"' + (cab ? ' s="1"' : '') + '><is><t xml:space="preserve">' + X(s) + '</t></is></c>'; };
    const hojaXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>' +
      ancho.map((w, j) => '<col min="' + (j + 1) + '" max="' + (j + 1) + '" width="' + w + '" customWidth="1"/>').join('') + '</cols><sheetData>' +
      filas.map((r, i) => '<row r="' + (i + 1) + '">' + r.map((v, j) => celda(v, col(j) + (i + 1), i === 0)).join('') + '</row>').join('') + '</sheetData>' +
      (filas.length > 1 ? '<autoFilter ref="A1:' + col(Math.max(0, (filas[0] || []).length - 1)) + filas.length + '"/>' : '') + '</worksheet>';
    const F = {
      '[Content_Types].xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>',
      '_rels/.rels': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
      'xl/workbook.xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="' + X(String(hoja || 'Hoja1').replace(/[\\\/?*\[\]:]/g, ' ').slice(0, 31)) + '" sheetId="1" r:id="rId1"/></sheets>' + (filas.length > 1 ? '<definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">\'' + X(String(hoja || 'Hoja1').replace(/[\\\/?*\[\]:]/g, ' ').slice(0, 31)).replace(/'/g, "''") + '\'!$A$1:$' + col(Math.max(0, (filas[0] || []).length - 1)) + '$' + filas.length + '</definedName></definedNames>' : '') + '</workbook>',
      'xl/_rels/workbook.xml.rels': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
      'xl/styles.xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="2"><numFmt numFmtId="164" formatCode="#,##0.00"/><numFmt numFmtId="165" formatCode="dd/mm/yyyy"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="4"><xf/><xf fontId="1" applyFont="1"/><xf numFmtId="164" applyNumberFormat="1"/><xf numFmtId="165" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>',
      'xl/worksheets/sheet1.xml': hojaXml};
    const T = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; T[n] = c >>> 0; }
    const crc = b => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = T[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
    const partes = [], central = []; let off = 0;
    const u16 = n => [n & 255, (n >>> 8) & 255], u32 = n => [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255];
    Object.keys(F).forEach(nom => { const nb = enc.encode(nom), d = enc.encode(F[nom]), c = crc(d);
      const loc = new Uint8Array([0x50, 0x4b, 3, 4, ...u16(20), 0, 0, 0, 0, 0, 0, 0x21, 0, ...u32(c), ...u32(d.length), ...u32(d.length), ...u16(nb.length), 0, 0]);
      partes.push(loc, nb, d);
      central.push(new Uint8Array([0x50, 0x4b, 1, 2, ...u16(20), ...u16(20), 0, 0, 0, 0, 0, 0, 0x21, 0, ...u32(c), ...u32(d.length), ...u32(d.length), ...u16(nb.length), 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ...u32(off)]), nb);
      off += loc.length + nb.length + d.length; });
    const tamC = central.reduce((a, b) => a + b.length, 0);
    const fin = new Uint8Array([0x50, 0x4b, 5, 6, 0, 0, 0, 0, ...u16(Object.keys(F).length), ...u16(Object.keys(F).length), ...u32(tamC), ...u32(off), 0, 0]);
    return new Blob([...partes, ...central, fin], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  }
