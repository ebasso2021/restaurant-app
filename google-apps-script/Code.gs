/**
 * Taste of Peru — Google Sheets database for the app on GitHub Pages.
 *
 * Setup (one time):
 *  1. Create a new Google Sheet (e.g. "Taste of Peru – data") in your Google Drive.
 *  2. In the Sheet: Extensions → Apps Script. Delete the sample code, paste this whole file, Save.
 *  3. Change PIN below to your own secret PIN (at least 6 characters). Save.
 *  4. Deploy → New deployment → type "Web app".
 *       Execute as: Me      Who has access: Anyone
 *     Deploy → authorize with your Google account → copy the "Web app URL" (ends in /exec).
 *  5. In the app on GitHub: AI system → ⚙ Settings → paste the URL and the same PIN → Save.
 *
 * Every collection of the app gets its own sheet tab (reservations, inventory, sales, …).
 * Column A = id, column B = the full record (JSON, used by the app), the other columns
 * are the same fields, readable, for you. Edit data from the app, not by hand in column B.
 *
 * Security: reading or changing data needs the PIN. Without the PIN, the only thing allowed
 * is adding a NEW booking (so customers can book). Never share the PIN.
 */
const PIN = "CHANGE-ME-123456";

const COLLECTIONS = ["reservations", "inventory", "waste", "sales", "posts", "reviews", "settings"];

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
    const action = String(req.action || "");
    const col = String(req.col || "");
    const authed = PIN !== "CHANGE-ME-123456" && String(req.pin || "") === PIN;
    if (action === "ping") return out_({ ok: true, authed: authed });
    if (COLLECTIONS.indexOf(col) < 0) return out_({ ok: false, error: "bad_collection" });

    if (action === "list") {
      if (!authed) return out_({ ok: false, error: "pin" });
      return out_({ ok: true, docs: list_(col) });
    }
    if (action === "set") {
      const id = String(req.id || "");
      if (!/^[A-Za-z0-9_.\-]{1,120}$/.test(id) || typeof req.data !== "object" || req.data === null) return out_({ ok: false, error: "bad_request" });
      if (!authed) {
        // public: only brand-new bookings, always "pending"
        if (col !== "reservations" || rowOf_(sheet_(col), id) > 0) return out_({ ok: false, error: "pin" });
        const d = req.data, clean = {};
        ["name", "contact", "date", "time", "party", "notes"].forEach(function (k) { if (d[k] != null) clean[k] = String(d[k]).slice(0, 300); });
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
      const sh = sheet_(col), r = rowOf_(sh, String(req.id || ""));
      if (r > 0) sh.deleteRow(r);
      return out_({ ok: true });
    }
    return out_({ ok: false, error: "bad_action" });
  } finally {
    lock.releaseLock();
  }
}

function sheet_(col) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(col);
  if (!sh) { sh = ss.insertSheet(col); sh.getRange(1, 1, 1, 2).setValues([["id", "json"]]); sh.setFrozenRows(1); }
  return sh;
}
function rowOf_(sh, id) {
  const n = sh.getLastRow(); if (n < 2) return -1;
  const ids = sh.getRange(2, 1, n - 1, 1).getDisplayValues();
  for (let i = 0; i < ids.length; i++) if (ids[i][0] === id) return i + 2;
  return -1;
}
function list_(col) {
  const sh = sheet_(col), n = sh.getLastRow(); if (n < 2) return [];
  return sh.getRange(2, 1, n - 1, 2).getDisplayValues().filter(function (r) { return r[0]; }).map(function (r) {
    let data = {}; try { data = JSON.parse(r[1]); } catch (e) {}
    return { id: r[0], data: data };
  });
}
function write_(col, id, data) {
  const sh = sheet_(col);
  let headers = sh.getRange(1, 1, 1, Math.max(2, sh.getLastColumn())).getDisplayValues()[0];
  Object.keys(data).forEach(function (k) {
    if (typeof data[k] !== "object" && headers.indexOf(k) < 0) { headers.push(k); sh.getRange(1, headers.length).setValue(k); }
  });
  const row = headers.map(function (h, i) { return i === 0 ? id : i === 1 ? JSON.stringify(data) : (data[h] == null || typeof data[h] === "object" ? "" : String(data[h])); });
  let r = rowOf_(sh, id); if (r < 0) r = sh.getLastRow() + 1;
  const range = sh.getRange(r, 1, 1, row.length);
  range.setNumberFormat("@"); // keep dates and times as plain text
  range.setValues([row]);
}
function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
