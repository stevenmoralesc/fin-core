# 📖 Guía del Desarrollador: Entendiendo la Estructura

¡Bienvenido! Este proyecto fue diseñado pensando en ser robusto, moderno y profesional, utilizando **Next.js** (basado en React) y **Tailwind CSS**. 

Si vienes del mundo tradicional de `index.html`, una carpeta `/css` y una `/js`, esta estructura puede parecer un poco distinta. Aquí te explico cómo funciona este proyecto paso a paso, para que puedas editarlo tú mismo.

---

## 🏗️ 1. ¿Dónde está mi `index.html`?

En Next.js, no hay un `index.html` estático. El HTML se "arma" dinámicamente usando componentes de React. 

- En lugar de `index.html`, la **página principal** se encuentra en: `src/app/page.tsx`
- Cada página web nueva (como `/cuentas` o `/presupuesto`) tiene su propio archivo `page.tsx` dentro de una carpeta en `src/app/`. Por ejemplo: `src/app/cuentas/page.tsx`.

## 🎨 2. ¿Dónde está el CSS?

Usamos **Tailwind CSS**, lo cual significa que en lugar de escribir clases de CSS separadas y luego asignarlas, usamos "clases utilitarias" directamente en el HTML.
Por ejemplo, en vez de:
```css
.boton { background-color: blue; padding: 10px; border-radius: 5px; }
```
Se escribe en el `.tsx` así:
```html
<button className="bg-blue-500 p-2.5 rounded-md">Guardar</button>
```

**Pero sí tenemos un archivo CSS principal:**
Se encuentra en `src/app/globals.css`. Allí es donde se guardan todas las **variables de colores globales** (temas claro y oscuro) y los estilos de la barra de desplazamiento (scroll). Si quieres editar el esquema de colores de la aplicación, es ahí donde debes hacerlo.

## 🧩 3. ¿Qué son los componentes? (`src/components/`)

Piensa en los componentes como piezas de Lego. En vez de copiar y pegar el código del menú lateral en todas las páginas HTML, creamos **un solo archivo** llamado `Sidebar.tsx` y lo "importamos" donde sea necesario.

Los componentes están ordenados en:
- `src/components/layout/`: Elementos estructurales que siempre están en la pantalla (como el menú `Sidebar` y el encabezado superior `Header`).
- `src/components/modals/`: Las ventanas emergentes o pop-ups (ej: `TransactionModal.tsx` para una nueva transacción).
- `src/components/views/`: Piezas enormes que ocupan toda la pantalla (ej: `AccountsView.tsx` para la vista de cuentas).
- `src/components/dashboard/`: Componentes específicos de la gráfica y los números grandes de inicio.

## 🧠 4. ¿Dónde está la lógica JS y la Base de Datos?

- **Lógica de la Base de Datos**: Está en `src/app/api/`. Estas son rutas que actúan como "servidores en miniatura" (Backend). Por ejemplo, si quieres ver qué pasa cuando se guarda una transacción en la base de datos (SQLite), ve a `src/app/api/transactions/route.ts`.
- **Estructura de la Base de Datos**: Está en `prisma/schema.prisma`. Si quieres agregar una nueva columna a una tabla, debes hacerlo allí.
- **Lógica visual (Frontend JS)**: Toda la interacción (clicks, alertas, formularios) está **junto con el HTML** dentro de los archivos `.tsx` de los componentes.

## 🚀 5. ¿Cómo ejecutar el proyecto?

Para arrancar el proyecto en tu computadora de forma local:

1. Abre tu terminal en esta carpeta.
2. Escribe `npm install` (solo es necesario la primera vez para instalar todo).
3. Escribe `npm run dev`.
4. Abre tu navegador en `http://localhost:3000`.

*Nota: Mientras `npm run dev` esté activo, cualquier cambio que hagas en el código (ya sea en el CSS o en un componente) se reflejará instantáneamente en la pantalla sin tener que recargar.*
