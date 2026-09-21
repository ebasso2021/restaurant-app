/**
 * Taste of Peru — Google Sheets database + user login for the app on GitHub Pages.
 * Works with the spreadsheet "Taste of Peru – datos".
 *
 * Setup (one time):
 *  1. Open "Taste of Peru – datos" → Extensions → Apps Script. Paste this whole file, Save.
 *  2. Choose the function  instalarFormulas  → Run → authorize (writes the sheet formulas).
 *  3. Reload the spreadsheet. A new menu "Taste of Peru" appears → "Crear o cambiar usuario…"
 *     → create your first user with role  admin.  (This also creates the tabs Usuarios and Roles.)
 *  4. Deploy → New deployment → Web app.  Execute as: Me   Who has access: Anyone → Deploy.
 *     After changing this code later: Deploy → Manage deployments → ✏ → Version: New version → Deploy.
 *  5. Open the app on GitHub, paste the Web app URL (ends in /exec) the first time, and log in.
 *
 * Roles:  admin   = everything, including users and settings
 *         chef    = reads everything; changes Inventario, Mermas, costs (Config) and Órdenes (kitchen board)
 *         lectura = reads everything, changes nothing
 *         cocinero = full Kitchen & inventory; everything else read only
 *         mesero   = only Customers (bookings), Tables layout, orders and billing by table
 * Passwords are stored only as salted SHA-256 hashes. Sessions last 6 hours.
 */
// app collection → tab name
const SHEETS = { reservations: "Reservas", inventory: "Inventario", waste: "Mermas", sales: "Ventas (app)",
                 posts: "Publicaciones", reviews: "Reseñas", settings: "Config (app)",
                 tables: "Mesas", orders: "Órdenes", menu: "Menú", bills: "Facturas", recipes: "Recetas (app)" };
// readable columns: [field, header]
const FIELDS = {
  reservations: [["date","Fecha"],["time","Hora"],["name","Nombre"],["contact","Contacto"],["party","Personas"],["notes","Notas"],["status","Estado"],["created","Creada"],["table","Mesa"],["end","Hasta"]],
  inventory: [["name","Artículo"],["unit","Unidad"],["qty","Stock"],["min","Alerta"],["par","Cantidad máxima"],["cost","Costo unitario"],["supplier","Proveedor"],["updated","Actualizado"]],
  waste: [["date","Fecha"],["itemId","ID artículo"],["item","Artículo"],["qty","Cantidad"],["unit","Unidad"],["cost","Costo"],["reason","Motivo"]],
  posts: [["when","Fecha y hora"],["channel","Canal"],["status","Estado"],["text","Texto"],["image","Imagen"],["reach","Alcance"],["likes","Likes"],["comments","Comentarios"],["saves","Guardados"]],
  reviews: [["date","Fecha"],["source","Fuente"],["stars","Estrellas"],["name","Autor"],["text","Texto"],["reply","Respuesta"],["replied","Respondida"]],
  tables: [["num","Mesa"],["seats","Sillas"],["zone","Zona"],["active","Activa"],["occupied","Ocupada"],["occSince","Ocupada desde"]],
  orders: [["date","Fecha"],["table","Mesa"],["guests","Comensales"],["status","Estado"],["itemsText","Platos"],["allergies","Alergias"],["message","Mensaje a cocina"],["booking","Reserva"],["by","Tomada por"],["created","Creada"],["updated","Actualizada"],["resId","ID reserva"]],
  menu: [["name","Nombre"],["cat","Grupo"],["kind","Tipo"],["price","Precio"],["notes","Nota"],["prodId","ID bebida app"],["active","Activo"]],
  bills: [["date","Fecha"],["table","Mesa"],["guests","Comensales"],["linesText","Detalle"],["currency","Moneda"],["rate","Cambio"],["totalCur","Total moneda"],["subtotal","Subtotal"],["discount","Descuento"],["discountReason","Motivo descuento"],["taxRate","GST %"],["tax","GST"],["tip","Propina"],["total","Total"],["split","División"],["per","Por persona"],["method","Pago"],["stockText","Descuento de stock"],["status","Estado"],["by","Cobrado por"],["created","Creada"],["paid","Pagada"]],
  recipes: [["item","Plato"],["portionLabel","Porción (medida única)"],["ingText","Ingredientes por 1 porción"],["steps","Preparación"],["notes","Notas"],["locked","Establecida"],["lockedAt","Establecida el"],["lockedBy","Por"],["itemId","ID del menú"],["updated","Actualizada"]],
  sales: [], settings: []
};
const NUM = ["qty","min","par","cost","party","reach","likes","comments","saves","stars","num","seats","table","guests","price","subtotal","discount","taxRate","tax","tip","total","split","per","portions","rate","totalCur"];
const BOOL = ["replied","active","occupied","locked"];
const DATES = ["date"];
const PRODUCTS = { quinoa: "Jugo de quinua", chicha: "Chicha morada", maca: "Jugo de maca", mazamorra: "Mazamorra morada", lucuma: "Jugo de lúcuma", chirimoya: "Jugo de chirimoya" };

/* ---------------- users, roles and sessions ---------------- */
const ROLES = {
  admin:    { label: "Administrador", write: "*", read: "*",
              desc: "Acceso total: todos los módulos, usuarios y ajustes. / Full access: all modules, users and settings." },
  chef:     { label: "Chef", write: ["inventory", "waste", "settings", "orders", "recipes"], read: "*",
              desc: "Ve todo. Cambia Inventario, Mermas, costo por vaso y Órdenes. / Sees everything. Changes inventory, waste, cost per cup and orders." },
  cocinero: { label: "Cocinero", write: ["inventory", "waste"], read: "*",
              desc: "Acceso total a Cocina e inventario (stock, mermas); el resto solo lectura. / Full access to Kitchen & inventory; everything else read only." },
  mesero:   { label: "Mesero", write: ["reservations", "tables", "orders", "bills", "sales"], read: ["reservations", "tables", "orders", "menu", "bills", "recipes", "settings"],
              desc: "Clientes (reservas), Distribución de mesas, Órdenes por mesa y Facturación por mesa; no cambia la lista de precios. / Customers, Tables layout, Orders and Billing by table; cannot change the price list." },
  lectura:  { label: "Solo lectura", write: [], read: "*",
              desc: "Ve todo, no cambia nada. / Sees everything, changes nothing." }
};
const SESSION_SECONDS = 21600; // 6 h
function usersSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName("Usuarios");
  if (!sh) {
    sh = ss.insertSheet("Usuarios");
    sh.getRange(1, 1, 1, 7).setValues([["Usuario", "Nombre", "Rol", "Activo", "Último acceso", "hash", "sal"]]);
    sh.setFrozenRows(1); sh.hideColumns(6, 2);
    sh.getRange("A1:G1").setFontWeight("bold").setBackground("#5B2366").setFontColor("#FFFFFF");
  }
  const rows = [["Rol", "Nombre", "Permisos / Permissions"]].concat(Object.keys(ROLES).map(function (k) { return [k, ROLES[k].label, ROLES[k].desc]; }));
  let r = ss.getSheetByName("Roles");
  if (!r) { r = ss.insertSheet("Roles"); r.setColumnWidth(3, 620); }
  const cur = r.getLastRow() >= 1 ? r.getRange(1, 1, Math.max(r.getLastRow(), rows.length), 3).getDisplayValues() : [];
  if (JSON.stringify(cur.slice(0, rows.length)) !== JSON.stringify(rows) || cur.length !== rows.length) {
    if (r.getLastRow() > 0) r.getRange(1, 1, r.getLastRow(), 3).clearContent();
    r.getRange(1, 1, rows.length, 3).setValues(rows);
    r.getRange("A1:C1").setFontWeight("bold").setBackground("#5B2366").setFontColor("#FFFFFF");
    const rule = SpreadsheetApp.newDataValidation().requireValueInList(Object.keys(ROLES), true).build();
    sh.getRange("C2:C200").setDataValidation(rule);
  }
  return sh;
}
function hash_(password, salt) {
  let h = salt + "|" + password;
  for (let i = 0; i < 300; i++) h = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, h, Utilities.Charset.UTF_8));
  return h;
}
function findUser_(sh, user) {
  const n = sh.getLastRow(); if (n < 2) return -1;
  const u = String(user || "").trim().toLowerCase(); if (!u) return -1;
  const vals = sh.getRange(2, 1, n - 1, 1).getDisplayValues();
  for (let i = 0; i < vals.length; i++) if (String(vals[i][0]).trim().toLowerCase() === u) return i + 2;
  return -1;
}
function saveUser_(user, name, role, active, password) {
  user = String(user || "").trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,40}$/.test(user)) throw new Error("usuario inválido (3-40: letras, números, . _ -)");
  if (!ROLES[role]) throw new Error("rol inválido");
  const sh = usersSheet_(); let r = findUser_(sh, user);
  if (r < 0 && !password) throw new Error("falta la contraseña");
  if (password && String(password).length < 8) throw new Error("la contraseña debe tener al menos 8 caracteres");
  if (r < 0) r = sh.getLastRow() + 1;
  const row = sh.getRange(r, 1, 1, 7).getValues()[0];
  row[0] = user; row[1] = String(name || user).slice(0, 80); row[2] = role; row[3] = active !== false;
  if (password) { row[6] = Utilities.getUuid(); row[5] = hash_(String(password), row[6]); }
  sh.getRange(r, 1, 1, 7).setValues([row]);
}
function adminCount_(sh, exceptRow) {
  const n = sh.getLastRow(); if (n < 2) return 0;
  return sh.getRange(2, 1, n - 1, 4).getValues().filter(function (v, i) { return i + 2 !== exceptRow && v[2] === "admin" && v[3] !== false; }).length;
}
function session_(token) {
  if (!token) return null;
  const v = CacheService.getScriptCache().get("s_" + token);
  if (!v) return null;
  const s = JSON.parse(v);
  // role changes and deactivations take effect at once, without waiting for the session to expire
  const sh = usersSheet_(), r = findUser_(sh, s.user);
  if (r < 0) return null;
  const row = sh.getRange(r, 1, 1, 4).getValues()[0];
  if (row[3] === false) return null;
  const role = String(row[2] || "").trim();
  if (!ROLES[role]) return null;
  s.role = role;
  return s;
}
function canRead_(s, col) {
  if (!s || !ROLES[s.role]) return false;
  const r = ROLES[s.role].read;
  return r === "*" || r.indexOf(col) >= 0;
}
function canWrite_(s, col) {
  if (!s || !ROLES[s.role]) return false;
  const w = ROLES[s.role].write;
  return w === "*" || w.indexOf(col) >= 0;
}
function login_(user, password) {
  const cache = CacheService.getScriptCache(), key = "f_" + String(user || "").toLowerCase();
  const fails = Number(cache.get(key) || 0);
  if (fails >= 5) return { ok: false, error: "locked" };
  const sh = usersSheet_(), r = findUser_(sh, user);
  const row = r > 0 ? sh.getRange(r, 1, 1, 7).getValues()[0] : null;
  if (!row || row[3] === false || !row[5] || hash_(String(password || ""), String(row[6])) !== row[5]) {
    cache.put(key, String(fails + 1), 900);
    return { ok: false, error: "bad_login" };
  }
  cache.remove(key);
  const token = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, "");
  const s = { user: row[0], name: row[1], role: row[2] };
  cache.put("s_" + token, JSON.stringify(s), SESSION_SECONDS);
  sh.getRange(r, 5).setValue(new Date());
  return { ok: true, token: token, user: s.user, name: s.name, role: s.role, roleLabel: ROLES[s.role].label };
}

/* ---------------- web app ---------------- */
function doGet(e) { return handle_((e && e.parameter) || {}); }
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
    if (action === "ping") return out_({ ok: true, hasUsers: usersSheet_().getLastRow() >= 2 });
    if (action === "login") return out_(login_(req.user, req.password));
    const s = session_(req.token);
    if (action === "logout") { if (req.token) CacheService.getScriptCache().remove("s_" + req.token); return out_({ ok: true }); }
    if (action === "me") return s ? out_({ ok: true, user: s.user, name: s.name, role: s.role, roleLabel: ROLES[s.role].label }) : out_({ ok: false, error: "auth" });

    // user management (admin only)
    if (action.indexOf("users_") === 0) {
      if (!s) return out_({ ok: false, error: "auth" });
      if (s.role !== "admin") return out_({ ok: false, error: "forbidden" });
      const sh = usersSheet_();
      if (action === "users_list") {
        const n = sh.getLastRow(); if (n < 2) return out_({ ok: true, users: [] });
        return out_({ ok: true, users: sh.getRange(2, 1, n - 1, 5).getValues().filter(function (v) { return v[0]; }).map(function (v) {
          return { user: String(v[0]), name: String(v[1]), role: String(v[2]), active: v[3] !== false, last: v[4] ? toDateStr_(v[4]) : "" }; }) });
      }
      if (action === "users_save") {
        const r = findUser_(sh, req.user);
        if (r > 0 && (req.role !== "admin" || req.active === false) && sh.getRange(r, 3).getValue() === "admin" && adminCount_(sh, r) === 0)
          return out_({ ok: false, error: "last_admin" });
        try { saveUser_(req.user, req.name, req.role, req.active, req.password); } catch (err) { return out_({ ok: false, error: "bad_request", message: err.message }); }
        return out_({ ok: true });
      }
      if (action === "users_delete") {
        const r = findUser_(sh, req.user); if (r < 0) return out_({ ok: true });
        if (String(req.user).toLowerCase() === s.user) return out_({ ok: false, error: "self" });
        if (sh.getRange(r, 3).getValue() === "admin" && adminCount_(sh, r) === 0) return out_({ ok: false, error: "last_admin" });
        sh.deleteRow(r); return out_({ ok: true });
      }
      return out_({ ok: false, error: "bad_action" });
    }

    if (!SHEETS[col]) return out_({ ok: false, error: "bad_collection" });
    if (action === "list") {
      if (!s) return out_({ ok: false, error: "auth" });
      if (!canRead_(s, col)) return out_({ ok: false, error: "forbidden" });
      return out_({ ok: true, docs: list_(col) });
    }
    if (action === "set") {
      const id = String(req.id || "");
      if (!/^[A-Za-z0-9_.\-]{1,120}$/.test(id) || typeof req.data !== "object" || req.data === null) return out_({ ok: false, error: "bad_request" });
      if (!s) return out_({ ok: false, error: "auth" });
      if (!canWrite_(s, col)) return out_({ ok: false, error: "forbidden" });
      const isNew = rowOf_(sheet_(col), id) < 0;
      write_(col, id, req.data);
      // a new paid bill discounts the stock its recipes use (one standard portion per unit sold)
      if (col === "bills" && isNew && Array.isArray(req.data.stockUse)) useStock_(req.data.stockUse);
      return out_({ ok: true });
    }
    if (action === "delete") {
      if (!s) return out_({ ok: false, error: "auth" });
      if (!canWrite_(s, col)) return out_({ ok: false, error: "forbidden" });
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

/* ---------------- spreadsheet menu: create the first admin and manage users ---------------- */
function onOpen() {
  SpreadsheetApp.getUi().createMenu("Taste of Peru")
    .addItem("Crear o cambiar usuario…", "menuUsuario")
    .addItem("Instalar fórmulas", "instalarFormulas")
    .addToUi();
}
function menuUsuario() {
  const ui = SpreadsheetApp.getUi(); usersSheet_();
  const ask = function (q) { const r = ui.prompt("Taste of Peru", q, ui.ButtonSet.OK_CANCEL); if (r.getSelectedButton() !== ui.Button.OK) throw new Error("cancel"); return r.getResponseText().trim(); };
  try {
    const user = ask("Usuario (3-40 letras/números, sin espacios) / Username:");
    const name = ask("Nombre completo / Full name:");
    const role = ask("Rol / Role:  admin, chef, cocinero, mesero  o  lectura").toLowerCase();
    const pw = ask("Contraseña (mínimo 8 caracteres). Déjala vacía para no cambiarla. / Password (min 8), blank = keep:");
    saveUser_(user, name, role, true, pw);
    ui.alert("Usuario guardado / User saved: " + user.toLowerCase() + " (" + role + ")");
  } catch (err) { if (err.message !== "cancel") ui.alert("Error: " + err.message); }
}

/* ---------------- storage ---------------- */
function sheet_(col) {
  const ss = SpreadsheetApp.getActiveSpreadsheet(), name = SHEETS[col];
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    const h = ["ID", "json"].concat(FIELDS[col].map(function (f) { return f[1]; }));
    sh.getRange(1, 1, 1, h.length).setValues([h]); sh.setFrozenRows(1); sh.hideColumns(2);
    if (col === "recipes") moveOldRecipes_(ss, sh);
  }
  return sh;
}
// Earlier versions saved the app's recipes inside the costing tab "Recetas" (rows at the bottom and
// extra columns on the right). Move them to "Recetas (app)" once, and leave "Recetas" as it was.
function moveOldRecipes_(ss, dest) {
  const old = ss.getSheetByName("Recetas"); if (!old) return;
  const n = old.getLastRow(), w = old.getLastColumn(); if (n < 2 || w < 2) return;
  const vals = old.getRange(1, 1, n, w).getValues(), moved = [];
  for (let i = n - 1; i >= 1; i--) {
    const id = String(vals[i][0] || ""); if (!/^r[A-Za-z0-9]{6,}$/.test(id)) continue;
    let data = null; try { data = JSON.parse(vals[i][1] || ""); } catch (e) {}
    if (!data || !data.itemId) continue;
    moved.push([id, data]); old.deleteRow(i + 1);
  }
  moved.reverse().forEach(function (m) { write_("recipes", m[0], m[1]); });
  const labels = FIELDS.recipes.map(function (f) { return f[1]; });
  const head = old.getRange(1, 1, 1, old.getLastColumn()).getDisplayValues()[0];
  for (let c = head.length; c >= 1; c--) if (labels.indexOf(head[c - 1]) >= 0) old.deleteColumn(c);
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
const TIMES = ["time", "end"];
function tz_() { return SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone() || Session.getScriptTimeZone(); }
function toDateStr_(v, key) {
  if (Object.prototype.toString.call(v) !== "[object Date]") return String(v);
  return Utilities.formatDate(v, tz_(), TIMES.indexOf(key) >= 0 ? "HH:mm" : "yyyy-MM-dd");
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
      else if (BOOL.indexOf(k) >= 0) { if (v !== "") data[k] = v === true || /^(true|verdadero|s[ií]|yes|1)$/i.test(String(v)); }
      else data[k] = v === "" ? "" : toDateStr_(v, k);
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
      const p = String(v).split("-"); row.push(new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]), 12, 0, 0)); fmts.push("yyyy-mm-dd"); return;
    }
    if (NUM.indexOf(k) >= 0 && v !== "" && !isNaN(Number(v))) { v = Number(v); row.push(v); fmts.push(Number.isInteger(v) ? "0" : "0.00"); return; }
    if (BOOL.indexOf(k) >= 0) { row.push(!!v); fmts.push("@"); return; }
    v = String(v); if (/^[=+]/.test(v)) v = "'" + v;
    row.push(v); fmts.push("@");
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

function useStock_(uses) {
  const inv = sheet_("inventory"), w = inv.getLastColumn(), headers = inv.getRange(1, 1, 1, w).getDisplayValues()[0];
  const cQty = headers.indexOf("Stock") + 1, cUpd = headers.indexOf("Actualizado") + 1; if (cQty < 1) return;
  const now = new Date().toISOString();
  uses.slice(0, 200).forEach(function (u) {
    const q = Number(u && u.qty); if (!u || !u.id || !(q > 0)) return;
    const row = rowOf_(inv, String(u.id)); if (row < 0) return;
    const left = Math.max(0, Math.round((Number(inv.getRange(row, cQty).getValue() || 0) - q) * 1000) / 1000);
    inv.getRange(row, cQty).setValue(left);
    if (cUpd > 0) inv.getRange(row, cUpd).setValue(now);
    let data = {}; try { data = JSON.parse(inv.getRange(row, 2).getValue() || "{}"); } catch (err) {}
    data.qty = left; data.updated = now; inv.getRange(row, 2).setValue(JSON.stringify(data));
  });
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
