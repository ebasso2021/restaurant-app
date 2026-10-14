# Cambio de nombre: Taste of Peru → MishKi / Rename: Taste of Peru → MishKi

**Fecha / Date:** 2026-10-14

## Archivos modificados / Files changed

| Archivo / File | Cambio / Change |
|---|---|
| `index.html` | Todos los textos "Taste of Peru" → "MishKi" (pestaña, encabezado, inicio de sesión, bienvenida, IA, reservas, correos, recibos, ajustes). Fondo del login → `img/MishKi_logo.png`. Respaldo → `mishki-backup-….json` (sigue aceptando respaldos antiguos). / All "Taste of Peru" text → "MishKi". Login background → `img/MishKi_logo.png`. Backup file → `mishki-backup-….json` (old backups still import). |
| `google-apps-script/Code.gs` | Nombres y menú → "MishKi". / Names and menu → "MishKi". |
| `README.md` | Nombre → "MishKi". / Name → "MishKi". |
| `img/icon-192.png`, `img/icon-180.png`, `img/favicon-32.png` | Íconos nuevos con el logo MishKi. / New icons from the MishKi logo. |

## Respaldos / Backups

- `_backup-before-mishki/` — `index.html`, `Code.gs`, `README.md` y los íconos originales. / originals and old icons.
- `index.backup-before-mishki.html` — copia original de `index.html`. / original copy of `index.html`.

## Pendiente / To do

1. Renombrar la hoja de Google "Taste of Peru – datos" → **"MishKi – datos"** (opcional; la app la encuentra por ID). / Rename the Google Sheet (optional; the app finds it by ID).
2. Pegar el nuevo `Code.gs` en Apps Script y guardar. / Paste the new `Code.gs` into Apps Script and save.
3. Hacer commit y push a GitHub. / Commit and push to GitHub.
