# Taste of Peru — Restaurant App

**Online version (with data saving and AI):** https://claude.ai/artifact/UZQpG8ZbaffWJ3cS2f6zsq
Last updated: 2026-09-19

---

## Español

### Qué es
Una app bilingüe (EN/ES) para manejar un pequeño local de bebidas y postres peruanos en Edmonton, Alberta, con un sistema de IA.

### Archivos en esta carpeta
| Archivo | Contenido |
|---|---|
| `index.html` | La app completa (HTML, CSS y JavaScript en un solo archivo). |
| `README.md` | Este documento. |

> **Importante:** si abres `index.html` directamente desde tu computadora, las calculadoras, normas y textos funcionan, pero **no se guardan datos y la IA no funciona**. Esas funciones solo existen en la versión en línea en Claude (enlace arriba).

### Pestañas
1. **Productos** — Jugo de quinua, Chicha morada, Jugo de maca, Mazamorra morada, Jugo de lúcuma, Jugo de chirimoya: calculadora de lotes, preparación, beneficios, verificación de afirmaciones y flujo con puntos críticos de control (PCC).
2. **Sistema IA** — resumen y 5 módulos funcionales (ver abajo).
3. **Normas AHS** — requisitos de inocuidad de Alberta Health Services.
4. **Camino a la venta** — pasos para vender en Edmonton.

### Módulos del Sistema IA
| Módulo | Funciones |
|---|---|
| 1 · Clientes | Asistente para clientes (texto y **voz** 🎤, lectura de respuestas en voz alta), formulario de reservas, **list box** de reservas con filtro (Próximas/Todas/Pasadas/Canceladas), Confirmar/Cancelar/Borrar y mensaje de confirmación para copiar. |
| 2 · Cocina e inventario | Stock con **Alerta** y **Cantidad máxima**, botón **Agregar item**, cuadro y botón **+ Stock** (suma a lo existente), orden de compra automática, predicción de demanda (día y hora) con ajuste por IA, registro de merma. |
| 3 · Ventas y análisis | Registro de ventas, costo por vaso, ingresos, márgenes, gráfico diario, bebidas más rentables / "se vende bien, margen bajo", proyección de 7 días, análisis con IA. |
| 4 · Marketing | Generador de 3 opciones de publicación o anuncio (respeta reglas de afirmaciones), calendario de publicaciones, engagement %, análisis con IA. |
| 5 · Reseñas | Registro de reseñas, respuestas con IA, alerta de salud/inocuidad, problemas recurrentes, reporte semanal. |

### Reglas del inventario
- **Alerta:** si el stock llega a este número o menos → *Bajo* y entra en la orden de compra.
- **Cantidad máxima:** la orden pide lo necesario para llegar a este número; si el stock la supera → *Exceso*.
- Cambios se guardan al salir de cada casilla. No hay historial de cambios.

### Cómo se guardan los datos
En la base de datos de la app en claude.ai (no en tu computadora). Se comparte con quienes tengan acceso a la app; se borra si se borra la app. Por ser una app con datos, solo se puede compartir dentro de tu organización.

### Limitaciones
- Los clientes aún no pueden usar el asistente ni reservar por su cuenta (la app es privada). Opciones: formulario de Google, plataforma de reservas, WhatsApp Business o página pública.
- No publica en redes ni importa reseñas automáticamente.
- La voz depende del navegador (Chrome, Edge, Safari); no se probó con un micrófono real.

### Cifras verificadas (del texto original)
| Afirmación | Resultado |
|---|---|
| Predicción 85–92% según Oracle Hospitality | **No verificado** — viene de un blog de proveedor (Oxmaint), sin fuente, sobre ocupación hotelera. |
| 22% menos merma en 90 días | **No verificado** — estudio revisado por pares: 23–51% en 4 de 5 cocinas, en 7–10 meses. |
| $1,200–$6,000 USD/mes de ahorro | **No verificado.** |
| Hasta 40% menos costo por lead | **No verificado.** |

Fuentes: [Sigala et al., Waste Management 2025](https://www.sciencedirect.com/science/article/pii/S0956053X25001072) · [Winnow](https://www.winnowsolutions.com/en/case-studies) · [Oracle, mar. 2026](https://www.oracle.com/news/announcement/oracle-and-netsuite-deliver-new-ai-powered-solution-for-restaurant-operations-2026-03-31/) · [Oxmaint](https://oxmaint.com/industries/hospitality/ai-demand-forecasting-hospitality-operations)

---

## English

### What it is
A bilingual (EN/ES) app to run a small Peruvian drinks and desserts counter in Edmonton, Alberta, with an AI system.

### Files in this folder
| File | Contents |
|---|---|
| `index.html` | The full app (HTML, CSS and JavaScript in one file). |
| `README.md` | This document. |

> **Important:** if you open `index.html` directly from your computer, the calculators, rules and text work, but **no data is saved and AI does not work**. Those features only exist in the online version in Claude (link above).

### Tabs
1. **Products** — Quinoa drink, Chicha morada, Maca shake, Mazamorra morada, Lúcuma juice, Chirimoya juice: batch calculator, method, benefits, claim check and flow with critical control points (CCP).
2. **AI system** — overview and 5 working modules (below).
3. **AHS rules** — Alberta Health Services food-safety requirements.
4. **Path to sale** — steps to sell in Edmonton.

### AI system modules
| Module | Features |
|---|---|
| 1 · Customers | Customer assistant (text and **voice** 🎤, replies read aloud), booking form, bookings **list box** with filter (Upcoming/All/Past/Cancelled), Confirm/Cancel/Delete and a copy-ready confirmation message. |
| 2 · Kitchen & inventory | Stock with **Alert** and **Maximum quantity**, **Add item** button, **+ Stock** box and button (adds to existing), automatic purchase order, demand forecast (day and hour) with AI adjustment, waste log. |
| 3 · Sales & analytics | Sales log, cost per cup, revenue, margins, daily chart, most profitable / "sells well, low margin" drinks, 7-day projection, AI analysis. |
| 4 · Marketing | Generator of 3 post or ad options (follows claim rules), posting calendar, engagement %, AI analysis. |
| 5 · Reviews | Review log, AI reply drafts, health/safety flag, recurring problems, weekly report. |

### Inventory rules
- **Alert:** stock at or below this number → *Low* and added to the purchase order.
- **Maximum quantity:** the order asks for enough to reach this number; stock above it → *Overstock*.
- Changes save when you leave each box. There is no change history.

### How data is saved
In the app's database on claude.ai (not on your computer). Shared with anyone who has access to the app; deleted if the app is deleted. Because it stores data, it can only be shared inside your organization.

### Limitations
- Customers can't use the assistant or book on their own yet (the app is private). Options: Google Form, booking platform, WhatsApp Business or a public page.
- It does not post to social media or import reviews automatically.
- Voice depends on the browser (Chrome, Edge, Safari); not tested with a real microphone.

### Checked figures (from the original text)
| Claim | Result |
|---|---|
| 85–92% forecast accuracy per Oracle Hospitality | **Unverified** — from a vendor blog (Oxmaint), uncited, about hotel occupancy. |
| 22% less waste in 90 days | **Unverified** — peer-reviewed study: 23–51% at 4 of 5 kitchens, over 7–10 months. |
| $1,200–$6,000 USD/month savings | **Unverified.** |
| Up to 40% lower cost per lead | **Unverified.** |

Sources: see the Spanish section above.


---

## Google Drive como base de datos / Google Drive as the database

**ES:** La app en GitHub Pages puede guardar reservas, inventario, ventas, etc. en una **hoja de Google** de tu Drive, compartida entre tus dispositivos. Sigue los 5 pasos al inicio de `google-apps-script/Code.gs`, luego en la app: **Sistema IA → ⚙ Ajustes → Google Drive**, pega la URL `/exec` y tu PIN. Sin el PIN nadie puede leer los datos; solo se permite agregar reservas nuevas.

**EN:** The app on GitHub Pages can save bookings, inventory, sales, etc. to a **Google Sheet** in your Drive, shared across your devices. Follow the 5 steps at the top of `google-apps-script/Code.gs`, then in the app: **AI system → ⚙ Settings → Google Drive**, paste the `/exec` URL and your PIN. Without the PIN nobody can read the data; only new bookings can be added.

⚠️ Never commit your real PIN to this public repository — change it only in the Apps Script editor.
