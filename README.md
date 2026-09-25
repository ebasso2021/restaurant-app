# Taste of Peru — Restaurant App

**Online version (with data saving and AI):** https://claude.ai/artifact/UZQpG8ZbaffWJ3cS2f6zsq
Last updated: 2026-09-21

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
1. **Productos** — Jugo de quinua, Chicha morada, Jugo de maca, Mazamorra morada, Jugo de lúcuma, Jugo de chirimoya y **Lomo saltado** (plato de fondo, 4 porciones, ingredientes y preparación en ES/EN): calculadora de lotes, preparación, beneficios, verificación de afirmaciones y flujo con puntos críticos de control (PCC).
2. **Gestión con IA** — resumen y 5 módulos funcionales (ver abajo).
3. **Normas AHS** — requisitos de inocuidad de Alberta Health Services.
4. **Camino a la venta** — pasos para vender en Edmonton. Cada paso tiene **✎ Agregar/Editar nota** (con **Guardar**) para anotar el avance, y **✓ Hecho** para marcarlo con ✓; arriba se ve el progreso (p. ej. 2 / 11). Lo pueden cambiar el administrador y el chef.

### Aprender recetas de un documento de Word
En **Recetas** hay dos botones: **📄 Nueva receta desde un documento de Word** (crea el ítem en el menú) y, dentro de cada receta, **📄 Aprender ingredientes y preparación de un documento de Word**. La app lee el archivo `.docx` en el navegador (con IA si está disponible, si no con un lector de texto que busca los títulos “Ingredientes” y “Preparación”), convierte las cantidades a 1 porción, llena el editor de la receta y agrega al inventario los ingredientes que faltan (con stock 0, ya vinculados). Revisa y pulsa **Guardar como medida única**.

En **Menú → Agregar al menú** hay dos botones: **📄 Importar documento** (un archivo de receta Word .docx o .txt → crea el plato o bebida con el grupo, tipo, precio y nota del formulario, guarda su receta para 1 porción y agrega los ingredientes al stock) y **🥕 Importar ingredientes** (un archivo con solo la lista de ingredientes → los agrega al stock con cantidad 0; si escribiste un nombre, también crea ese plato con esos ingredientes como receta).

### Recetas en dos idiomas
Al cambiar EN/ES cambian los nombres de los platos, los ingredientes y la preparación. Al guardar una receta, la app guarda también la versión en el otro idioma (de la receta de referencia de la app, de la versión anterior o traducida con IA). Si una receta antigua está solo en un idioma, aparece **🌐 Traducirla** para completarla.

### Módulos de Gestión con IA
| Módulo | Funciones |
|---|---|
| 1 · Clientes | Asistente para clientes (texto y **voz** 🎤, lectura de respuestas en voz alta), formulario de reservas, **list box** de reservas con filtro (Próximas/Todas/Pasadas/Canceladas), Confirmar/Cancelar/Borrar y mensaje de confirmación para copiar. |
| 2 · Cocina e inventario | Tabla de stock de solo lectura con botón **✏ Editar** por fila (artículo, stock, alerta, cantidad máxima, piezas por paquete, proveedor → **✓ Guardar** / **Cancelar**; el cambio de stock va al Kardex como conteo) y **✕ Eliminar** con ventana de confirmación. Panel **Artículos**. **No se permiten campos vacíos** y tampoco 0 / 0,00 en alerta, cantidad máxima, piezas por paquete, proveedor y cantidades de compra y merma; el **stock puede ser 0** y, cuando el stock es 0, el **costo también puede ser 0** (lote, caducidad y factura son opcionales); los campos que faltan se marcan en rojo y los artículos incompletos muestran **Faltan datos**. Tabla de stock sin columnas de costo (costo y valor están en el módulo 3, desde el Kardex); piezas por paquete bajo el nombre del artículo. Stock con **Alerta** y **Cantidad máxima**, botón **Agregar item**, cuadro **Agregar stock** (suma a lo existente; sin botón + Stock por fila), orden de compra automática, predicción de demanda (día y hora) con ajuste por IA, registro de merma. Stock en **g, kg, mL, L o unidades**; el costo es **siempre por kg, por L o por unidad** con **2 decimales** (y se muestra por g/mL). **Valor del stock = stock convertido a kg/L × costo** (4.500 g a CA$8,50/kg = CA$38,25). Las **piezas** se compran por **paquete** y se costean por unidad: **costo unitario = precio del paquete ÷ piezas del paquete** (caja de 30 huevos a CA$9,00 = CA$0,30 por huevo) y valor = unidades × costo unitario; 1 si se compran sueltas), valor = piezas ÷ N × costo (30 huevos a CA$4,20 el paquete de 12 = CA$10,50); **costo promedio ponderado** en cada compra; el botón **📒** de cada artículo abre su Kardex en el módulo 3. |
| 3 · Ventas, costos y análisis | Cuatro submenús (el stock entra solo con **Agregar stock** en 2 · Cocina e inventario; las compras ya registradas quedan en el Kardex, donde se editan o eliminan): **Ventas** · **Costos** · **📒 Kardex** con las columnas Artículo · Costo promedio ponderado (por kg / L / paquete) · Por g / mL / und · Valor del stock · Fecha de movimiento · Registro (fecha y hora en que se guardó; ✏ si se editó) · Tipo (entrada / salida) · Cantidad · Costo unitario · Saldo actualizado · Proveedor · Lote · Caducidad (lotes vencidos en rojo, por vencer en 7 días en ámbar), formulario **Registrar movimiento**, botones **✏ Editar** y **🗑 Eliminar** en cada fila (dos clics para eliminar; al guardar o eliminar se recalcula automáticamente todo el Kardex del artículo con el costo promedio ponderado y se actualiza el inventario; avisa si una salida queda mayor que el stock), botón **Reiniciar Kardex** (solo borra la base de datos del Kardex; después el Kardex se alimenta de las compras y el saldo de cada movimiento sale del propio Kardex; en la hoja: menú Taste of Peru → Reiniciar Kardex) y CSV. Las ventas cobradas en facturación son salidas del Kardex y bajan el inventario; en la web se guarda en la pestaña **Kardex** de la hoja de Google · **Costos** (costo por porción con el costo promedio ponderado del Kardex, valor del stock y costos operativos) · **Ventas** (registro, KPIs, gráfico y tabla) · **Análisis y proyección** (KPIs, proyección de 7 días y análisis con IA). Registro de ventas, costo por vaso, ingresos, márgenes, gráfico diario, bebidas más rentables / "se vende bien, margen bajo", proyección de 7 días, análisis con IA. **Costos operativos** (personal con calculadora, alquiler, electricidad, impuestos, seguros, licencias y permisos anuales, mantenimiento de equipos, otros y costos propios; por semana/mes/año) → utilidad neta y punto de equilibrio (vasos al día). |
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
1. **Products** — Quinoa drink, Chicha morada, Maca shake, Mazamorra morada, Lúcuma juice, Chirimoya juice and **Lomo saltado** (main dish, serves 4, ingredients and method in EN/ES): batch calculator, method, benefits, claim check and flow with critical control points (CCP).
2. **AI System Management** — overview and 5 working modules (below).
3. **AHS rules** — Alberta Health Services food-safety requirements.
4. **Path to sale** — steps to sell in Edmonton. Each step has **✎ Add/Edit note** (with **Save**) to record progress, and **✓ Done** to check it off with ✓; progress shows at the top (e.g. 2 / 11). The administrator and the chef can change it.

### Learn recipes from a Word document
In **Recipes** there are two buttons: **📄 New recipe from a Word document** (creates the menu item) and, inside each recipe, **📄 Learn ingredients and preparation from a Word document**. The app reads the `.docx` file in the browser (with AI when available, otherwise with a text reader that looks for “Ingredients” and “Preparation” headings), converts the amounts to 1 portion, fills the recipe editor and adds the missing ingredients to the inventory (stock 0, already linked). Review and press **Save as the standard measure**.

In **Menu → Add to the menu** there are two buttons: **📄 Import document** (a Word .docx or .txt recipe file → creates the dish or drink with the form's group, type, price and note, saves its 1-portion recipe and adds the ingredients to the stock) and **🥕 Import ingredients** (a file with just the ingredient list → adds them to the stock at quantity 0; if you typed a name, it also creates that dish with those ingredients as its recipe).

### Recipes in two languages
Switching EN/ES switches dish names, ingredients and preparation. When a recipe is saved, the app also stores the other language (from the app's reference recipe, the previous version, or translated with AI). If an older recipe is only in one language, **🌐 Translate it** fills it in.

### AI System Management modules
| Module | Features |
|---|---|
| 1 · Customers | Customer assistant (text and **voice** 🎤, replies read aloud), booking form, bookings **list box** with filter (Upcoming/All/Past/Cancelled), Confirm/Cancel/Delete and a copy-ready confirmation message. |
| 2 · Kitchen & inventory | Read-only stock table with an **✏ Edit** button per row (item, on hand, alert, maximum quantity, pieces per package, supplier → **✓ Save** / **Cancel**; a stock change goes to the Kardex as a count) and **✕ Delete** with a confirmation dialog. **Items** panel. **No blank fields**, and no 0 / 0.00 in alert, maximum quantity, pieces per package, supplier and purchase or waste quantities; **on hand may be 0** and, when on hand is 0, the **cost may be 0** too (lot, expiry and invoice are optional); missing fields turn red and incomplete items show **Missing data**. Stock table without cost columns (cost and value are in module 3, from the Kardex); pieces per package under the item name. Stock with **Alert** and **Maximum quantity**, **Add item** button, **Add stock** box (adds to existing; no per-row + Stock button), automatic purchase order, demand forecast (day and hour) with AI adjustment, waste log. Stock in **g, kg, mL, L or pieces**; the cost is **always per kg, per L or per piece** with **2 decimals** (also shown per g/mL). **Stock value = stock converted to kg/L × cost** (4,500 g at CA$8.50/kg = CA$38.25). **Pieces** are bought by the **package** and costed per piece: **unit cost = package price ÷ pieces in the package** (a box of 30 eggs at CA$9.00 = CA$0.30 per egg) and value = pieces × unit cost; 1 if bought one by one), value = pieces ÷ N × cost (30 eggs at CA$4.20 per pack of 12 = CA$10.50); **weighted average cost** on each purchase; each item's **📒** button opens its Kardex in module 3. |
| 3 · Sales, costs & analytics | Four sub-tabs (stock comes in only through **Add stock** in 2 · Kitchen & inventory; purchases already recorded stay in the Kardex, where they can be edited or deleted): **Sales** · **Costs** · **📒 Kardex** with the columns Item · Weighted average cost (per kg / L / package) · Per g / mL / piece · Stock value · Movement date · Timestamp (date and time it was recorded; ✏ if edited) · Type (in / out) · Quantity · Unit cost · Updated balance · Supplier · Lot · Expiry (expired lots in red, expiring within 7 days in amber), a **Register movement** form, **✏ Edit** and **🗑 Delete** buttons on every row (two clicks to delete; saving or deleting automatically recalculates the item's whole Kardex with the weighted average cost and updates the inventory; warns if an exit ends up larger than the stock), a **Restart Kardex** button (only erases the Kardex database; after that the Kardex is fed by purchases and each movement's balance comes from the Kardex itself; in the Sheet: menu Taste of Peru → Reiniciar Kardex) and CSV. Sales charged in billing are Kardex exits and lower the inventory; on the website it is saved in the **Kardex** tab of the Google Sheet · **Costs** (cost per portion from the Kardex weighted average cost, stock value and operating costs) · **Sales** (log, KPIs, chart and table) · **Analysis & projection** (KPIs, 7-day projection and AI analysis). Sales log, cost per cup, revenue, margins, daily chart, most profitable / "sells well, low margin" drinks, 7-day projection, AI analysis. **Operating costs** (staff with calculator, rent, electricity, taxes, insurance, annual licences and permits, equipment maintenance, other and your own costs; per week/month/year) → net profit and break-even (cups per day). |
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


---

## Acceso con usuario y contraseña / Sign-in and roles

**ES:** En GitHub la app pide usuario y contraseña antes de mostrar nada. Los usuarios están en la pestaña **Usuarios** de la hoja “Taste of Peru – datos” (contraseñas guardadas solo como hash). Roles: **admin** (todo, incluidos usuarios y ajustes), **chef** (ve todo; cambia inventario, merma y costo por vaso), **lectura** (ve todo, no cambia nada). El primer administrador se crea desde el menú **Taste of Peru → Crear o cambiar usuario…** de la hoja; los demás, desde la app en **Sistema IA → ⚙ Ajustes → Usuarios**. Los permisos los aplica el servidor (Apps Script), no solo la pantalla.

**EN:** On GitHub the app asks for a username and password before showing anything. Users live in the **Usuarios** tab of the “Taste of Peru – datos” sheet (passwords stored only as hashes). Roles: **admin** (everything, including users and settings), **chef** (sees everything; changes inventory, waste and cost per cup), **lectura** (read only). Create the first administrator from the sheet menu **Taste of Peru → Crear o cambiar usuario…**; the rest from the app under **AI system → ⚙ Settings → Users**. Permissions are enforced by the server (Apps Script), not only by the screen.
