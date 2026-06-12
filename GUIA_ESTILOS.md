# 🖌️ Guía de Estilos y Componentes Visuales

El diseño de este proyecto utiliza un sistema moderno de variables CSS puro combinado con la potencia de Tailwind CSS. No necesitarás reescribir docenas de líneas de código CSS para cambiar colores o espaciados; casi todo se hace de forma declarativa.

---

## 1. Archivo Base (`globals.css`)
Este es el archivo principal de diseño. Aquí definimos un "Tema Central" que se propaga por toda la aplicación, tanto en Modo Claro como en Modo Oscuro.

Si quieres **cambiar el esquema de colores principal**, aquí tienes los valores que debes alterar:

```css
:root {
  /* Fondo general y fondo de tarjetas */
  --bg-main:          #f9fafb;  
  --bg-surface:       #ffffff;  

  /* Textos */
  --text-primary:     #111827;  /* Textos principales oscuros */
  --text-secondary:   #4b5563;  /* Subtítulos */

  /* Color Acento (El botón principal azul/púrpura) */
  --accent:           #6366f1;  
  --accent-fg:        #ffffff;  /* El color del texto dentro del botón de acento */
  --success:          #10b981;  /* Color verde para ingresos */
}
```

Al cambiar el valor de `--accent` por rojo (`#ef4444`), por ejemplo, todos los botones principales de la aplicación se volverán rojos mágicamente.

## 2. Estructura de Tailwind CSS (Clases)
En los archivos `.tsx` (ej. `Dashboard.tsx`), verás clases largas en el código HTML:
```html
<div className="flex flex-col gap-8 rounded-xl p-4">
```
Esto significa:
- `flex flex-col`: Utilizar un layout flexible en columna.
- `gap-8`: Dejar un espacio considerable (32px) entre los elementos.
- `rounded-xl`: Bordes redondeados.
- `p-4`: Padding o margen interno.

Para saber qué hace cada clase o si necesitas una nueva (ej. cambiar el texto a negrita), consulta la documentación oficial de [Tailwind CSS](https://tailwindcss.com/docs).

## 3. ¿Cómo no romper el diseño al editar?
La mejor forma de modificar el diseño visual es **aislando el cambio**. 

1. Ve al archivo `.tsx` que deseas cambiar.
2. Encuentra la etiqueta o `div` correspondiente. 
3. Agrega o remueve clases de Tailwind dentro de `className=""`.
4. Si quieres usar estilos en línea como solías hacerlo, puedes usar el atributo `style={{ color: 'red' }}`. Ojo: ¡Lleva doble llave!

Ejemplo:
```tsx
// Correcto
<span style={{ color: "red", fontSize: "14px" }}>Texto</span>

// Incorrecto (así se hacía en HTML puro, aquí fallará)
<span style="color: red; font-size: 14px;">Texto</span>
```

¡Con esta guía deberías poder ajustar el aspecto visual de la aplicación muy fácilmente!
