/**
 * Taste of Peru — Google Sheets database for the app on GitHub Pages.
 * Works with the spreadsheet "Taste of Peru – datos" (tabs: Resumen, Reservas, Clientes,
 * Inventario, Stock, Compras, Proveedores, Recetas, Productos, Ventas detalle, Mermas, …).
 *
 * Setup (one time):
 *  1. Open the spreadsheet "Taste of Peru – datos" → Extensions → Apps Script.
 *  2. Delete the sample code, paste this whole file, Save.
 *  3. Change PIN below to your own secret PIN (at least 6 characters). Save.
 *  4. In the toolbar choose the function  instalarFormulas  → Run → authorize with your Google
 *     account. This writes the formulas of Resumen, Clientes, Stock, Compras and Recetas.
 *  5. Deploy → New deployment → type "Web app".  Execute as: Me   Who has access: Anyone
 *     Deploy → copy the "Web app URL" (ends in /exec).
 *  6. In the app on GitHub: AI system → ⚙ Settings → Google Drive → paste the URL and the PIN.
 *
 * Security: reading or changing data needs the PIN. Without the PIN the only thing allowed is
 * adding a NEW booking (so customers can book). Never share the PIN and never put it on GitHub.
 */
const PIN = "CHANGE-ME-123456";

// app collection → tab name
const SHEETS = { reservations: "Reservas", inventory: "Inventario", waste: "Mermas", sales: "Ventas (app)",
                 posts: "Publicaciones", reviews: "Reseñas", settings: "Config (app)" };
// readable columns: [field, header]
const FIELDS = {
  reservations: [["date","Fecha"],["time","Hora"],["name","Nombre"],["contact","Contacto"],["party","Personas"],["notes","Notas"],["status","Estado"],["created","Creada"]],
  inventory: [["name","Artículo"],["unit","Unidad"],["qty","Stock"],["min","Alerta"],["par","Cantidad máxima"],["cost","Costo unitario"],["supplier","Proveedor"],["updated","Actualizado"]],
  waste: [["date","Fecha"],["itemId","ID artículo"],["item","Artículo"],["qty","Cantidad"],["unit","Unidad"],["cost","Costo"],["reason","Motivo"]],
  posts: [["when","Fecha y hora"],["channel","Canal"],["status","Estado"],["text","Texto"],["image","Imagen"],["reach","Alcance"],["likes","Likes"],["comments","Comentarios"],["saves","Guardados"]],
  reviews: [["date","Fecha"],["source","Fuente"],["stars","Estrellas"],["name","Autor"],["text","Texto"],["reply","Respuesta"],["replied","Respondida"]],
  sales: [], settings: []
};
const NUM = ["qty","min","par","cost","party","reach","likes","comments","saves","stars"];
const BOOL = ["replied"];
const DATES = ["date"];
const PRODUCTS = { quinoa: "Jugo de quinua", chicha: "Chicha morada", maca: "Jugo de maca", mazamorra: "Mazamorra morada", lucuma: "Jugo de lúcuma", chirimoya: "Jugo de chirimoya" };

/* ---------------- web app ---------------- */
function doGet(e) { return handle_(e.parameter || {}); }
function doPost(e) {
  let body = {};
  try { body = JSON.parse(e.postData && e.postData.contents || "{}"); } catch (err) { return out_({ ok: false, error: "bad_json" }); }
  return handle_(body);
}
function handle_(req) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const action = String(req.action || ""), col = String(req.col || "");
    const authed = PIN !== "CHANGE-ME-123456" && String(req.pin || "") === PIN;
    if (action === "ping") return out_({ ok: true, authed: authed });
    if (!SHEETS[col]) return out_({ ok: false, error: "bad_collection" });
    if (action === "list") {
      if (!authed) return out_({ ok: false, error: "pin" });
      return out_({ ok: true, docs: list_(col) });
    }
    if (action === "set") {
      const id = String(req.id || "");
      if (!/^[A-Za-z0-9_.\-]{1,120}$/.test(id) || typeof req.data !== "object" || req.data === null) return out_({ ok: false, error: "bad_request" });
      if (!authed) {
        if (col !== "reservations" || rowOf_(sheet_(col), id) > 0) return out_({ ok: false, error: "pin" });
        const d = req.data, clean = {};
        ["name", "contact", "date", "time", "notes"].forEach(function (k) { if (d[k] != null) clean[k] = String(d[k]).slice(0, 300); });
        clean.party = Math.max(1, Math.min(50, Number(d.party) || 1));
        clean.status = "pending"; clean.created = new Date().toISOString();
        write_(col, id, clean);
        return out_({ ok: true });
      }
      write_(col, id, req.data);
      return out_({ ok: true });
    }
    if (action === "delete") {
      if (!authed) return out_({ ok: false, error: "pin" });
      const sh = sheet_(col), id = String(req.id || ""), r = rowOf_(sh, id);
      if (r > 0) sh.deleteRow(r);
      if (col === "sales") salesDetail_(id, null);
      return out_({ ok: true });
    }
    return out_({ ok: false, error: "bad_action" });
  } finally {
    lock.releaseLock();
  }
}

/* ---------------- storage ---------------- */
function sheet_(col) {
  const ss = SpreadsheetApp.getActiveSpreadsheet(), name = SHEETS[col];
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    const h = ["ID", "json"].concat(FIELDS[col].map(function (f) { return f[1]; }));
    sh.getRange(1, 1, 1, h.length).setValues([h]); sh.setFrozenRows(1); sh.hideColumns(2);
  }
  return sh;
}
function headerMap_(col, headers) { // header → field
  const m = {}; FIELDS[col].forEach(function (f) { m[f[1]] = f[0]; });
  return headers.map(function (h, i) { return i < 2 ? null : (m[h] || h); });
}
function rowOf_(sh, id) {
  const n = sh.getLastRow(); if (n < 2 || !id) return -1;
  const ids = sh.getRange(2, 1, n - 1, 1).getDisplayValues();
  for (let i = 0; i < ids.length; i++) if (ids[i][0] === id) return i + 2;
  return -1;
}
function toDateStr_(v) {
  return Object.prototype.toString.call(v) === "[object Date]" ? Utilities.formatDate(v, Session.getScriptTimeZone(), "yyyy-MM-dd") : String(v);
}
function list_(col) {
  const sh = sheet_(col), n = sh.getLastRow(), w = sh.getLastColumn(); if (n < 2) return [];
  const headers = sh.getRange(1, 1, 1, w).getDisplayValues()[0], keys = headerMap_(col, headers);
  const vals = sh.getRange(2, 1, n - 1, w).getValues(), docs = [];
  vals.forEach(function (row, i) {
    const hasData = row.some(function (v, j) { return j >= 2 && v !== ""; });
    let id = String(row[0] || "");
    if (!id && !hasData) return;
    if (!id) { id = "s" + Utilities.getUuid().replace(/-/g, "").slice(0, 16); sh.getRange(i + 2, 1).setValue(id); }
    let data = {}; try { data = JSON.parse(row[1] || "{}"); } catch (e) {}
    keys.forEach(function (k, j) {
      if (!k) return; const v = row[j];
      if (NUM.indexOf(k) >= 0) { if (v !== "" && !isNaN(Number(v))) data[k] = Number(v); }
      else if (BOOL.indexOf(k) >= 0) data[k] = v === true || String(v).toLowerCase() === "true";
      else data[k] = v === "" ? "" : toDateStr_(v);
    });
    docs.push({ id: id, data: data });
  });
  return docs;
}
function write_(col, id, data) {
  const sh = sheet_(col);
  let headers = sh.getRange(1, 1, 1, Math.max(2, sh.getLastColumn())).getDisplayValues()[0];
  const byField = {}; FIELDS[col].forEach(function (f) { byField[f[0]] = f[1]; });
  Object.keys(data).forEach(function (k) {
    if (typeof data[k] === "object" && data[k] !== null) return;
    const h = byField[k] || k;
    if (headers.indexOf(h) < 0) { headers.push(h); sh.getRange(1, headers.length).setValue(h); }
  });
  const keys = headerMap_(col, headers), row = [], fmts = [];
  keys.forEach(function (k, j) {
    if (j === 0) { row.push(id); fmts.push("@"); return; }
    if (j === 1) { row.push(JSON.stringify(data)); fmts.push("@"); return; }
    let v = data[k];
    if (v == null || typeof v === "object") { row.push(""); fmts.push("@"); return; }
    if (DATES.indexOf(k) >= 0 && /^\d{4}-\d{2}-\d{2}$/.test(String(v))) {
      const p = String(v).split("-"); row.push(new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]))); fmts.push("yyyy-mm-dd"); return;
    }
    if (NUM.indexOf(k) >= 0 && v !== "" && !isNaN(Number(v))) { v = Number(v); row.push(v); fmts.push(Number.isInteger(v) ? "0" : "0.00"); return; }
    if (BOOL.indexOf(k) >= 0) { row.push(!!v); fmts.push("@"); return; }
    row.push(String(v)); fmts.push("@");
  });
  let r = rowOf_(sh, id); if (r < 0) r = sh.getLastRow() + 1;
  const range = sh.getRange(r, 1, 1, row.length);
  range.setNumberFormats([fmts]);
  range.setValues([row]);
  if (col === "sales") salesDetail_(id, data);
}
// one row per product and day in "Ventas detalle", rebuilt from the app's daily sales record
function salesDetail_(dateId, data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName("Ventas detalle");
  if (!sh) { sh = ss.insertSheet("Ventas detalle"); sh.getRange(1, 1, 1, 5).setValues([["Fecha", "Producto ID", "Producto", "Vasos", "Ingresos"]]); sh.setFrozenRows(1); }
  const n = sh.getLastRow();
  if (n >= 2) {
    const dates = sh.getRange(2, 1, n - 1, 1).getValues();
    for (let i = dates.length - 1; i >= 0; i--) if (toDateStr_(dates[i][0]) === dateId) sh.deleteRow(i + 2);
  }
  if (!data || !data.items || !/^\d{4}-\d{2}-\d{2}$/.test(dateId)) return;
  const p = dateId.split("-"), day = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  const rows = Object.keys(data.items).map(function (pid) {
    const it = data.items[pid] || {};
    return [day, pid, PRODUCTS[pid] || pid, Number(it.cups) || 0, Number(it.revenue) || 0];
  });
  if (rows.length) {
    const r = sh.getLastRow() + 1;
    sh.getRange(r, 1, rows.length, 5).setValues(rows);
    sh.getRange(r, 1, rows.length, 1).setNumberFormat("yyyy-mm-dd");
    sh.getRange(r, 5, rows.length, 1).setNumberFormat("#,##0.00");
  }
}
function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/* ---------------- Compras → Stock ----------------
 * When a purchase row gets Estado = "Recibido", add its Cantidad to the item's Stock in Inventario
 * (once) and update the unit cost if one was entered. Column K records when it was applied. */
function onEdit(e) {
  const sh = e.range.getSheet();
  if (sh.getName() !== "Compras" || e.range.getColumn() > 10 || e.range.getRow() < 2) return;
  const first = e.range.getRow(), last = first + e.range.getNumRows() - 1;
  for (let r = first; r <= last; r++) applyPurchase_(sh, r);
}
function applyPurchase_(sh, r) {
  const v = sh.getRange(r, 1, 1, 11).getValues()[0]; // A Fecha … J Estado, K Aplicado
  if (v[9] !== "Recibido" || v[10] !== "" || !v[2] || v[2] === "¿?") return;
  const qty = Number(v[4]); if (!(qty > 0)) return;
  const cost = v[5] === "" ? null : Number(v[5]);
  const inv = sheet_("inventory"), row = rowOf_(inv, String(v[2])); if (row < 0) return;
  const w = inv.getLastColumn(), headers = inv.getRange(1, 1, 1, w).getDisplayValues()[0];
  const cQty = headers.indexOf("Stock") + 1, cCost = headers.indexOf("Costo unitario") + 1, cUpd = headers.indexOf("Actualizado") + 1;
  const now = new Date().toISOString();
  inv.getRange(row, cQty).setValue(Number(inv.getRange(row, cQty).getValue() || 0) + qty);
  if (cost != null && !isNaN(cost) && cCost > 0) inv.getRange(row, cCost).setValue(cost);
  if (cUpd > 0) inv.getRange(row, cUpd).setValue(now);
  // keep the hidden json in step
  let data = {}; try { data = JSON.parse(inv.getRange(row, 2).getValue() || "{}"); } catch (err) {}
  data.qty = Number(inv.getRange(row, cQty).getValue()); if (cost != null && !isNaN(cost)) data.cost = cost; data.updated = now;
  inv.getRange(row, 2).setValue(JSON.stringify(data));
  sh.getRange(r, 11).setValue(Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm"));
}

/* ---------------- formulas (run once) ---------------- */
function instalarFormulas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const put = function (tab, a1, f) { const sh = ss.getSheetByName(tab); if (sh) sh.getRange(a1).setFormula(f); };
  const clear = function (tab, a1) { const sh = ss.getSheetByName(tab); if (sh) sh.getRange(a1).clearContent(); };
  const d30 = '">="&(TODAY()-30)';

  // Resumen
  put("Resumen", "B2", '=COUNTIFS(Reservas!C2:C,">="&TODAY(),Reservas!I2:I,"<>cancelled")');
  put("Resumen", "B3", '=COUNTIFS(Reservas!C2:C,TODAY(),Reservas!I2:I,"<>cancelled")');
  put("Resumen", "B4", '=COUNTIF(Clientes!A2:A,"?*")');
  put("Resumen", "B5", '=COUNTIF(Stock!G2:G,"Bajo")');
  put("Resumen", "B6", '=SUM(Stock!J2:J)');
  put("Resumen", "B7", '=SUMIFS(Compras!G2:G,Compras!J2:J,"Recibido",Compras!A2:A,' + d30 + ')');
  put("Resumen", "B8", '=SUMIFS(Mermas!H2:H,Mermas!C2:C,' + d30 + ')');
  put("Resumen", "B9", "=SUMIFS('Ventas detalle'!D2:D,'Ventas detalle'!A2:A," + d30 + ")");
  put("Resumen", "B10", "=SUMIFS('Ventas detalle'!E2:E,'Ventas detalle'!A2:A," + d30 + ")");
  put("Resumen", "B11", '=IFERROR(AVERAGE(Reseñas!E2:E),"—")');
  put("Resumen", "B12", '=COUNTIFS(Reseñas!A2:A,"?*",Reseñas!I2:I,"<>TRUE")');

  // Clientes (from Reservas; a customer = phone, or name when there is no phone)
  clear("Clientes", "A2:F");
  put("Clientes", "A2", '=IFERROR(SORT(UNIQUE(FILTER(IF(Reservas!F2:F<>"",Reservas!F2:F,Reservas!E2:E),Reservas!E2:E<>""))),"")');
  put("Clientes", "B2", '=MAP(A2:A,LAMBDA(k,IF(k="","",IFERROR(INDEX(Reservas!E2:E,MATCH(k,Reservas!F2:F,0)),k))))');
  put("Clientes", "C2", '=MAP(A2:A,LAMBDA(k,IF(k="","",COUNTIF(Reservas!F2:F,k)+COUNTIFS(Reservas!F2:F,"",Reservas!E2:E,k))))');
  put("Clientes", "D2", '=MAP(A2:A,LAMBDA(k,IF(k="","",SUMIF(Reservas!F2:F,k,Reservas!G2:G)+SUMIFS(Reservas!G2:G,Reservas!F2:F,"",Reservas!E2:E,k))))');
  put("Clientes", "E2", '=MAP(A2:A,LAMBDA(k,IF(k="","",MAX(MAXIFS(Reservas!C2:C,Reservas!F2:F,k),MAXIFS(Reservas!C2:C,Reservas!F2:F,"",Reservas!E2:E,k)))))');
  put("Clientes", "F2", '=MAP(A2:A,LAMBDA(k,IF(k="","",COUNTIFS(Reservas!F2:F,k,Reservas!I2:I,"cancelled")+COUNTIFS(Reservas!F2:F,"",Reservas!E2:E,k,Reservas!I2:I,"cancelled"))))');
  ss.getSheetByName("Clientes").getRange("E2:E").setNumberFormat("yyyy-mm-dd");

  // Stock (live view of Inventario + Compras + Mermas)
  clear("Stock", "A2:N");
  const src = { A: "A", B: "C", C: "D", D: "E", E: "F", F: "G", I: "H", N: "I" };
  Object.keys(src).forEach(function (c) { put("Stock", c + "2", '=ARRAYFORMULA(IF(Inventario!A2:A="","",Inventario!' + src[c] + '2:' + src[c] + '))'); });
  put("Stock", "G2", '=ARRAYFORMULA(IF(A2:A="","",IF((E2:E>0)*(D2:D<=E2:E),"Bajo",IF((F2:F>0)*(D2:D>F2:F),"Exceso","OK"))))');
  put("Stock", "H2", '=ARRAYFORMULA(IF(A2:A="","",IF((G2:G="Bajo")*(F2:F>D2:D),F2:F-D2:D,0)))');
  put("Stock", "J2", '=ARRAYFORMULA(IF(A2:A="","",IFERROR(D2:D*I2:I,0)))');
  put("Stock", "K2", '=MAP(A2:A,LAMBDA(id,IF(id="","",SUMIFS(Compras!E2:E,Compras!C2:C,id,Compras!J2:J,"Recibido",Compras!A2:A,' + d30 + '))))');
  put("Stock", "L2", '=MAP(A2:A,LAMBDA(id,IF(id="","",IF(MAXIFS(Compras!A2:A,Compras!C2:C,id)=0,"",MAXIFS(Compras!A2:A,Compras!C2:C,id)))))');
  put("Stock", "M2", '=MAP(A2:A,LAMBDA(id,IF(id="","",SUMIFS(Mermas!F2:F,Mermas!D2:D,id,Mermas!C2:C,' + d30 + '))))');
  const st = ss.getSheetByName("Stock"); st.getRange("J2:J").setNumberFormat("#,##0.00"); st.getRange("L2:L").setNumberFormat("yyyy-mm-dd");

  // Compras (lookups from the chosen item)
  clear("Compras", "C2:D"); clear("Compras", "G2:G");
  put("Compras", "C2", '=MAP(B2:B,LAMBDA(n,IF(n="","",IFERROR(INDEX(Inventario!A2:A,MATCH(n,Inventario!C2:C,0)),"¿?"))))');
  put("Compras", "D2", '=MAP(B2:B,LAMBDA(n,IF(n="","",IFERROR(INDEX(Inventario!D2:D,MATCH(n,Inventario!C2:C,0)),""))))');
  put("Compras", "G2", '=ARRAYFORMULA(IF((E2:E="")+(F2:F=""),"",E2:E*F2:F))');
  const co = ss.getSheetByName("Compras"); co.getRange("A2:A").setNumberFormat("yyyy-mm-dd"); co.getRange("G2:G").setNumberFormat("#,##0.00");

  // Recetas (unit and cost from Inventario)
  clear("Recetas", "E2:E"); clear("Recetas", "G2:H");
  put("Recetas", "E2", '=MAP(B2:B,LAMBDA(n,IF(n="","",IFERROR(INDEX(Inventario!D2:D,MATCH(n,Inventario!C2:C,0)),"no está en inventario"))))');
  put("Recetas", "G2", '=MAP(B2:B,LAMBDA(n,IF(n="","",IFERROR(INDEX(Inventario!H2:H,MATCH(n,Inventario!C2:C,0)),""))))');
  put("Recetas", "H2", '=ARRAYFORMULA(IF(B2:B="","",IF(D2:D=E2:E,C2:C*IFERROR(G2:G*1,0),"convertir unidad")))');
  ss.getSheetByName("Recetas").getRange("H2:H").setNumberFormat("#,##0.00");

  ss.toast("Fórmulas instaladas / Formulas installed", "Taste of Peru", 5);
}
